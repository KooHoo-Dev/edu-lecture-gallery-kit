import type { GalleryConfig } from './config'
import type { BaseMeta, BaseSpecimen, ParamDef, ParamValue } from './contract'

/* 모든 갤러리에 같은 meta 규칙. 검사 도구(gallery check)가 헤드리스 Chrome 에서 window.__gallery.lint() 로 부른다.
 * 갤러리 도메인 규칙은 설정의 lint 가 더한다. 개수 규칙의 근거는 docs/kit-guide.md */

export interface LintIssue {
  id: string
  level: 'error' | 'warn'
  message: string
}

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const HEX = /^#[0-9a-f]{6}$/i

function count(issues: string[], what: string, n: number, min: number, max: number) {
  if (n < min || n > max) issues.push(`${what} 는 ${min}~${max}개여야 한다 (지금 ${n}개)`)
}

function valueFits(def: ParamDef, v: ParamValue): boolean {
  if (def.type === 'range') return typeof v === 'number' && v >= def.min && v <= def.max
  if (def.type === 'select') return typeof v === 'string' && def.options.some(o => o.value === v)
  if (def.type === 'toggle') return typeof v === 'boolean'
  return typeof v === 'string' && HEX.test(v)
}

/** 원제 (연도) 에서 원제만. 짧은 것은 오탐이 많아 건너뛴다 */
function gameNames(meta: BaseMeta): string[] {
  return meta.inspiredBy.map(i => i.title.replace(/\s*\(\d{4}\)\s*$/, '').trim().toLowerCase()).filter(t => t.length >= 3)
}

export function lintMeta(meta: BaseMeta, known: { groups: string[]; ids: Set<string>; planned: Set<string> }): string[] {
  const out: string[] = []
  if (!KEBAB.test(meta.id)) out.push(`id 가 kebab-case 가 아니다: ${meta.id}`)
  if (!meta.title.trim() || !meta.titleEn.trim()) out.push('title, titleEn 이 비었다')
  if (!known.groups.includes(meta.group)) out.push(`group 이 설정에 없다: ${meta.group}`)
  count(out, 'goals', meta.goals.length, 3, 4)
  count(out, 'mistakes', meta.mistakes.length, 3, 5)
  count(out, 'presets', meta.presets.length, 2, 5)
  count(out, 'steps', meta.steps.length, 2, 5)
  count(out, 'prompt.adaptIdeas', meta.prompt.adaptIdeas.length, 2, 6)
  count(out, 'references', meta.references.length, 1, 6)
  count(out, 'unity.setup', meta.unity.setup.length, 2, 7)
  count(out, 'unity.pitfalls', meta.unity.pitfalls.length, 2, 6)
  if ((meta.captures?.length ?? 0) > 3) out.push('captures 는 3개 이하 (용량)')
  if (!meta.unity.verify.trim()) out.push('unity.verify 가 비었다')
  if (!meta.offNote.trim()) out.push('offNote 가 비었다')
  if (!meta.prompt.goal.trim()) out.push('prompt.goal 이 비었다')
  meta.steps.forEach((s, i) => s.n !== i + 1 && out.push(`steps 의 n 은 1부터 차례로 (${i + 1}번째가 ${s.n})`))

  // 조절 값
  const defs = new Map<string, ParamDef>()
  for (const d of meta.params) {
    if (defs.has(d.key)) out.push(`params key 가 겹친다: ${d.key}`)
    defs.set(d.key, d)
    if (!valueFits(d, d.default)) out.push(`${d.key}: 기본값이 정의와 맞지 않는다`)
    if (d.type === 'range' && !(d.step > 0 && d.min < d.max)) out.push(`${d.key}: range 의 min, max, step 이 이상하다`)
  }
  for (const d of meta.params) {
    if (!d.showWhen) continue
    const ref = defs.get(d.showWhen.key)
    if (ref?.type !== 'select') out.push(`${d.key}: showWhen.key 는 select 값이어야 한다`)
    else for (const v of d.showWhen.values) if (!ref.options.some(o => o.value === v)) out.push(`${d.key}: showWhen 값 ${v} 가 ${ref.key} 에 없다`)
  }
  const checkValues = (what: string, values: Record<string, ParamValue>) => {
    for (const [k, v] of Object.entries(values)) {
      const d = defs.get(k)
      if (!d) out.push(`${what}: 없는 값 ${k}`)
      else if (!valueFits(d, v)) out.push(`${what}: ${k} = ${String(v)} 이 정의와 맞지 않는다`)
    }
  }
  const presetIds = new Set<string>()
  for (const p of meta.presets) {
    if (!KEBAB.test(p.id) || presetIds.has(p.id)) out.push(`preset id 가 kebab-case 가 아니거나 겹친다: ${p.id}`)
    presetIds.add(p.id)
    checkValues(`preset ${p.id}`, p.values)
  }
  for (const c of meta.captures ?? []) checkValues(`capture ${c.name}`, c.values)
  if (meta.thumbnail && meta.thumbnail !== 'default' && !meta.captures?.some(c => c.name === meta.thumbnail)) out.push(`thumbnail 이 captures 에 없다: ${meta.thumbnail}`)

  // 이벤트와 트랙
  if (meta.events.length > 9) out.push('events 는 9개 이하 (단축키 1~9)')
  const eventIds = new Set(meta.events.map(e => e.id))
  if (eventIds.size !== meta.events.length) out.push('event id 가 겹친다')
  const tracks = [...meta.events.flatMap(e => (e.tracks ?? []).map(t => ({ t, where: `event ${e.id}` }))), ...(meta.demo?.loops ?? []).map(t => ({ t, where: 'demo.loops' }))]
  for (const { t, where } of tracks) {
    const d = defs.get(t.key)
    if (d?.type !== 'range') {
      out.push(`${where}: 트랙은 range 값만 움직인다 (${t.key})`)
      continue
    }
    if (t.frames.length < 2) out.push(`${where}: ${t.key} 트랙은 프레임이 둘 이상`)
    t.frames.forEach(([time, v], i) => {
      if (i > 0 && time < t.frames[i - 1][0]) out.push(`${where}: ${t.key} 시간이 거꾸로 간다`)
      if (v < d.min || v > d.max) out.push(`${where}: ${t.key} 값 ${v} 이 범위 밖`)
    })
  }
  for (const f of meta.demo?.fire ?? []) {
    if (!eventIds.has(f.event)) out.push(`demo.fire: 없는 이벤트 ${f.event}`)
    if (!(f.every > 0)) out.push(`demo.fire: every 는 0 보다 커야 한다`)
  }

  // 연결과 출처
  for (const r of meta.related ?? []) if ('id' in r && !known.ids.has(r.id) && !known.planned.has(r.id)) out.push(`related: 없는 표본 ${r.id}`)
  for (const i of meta.inspiredBy) {
    if (!/\(\d{4}\)$/.test(i.title)) out.push(`inspiredBy 제목은 '원제 (연도)' 형식: ${i.title}`)
    if (i.borrowed.length > 2) out.push(`inspiredBy ${i.title}: 빌린 축은 2개 이하`)
  }
  const names = gameNames(meta)
  const named = [meta.id, meta.title, meta.titleEn, ...meta.presets.flatMap(p => [p.id, p.name])].map(s => s.toLowerCase())
  for (const n of names) if (named.some(s => s.includes(n) || s.includes(n.replace(/\s+/g, '-')))) out.push(`게임명은 inspiredBy 에만: ${n}`)
  return out
}

/** extraIds: 격리 빌드에 들어 있지 않지만 리포에 있는 표본 id (related 확인용) */
export function lintAll<S extends BaseSpecimen>(config: GalleryConfig<S>, extraIds: string[] = []): LintIssue[] {
  const ids = new Set<string>()
  const issues: LintIssue[] = []
  for (const s of config.specimens) {
    if (ids.has(s.meta.id)) issues.push({ id: s.meta.id, level: 'error', message: 'id 가 다른 표본과 겹친다' })
    ids.add(s.meta.id)
  }
  const known = { groups: Object.keys(config.groups), ids: new Set([...ids, ...extraIds]), planned: new Set((config.planned ?? []).map(p => p.id)) }
  for (const s of config.specimens) {
    for (const message of lintMeta(s.meta, known)) issues.push({ id: s.meta.id, level: 'error', message })
    for (const message of config.lint?.(s) ?? []) issues.push({ id: s.meta.id, level: 'error', message })
  }
  return issues
}

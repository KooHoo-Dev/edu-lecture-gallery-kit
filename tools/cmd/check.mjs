// gallery check: 갤러리 검사 (Node + 헤드리스 Chrome).
//   gallery check            전체: 폴더, import 대소문자, 도메인 검사, 타입 검사, dist 빌드, 용량 예산, 외부 참조,
//                            네트워크를 막은 file:// 실행, meta 규칙, 표본마다 무대 동작, Skill 최신 여부
//   gallery check <id> ...   지정한 표본: 폴더, 도메인 검사, 그 표본만 넣은 빌드에서 meta 규칙과 무대 동작
//   --no-build               전체 검사에서 dist 를 다시 만들지 않는다
//   --links                  출처 링크 생존 확인 (인터넷 필요)
//
// 무대 동작 검사 (표본마다, 무대 시간을 thumbTime 에 멈춘 화면으로 비교한다)
//   무대가 그리는가, 오류가 없는가 / 효과 끄기 화면이 최종과 다른가 / 단계마다 화면이 최종과 다른가 /
//   이벤트를 일으키고 시간을 옮겨도 오류가 없는가 / 자동 데모를 켜고 돌려도 오류가 없는가

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, parse, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { findChrome, withChrome } from '../lib/chrome.mjs'
import { diffs, settle } from '../lib/pixels.mjs'
import { project, reporter, specimenIds, typecheck, viteBuild } from '../lib/project.mjs'
import { ensureModules } from '../lib/worktree.mjs'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
/** 화면이 '같다' 고 볼 바뀐 픽셀 비율 (8 넘게 바뀐 픽셀이 0.01% 미만) */
const SAME = 0.0001

export default async function check(args) {
  const p = project()
  ensureModules(p.root, p.web)
  const r = reporter()
  const ids = args.filter(a => !a.startsWith('--'))
  const full = ids.length === 0
  const all = specimenIds(p)
  for (const id of ids) if (!all.includes(id)) r.err(`표본 폴더가 없다: ${relative(p.root, join(p.specimensDir, id))}`)

  checkFolders(p, r)
  checkImportCase(p.srcDir, r)

  if (p.domainCheck) {
    const domain = await import(pathToFileURL(p.domainCheck).href)
    await domain.default({ project: p, ids: full ? all : ids, full, err: r.err, warn: r.warn })
  }

  if (!findChrome()) {
    ;(process.env.CI ? r.err : r.warn)('Chrome/Edge 를 찾지 못해 페이지 검사를 건너뜀')
    return r.done()
  }

  if (full) {
    const tsc = typecheck(p)
    if (tsc) r.err(`타입 검사 실패\n${tsc.slice(0, 3000)}`)
    if (!args.includes('--no-build')) {
      try {
        viteBuild(p)
      } catch (e) {
        r.err(e.message)
        return r.done()
      }
    }
    if (!existsSync(p.dist)) {
      r.err(`${relative(p.root, p.dist)} 이 없다`)
      return r.done()
    }
    checkDist(p, r)
    await checkPage(p, p.dist, all, all, r, { full: true, links: args.includes('--links') })
  } else {
    for (const id of ids.filter(i => all.includes(i))) {
      let html
      try {
        html = viteBuild(p, { only: id })
      } catch (e) {
        r.err(e.message)
        continue
      }
      await checkPage(p, html, [id], all, r, { full: false, links: args.includes('--links') })
    }
  }
  r.done()
}

function checkFolders(p, r) {
  if (!existsSync(p.specimensDir)) return r.err(`표본 폴더가 없다: ${relative(p.root, p.specimensDir)}`)
  for (const d of readdirSync(p.specimensDir)) {
    if (!statSync(join(p.specimensDir, d)).isDirectory()) continue
    if (!KEBAB.test(d)) r.err(`표본 폴더 이름은 kebab-case: ${d}`)
    if (!existsSync(join(p.specimensDir, d, 'meta.ts'))) r.warn(`meta.ts 가 없는 표본 폴더: ${d}`)
  }
}

/* import 경로의 대소문자가 실제 파일과 정확히 같은지 (Windows 에서 통과해도 Linux CI 에서 깨진다) */
const IMPORT_RE = /(?:import|export)[^'"\n]*?from\s*['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]|import\s+['"](\.[^'"]+)['"]/g
const EXTS = ['', '.ts', '.tsx', '.js', '.mjs', '.css', '/index.ts', '/index.tsx']

function exactExists(path) {
  if (!existsSync(path)) return false
  let cur = parse(resolve(path)).root
  for (const part of relative(cur, resolve(path)).split(/[\\/]/)) {
    if (!readdirSync(cur).includes(part)) return false
    cur = join(cur, part)
  }
  return true
}

function checkImportCase(dir, r) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      checkImportCase(path, r)
      continue
    }
    if (!/\.(tsx?|mjs|js)$/.test(name)) continue
    const text = readFileSync(path, 'utf8')
    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = (m[1] ?? m[2] ?? m[3]).split('?')[0]
      if (spec.includes('*')) continue
      const target = resolve(dir, spec)
      if (!EXTS.some(ext => exactExists(target + ext))) r.err(`import 경로가 실제 파일과 다르다 (대소문자 포함): ${relative(process.cwd(), path)} -> ${spec}`)
    }
  }
}

function checkDist(p, r) {
  const raw = readFileSync(p.dist)
  for (const [label, size, budget] of [
    ['원본', raw.length, p.budget.raw],
    ['gzip', gzipSync(raw, { level: 6 }).length, p.budget.gzip],
  ]) {
    console.log(`  dist ${label}: ${(size / 1024).toFixed(0)} KB (예산 ${(budget / 1024).toFixed(0)} KB, ${Math.round((size / budget) * 100)}%)`)
    if (size > budget) r.err(`용량 예산 초과(${label})`)
    else if (size > budget * 0.9) r.warn(`용량 예산 90% 넘음(${label})`)
  }
  const html = raw.toString('utf8')
  for (const [pattern, what] of [
    [/<script[^>]+src=["']https?:/i, '외부 스크립트'],
    [/<link[^>]+href=["']https?:[^>]*stylesheet|<link[^>]+stylesheet[^>]+href=["']https?:/i, '외부 스타일시트'],
    [/@import\s+url\(["']?https?:/i, '외부 CSS @import'],
    [/url\(["']?https?:\/\/[^)]*\.(woff2?|ttf|png|jpe?g|webp|svg)/i, '외부 글꼴·이미지'],
  ]) {
    if (pattern.test(html)) r.err(`dist 에 ${what} 참조가 있다 (오프라인 실행 불가)`)
  }
}

async function checkPage(p, html, ids, all, r, { full, links }) {
  const url = pathToFileURL(html).href
  const t = p.thumbTime
  await withChrome(
    async page => {
      await page.goto(`${url}#/`)
      await page.sleep(1200)
      const api = await page.evaluate('!!window.__gallery')
      if (!api) return r.err('window.__gallery 가 없다 (main.tsx 가 mountGallery 로 시작하는지 확인)')
      const built = await page.evaluate('window.__gallery.ids()')
      for (const id of ids) if (!built.includes(id)) r.err(`${id}: 빌드에 들어가지 않았다 (registry.ts 의 glob 을 확인)`)
      const metas = Object.fromEntries(await Promise.all(ids.map(async id => [id, await page.evaluate(`window.__gallery.meta(${JSON.stringify(id)})`)])))

      if (full) {
        const text = await page.evaluate('document.body.innerText')
        const missing = ids.filter(id => metas[id] && !text.includes(metas[id].title))
        if (missing.length) r.err(`오프라인(file://, 네트워크 차단)에서 홈에 보이지 않는 표본: ${missing.join(', ')}`)
        else console.log(`  오프라인 실행: 표본 ${ids.length}개 모두 표시됨`)
      }

      for (const issue of await page.evaluate(`window.__gallery.lint(${JSON.stringify(all)})`)) {
        if (ids.includes(issue.id)) (issue.level === 'warn' ? r.warn : r.err)(`${issue.id}: ${issue.message}`)
      }

      for (const id of ids) {
        const meta = metas[id]
        if (!meta) continue
        await checkStage(page, url, id, meta, t, p.checkQuery, r)
        console.log(`  ${id}: 무대 검사 끝`)
      }

      if (full && p.skillDir) await checkSkill(page, p, r)
      if (links) await checkLinks(Object.values(metas), r)
      for (const log of page.logs.slice(0, 8)) r.err(`페이지 오류: ${String(log).slice(0, 300)}`)
    },
    { extraArgs: full ? ['--host-resolver-rules=MAP * ~NOTFOUND'] : [] },
  )
}

async function open(page, url, id, query) {
  await page.goto(`${url}#/s/${id}?${query}`)
  await page.sleep(500)
  await settle(page, 0)
  const notfound = await page.evaluate(`document.querySelector('.notfound')?.innerText ?? ''`)
  return notfound
}

async function stageShot(page) {
  // 상태 배지(단계 이름, 효과 끔, 일시정지)는 비교에서 뺀다. 배지만 달라도 화면이 다르다고 보게 된다
  await page.evaluate(`document.querySelectorAll('.stage-badges').forEach(e => e.style.visibility = 'hidden')`)
  const rect = await page.rect('.stage')
  return rect ? page.screenshot(rect) : null
}

async function checkStage(page, url, id, meta, t, query, r) {
  const base = `${query}&t=${t}`
  const failed = await open(page, url, id, base)
  if (failed) return r.err(`${id}: 표본을 표시하지 못함: ${failed.slice(0, 300)}`)
  const status = await page.evaluate('window.__gallery.stage()')
  if (!status) return r.err(`${id}: 무대 핸들이 없다 (Stage 가 ref 로 StageHandle 을 내놓는지 확인)`)
  if (status.error) return r.err(`${id}: 무대 오류: ${status.error}`)
  if (!status.frames) return r.err(`${id}: 무대가 그리지 않는다`)
  const final = await stageShot(page)
  if (!final) return r.err(`${id}: .stage 요소가 없다`)

  const compare = async (query, what, level = r.err) => {
    await open(page, url, id, query)
    const s = await page.evaluate('window.__gallery.stage()')
    if (s?.error) return r.err(`${id}: ${what}에서 무대 오류: ${s.error}`), null
    const shot = await stageShot(page)
    const [d] = await diffs(page, [final, shot])
    if (d.changed < SAME) level(`${id}: ${what} 화면이 최종과 같다 (바뀐 픽셀 ${(d.changed * 100).toFixed(3)}%)`)
    return shot
  }
  await compare(`${base}&off=1`, '효과 끄기')
  const stepShots = []
  for (const s of meta.steps) stepShots.push(await compare(`${base}&step=${s.n}`, `${s.n}단계`, r.warn))
  for (let k = 1; k < stepShots.length; k++) {
    if (!stepShots[k] || !stepShots[k - 1]) continue
    const [d] = await diffs(page, [stepShots[k - 1], stepShots[k]])
    if (d.changed < SAME) r.warn(`${id}: ${meta.steps[k - 1].n}단계와 ${meta.steps[k].n}단계 화면이 같다`)
  }

  // 이벤트: 멈춘 무대에서 일으키고 시간을 옮긴다
  for (const ev of meta.events) {
    await open(page, url, id, base)
    const before = await stageShot(page)
    const frames = (await page.evaluate('window.__gallery.stage()'))?.frames ?? 0
    await page.evaluate(`window.__gallery.fire(${JSON.stringify(ev.id)})`)
    await page.evaluate(`window.__gallery.seek(${t + 0.3})`)
    await settle(page, frames)
    const s = await page.evaluate('window.__gallery.stage()')
    await page.evaluate('window.__gallery.seek(null)')
    if (s?.error) {
      r.err(`${id}: 이벤트 ${ev.id} 뒤 무대 오류: ${s.error}`)
      continue
    }
    const after = await stageShot(page)
    const [d] = await diffs(page, [before, after])
    if (d.changed < SAME) r.warn(`${id}: 이벤트 ${ev.id} 를 일으키고 0.3초 뒤에도 화면이 그대로다`)
  }

  // 자동 데모를 켜고 실제 시간으로 잠깐 돌린다
  await page.goto(`${url}#/s/${id}?auto=1`)
  await page.sleep(1500)
  const live = await page.evaluate('window.__gallery.stage()')
  if (live?.error) r.err(`${id}: 자동 데모 중 무대 오류: ${live.error}`)
  else if (!live || live.frames < 2) r.err(`${id}: 자동 데모에서 무대가 프레임을 그리지 않는다`)
}

async function checkSkill(page, p, r) {
  let entries
  try {
    entries = await page.evaluate('window.__gallery.skill()')
  } catch (e) {
    return r.err(`Skill 을 만들지 못했다: ${e.message}`)
  }
  for (const entry of entries) {
    const path = join(p.skillDir, entry.path)
    const want = Buffer.from(entry.base64, 'base64')
    const have = existsSync(path) ? readFileSync(path) : null
    // 텍스트 파일은 줄 끝 차이를 무시한다 (Windows 체크아웃)
    const same = have && (Buffer.compare(have, want) === 0 || have.toString('utf8').replace(/\r\n/g, '\n') === want.toString('utf8'))
    if (!same) return r.err(`Skill 이 최신이 아니다: ${entry.path}. npm run skill`)
  }
  console.log(`  Skill: 파일 ${entries.length}개 최신`)
}

async function checkLinks(metas, r) {
  const urls = [...new Set(metas.flatMap(m => [...m.references.map(x => x.url), ...m.inspiredBy.map(x => x.link).filter(Boolean)]))]
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 gallery-link-check' } })
      if (res.status >= 400) r.warn(`링크 응답 ${res.status}: ${u}`)
    } catch (e) {
      r.warn(`링크 확인 실패: ${u} (${e.message})`)
    }
  }
  console.log(`  링크 ${urls.length}개 확인`)
}

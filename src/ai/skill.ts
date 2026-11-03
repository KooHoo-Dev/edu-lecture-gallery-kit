import type { SkillConfig, SkillFile } from '../config'
import type { BaseSpecimen } from '../contract'
import type { ZipEntry } from './zip'

/* 표본 데이터에서 Agent Skill 을 만든다. 앱의 zip 받기와 검사 도구(gallery skill)가 같은 함수를 쓴다.
 * frontmatter 는 표준 필드만 써서 claude.ai 업로드와 Claude Code 에서 같은 zip 이 동작한다.
 * Skill 설명은 매 턴 컨텍스트를 차지하므로 갤러리마다 묶음 하나로 만들고, 표본 자료는 필요할 때만 읽게 한다. */

export const DESCRIPTION_LIMIT = 1536
export const SKILL_LINE_LIMIT = 500

export interface SkillSource<S extends BaseSpecimen> {
  specimen: S
  files: SkillFile[]
}

function skillMarkdown<S extends BaseSpecimen>(cfg: SkillConfig<S>, name: string, sources: SkillSource<S>[], version: string): string {
  const description = cfg.description(sources.map(s => s.specimen))
  if (description.length > DESCRIPTION_LIMIT) throw new Error(`Skill 설명이 ${DESCRIPTION_LIMIT}자를 넘습니다: ${description.length}`)
  const rows = sources.map(({ specimen: { meta } }) => `| \`${meta.id}\` | ${meta.title} | ${cfg.kindOf(sources.find(s => s.specimen.meta.id === meta.id)!.specimen)} | ${meta.oneLiner} |`)
  const text = [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
    'license: MIT',
    `compatibility: ${cfg.compatibility}`,
    'metadata:',
    `  version: "${version}"`,
    `  source: ${JSON.stringify(cfg.title)}`,
    '---',
    '',
    `# ${cfg.title}`,
    '',
    cfg.intro,
    '',
    '## 목록',
    '',
    '| ID | 이름 | 분류 | 설명 |',
    '|---|---|---|---|',
    ...rows,
    '',
    '## 진행 순서',
    '',
    ...cfg.steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    '## 지킬 것',
    '',
    cfg.rules,
    '',
    '## 파일을 다룰 때',
    '',
    ...cfg.notes.map(n => `- ${n}`),
    '',
  ].join('\n')
  const lines = text.split('\n').length
  if (lines > SKILL_LINE_LIMIT) throw new Error(`SKILL.md 가 ${SKILL_LINE_LIMIT}줄을 넘습니다: ${lines}`)
  return text
}

/** Skill 폴더의 파일 목록. single 이면 표본 하나만 담은 '<name>-<id>' Skill */
export function buildSkillFiles<S extends BaseSpecimen>(cfg: SkillConfig<S>, sources: SkillSource<S>[], version: string, single = false): ZipEntry[] {
  const name = single && sources.length === 1 ? `${cfg.name}-${sources[0].specimen.meta.id}` : cfg.name
  const entries: ZipEntry[] = [{ path: `${name}/SKILL.md`, content: skillMarkdown(cfg, name, sources, version) }]
  for (const { specimen, files } of sources) {
    const base = `${name}/references/${specimen.meta.id}`
    entries.push({ path: `${base}/guide.md`, content: cfg.guide(specimen) })
    for (const file of files) entries.push({ path: `${base}/${file.name}`, content: typeof file.content === 'string' ? file.content.replace(/\r\n/g, '\n') : file.content })
  }
  return entries
}

/** 설정의 files() 로 자료를 모아 Skill 파일 목록을 만든다 */
export async function collectSkill<S extends BaseSpecimen>(cfg: SkillConfig<S>, specimens: S[], version: string, single = false): Promise<ZipEntry[]> {
  const sources = await Promise.all(specimens.map(async specimen => ({ specimen, files: await cfg.files(specimen) })))
  return buildSkillFiles(cfg, sources, version, single)
}

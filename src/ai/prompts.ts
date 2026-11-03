import type { CodeFile, ParamDef, ParamValues } from '../contract'

/* 프롬프트·Skill 글을 만드는 도우미. 특정 AI 도구에 묶지 않는 평범한 Markdown 이다.
 * 프롬프트의 내용(환경, 지킬 것, 넣는 순서)은 갤러리가 정하고 kit 은 모양만 맞춘다. */

const trimNumber = (v: number) => String(Number(v.toFixed(4)))

export function numbered(lines: string[]): string {
  return lines.map((line, i) => `${i + 1}. ${line}`).join('\n')
}

export function bullets(lines: string[]): string {
  return lines.map(line => `- ${line}`).join('\n')
}

/** 값 하나를 사람이 읽는 글로 */
export function displayValue(def: ParamDef, value: unknown): string {
  if (def.type === 'select') return def.options.find(o => o.value === String(value))?.label ?? String(value)
  if (def.type === 'toggle') return value ? '켬' : '끔'
  if (def.type === 'color') return String(value).toUpperCase()
  return `${trimNumber(Number(value))}${def.unit ?? ''}`
}

/** 값 표 (Markdown 3열). columns 는 머리줄 이름 */
export function valueTable(defs: ParamDef[], values: ParamValues, columns: [string, string, string] = ['이름', '뜻', '값']): string {
  const rows = defs.map(def => `| \`${def.key}\` | ${def.label} | ${displayValue(def, values[def.key] ?? def.default)} |`)
  return [`| ${columns.join(' | ')} |`, '|---|---|---|', ...rows].join('\n')
}

/** 코드 블록의 울타리. 코드 안에 ``` 가 있으면 더 길게 */
export function fenceFor(code: string): string {
  const longest = Math.max(2, ...[...code.matchAll(/`+/g)].map(m => m[0].length))
  return '`'.repeat(longest + 1)
}

/** 파일 전체를 '### 경로' + 코드 블록으로 */
export function codeSection(files: CodeFile[]): string {
  return files
    .map(f => {
      const code = f.code.replace(/\r\n/g, '\n').trimEnd()
      const fence = fenceFor(code)
      return `### ${f.path}\n\n${fence}${f.lang}\n${code}\n${fence}`
    })
    .join('\n\n')
}

/** 해설 서식(Rich)을 Markdown 으로. 갤러리 안 링크(#/s/...)는 글자만 남긴다 */
export function richToMarkdown(text: string): string {
  return text.replace(/\[(.+?)\]\((#\/[^)\s]+)\)/g, '$1')
}

/** 프롬프트 한 편: 제목과 '## 이름\n내용' 구역들 */
export function promptDoc(title: string, lead: string, sections: [string, string][]): string {
  return [`# ${title}`, lead, ...sections.filter(([, body]) => body.trim()).map(([name, body]) => `## ${name}\n${body}`)].join('\n\n')
}

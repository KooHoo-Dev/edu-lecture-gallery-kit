import type { BaseMeta, BaseSpecimen, CodeFile } from './contract'

/* 갤러리의 src/registry.ts 가 import.meta.glob 결과를 표본 목록으로 바꿀 때 쓰는 도우미.
 * glob 문자열은 Vite 가 정적으로 읽어야 하므로 갤러리 쪽에 둔다. 표본 자리는 경로의 첫 `/*\/` 다
 * (격리 빌드 GALLERY_ONLY=<id> 가 그 자리를 id 로 바꾼다). */

/** glob 키(경로)에서 prefix 뒤 첫 폴더 이름 = 표본 id */
export function idFromPath(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null
  return path.slice(prefix.length).split('/')[0] || null
}

/** meta glob -> 메타 목록. 폴더 이름과 meta.id 가 다르면 멈춘다 */
export function collectMetas<M extends BaseMeta>(modules: Record<string, { meta: M }>, prefix: string): M[] {
  return Object.entries(modules).map(([path, mod]) => {
    const id = idFromPath(path, prefix)
    if (mod.meta.id !== id) throw new Error(`표본 폴더명(${id})과 meta.id(${mod.meta.id})가 다릅니다`)
    return mod.meta
  })
}

const LANGS: Record<string, string> = { cs: 'csharp', shader: 'cpp', hlsl: 'cpp', uxml: 'xml', uss: 'css', json: 'json', md: 'markdown' }

/**
 * raw glob -> 표본의 코드 파일. prefix 는 표본 폴더들의 부모(예: '../unity/'), unityRoot 는 Unity 프로젝트 안 자리
 * (예: 'Assets/Patterns/'). 하위 폴더 구조는 그대로 유지한다. order 로 파일 순서를 정한다 (작을수록 앞)
 */
export function collectFiles(
  sources: Record<string, string>,
  prefix: string,
  id: string,
  unityRoot: string,
  order: (relPath: string) => number = () => 0,
): CodeFile[] {
  const base = `${prefix}${id}/`
  return Object.entries(sources)
    .filter(([path]) => path.startsWith(base))
    .map(([path, code]) => {
      const rel = path.slice(base.length)
      const name = rel.split('/').at(-1)!
      const ext = name.split('.').at(-1)!.toLowerCase()
      return { rel, file: { name, path: `${unityRoot}${id}/${rel}`, lang: LANGS[ext] ?? 'plaintext', code } }
    })
    .sort((a, b) => order(a.rel) - order(b.rel) || a.rel.localeCompare(b.rel))
    .map(x => x.file)
}

/** url glob -> 촬영 이름별 주소 (예: '../shots/<id>/default.webp') */
export function collectShots(urls: Record<string, string>, prefix: string, id: string): Record<string, string> {
  const base = `${prefix}${id}/`
  return Object.fromEntries(
    Object.entries(urls)
      .filter(([path]) => path.startsWith(base))
      .map(([path, url]) => [path.slice(base.length).replace(/\.[^.]+$/, ''), url]),
  )
}

/** 그룹 순서(groups 의 키 순서) 다음 order 로 정렬 */
export function sortSpecimens<S extends BaseSpecimen>(list: S[], groupOrder: string[]): S[] {
  const g = (s: S) => groupOrder.indexOf(s.meta.group)
  return [...list].sort((a, b) => g(a) - g(b) || a.meta.order - b.meta.order)
}

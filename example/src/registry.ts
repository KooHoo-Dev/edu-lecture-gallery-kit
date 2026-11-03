import { collectFiles, collectMetas, collectShots, sortSpecimens, type BaseMeta, type BaseSpecimen } from '@koohoo/gallery-kit'

/* 표본 자동 등록. glob 의 첫 '/*\/' 가 표본 자리다 (GALLERY_ONLY 격리 빌드가 바꾼다) */
const metas = import.meta.glob<{ meta: BaseMeta }>('./specimens/*/meta.ts', { eager: true })
const sources = import.meta.glob<string>('../unity/*/**/*.cs', { query: '?raw', import: 'default', eager: true })
const shots = import.meta.glob<string>('./shots/*/*.webp', { import: 'default', eager: true })

export const GROUPS = {
  A: { name: '기본', desc: '예제 갤러리의 유일한 그룹' },
}

export const SPECIMENS: BaseSpecimen[] = sortSpecimens(
  collectMetas(metas, './specimens/').map(meta => ({
    meta,
    files: collectFiles(sources, '../unity/', meta.id, 'Assets/KitExample/'),
    shots: collectShots(shots, './shots/', meta.id),
  })),
  Object.keys(GROUPS),
)

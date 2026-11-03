import { collectSkill } from './ai/skill'
import { createZip } from './ai/zip'
import type { GalleryConfig } from './config'
import type { BaseMeta, BaseSpecimen, StageHandle, StageStatus } from './contract'
import { lintAll, type LintIssue } from './lint'

/* 자동 검사용 창구. Node 도구(gallery check, live, skill, thumbs)가 헤드리스 Chrome 에서 부른다.
 * Node 는 node_modules 안의 TS 를 읽지 못하므로, TS 로 쓴 검사·생성 로직은 모두 이 창구를 거쳐 브라우저에서 돈다.
 * 사용자 화면에는 영향이 없다. */

export interface GalleryTestApi {
  id: string
  name: string
  version: string
  ids: () => string[]
  meta: (id: string) => BaseMeta | null
  /** knownIds: 리포에 있는 모든 표본 id (격리 빌드에서 related 확인용) */
  lint: (knownIds?: string[]) => LintIssue[]
  /** 지금 열린 상세 페이지의 표본 id */
  current: () => string | null
  stage: () => StageStatus | null
  seek: (time: number | null) => boolean
  fire: (eventId: string) => boolean
  /** 무대 화면. type 이 image/webp 면 WebP 로 바꾼다. data URL */
  capture: (type?: string, quality?: number) => Promise<string | null>
  /** Skill 파일 목록 (내용은 base64) */
  skill: () => Promise<{ path: string; base64: string }[]>
  skillZip: () => Promise<string>
  /** 갤러리 도메인 창구 (설정의 test) */
  domain: Record<string, (...args: never[]) => unknown>
}

declare global {
  interface Window {
    __gallery?: GalleryTestApi
  }
}

let currentId: string | null = null
let currentGet: (() => StageHandle | null) | null = null

export function setCurrentStage(id: string | null, get: (() => StageHandle | null) | null) {
  currentId = id
  currentGet = get
}

const handle = () => currentGet?.() ?? null

function toBase64(content: string | Uint8Array): string {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

async function blobToDataUrl(blob: Blob, type: string, quality: number): Promise<string> {
  let out = blob
  if (type !== blob.type) {
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
    out = await new Promise<Blob>((ok, fail) => canvas.toBlob(b => (b ? ok(b) : fail(new Error('변환 실패'))), type, quality))
  }
  return await new Promise<string>((ok, fail) => {
    const reader = new FileReader()
    reader.onload = () => ok(String(reader.result))
    reader.onerror = () => fail(reader.error)
    reader.readAsDataURL(out)
  })
}

export function installTestApi<S extends BaseSpecimen>(config: GalleryConfig<S>) {
  window.__gallery = {
    id: config.id,
    name: config.name,
    version: __APP_VERSION__,
    ids: () => config.specimens.map(s => s.meta.id),
    meta: id => config.specimens.find(s => s.meta.id === id)?.meta ?? null,
    lint: knownIds => lintAll(config, knownIds),
    current: () => currentId,
    stage: () => handle()?.status() ?? null,
    seek: time => {
      const h = handle()
      h?.seek(time)
      return !!h
    },
    fire: eventId => {
      const h = handle()
      h?.fire(eventId)
      return !!h
    },
    capture: async (type = 'image/png', quality = 0.9) => {
      const blob = await handle()?.capture()
      return blob ? blobToDataUrl(blob, type, quality) : null
    },
    skill: async () => (await collectSkill(config.ai.skill, config.specimens, __APP_VERSION__)).map(e => ({ path: e.path, base64: toBase64(e.content) })),
    skillZip: async () => toBase64(createZip(await collectSkill(config.ai.skill, config.specimens, __APP_VERSION__))),
    domain: config.test ?? {},
  }
}

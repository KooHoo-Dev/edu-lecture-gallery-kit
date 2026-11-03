import { createContext, useContext, type ComponentType, type ReactNode, type Ref } from 'react'
import type { BaseSpecimen, CodeFile, ParamValues, PlannedSpecimen, StageHandle, StageProps } from './contract'

/* 갤러리 하나가 kit 에 넘기는 것. 갤러리의 src/gallery.config.tsx 가 defineGallery 로 만든다. */

declare global {
  /** package.json 의 version (kit 의 Vite 설정이 넣는다) */
  const __APP_VERSION__: string
  /** 빌드 날짜 YYYY-MM-DD */
  const __BUILD_DATE__: string
}

/** 머리·카드에 붙는 작은 표시. tone 은 CSS 색 (분류 색) */
export interface Chip {
  label: string
  title?: string
  tone?: string
  /** 주의 표시 (요구 설정, 번쩍임 등) */
  warn?: boolean
  outline?: boolean
}

/** 홈의 추가 필터 하나 (셰이더의 무대 종류처럼). legend 가 true 면 홈 상단에 설명 목록으로도 보인다 */
export interface Facet<S> {
  label: string
  options: { value: string; label: string; desc?: string; tone?: string }[]
  of: (s: S) => string
  legend?: boolean
}

export interface PromptKind<S> {
  id: string
  /** 탭 이름 (예: 그대로 넣기) */
  name: string
  desc: string
  build: (s: S, values: ParamValues) => string
}

/** Skill 의 references/<id>/ 아래에 들어갈 파일 */
export interface SkillFile {
  name: string
  content: string | Uint8Array
}

export interface SkillConfig<S> {
  /** Skill 이름 (kebab-case). 표본 하나만 담으면 '<name>-<id>' */
  name: string
  /** frontmatter description. 1,536자 이하 */
  description: (all: S[]) => string
  /** frontmatter compatibility */
  compatibility: string
  /** SKILL.md 제목 */
  title: string
  /** 제목 아래 첫 문단 */
  intro: string
  /** 목록 표의 '분류' 칸 */
  kindOf: (s: S) => string
  /** '진행 순서' 목록 */
  steps: string[]
  /** '지킬 것' (Markdown 목록) */
  rules: string
  /** '파일을 다룰 때' 목록 */
  notes: string[]
  /** references/<id>/guide.md */
  guide: (s: S) => string
  /** references/<id>/ 의 코드와 자료 (기본값 기준) */
  files: (s: S) => Promise<SkillFile[]>
}

export interface AiConfig<S> {
  /** AI 세트 첫머리 안내 */
  intro: string
  prompts: PromptKind<S>[]
  /** 현재 값이 반영된 원본 코드 */
  files: (s: S, values: ParamValues) => CodeFile[]
  /** 코드 패널 아래 설명 */
  codeNote?: (s: S) => ReactNode
  /** 코드 패널의 마지막 탭 (예: 머티리얼 설정, Inspector 값). markdown 은 3열 표 */
  sheet?: { tab: string; markdown: (s: S, values: ParamValues) => string }
  /** 이미지 패널 */
  images: {
    title: string
    list: (s: S) => { name: string; label: string; url: string }[]
    note?: string
    /** 무대 캡처 버튼 이름. 없으면 버튼을 두지 않는다 */
    liveLabel?: string
  }
  skill: SkillConfig<S>
}

/** 상세 페이지에 더하는 구역. after 는 공통 구역 이름 */
export interface SectionDef<S> {
  id: string
  title: string
  after: 'goals' | 'mistakes' | 'ai' | 'unity' | 'origin'
  wide?: boolean
  render: (s: S, values: ParamValues) => ReactNode
}

export interface GalleryConfig<S extends BaseSpecimen = BaseSpecimen> {
  /** 영문 kebab-case (로그, 검사 창구) */
  id: string
  /** 표시 이름 (예: Pattern Gallery) */
  name: string
  brand: { title: string; tagline: string }
  /** localStorage 키 앞머리. 같은 file:// 출처를 쓰는 다른 도구와 겹치지 않게 (예: jaytools.patterngallery.v1.) */
  storageKey: string
  /** '오프라인용 HTML 받기' 파일 이름 */
  downloadName: string
  /** 바닥글과 상세 머리의 기준 환경 (예: Unity 6.3 LTS · C# 9) */
  envLabel: string
  /** 바닥글의 콘텐츠 고지 한 문장 */
  footer: string
  hero: { eyebrow: string; title: ReactNode; lead: ReactNode }
  searchPlaceholder: string
  /** 그룹 키 -> 이름·설명. 순서대로 보인다 */
  groups: Record<string, { name: string; desc: string }>
  facet?: Facet<S>
  /** 태그 필터 이름 (예: 기법) */
  tagLabel: string
  specimens: S[]
  planned?: PlannedSpecimen[]
  /** 옛 ID -> 새 ID */
  aliases?: Record<string, string>
  Stage: ComponentType<StageProps<S> & { ref?: Ref<StageHandle> }>
  /** 카드에 마우스를 올리면 무대를 실행할지 (기본: 모션 줄이기가 꺼져 있으면) */
  cardLive?: () => boolean
  /** 카드 이미지 설명 (예: Unity 실측 화면) */
  shotAlt: string
  /** 상세 머리의 도메인 칩 */
  chips?: (s: S) => Chip[]
  /** 카드의 분류 칩 */
  cardChip?: (s: S) => Chip | null
  sections?: SectionDef<S>[]
  /** 단계 목록 마지막 칸 */
  finalStep: { label: string; body: string }
  /** AI 지시 세트와 Skill */
  ai: AiConfig<S>
  /** 'Unity 에 직접 넣기' 구역의 추가 내용 */
  unityExtra?: (s: S) => ReactNode
  about: {
    /** '이 갤러리는 무엇인가' 문단들 */
    intro: ReactNode
    /** 콘텐츠 원칙 목록 */
    principles: string[]
    /** 영문 고지 */
    noticeEn: string
    /** 수강생에게 */
    students: ReactNode
    /** kit 기본 목록에 더할 라이브러리 [이름, 라이선스, 주소] */
    libs?: [string, string, string][]
  }
  /** 도메인 검사 (브라우저에서 돈다). 문제 목록을 돌려준다 */
  lint?: (s: S) => string[]
  /** 검사 도구가 부르는 도메인 창구 (window.__gallery.domain) */
  test?: Record<string, (...args: never[]) => unknown>
}

export function defineGallery<S extends BaseSpecimen>(config: GalleryConfig<S>): GalleryConfig<S> {
  return config
}

export const GalleryContext = createContext<GalleryConfig | null>(null)

export function useGallery<S extends BaseSpecimen = BaseSpecimen>(): GalleryConfig<S> {
  const config = useContext(GalleryContext)
  if (!config) throw new Error('GalleryContext 가 없습니다. mountGallery 로 시작하세요')
  return config as unknown as GalleryConfig<S>
}

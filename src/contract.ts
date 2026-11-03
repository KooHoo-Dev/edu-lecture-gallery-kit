import type { ReactNode } from 'react'

/* ──────────────────────────────────────────────────────────────
 * 표본 계약 v2: 모든 교안 갤러리가 같이 쓰는 meta 형식과 무대 계약.
 * 갤러리는 BaseMeta 를 넓혀 도메인 필드(stage 등)를 더한다. 자세한 규칙은 docs/kit-guide.md.
 * ────────────────────────────────────────────────────────────── */

export type ParamValue = number | string | boolean
export type ParamValues = Record<string, ParamValue>

interface ParamBase {
  /** 원본 코드의 이름 (셰이더 속성, [SerializeField] 필드, 시나리오 입력 변수). 복사하는 코드와 프롬프트에 그대로 쓰인다 */
  key: string
  /** 한국어 표시 이름 */
  label: string
  /** 이 값이 화면에서 무엇을 바꾸는지 */
  hint?: string
  /** 다른 select 값이 이 목록 중 하나일 때만 보인다 (쓰이지 않는 값 숨기기) */
  showWhen?: { key: string; values: string[] }
}
export type ParamDef =
  | (ParamBase & { type: 'range'; min: number; max: number; step: number; default: number; unit?: string })
  | (ParamBase & { type: 'select'; options: { value: string; label: string }[]; default: string })
  | (ParamBase & { type: 'toggle'; default: boolean })
  /** sRGB 16진수 (#rrggbb) */
  | (ParamBase & { type: 'color'; default: string })

export interface Preset {
  id: string
  /** 쓰임새 이름 (게임명 금지) */
  name: string
  look?: string
  /** 기본값과 다른 값만 */
  values: ParamValues
}

export type Ease = 'linear' | 'inOutSine' | 'outQuad' | 'inQuad'

/** range 값 하나를 시간에 따라 움직이는 트랙. frames 는 [초, 값] 목록 */
export interface Track {
  key: string
  frames: [number, number][]
  ease?: Ease
}

/**
 * 이벤트 버튼(1~9)으로 한 번 일으키는 것.
 * tracks 가 있으면 kit 의 트랙 엔진이 값을 움직이고, 없으면 무대가 id 를 받아 직접 처리한다 (게임 입력 등)
 */
export interface StageEvent {
  id: string
  label: string
  tracks?: Track[]
}

/** 사람이 없어도 핵심 상황이 도는 자동 데모. 갤러리는 무대에서 다른 방식(시나리오 재생 등)을 더할 수 있다 */
export interface Demo {
  loops?: Track[]
  /** 일정 간격(초)으로 발생시키는 이벤트 */
  fire?: { event: string; every: number }[]
}

/**
 * 안내 순서 한 칸. 무대가 n 과 target 을 해석한다.
 * 예: 셰이더는 SG_STEP 중간 출력, 패턴은 구조 그림 노드와 코드의 `// [n]` 줄, C# 문법은 실행 위치
 */
export interface Step {
  n: number
  label: string
  body: string
  /** 무대가 강조할 대상 (구조 그림 노드 id 등). 쉼표로 여럿 */
  target?: string
}

export interface Mistake {
  /** 수강생이 실제로 겪는 증상 */
  title: string
  /** 원인과 해결 */
  body: string
}

export interface InspiredBy {
  /** 원제 (연도) */
  title: string
  credit: string
  /** 빌린 축. 최대 2개 */
  borrowed: string[]
  learned: string
  link?: string
}

export interface Reference {
  label: string
  url: string
}

/** 함께 보면 좋은 표본. 같은 갤러리는 id, 다른 갤러리는 url 과 title */
export type Related = { id: string; why: string } | { url: string; title: string; why: string }

export interface UnityGuide {
  /** Unity 에 넣는 순서 */
  setup: string[]
  /** 잘 되었는지 확인하는 방법 한 문장 */
  verify: string
  pitfalls: string[]
}

export interface PromptGuide {
  /** 이 표본으로 무엇을 하려는지 한 문장. 프롬프트 첫머리에 들어간다 */
  goal: string
  /** '변형' 프롬프트에 넣는 예시. 첫 번째가 예시 칸에 들어간다 */
  adaptIdeas: string[]
}

/** 기본값 외에 더 찍어 둘 상태 (썸네일, AI 세트 이미지) */
export interface Capture {
  name: string
  label: string
  values: ParamValues
}

export interface BaseMeta {
  /** 영구 불변 ID (kebab-case). 폴더 이름, URL 에 쓰인다 */
  id: string
  title: string
  titleEn: string
  /** 갤러리 설정 groups 의 키 */
  group: string
  order: number
  oneLiner: string
  /** 3~4개. "~할 수 있다" */
  goals: string[]
  /** 기법·주제. 검색과 필터에 쓴다 */
  tags: string[]
  difficulty: 1 | 2 | 3
  params: ParamDef[]
  presets: Preset[]
  events: StageEvent[]
  demo?: Demo
  /** 2~5개 */
  steps: Step[]
  /** '효과 끄기' 화면이 보여 주는 흔한 실수 */
  offNote: string
  mistakes: Mistake[]
  unity: UnityGuide
  prompt: PromptGuide
  captures?: Capture[]
  /** 썸네일로 쓸 촬영 이름 (captures 의 name). 기본 'default' */
  thumbnail?: string
  inspiredBy: InspiredBy[]
  /** 원작과 다르게 새로 만든 것 */
  original: string
  references: Reference[]
  related?: Related[]
  /** 화면의 넓은 영역이 번쩍인다. 이벤트가 제한기를 거친다 */
  flashes?: boolean
}

/** 표본의 원본 코드 파일 하나 */
export interface CodeFile {
  /** 파일 이름 (예: PlayerController.cs) */
  name: string
  /** Unity 프로젝트 안에서 둘 자리 (예: Assets/Patterns/state-player-actions/Core/PlayerController.cs) */
  path: string
  /** highlight.js 언어 이름 (csharp, cpp, xml, css …) */
  lang: string
  code: string
}

/** 앱이 다루는 표본 하나. 갤러리는 필드를 더할 수 있다 */
export interface BaseSpecimen<M extends BaseMeta = BaseMeta> {
  meta: M
  files: CodeFile[]
  /** 촬영 이름 -> 이미지 주소 (Unity 실측 또는 웹 무대 촬영) */
  shots: Record<string, string>
}

/** 아직 구현되지 않은 계획 표본 ('제작 중' 카드) */
export interface PlannedSpecimen {
  id: string
  title: string
  group: string
  order: number
  oneLiner: string
}

/* ───────── 무대 계약 ───────── */

export interface StageProps<S extends BaseSpecimen = BaseSpecimen> {
  specimen: S
  values: ParamValues
  /** 0 = 최종, 그 밖은 steps 의 n */
  step: number
  /** 효과 끄기 (흔한 실수) */
  off: boolean
  playing: boolean
  /** 1, 0.5, 0.25 */
  speed: number
  auto: boolean
  /** 링크의 t=<초>: 이 시간에 멈춘 채 시작 */
  startTime?: number
  /** 자동 데모·이벤트가 움직이는 값 (값 조절 패널 표시용). null 이면 조절 값으로 돌아간 것 */
  onLive?: (key: string, value: number | null) => void
  /** 갤러리 카드 미리보기. 가볍게 그린다 */
  thumbnail?: boolean
  /** 무대 위 배지 */
  children?: ReactNode
}

export interface StageStatus {
  /** 그린 프레임 수 */
  frames: number
  /** 무대 시간 (초) */
  time: number
  error: string | null
}

export interface StageHandle {
  /** 이벤트를 한 번 일으킨다 */
  fire: (eventId: string) => void
  /** 현재 화면을 PNG 로 */
  capture: () => Promise<Blob | null>
  /** 자동 검사용: 무대 시간을 직접 정하고 스스로 흐르지 않게 붙든다. null 이면 놓는다 */
  seek: (time: number | null) => void
  status: () => StageStatus
}

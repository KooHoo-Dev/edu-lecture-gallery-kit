# 교안 갤러리 공통 틀 설계 (gallery-kit, 가칭)

- 작성: 2026-11-03. 상태: Jay 확인 (2026-11-03). 9절 질문 답: kit 리포 생성, 파일럿은 상태·관찰자·명령, 회사 크레딧은 11-19 전에 쓴다. 구현 메모는 10절.
- 근거: `C:\Users\user\UIGallery`(이하 UIG, `57cf6d4`)와 `C:\Users\user\shader-gallery`(이하 SG, `4834fb6`)를 읽기만 하고 비교했다.
- 처음에는 `JayTools/docs/gallery-kit-design.md` 에 썼고 kit 리포가 생겨 여기로 옮겼다.

## 0. 결론

1. **공통 틀(kit)은 공유 패키지로 나눠 갖는다.** 공개 리포 하나에 앱 셸, 표본 계약, AI 지시 세트와 Skill 생성, 검사·캡처 도구, 배포 워크플로, 잡 생성·리뷰 틀, 공통 규격 문서를 둔다. 갤러리는 git 태그로 설치한다. 결과물이 HTML 하나인 것은 그대로다.
2. **원칙은 SG 를 따른다.** 표본은 "글 데이터 + Unity 에 그대로 넣는 원본 코드 + 실측 결과" 이고, 웹 무대는 앱이 종류별로 제공한다. 웹이 원본 코드를 직접 실행하지 못하면, 같은 시나리오를 원본으로도 돌려 결과를 기계로 대조한다.
3. **파일럿은 디자인 패턴 갤러리**이고 표본은 상태, 관찰자, 명령 3개다. 표본은 패턴 하나를 게임 상황 하나에 적용한 것이다. 무대는 미니 월드, 구조 그림, 사건 기록을 한 화면에 둔 '시나리오 무대'다.
4. **C# 문법 갤러리는 두 번째로 만든다.** 표본은 문법 개념 하나를 보여 주는 짧은 프로그램이다. 무대는 dotnet 으로 실제 실행해 남긴 기록을 한 줄씩 재생하는 '실행 무대'다. 기록 도구(트레이서)는 시험부터 한다.
5. 기존 두 갤러리는 지금 옮기지 않는다. kit 를 SG 셸에서 뽑아내므로 SG 는 다음 셰이더 묶음 전에 옮긴다. UIG 는 옮기지 않는다.

## 1. 두 앱 비교

### 1-1. 항목별

| 항목 | UIGallery | Shader Gallery | 판단 |
|---|---|---|---|
| 앱 셸 | 갤러리(그룹·태그 필터, 화면에 들어오면 마운트하는 실시간 무대 카드) → 상세. 해시 라우터, 발표 모드(P), 라이트/다크, 오프라인 HTML 받기 | UIG 셸을 복사. 카드는 Unity 실측 정적 썸네일. 상세 페이지를 링크마다 오류 경계로 감쌈 | 공통. 카드는 정적 썸네일 기본 |
| 표본 단위 | `src/specimens/<id>/` 의 React HUD(+선택 three Scene) + `src/unity/<id>/ugui·uitk` | `web/src/specimens/<id>/meta.ts` + `Assets/Shaders/<id>/`(core.hlsl, .shader, C#). React 없음 | SG 원칙(데이터 + 원본 코드) |
| meta 공통 필드 | id, title, titleEn, group, order, oneLiner, goals, difficulty, params, presets, events, mistakes, inspiredBy, original, references, related, flashes | 같은 것 + tags, steps, demo, prompt, captures, thumbnail | 공통 계약 v2 (2-5절) |
| meta 도메인 필드 | paradigms, principles, platforms, inputs, genres, stage(aspect·three·backdrop), hotspots, juiceOff, timings, unity{ugui, uitk} | stage(kind·mesh·blend 등), shaderFile, requires, webGlslReason, offNote, unity(setup·verify·pitfalls·graph) | 갤러리별 |
| 값 조절 | range, select, toggle, color + 프리셋 + 초기화. 표본 코드가 값을 읽는다 | 같은 4종. key 가 셰이더 속성 이름이고 패널에 표기. 트랙이 움직이는 값을 실시간 표시 | 공통. key = 원본 코드 이름 |
| 이벤트, 자동 데모 | 이벤트는 id 만. 표본이 `useTrigger`, `useAutoplay` 로 처리 | 이벤트와 데모가 트랙(`[초, 값]`) 데이터. 앱이 재생 | 공통 트랙 엔진 + 무대 직접 처리 둘 다 허용 |
| 단계 | 해설 번호(hotspots). 무대 위 번호, ←/→, H | 단계 보기. `SG_STEP` 중간 출력, ←/→, 마지막은 최종 | 공통 '안내 순서'. 해석은 무대가 한다 |
| 효과 끄기 | J. `juice=false` 를 표본이 처리 | J. `SG_OFF` 분기를 컴파일 | 공통 (`off` + `offNote`) |
| 링크 옵션 | preset, juice, speed, event, spot, spots, auto, aspect, p.*, webgl | preset, off, speed, event, step, auto, t, p.* | 공통 + 갤러리 추가 |
| AI 지시 세트 | 프롬프트 3종(SG 에서 손으로 이식). 조절 값과 Unity 필드는 이름·단위로 추정해 346개 중 120개만 짝지음 | 프롬프트 3종, Unity 실측 스크린샷과 현재 웹 화면 복사, 현재 값이 들어간 코드, Skill zip | 틀은 공통. 환경, 지킬 것, 넣는 순서는 갤러리 |
| Skill | 없음 | 묶음 Skill 하나(SKILL.md 500줄 이하, 설명 1,536자 이하). 앱 안 zip 과 `tools/build-skill.mjs` 가 같은 함수 | 공통 |
| Unity 실측 | `tools/unity-compile.ps1`(Unity 내장 Roslyn, 컴파일만, 손으로 실행). 화면은 손으로 확인 | `tools/unity.mjs`: 열린 에디터 또는 배치 복사본에서 4개 그래픽 API 컴파일과 촬영 → webp | 실행 장치는 공통 라이브러리, 진입점은 갤러리 |
| 빌드, 배포 | Vite + singlefile, `UIG_ONLY` 격리 빌드, deploy.yml(main → Pages, `v*` → Release) | 같음 (`SG_ONLY`, `web/` 폴더) | 공통 (재사용 워크플로) |
| 검사 | `check.py`(Python): 비트맵 금지, 폴더, import 대소문자, 용량, 오프라인 실행, UXML, namespace | `check.mjs`(Node): 폴더, 공통 문법, 래퍼, meta 와 셰이더 대조, 글 규칙, import, WebGL 컴파일, 무대 동작, 그림자, 용량, 오프라인, Skill 최신 | 공통 뼈대(Node) + 도메인 규칙 |
| 캡처 | `shot.py`(가상 시간) + `live.mjs`(실제 시간) | `live.mjs` + `t=` 시간 고정 + `burst` 연속 촬영과 변화량 | 공통 (`live` + burst) |
| 용량 | 원본 5MB, gzip 1.5MB. 지금 gzip 80%, 표본당 약 110KB | 같은 예산. gzip 86%, 표본당 약 47KB (plan 4절) | 공통 예산과 `size` 도구 |
| 작업 흐름 | 세션 안 서브에이전트 (구현 → 독립 리뷰 → 수정) | JayDispatch 잡: 명세 → `make-jobs` → `dispatch run` → `prepare-review` → 독립 리뷰 → 수정 잡 → 병합 | SG 흐름을 kit 틀로 |
| 문서 | plan, specimen-guide(계약 v1), agent-contract, next-specimens-research + research JSON | plan, handoff, specimen-guide(규격 v1), shader-selection, prompt-test | 공통 규칙은 kit-guide, 도메인은 갤러리 |

### 1-2. 복사가 이미 만든 어긋남

SG 셸은 2026-11-02 에 UIG 를 복사해 시작했다. 하루 만에 다음이 갈렸다.

- 이름이 같은 셸 파일 23개 중 내용이 같은 것은 2개(`Rich.tsx`, `fonts.css`)뿐이다. 14개는 몇 줄에서 50줄 차이다. 대부분 이름, 강조색, 저장 키, 그리고 한쪽에만 들어간 수정이다. 7개는 크게 다르다(`SpecimenPage`, `prompts`, `registry`, `app.css`, `Home`, `SpecimenCard`, `clipboard`).
- 한쪽에만 들어간 수정
  - SG 에만 있다: 한글 입력 상태에서 단축키가 먹지 않는 문제를 `e.code` 로 고친 것(UIG 는 아직 `e.key`), 발표 모드 P 키의 조합키 무시, 상세 페이지 전체를 감싸는 오류 경계, 클립보드 이미지 복사와 공용 복사 훅.
  - UIG 에만 있다: 무대 단축키 가드 `stageKeys`(키를 쓰는 표본 22개를 통일한 것).
- AI 프롬프트 란은 SG 에서 UIG 로 손으로 옮겼다. 505줄과 독립 리뷰 10건이 들었다.
- 검사 도구는 UIG 가 Python, SG 가 Node 다. 용량 예산, 오프라인 실행, import 대소문자 검사를 두 번 구현했다.

갤러리가 넷이 되면 이런 수정을 매번 세 군데에 옮겨야 한다.

### 1-3. kit 로 올릴 것과 갤러리에 남길 것

| 영역 | kit 로 올린다 | 갤러리에 남긴다 |
|---|---|---|
| 셸 | App 틀, 라우터와 공통 링크 옵션, 홈(그룹·태그·검색 필터, 정적 썸네일 카드, 제작 중 카드), 상세 페이지 뼈대와 슬롯, 값 조절 패널, 재생 바, 단계 목록, 단축키(Space, 1~9, J, S, A, ←/→, P. `e.code` 로 판단), 무대 단축키 가드, 발표 모드, 테마, 오프라인 HTML 받기, 오류 경계, About, EnvBadge, Rich, clipboard, storage, 번쩍임 제한기, 토큰·폰트·공통 CSS | 무대 컴포넌트, 머리 칩, 상세 페이지에 더하는 구역, 브랜드 이름과 강조색, 저장 키, 그룹 이름, 태그 어휘 |
| 계약 | meta 공통 타입, params(기본값, 프리셋, 링크 덮어쓰기), 트랙 엔진(ease, 이벤트, 데모), `StageProps`·`StageHandle` | meta 도메인 필드 (`stage`, 도메인 입력) |
| 원본 코드 | 없음 | 원본 코드 규격 (core.hlsl 공통 문법, Unity C# 규칙, C# 버전) |
| AI | 프롬프트 골격, 값 표, 코드 블록, Skill 생성(SKILL.md, guide.md, zip), AI 세트 화면 | 프롬프트 종류 목록, 환경, 지킬 것, 넣는 순서, 파일 경로 |
| 도구 | check 공통 항목, live(+burst), size, skill, thumbs(웹 무대 썸네일), new(표본 시작 틀), unity-compile, Chrome·worktree·Unity 실행 라이브러리, Vite 격리 빌드 플러그인 | check 도메인 규칙, 실측 진입점(SgVerify, dotnet 하네스, 트레이서), `registry.ts`(Vite glob 은 고정 문자열이어야 한다) |
| 배포 | 재사용 워크플로 (빌드 → check → Pages, 태그 → Release) | 작업 폴더, Release 파일 이름 |
| 작업 흐름 | 잡 생성기, 수정 잡 생성기, 리뷰 폴더 준비, 리뷰 지침 틀, 잡 템플릿 | writePaths 패턴, verify 명령, 기준 샘플 표, 리뷰 폴더에 넣을 것 |
| 문서 | kit-guide (2-7절) | plan, handoff, specimen-guide 도메인 절, selection, research |

## 2. 나눠 갖는 방법: 공유 패키지

### 2-1. 결정과 근거

| 기준 | 템플릿 리포 | 공유 패키지 | 복사 |
|---|---|---|---|
| 새 갤러리 시작 | 쉽다 | `gallery new` 시작 틀 | 쉽다 |
| 수정 전파 | 없다 | 태그를 올리면 된다 | 손으로 옮긴다 |
| 갤러리별 변형 | 자유 | 설정과 슬롯으로만 | 자유 |
| 관리 부담 | 낮다 | 버전 관리, 두 리포 수정 | 처음엔 낮고 점점 커진다 |
| 주된 위험 | 어긋남 | kit 변경이 갤러리를 깨뜨림 | 어긋남 |

**공유 패키지로 한다.** 근거는 네 가지다.

1. 템플릿은 첫날만 같다. 1-2절의 어긋남이 템플릿으로 시작했을 때와 같은 결과다. 갤러리가 최소 넷(UI, 셰이더, 패턴, C# 문법)이 되면 셸 수정 하나를 세 번 옮겨야 한다.
2. 도구는 같은 계약 위에서만 한 번 쓸 수 있다. 검사, 연속 촬영, 썸네일, 잡 생성, 리뷰 폴더는 meta 형식과 무대 핸들에 기대고 있다. 계약이 갈라지면 도구도 갈라진다. UIG 의 Python 검사와 SG 의 Node 검사가 그 예다.
3. 단점은 작다. Jay 혼자 쓰고, 구독 세션 하나가 kit 과 갤러리를 함께 고친다. 태그를 고정하므로 kit 변경이 다른 갤러리를 갑자기 깨뜨리지 않는다.
4. 결과물에는 영향이 없다. kit 는 빌드 때 갤러리 코드와 함께 묶여 HTML 하나가 된다. `file://` 실행과 Pages 배포는 지금과 같다.

### 2-2. 패키지 형태

- **리포**: 공개 `KooHoo-Dev/edu-lecture-gallery-kit` (Jay 가 만든다). 갤러리 리포의 Actions 가 `npm ci` 로 인증 없이 받으려면 공개여야 한다. JayTools 는 비공개라 여기 둘 수 없다.
- **설치**: 갤러리 `package.json` 에 `"@koohoo/gallery-kit": "github:KooHoo-Dev/edu-lecture-gallery-kit#v0.1.0"`. npm 레지스트리 계정이 필요 없다.
- **담는 것**: TS/TSX 원본과 CSS 를 그대로 담는다. 갤러리의 Vite 가 함께 빌드한다. three.js, R3F 같은 무거운 의존성은 kit 에 넣지 않는다. 필요한 갤러리만 넣는다.
- **도구**: `bin` 으로 `gallery check | live | size | skill | thumbs | new | unity-compile` 을 둔다. 갤러리는 같은 이름의 npm 스크립트(`npm run check -- <id>`)로 부른다. Node 만 쓴다.
- **배포**: 갤러리의 deploy.yml 은 kit 의 재사용 워크플로를 부른다 (`uses: KooHoo-Dev/edu-lecture-gallery-kit/.github/workflows/pages.yml@v0.1.0`). 지금 두 deploy.yml 의 차이는 작업 폴더와 Release 파일 이름뿐이라 입력값이면 충분하다.
- **로컬에서 kit 를 고칠 때**: kit 리포를 `C:\Users\user\gallery-kit` 에 둔다. 갤러리에서 `npm run kit:link` 로 node_modules 의 kit 를 그 폴더에 정션으로 잇는다. 확인한 뒤 kit 커밋과 태그 → 갤러리 `npm run kit:bump v0.1.1` → 갤러리 커밋 순서다.
- **워커 worktree**: SG 의 `tools/lib/worktree.mjs` 처럼 메인의 node_modules 를 정션으로 잇는다. kit 도 함께 보인다. 워커는 kit 를 고치지 않는다 (writePaths 밖).
- **버전**: 0.x 동안 minor 를 올리면 계약이 바뀐 것이다. `CHANGELOG.md` 에 갤러리가 할 일을 적는다. kit 의 CI 는 `example/` 갤러리를 빌드하고 검사해 셸이 깨지지 않았는지 본다.
- **먼저 시험할 것**: Vite 8 과 TypeScript 7 이 node_modules 안의 TS 원본을 빌드하고 타입 검사하는지. 안 되면 kit 이 태그마다 빌드한 JS 와 `.d.ts` 를 함께 커밋한다.

### 2-3. kit 폴더

```text
edu-lecture-gallery-kit/
├─ src/
│  ├─ contract/     types.ts (공통 meta, StageProps, StageHandle), params.ts, tracks.ts (트랙 엔진)
│  ├─ shell/        App, router, Home, SpecimenCard, SpecimenPage (슬롯), ControlPanel, PlayBar, StepList,
│  │                keys.ts (갤러리 단축키), stageKeys.ts (무대 단축키 가드), About, EnvBadge, ErrorBoundary, Rich
│  ├─ ai/           prompts.ts (골격), skill.ts, zip.ts, AiKit.tsx, clipboard.ts
│  ├─ runtime/      storage.ts, flash.ts, env.ts
│  ├─ styles/       tokens.css, fonts.css, app.css
│  └─ vite.ts       단일 HTML 설정과 격리 빌드(GALLERY_ONLY=<id>)를 묶은 Vite 설정 함수
├─ tools/
│  ├─ gallery.mjs   check, live, size, skill, thumbs, new, unity-compile
│  ├─ lib/          chrome.mjs, worktree.mjs, unity.mjs (에디터 다리, 배치 복사본, 잠금)
│  └─ workflow/     make-jobs, make-fix-jobs, prepare-review, review-brief.md (틀)
├─ templates/       새 갤러리 시작 틀: index.html, vite.config.ts, gallery.config.ts, registry.ts,
│                   docs/ (plan, handoff, specimen-guide, selection 틀), jobs/_specimen-template.md,
│                   .claude/launch.json, .gitattributes, .github/workflows/deploy.yml
├─ example/         가장 작은 예제 갤러리 (kit CI 용)
├─ .github/workflows/  pages.yml (재사용), ci.yml
└─ docs/            kit-guide.md, design.md (이 문서), CHANGELOG.md
```

출발점은 SG 셸이다. 데이터형 표본, 트랙 엔진, AI 세트, Skill, `t=`, burst 가 이미 있다. UIG 에서는 `stageKeys` 와 홈의 지연 마운트 방식만 가져온다.

### 2-4. 갤러리가 kit 에 넘기는 것

갤러리마다 `gallery.config.ts` 하나로 넘긴다. 아래는 형태만 보인 예다.

```ts
export default defineGallery({
  name: 'Pattern Gallery',
  brand: { title: 'PATTERN GALLERY', tagline: '게임 프로그래밍 패턴 · 시나리오 · Unity C#' },
  storageKey: 'jaytools.patterngallery.v1',
  accent: { dark: '#7ee081', light: '#2f7d32' },
  envLabel: 'Unity 6.3 LTS · C# 9',
  groups: { A: '행동', B: '연결', C: '데이터' },
  Stage: PatternStage,          // StageProps 를 받고 StageHandle 을 내놓는 컴포넌트
  chips: meta => [...],         // 상세 머리의 도메인 칩
  sections: [...],              // 상세 페이지에 더하는 구역과 위치
  ai: { kinds, environment, fixedRules, installSteps, files, images },
  skill: { name: 'game-patterns', description: specimens => '...' },
  check: './tools/check-domain.mjs',
})
```

### 2-5. 표본 계약 v2 (공통 meta)

| 필드 | 규칙 | UIG 에서 | SG 에서 |
|---|---|---|---|
| `id` `title` `titleEn` `group` `order` `oneLiner` `goals` `difficulty` | 지금과 같다 | 같음 | 같음 |
| `tags` | 검색과 필터용 기법·주제 | `tags`(접근성)과 `principles` 를 합칠 수 있음 | 같음 |
| `params` | 4종. **`key` 는 원본 코드의 이름**이고 검사가 대조한다 | 이름 규칙 없음 | 셰이더 속성 이름 |
| `presets` | 2~5개, 쓰임새 이름, 기본값과 다른 값만 | 같음 | 같음 |
| `events` | `{ id, label, tracks? }`. 트랙이 있으면 kit 엔진이 값을 움직이고, 없으면 무대가 직접 처리한다 | 트랙 없음 | 트랙 |
| `demo` | `{ loops?, fire?, scenario? }`. 갤러리가 시나리오 재생을 더할 수 있다 | 없음 (표본 코드) | 같음 |
| `steps` | 안내 순서 `{ n, label, body, target? }`. 무대가 해석한다 | hotspots (`target` = `data-part`) | `SG_STEP` 번호 |
| `offNote` | 효과 끄기 화면이 보여 주는 흔한 실수 | `juiceOff` | 같음 |
| `mistakes` | 3~5개. '문제 해결' 프롬프트에 들어간다 | 같음 | 같음 |
| `unity` | 공통 최소 `{ setup, verify, pitfalls }` + 도메인 추가 | 시스템별 `hierarchy`, `steps`, `pitfalls` | `graph` 추가 |
| `prompt` | `{ goal, adaptIdeas }` | 없음 (추정) | 같음 |
| `captures` `thumbnail` | 썸네일과 AI 세트 이미지 | 없음 | 같음 |
| `inspiredBy` `original` `references` | 지금과 같다 | 같음 | 같음 |
| `related` | `{ id \| url, why }`. 다른 갤러리 표본은 `url` 로 잇는다 | `id` 만 | `id` 만 |
| `flashes` | 넓은 면이 번쩍이면 `true`, 제한기 필수 | 같음 | 같음 |
| `stage` 와 그 밖 | 갤러리 도메인 | aspect, three, hotspots, timings 등 | kind, shaderFile, requires 등 |

**값 이름 규칙이 핵심이다.** UIG 는 조절 값과 Unity 코드의 이름이 따로 놀아 프롬프트가 346개 중 120개만 짝지었다. 새 갤러리는 `key` 를 원본 코드의 이름으로 둔다. 패턴은 Unity 어댑터의 `[SerializeField]` 필드 이름, C# 문법은 시나리오 입력 변수 이름이다. 그래야 복사하는 코드, 프롬프트, Skill 에 값이 정확히 들어가고 검사가 대조할 수 있다.

무대 계약은 SG 의 `StageView` 를 그대로 일반화한다.

```ts
interface StageProps<S> { specimen: S; values: ParamValues; step: number; off: boolean; playing: boolean; speed: number; auto: boolean; startTime?: number; onLive?: (key: string, value: number | null) => void }
interface StageHandle { fire(eventId: string): void; capture(): Promise<Blob | null>; seek(time: number | null): void }
```

`seek` 는 `live` 의 burst 와 `thumbs` 가 무대 시간을 직접 옮겨 매번 같은 화면을 찍는 데 쓴다.

### 2-6. 검사 나누기

| kit `gallery check` (모든 갤러리) | 갤러리 도메인 규칙 (예) |
|---|---|
| 폴더 이름 kebab-case, `meta.id` 와 폴더 이름 일치, 파일 이름 ASCII | SG: core.hlsl 공통 문법, 래퍼 규칙, 속성 대조, WebGL 컴파일 |
| meta 개수 규칙, 프리셋·트랙 key 가 params 에 있는지, 단계 번호 연속, `related` 대상 존재 | 패턴: 코어에 `UnityEngine` 참조 없음, `Tick(dt)` 규칙, params key 와 `[SerializeField]` 대조, 시나리오 기록 대조 |
| 게임명이 id·제목·프리셋에 없는지, `inspiredBy` 형식 `원제 (연도)` | C# 문법: 기록 최신 여부, 감시 식 존재, LangVersion 9 |
| import 대소문자 (Linux CI 대비) | 공통: Unity 컴파일 (`gallery unity-compile`, 로컬만) |
| 표본만 넣은 격리 빌드로 무대 동작, 이벤트, 자동 데모, 단계마다 화면이 다른지(픽셀 변화량), 페이지 오류 | |
| 전체: 용량 예산(원본 5MB, gzip 1.5MB, 90% 경고), 외부 참조 0, 네트워크를 막은 `file://` 실행에서 모든 표본 제목 표시, Skill 최신, `--links` 출처 링크 | |

### 2-7. kit-guide 에 모을 공통 규칙

지금 두 specimen-guide 와 agent-contract 에 따로 있는 공통 규칙을 한 곳에 모은다. 갤러리의 specimen-guide 는 도메인 절만 쓰고 공통 절은 링크한다.

- meta 글쓰기: 개수, 문체, 굵게·코드·링크·표본 링크 문법, "~할 수 있다" 목표.
- 콘텐츠 정책: 원작 에셋 0, 빌린 축 최대 2개, 게임명은 `inspiredBy` 에만, 튜토리얼·오픈소스 코드도 원리만 참고.
- 연구 규칙: 출처 등급, 인용 15단어 이하, 직접 확인 못 한 주장의 표시, AI 접근을 금지한 사이트 제외, 차단 응답 재시도 금지.
- 안전 규칙: 넓은 면 번쩍임 초당 3회 이하(실제 시간 기준), 반복 맥동 2Hz 이하, 포화 빨강 기준, 색만으로 상태를 전하지 않기.
- 공통 세계관: UIG 의 '외곽 탐사대'(하린, 도윤, 세라, 잔해 드론, 수리 키트·냉각 셀 등)를 모든 갤러리에서 쓴다.
- 공통 완료 체크리스트와 환경 함정 (PowerShell 5.1 한글, CRLF, 헤드리스 스크린샷 캐시, 숨은 패널의 rAF 0, 커밋 메시지 파일 등).

## 3. 공통 원칙 (두 갤러리에서 배운 것)

1. **원본은 하나다.** Unity 에 넣는 코드가 원본이다. 웹은 원본을 직접 실행하거나(SG), 원본을 실제로 실행한 기록을 재생하거나(C# 문법), 같은 시나리오를 원본과 웹 양쪽에서 돌려 결과를 대조한다(패턴). 웹과 Unity 를 따로 쓰고 아무것도 대조하지 않는 UIG 방식은 새 갤러리에서 쓰지 않는다.
2. **표본은 데이터와 원본 코드다.** 무대는 앱이 종류별로 제공한다. 표본별 웹 코드는 꼭 필요한 만큼만 둔다. SG 는 이 원칙으로 표본당 약 47KB, React 표본인 UIG 는 약 110KB 였다.
3. **값 이름은 원본 코드의 이름이다** (2-5절).
4. **단계와 효과 끄기는 원본 코드 안의 표시로 둔다.** Unity 에서는 아무 일도 하지 않거나 사라진다. SG 의 `SG_STEP`, `SG_OFF` 가 선례다. 새 갤러리는 주석 `// [n]` 과 `#if GALLERY_MISTAKE` 를 쓴다.
5. **효과 끄기는 흔한 실수를 재현한 나쁜 예다.** 그냥 안 보이게 하면 안 된다.
6. **실측은 처음부터 자동이다.** UIG 는 Unity 컴파일을 끝까지 손으로 했다.
7. **홈은 정적 썸네일, 실행은 상세에서.** UIG 는 홈 카드 실시간 렌더가 첫 화면을 가장 많이 늦췄다.
8. **독립 리뷰는 생략하지 않는다.** 두 갤러리 모두 리뷰가 매번 실제 버그를 잡았다. 움직임을 말하는 글은 연속 촬영으로 확인한다.
9. **분업은 SG 그대로다.** 구독 세션이 기획, kit, 무대, 기준 샘플, 리뷰를 맡고 워커가 표본 구현과 수정을 맡는다. 워커의 writePaths 는 표본 폴더만이다.

## 4. 디자인 패턴과 C# 문법

### 4-1. 갤러리별 표본과 무대

| | UI (지금) | 셰이더 (지금) | 디자인 패턴 (파일럿) | C# 문법 (다음) |
|---|---|---|---|---|
| 표본 | UI 패턴 하나 | 셰이더 효과 하나 | 패턴 하나 × 게임 상황 하나 | 문법 개념 하나 |
| 원본 코드 | UGUI·UITK C# (웹과 따로) | core.hlsl + .shader + C# | 순수 C# 코어 + 얇은 MonoBehaviour 어댑터 | 실행할 수 있는 짧은 C# |
| 무대 | 표본별 React HUD (+three) | 무대 4종이 core.hlsl 실행 | 시나리오 무대 하나가 표본의 `sim.ts` 실행 | 실행 무대 하나가 dotnet 기록 재생 |
| 웹 = Unity 보장 | 없음 | 같은 파일 컴파일 + Unity 촬영 | 시나리오 기록을 dotnet 결과와 대조 | 실제 실행 기록 그 자체 |
| 값 조절 | HUD 값 | 셰이더 속성 | 코어 설정 = `[SerializeField]` 필드 | 시나리오 입력값 (기록한 조합 안에서) |
| 단계 | 해설 번호 | 중간 출력 | 처리 흐름 강조 (`// [n]`) | 실행 위치 (`// [n]`) |
| 효과 끄기 | 연출 끈 화면 | `SG_OFF` 흔한 실수 | 나쁜 예 코드로 같은 입력 처리 | `#if GALLERY_MISTAKE` 를 켠 기록 |
| 실측 도구 | 컴파일만 (손) | Unity 컴파일 + 촬영 | dotnet 하네스 + Unity 컴파일 | dotnet 트레이서 + Unity 컴파일 |

### 4-2. 디자인 패턴 갤러리

**표본.** 패턴 하나를 게임 상황 하나에 적용한 것이다. ID 는 `<패턴>-<상황>` 이다 (`state-player-actions`). 같은 패턴을 다른 상황으로 또 만들 수 있다.

```text
unity/<id>/Core/*.cs              순수 C# 코어. UnityEngine 을 참조하지 않는다. 원본
unity/<id>/Unity/*.cs             MonoBehaviour 어댑터. Input System → 코어 입력, 코어 상태 → 화면. 얇게
unity/<id>/Naive/*.cs             패턴 없이 짠 나쁜 예. 효과 끄기 화면과 같은 동작
web/src/specimens/<id>/meta.ts    글, 값, 프리셋, 이벤트, 시나리오, 구조 그림, 단계
web/src/specimens/<id>/sim.ts     코어와 나쁜 예를 같은 이름, 같은 순서로 옮긴 TS. 무대가 실행한다
truth/<id>/<시나리오>.log          dotnet 이 C# 코어와 나쁜 예를 돌려 남긴 사건 기록 (생성물, 커밋)
```

- 코어 규칙: 시간은 `Tick(float dt)` 로만 받는다(`Time.deltaTime` 을 코어가 직접 읽지 않는다). 난수는 시드를 받는다. 입력은 메서드 호출(`Jump()`)로 받는다. 이 규칙 덕분에 dotnet 으로 대조할 수 있다. 이 규칙 자체가 수강생에게 가르칠 '테스트하기 쉬운 구조'이기도 하다.
- C# 은 Unity 6.3 의 C# 9 까지 쓴다. 모든 형식은 `namespace PatternGallery.<PascalCase id>` 블록 안에 둔다 (UIG 규칙과 같다).

**시나리오 무대.** 패턴 갤러리의 모든 표본이 쓰는 무대 하나다. 세 칸으로 나눈다.

- 미니 월드: 2D 측면이나 위에서 본 작은 장면. 그림 부품(캡슐 아군, 삼각 드론, 상자, 바닥, 격자)은 갤러리 공통이고 세계관은 '외곽 탐사대'다.
- 구조 그림: `meta.diagram` 의 노드(클래스, 객체)와 화살표(참조, 구독, 호출). sim 이 보내는 신호로 지금 일하는 노드와 화살표가 빛난다. 예를 들어 현재 상태, 알림을 받는 구독자, 쌓인 명령이 빛난다.
- 사건 기록: 한 줄씩 쌓인다 (`0.10s 점프 입력 → Grounded.Exit → Jumping.Enter`). 효과 끄기 때는 나쁜 예의 기록이 나오고 버그 줄이 빨갛게 표시된다.

입력은 이벤트 버튼(1~9)과, 무대에 포커스가 있을 때의 키다 (`stageKeys` 규칙). AI 세트의 이미지 칸에는 Unity 스크린샷 대신 구조 그림과 사건 기록 이미지를 둔다.

| 공통 요소 | 패턴 갤러리에서 |
|---|---|
| 값 조절 | 코어 설정 값. key 는 어댑터의 `[SerializeField]` 필드 이름 |
| 프리셋 | 쓰임새 (액션, 플랫포머, 턴제 등) |
| 이벤트 | 게임 입력 (점프, 공격, 피격, 되돌리기 등) |
| 시나리오 | `meta.scenarios`: `[초, 입력]` 목록. 자동 데모, 검사, 대조가 함께 쓴다 |
| 자동 데모 | 대표 시나리오를 반복 재생 |
| 단계 보기 | 입력 하나가 처리되는 흐름. `target` 의 구조 그림 노드와 코드의 `// [n]` 줄을 강조 |
| 효과 끄기 | 같은 입력을 나쁜 예로 처리한다. 버그가 월드와 기록에 보인다 |
| 실측 | dotnet 하네스가 시나리오마다 코어와 나쁜 예의 기록을 만든다. 검사가 sim 의 기록과 줄마다 대조한다. 어댑터는 Unity 컴파일 검사 |
| AI 세트 | 프롬프트 3종 + Skill `game-patterns`. 넣는 파일은 Core, Unity 폴더. 나쁜 예는 참고로만 |

**웹과 Unity 를 같게 하는 방법.**

- dotnet 하네스(`truth/Harness.csproj`, LangVersion 9)가 코어 파일을 그대로 컴파일한다. 시나리오를 고정 dt(1/60초)로 돌리며 입력마다 코어의 공개 상태를 정해진 형식으로 적는다. 이 PC 에는 .NET SDK 10.0.302 가 있다.
- `sim.ts` 를 같은 시나리오로 Node 에서 돌려 같은 형식으로 적는다. 검사가 두 기록을 대조한다 (수치는 소수 둘째 자리까지).
- CI 는 커밋된 기록과 sim 을 대조하므로 dotnet 이 필요 없다. 로컬 `npm run truth` 가 기록을 다시 만든다.
- 어댑터와 코어는 `gallery unity-compile` 로 Unity 컴파일을 확인한다. UIG `unity-compile.ps1` 방식을 Node 로 옮긴 것이다. .NET 10 에만 있는 API 를 여기서 잡는다.
- Unity 장면에서 실제로 돌려 보는 확인은 v1 범위 밖이다. 장면 연결은 `unity.setup` 글로 안내한다.

**리포.** `KooHoo-Dev/edu-lecture-pattern-gallery`. 루트가 웹 앱이다(UIG 처럼). Unity 촬영이 필요 없으므로 Unity 프로젝트를 리포에 두지 않는다. 컴파일 검사용 Unity 프로젝트는 리포 밖 하나를 함께 쓴다.

### 4-3. C# 문법 갤러리

**표본.** 문법 개념 하나를 보여 주는, 실행할 수 있는 짧은 C# 프로그램이다. 상황은 Unity 에서 빌린다. ID 는 개념 이름이다 (`value-vs-reference`).

```text
samples/<id>/<Name>.cs                 원본. Unity 판 예시는 같은 폴더의 <Name>Behaviour.cs
web/src/specimens/<id>/meta.ts         글, 시나리오(입력값), 감시 목록(watch), 단계, 예측 질문
truth/<id>/<시나리오>.json              dotnet 실행 기록 (생성물, 커밋)
truth/<id>/<시나리오>.mistake.json      GALLERY_MISTAKE 를 켜고 실행한 기록
```

**실행 무대.** 모든 표본이 쓰는 무대 하나다.

- 코드: 지금 줄을 강조하고 지나온 줄은 흐리게 한다.
- 메모리 그림: 스택 프레임별 변수 상자, 힙 객체, 참조 화살표. 값 형식은 상자 안에 값을 그린다.
- 콘솔 출력과 실행 위치 막대.
- 예측 질문: `steps[].ask` 가 있으면 그 줄에서 멈추고 보기를 고르게 한 뒤 진행한다. 수업 중 '먼저 맞혀 보기' 용이다. 기록 재생만으로 생기는 상호작용 부족을 이것으로 채운다.

**기록 도구(트레이서).** C# 갤러리의 도구다 (`tools/tracer/`, dotnet 콘솔 앱).

- Roslyn 으로 원본의 문장마다 기록 호출을 끼운 사본을 만들어 실행한다. 원본 파일은 건드리지 않는다.
- 기록하는 것: 줄 번호, `meta.watch` 에 적은 식의 값(값 형식은 값, 참조 형식은 객체 번호와 필드), 콘솔 출력. 모든 지역 변수를 그리지 않는다.
- 값 조절은 미리 기록한 조합만 된다. select, toggle 위주로 쓰고 표본당 기록은 12개 이하로 둔다 (용량).
- LangVersion 9 로 실행하고 Unity 컴파일을 따로 확인한다.
- 시험할 것: `yield`, 람다, `async` 안에서도 문장 단위로 끼워 넣을 수 있는지, 순환 참조가 있는 객체 그래프 기록, 기록 크기. 안 되면 `// [n]` 표시 지점에서만 감시 식을 기록하는 축소판으로 간다.

| 공통 요소 | C# 문법 갤러리에서 |
|---|---|
| 값 조절, 프리셋 | 시나리오 입력값과 시나리오 ('원소 3개', '빈 목록') |
| 이벤트 | '다음 표시까지 실행', '처음부터' |
| 자동 데모 | 처음부터 끝까지 천천히 재생 반복 |
| 단계 보기 | `// [n]` 줄로 이동하고 그 시점의 메모리 그림 |
| 효과 끄기 | `#if GALLERY_MISTAKE` 를 켠 기록. Unity 에는 기호가 없어 그 분기가 사라진다 |
| AI 세트 | 프롬프트 종류는 갤러리가 정한다 (예: '내 코드에 적용', '설명해 줘', '문제 해결'). Skill `csharp-for-unity` |

### 4-4. 파일럿: 디자인 패턴 갤러리, 표본 3개

디자인 패턴을 먼저 하는 이유:

- kit 의 거의 모든 부분(값, 이벤트, 데모, 단계, 효과 끄기, AI 세트, Skill, Unity 컴파일)을 쓰므로 kit 를 시험하기에 알맞다.
- 새 기술 위험이 작다. dotnet 대조는 콘솔 앱 하나다. C# 문법을 먼저 하면 실행 무대와 트레이서라는 새 기술이 kit 시험과 겹쳐, 문제가 생겼을 때 원인을 가르기 어렵다.
- 무대가 실시간 입력을 받는 점이 UIG 와 같아서, `stageKeys` 같은 UIG 경험을 kit 에 올리는 계기가 된다.

| | `state-player-actions` 상태 패턴 | `observer-health-events` 관찰자 패턴 | `command-undo-replay` 명령 패턴 |
|---|---|---|---|
| 상황 | 탐사대장 하린의 대기, 이동, 점프, 공격, 피격 경직 | 하린의 체력이 바뀌면 HP 바, 피격 소리, 업적, 게임 오버 창이 각자 반응 | 정비사 도윤의 정비 드론이 격자를 이동. 되돌리기, 다시 하기, 리플레이 |
| 효과 끄기 (나쁜 예) | `isJumping`, `isAttacking` bool 과 if 문. '공격 중 점프' 시나리오에서 공격이 끝나지 않은 채 공중으로 뜨고, 피격 경직 중에 걷는다 | `Player` 가 HP 바, 소리, 업적을 직접 참조해 부른다. 업적 창을 빼면 `Player` 를 고쳐야 하고, 고치지 않으면 null 참조 오류가 기록에 뜬다 | 되돌리기를 '반대 방향으로 한 칸'으로 구현. 벽에 막혀 안 움직인 명령을 되돌리면 드론이 한 칸 어긋난다 (이전 상태를 저장하지 않은 흔한 실수) |
| 값 | `jumpHeight`, `attackDuration`, `hitStunDuration`, `allowAirAttack` | 구독자별 켜기 4개, `damage`, `unsubscribeOnDisable` (끄면 꺼진 HP 바가 계속 알림을 받는 유령 구독이 기록에 남는다) | `historyLimit`, `replaySpeed`, 벽 배치 프리셋 |
| 이벤트 | 점프, 공격, 피격, 이동 | 피해, 회복, HP 바 끄기·켜기, 즉사 | 상하좌우 이동, 되돌리기, 다시 하기, 리플레이. 무대 포커스 때 방향키 |
| 단계 | 입력이 현재 상태 객체로 간다 → 상태가 다음 상태를 정한다 → `Exit`·`Enter` → `Tick` 이 상태의 동작을 한다 | 체력이 바뀐다 → 이벤트를 발행한다 → 구독 목록을 차례로 부른다 → 구독자가 자기 화면만 고친다 | 입력이 명령 객체가 된다 → `Execute` 하고 기록에 넣는다 → `Undo` 는 저장한 이전 상태로 돌린다 → 리플레이는 기록을 처음부터 다시 실행한다 |
| Unity 쪽 | `PlayerStateMachine` 과 상태 클래스(코어) + `PlayerController`(Input System 액션 → 코어, 코어 상태 → Animator 파라미터) | `event Action<int, int> HealthChanged`, 구독은 `OnEnable`, 해제는 `OnDisable`. `UnityEvent` 와의 차이는 해설 | `ICommand { Execute(); Undo(); }`, `CommandHistory`, Input System |
| 왜 이 표본 | 수강생 코드에서 가장 흔한 bool 덩어리. 패턴 전후가 화면에서 바로 갈린다 | Unity 에서 실제로 자주 나는 '해제하지 않은 구독' 오류를 직접 보여 준다. UIG `health-bar-trail` 과 잇는다 | 입력과 되돌리기가 있어 무대 상호작용이 가장 많다 |
| 만드는 쪽 | 기준 샘플 1 (구독 세션) | 기준 샘플 2 (구독 세션) | 워커 파일럿 (JayDispatch). 문서와 기준 샘플만으로 만들 수 있는지 본다 |

### 4-5. C# 문법 첫 표본 후보 (파일럿 다음)

- `value-vs-reference` 값 형식과 참조 형식: `Vector3` 같은 struct 를 꺼내 고쳐도 원본이 그대로인 이유, `List<struct>` 원소 수정 실수.
- `closure-loop-capture` 람다의 변수 캡처: `for` 문 안에서 버튼 리스너를 달면 모두 마지막 값을 쓰는 실수.
- `iterator-yield-coroutine` 이터레이터와 `yield`: 코루틴의 정체, `MoveNext` 를 누가 언제 부르는지.

## 5. 작업 흐름 (JayDispatch)

- JayDispatch 는 이미 리포 독립이라 그대로 쓴다.
- kit 로 올리는 것: `make-jobs`(명세 → 잡), `make-fix-jobs`, `prepare-review`, `review-brief` 틀, `_specimen-template`. 갤러리 설정이 writePaths 패턴, verify 명령, allowedTools, 기준 샘플 표, 금지 폴더, 검증 잠금(Unity)을 채운다.
- 명령 이름을 맞춘다: `npm run check -- <id>`, `npm run live -- <id> ...`, `npm run truth -- <id>`, `npm run skill`. 그러면 잡의 verify 가 갤러리와 상관없이 같은 모양이 된다.
- 흐름은 SG 와 같다: 선정 카드 → 자리표시 항목 → 명세 → 잡 → `dispatch run` → 리뷰 폴더 → 독립 리뷰 → 구현 병합 → 수정 잡 → 병합 → skill, check → 커밋, push.
- 리뷰 폴더에 넣을 것은 갤러리가 정한다. 패턴은 코드, 웹 캡처, 연속 촬영, 기록 대조 결과, 워커 보고를 넣는다.
- 비용: SG 는 표본당 구현과 수정을 합쳐 $4~8 (Opus 5.5, effort high)이었다. 패턴 표본은 C# 이 세 묶음(코어, 어댑터, 나쁜 예)에 `sim.ts` 까지 있어 더 들 수 있다. 파일럿에서 잰다.

## 6. 문서 틀

| 문서 | 자리 | 내용 |
|---|---|---|
| `kit-guide.md` | kit | 2-7절의 공통 규칙 |
| `design.md` | kit | 이 문서 |
| `CHANGELOG.md` | kit | 버전별 계약 변화와 갤러리가 할 일 |
| `plan.md` | 갤러리 | 결정과 진행 기록 (SG 형식) |
| `handoff.md` | 갤러리 | 새 세션이 처음 읽는 문서: 상태, 규칙, 비용, 작업 흐름, 함정, 후속 과제 (SG 형식) |
| `specimen-guide.md` | 갤러리 | 도메인 규격만. 맨 앞에 기준 샘플 표, 공통 부분은 kit-guide 절 링크 |
| `selection.md` | 갤러리 | 선정 문서. 0 요약, 1 공통 요구, 2 그룹별 카드, 3 우선순위, 4 제작 묶음, 5 뺀 후보와 사유, 6 근거가 약한 항목, 7 쟁점과 결정 (SG `shader-selection.md` 형식) |
| `research/` | 갤러리 | 수집 자료 (텍스트와 URL 만) |

선정 카드 필드: ID, 제목, 그룹, 난이도, 한 줄 / 수업에서 왜 필요한가와 수업 프로젝트 연계 / 무대와 시나리오 / 효과 끄기 후보 / 확인된 대표작과 출처 / 겹치는 표본.

## 7. 진행 순서 (Jay 확인 뒤)

1. 시험 (구독 세션)
   - node_modules 안의 TS 원본을 Vite 8 과 TypeScript 7 이 빌드하고 타입 검사하는지
   - 재사용 워크플로로 Pages 배포가 되는지
   - 같은 코어 파일을 dotnet(LangVersion 9) 하네스와 Unity Roslyn 컴파일 양쪽에서 쓸 수 있는지
2. Jay: 리포 두 개를 만든다 (`edu-lecture-gallery-kit`, `edu-lecture-pattern-gallery`).
3. kit v0.1 (구독 세션): SG 셸에서 뽑아내고 UIG 의 `stageKeys` 를 더한다. `example/` 갤러리로 검사한다.
4. 패턴 갤러리 뼈대, 시나리오 무대, 기준 샘플 2개 (상태, 관찰자). 독립 리뷰를 받는다.
5. 워커 파일럿: 명령 표본 (JayDispatch, Opus 5.5 high) → 리뷰 → 수정 잡 → 병합.
6. Pages 공개. 회고를 반영해 kit v0.2 를 낸다.
7. 그 뒤: SG 를 kit 로 옮긴다 (다음 셰이더 묶음 전). C# 문법 갤러리는 트레이서 시험부터 한다.

## 8. 위험과 대응

| 위험 | 대응 |
|---|---|
| kit 변경이 다른 갤러리를 깨뜨린다 | 태그 고정. 갤러리는 원할 때만 올린다. kit CI 가 예제 갤러리를 빌드하고 검사한다 |
| 두 리포를 오가는 수정이 번거롭다 | `kit:link`. 구독 세션 하나가 kit 과 갤러리를 같이 고친다. 갤러리 전용 변형은 설정과 슬롯으로 |
| node_modules 안 TS 원본이 빌드되지 않는다 | kit 이 태그마다 JS 와 `.d.ts` 를 빌드해 커밋한다 |
| 패턴의 `sim.ts` 와 C# 코어가 어긋난다 | 시나리오 기록 대조가 검사에서 실패한다. 이벤트, 단계, 효과 끄기마다 시나리오를 하나 이상 둔다 |
| 패턴 표본 비용이 SG 보다 크다 | 파일럿에서 잰다. 크면 나쁜 예를 C# 에서 빼고 `sim.ts` 에만 두는 축소안으로 간다 (대조는 코어만) |
| C# 트레이서가 어렵다 | 시험을 먼저 한다. 안 되면 표시 지점에서만 감시 식을 기록하는 축소판으로 간다 |
| 용량 | 패턴과 C# 갤러리는 three.js 가 없어 셸이 가볍다. 예산과 `size` 도구는 공통이다 |
| Unity 런타임을 확인하지 않는다 | 패턴 v1 은 컴파일과 dotnet 대조까지 한다. 장면 촬영이 필요해지면 SG 의 Unity 실행 장치를 kit 라이브러리로 쓴다 |

## 9. 정해 둔 것과 Jay 가 정할 것

정해 둔 것 (되돌릴 수 있다. 바꾸려면 말하면 된다):

- 이 문서의 자리: `JayTools/docs/gallery-kit-design.md`, 커밋하지 않음.
- kit 는 SG 셸에서 뽑아낸다. 도구는 Node 만 쓴다 (UIG 의 Python 검사는 kit 로 올리지 않는다).
- 기존 갤러리: SG 는 다음 셰이더 묶음 전에 kit 로 옮긴다. UIG 는 옮기지 않는다.
- 패턴 표본은 C# 나쁜 예와 dotnet 대조까지 둔다. 파일럿 비용을 보고 줄일 수 있다.
- C# 문법 갤러리는 Unity 6.3 의 C# 9 범위만 다룬다. 최신 C# 문법은 참고로만 적는다.

Jay 가 정할 것:

1. **공유 방식과 리포**: kit 를 공개 리포 `KooHoo-Dev/edu-lecture-gallery-kit` 로 두고 git 태그로 설치한다. 이대로 갈까? 맞으면 이 리포와 파일럿 리포를 만들어 줘야 한다 (`gh` 가 없다).
2. **파일럿**: 디자인 패턴 갤러리(`edu-lecture-pattern-gallery`), 표본은 상태·관찰자·명령. 이대로 갈까? C# 문법을 먼저 하고 싶다면 트레이서 시험이 앞에 붙는다.
3. **크레딧 일정**: 회사 플랜 크레딧이 약 $278 남았고(SG handoff 기준) 11월 19일(UTC)에 만료된다. 파일럿 워커 잡(명령 표본)을 그 전에 돌리도록 일정을 잡을까, 아니면 기준 샘플까지만 구독으로 하고 워커 파일럿은 다음 크레딧으로 미룰까?

## 10. v0.1 구현 메모 (2026-11-03)

### 시험 결과 (7절 1단계)

| 시험 | 결과 |
|---|---|
| node_modules 안 TS 원본 | 통과. 패키지를 tgz 로 묶어 설치(git 설치와 같은 복사)한 뒤 Vite 8 빌드, 개발 서버(미리 묶기 포함), TypeScript 7 타입 검사가 모두 kit 의 TS/TSX 와 CSS 를 처리했다. 그래서 kit 은 빌드 단계 없이 원본을 담는다 |
| Node 가 kit 의 TS 를 직접 읽기 | **안 된다.** `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. 그래서 도구(Node)는 kit 의 TS 를 import 하지 않고, 빌드된 페이지의 `window.__gallery` 창구를 헤드리스 Chrome 으로 부른다 (meta 규칙, Skill 생성, 무대 시간 고정). Vite 설정 도우미만 JS(`vite.mjs`) |
| dotnet 하네스 + Unity 컴파일 | 통과. 같은 순수 C# 코어 파일을 .NET SDK 10.0.302 콘솔(LangVersion 9)로 실행해 기록을 남겼고, Unity 6000.3.20f1 내장 Roslyn(UIG `unity-compile.ps1` 방식을 Node 로 옮김)으로 1초 안에 컴파일했다. dotnet 은 `Random.Shared` 같은 .NET 전용 API 를 통과시키고 Unity 컴파일이 잡는다. C# 10 문법(파일 범위 namespace)은 양쪽 다 잡는다. Unity csc 는 `-preferreduilang:en` 을 줘야 오류 글이 깨지지 않는다 |
| 재사용 워크플로 Pages 배포 | 아직. kit 을 push 하고 갤러리 리포가 생기면 확인한다 |

### 설계와 달라진 것

- 도구 이름: `gallery check | live | thumbs | skill | size | unity-compile`. 갤러리는 `node tools/gallery.mjs <명령>` 으로 부른다. 이 진입점이 worktree 에서 node_modules 를 먼저 잇는다 (kit 을 찾기 전에 필요해서 갤러리 쪽에 둔다).
- 같은 화면 판정은 평균 차이가 아니라 **바뀐 픽셀 비율**(0.01% 미만)로 한다. 단계 보기처럼 작은 부분만 바뀌는 화면을 놓치지 않으려는 것이다. 비교 전에 무대 위 상태 배지를 숨긴다.
- 셸만 빌드한 예제 갤러리는 원본 394KB, gzip 152KB 다 (three.js 없음).

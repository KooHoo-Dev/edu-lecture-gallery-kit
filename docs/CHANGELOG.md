# 변경 기록

## v0.1.1 (2026-11-03)

패턴 갤러리를 만들며 고친 것. 계약은 그대로다.

- 갤러리 설정 `thumbQuery`, `checkQuery` (package.json `gallery`): 입력이 들어가야 차이가 보이는 갤러리는 자동 데모를 켠 채 검사하고 썸네일을 찍는다
- `TrackPlayer` 를 지울 수 있는 문법으로 (생성자 매개변수 속성 제거). kit `tsconfig` 에 `verbatimModuleSyntax`, `erasableSyntaxOnly` 를 켰다. 갤러리가 같은 설정을 켜도 kit 이 깨지지 않는다
- `gallery unity-compile` 이 프로세스마다 다른 임시 폴더를 쓴다 (워커 여럿이 동시에 돌릴 때)
- 갤러리가 할 일: `package.json` 과 `deploy.yml` 의 태그를 `v0.1.1` 로

## v0.1.0 (2026-11-03)

첫 판. Shader Gallery 셸에서 뽑아내고 UI Gallery 의 무대 단축키 가드를 더했다.

- 표본 계약 v2: `BaseMeta`, `StageProps`, `StageHandle` (`src/contract.ts`). SG 와 다른 점: `steps[].target`, `events[].tracks` 선택, `params[].showWhen`, `related` 의 `url` 형식, `CodeFile.path`
- 셸: 갤러리 설정(`defineGallery`)으로 이름, 그룹, 필터, 무대, 칩, 구역, AI 세트를 받는다
- AI 세트: 프롬프트 종류를 갤러리가 정한다. Skill 은 `SkillConfig` 로 만든다
- 도구: `gallery check | live | thumbs | skill | size | unity-compile`. TS 로직은 `window.__gallery` 창구로 헤드리스 Chrome 에서 돈다
- 배포: `.github/workflows/pages.yml` 재사용 워크플로

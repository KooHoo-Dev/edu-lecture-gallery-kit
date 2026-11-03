# 변경 기록

## v0.1.0 (2026-11-03)

첫 판. Shader Gallery 셸에서 뽑아내고 UI Gallery 의 무대 단축키 가드를 더했다.

- 표본 계약 v2: `BaseMeta`, `StageProps`, `StageHandle` (`src/contract.ts`). SG 와 다른 점: `steps[].target`, `events[].tracks` 선택, `params[].showWhen`, `related` 의 `url` 형식, `CodeFile.path`
- 셸: 갤러리 설정(`defineGallery`)으로 이름, 그룹, 필터, 무대, 칩, 구역, AI 세트를 받는다
- AI 세트: 프롬프트 종류를 갤러리가 정한다. Skill 은 `SkillConfig` 로 만든다
- 도구: `gallery check | live | thumbs | skill | size | unity-compile`. TS 로직은 `window.__gallery` 창구로 헤드리스 Chrome 에서 돈다
- 배포: `.github/workflows/pages.yml` 재사용 워크플로

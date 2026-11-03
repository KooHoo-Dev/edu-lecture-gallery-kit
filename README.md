# edu-lecture-gallery-kit

유니티 개발자 양성과정의 **인터랙티브 교안 갤러리**(UI, 셰이더, 디자인 패턴, C# 문법 …)가 같이 쓰는 틀이다.

- 앱 셸: 갤러리 → 상세, 값 조절·프리셋, 재생 바, 단계 보기, 효과 끄기, 발표 모드, 딥링크, 라이트/다크
- 표본 계약 v2 (`src/contract.ts`) 와 meta 규칙 검사
- AI 지시 세트: 프롬프트, 이미지, 원본 코드, Skill zip
- 도구: `gallery check | live | thumbs | skill | size | unity-compile`
- 배포: 단일 HTML 빌드 설정(`vite.mjs`)과 GitHub Pages 재사용 워크플로

설계는 [docs/design.md](docs/design.md), 모든 갤러리가 지키는 규칙은 [docs/kit-guide.md](docs/kit-guide.md), 변경 기록은 [docs/CHANGELOG.md](docs/CHANGELOG.md).

## 갤러리에서 쓰기

```json
"dependencies": { "@koohoo/gallery-kit": "github:KooHoo-Dev/edu-lecture-gallery-kit#v0.1.1" }
```

- `vite.config.ts`: `export default defineConfig(galleryVite())` (`@koohoo/gallery-kit/vite`)
- `src/main.tsx`: `mountGallery(config)`. 설정은 `defineGallery({...})` (`src/config.ts` 의 `GalleryConfig`)
- `tools/gallery.mjs`: [templates/tools/gallery.mjs](templates/tools/gallery.mjs) 를 복사한다 (worktree 에서 node_modules 를 잇고 kit 도구를 부른다)
- `.github/workflows/deploy.yml`: [templates/.github/workflows/deploy.yml](templates/.github/workflows/deploy.yml)
- 갤러리 설정 `package.json` 의 `"gallery"` 필드: [tools/lib/project.mjs](tools/lib/project.mjs) 머리말

가장 작은 예: [example/](example/).

## kit 을 고칠 때

1. 갤러리에서 node_modules 의 kit 을 이 폴더에 정션으로 잇고 확인한다.
2. `npx tsc --noEmit`, `npm --prefix example run build`, `npm --prefix example run check -- --no-build`.
3. 커밋, 태그(`v0.x.y`), push. 계약이 바뀌면 minor 를 올리고 CHANGELOG 에 갤러리가 할 일을 적는다.
4. 갤러리의 `package.json` 과 `deploy.yml` 의 태그를 올린다.

## 라이선스

MIT. 글꼴은 SIL OFL 1.1 (Chakra Petch, JetBrains Mono).

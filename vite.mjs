// 갤러리의 vite.config.ts 가 쓰는 공통 Vite 설정.
//   import { defineConfig } from 'vite'
//   import { galleryVite } from '@koohoo/gallery-kit/vite'
//   export default defineConfig(galleryVite())
// 결과물은 dist/index.html 한 개. 더블클릭(file://)과 GitHub Pages 에서 똑같이 동작한다.
// Node 는 node_modules 안의 TS 를 읽지 못하므로 이 파일만 JS 다.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * GALLERY_ONLY=<id> 로 빌드하면 그 표본만 등록한다 (검사·캡처 도구가 쓴다).
 * 여러 표본을 동시에 만들 때 다른 표본의 미완성 파일이 내 빌드를 깨뜨리지 않게 하려는 것.
 * registry 파일의 './' 나 '../' 로 시작하는 문자열에서 첫 '/*\/' 를 '/<id>/' 로 바꾼다.
 */
function onlySpecimen(registry) {
  const only = process.env.GALLERY_ONLY
  return {
    name: 'gallery-only-specimen',
    enforce: 'pre',
    transform(code, id) {
      if (!only || !registry.test(id.split('?')[0])) return
      return code.replace(/(['"])(\.{1,2}\/[^'"]*?)\/\*\/([^'"]*)\1/g, (_, q, head, tail) => `${q}${head}/${only}/${tail}${q}`)
    },
  }
}

/** @param {{ root?: string, registry?: RegExp }} [options] */
export function galleryVite(options = {}) {
  const root = options.root ?? process.cwd()
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  return {
    base: './',
    plugins: [onlySpecimen(options.registry ?? /[\/]src[\/]registry\.ts$/), react(), viteSingleFile()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_DATE__: JSON.stringify(process.env.GALLERY_BUILD_DATE ?? new Date().toISOString().slice(0, 10)),
    },
    build: {
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 4000,
    },
    // kit 을 정션으로 이었을 때(kit:link, 예제 갤러리) React 가 두 벌 묶이지 않게 한다
    resolve: { dedupe: ['react', 'react-dom'] },
    server: { port: 5173, strictPort: true, fs: { allow: ['..'] } },
    // kit 은 TS 원본이라 미리 묶지 않는다 (kit:link 로 고칠 때 바로 반영). kit 이 쓰는 CJS 의존성만 미리 묶는다
    optimizeDeps: {
      exclude: ['@koohoo/gallery-kit'],
      include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom/client', 'highlight.js/lib/core', 'highlight.js/lib/languages/cpp', 'highlight.js/lib/languages/csharp', 'highlight.js/lib/languages/css', 'highlight.js/lib/languages/json', 'highlight.js/lib/languages/xml'],
    },
  }
}

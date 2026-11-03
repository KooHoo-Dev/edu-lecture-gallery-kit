import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { galleryVite } from '../vite.mjs'

// 예제는 kit 리포 안에 있으므로 패키지 대신 원본 폴더를 바로 쓴다
const base = galleryVite()
export default defineConfig({
  ...base,
  resolve: { ...base.resolve, alias: { '@koohoo/gallery-kit': fileURLToPath(new URL('../src/index.ts', import.meta.url)) } },
})

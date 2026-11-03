// gallery thumbs: 웹 무대를 찍어 썸네일과 AI 세트 이미지로 둔다 (Unity 촬영이 없는 갤러리용).
//   gallery thumbs              모든 표본
//   gallery thumbs <id> ...     지정한 표본
// 무대 시간을 thumbTime(기본 1초)에 멈추고 자동 데모를 끈 화면을 찍는다.
// 결과: <shots>/<id>/default.webp 와 meta.captures 마다 <name>.webp (폭 720)

import { mkdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { withChrome } from '../lib/chrome.mjs'
import { settle, toWebp } from '../lib/pixels.mjs'
import { project, specimenIds, viteBuild } from '../lib/project.mjs'
import { ensureModules } from '../lib/worktree.mjs'

const WIDTH = 720

export default async function thumbs(args) {
  const p = project()
  ensureModules(p.root, p.web)
  const all = specimenIds(p)
  const ids = args.filter(a => !a.startsWith('--'))
  for (const id of ids.length ? ids : all) {
    if (!all.includes(id)) {
      console.log(`표본 폴더가 없다: ${id}`)
      process.exitCode = 1
      continue
    }
    const html = viteBuild(p, { only: id })
    const url = pathToFileURL(html).href
    await withChrome(
      async page => {
        const meta = await (async () => {
          await page.goto(`${url}#/`)
          await page.sleep(800)
          return page.evaluate(`window.__gallery.meta(${JSON.stringify(id)})`)
        })()
        const shots = [{ name: 'default', query: '' }, ...(meta.captures ?? []).map(c => ({ name: c.name, query: Object.entries(c.values).map(([k, v]) => `&p.${k}=${encodeURIComponent(String(v))}`).join('') }))]
        const dir = join(p.shotsDir, id)
        mkdirSync(dir, { recursive: true })
        for (const s of shots) {
          await page.goto(`${url}#/s/${id}?auto=0&t=${p.thumbTime}${s.query}`)
          await page.sleep(500)
          await settle(page, 0)
          // 무대 위 상태 배지(일시정지)는 썸네일에 넣지 않는다
          await page.evaluate(`document.querySelectorAll('.stage-badges').forEach(e => e.style.visibility = 'hidden')`)
          const rect = await page.rect('.stage')
          const png = await page.screenshot(rect)
          const webp = await toWebp(page, png, WIDTH)
          const file = join(dir, `${s.name}.webp`)
          writeFileSync(file, Buffer.from(webp, 'base64'))
          console.log(`${relative(p.root, file)} (${(Buffer.byteLength(webp, 'base64') / 1024).toFixed(1)} KB)`)
        }
        for (const log of page.logs.slice(0, 5)) console.log(`페이지 오류: ${String(log).slice(0, 300)}`)
      },
      { size: [1440, 1000] },
    )
  }
}

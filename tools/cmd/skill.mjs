// gallery skill: 표본 데이터에서 Skill 폴더와 zip 을 만든다. 앱의 zip 받기와 같은 함수(src/ai/skill.ts)를 쓴다.
//   gallery skill            dist 를 빌드하고 만든다
//   gallery skill --no-build 지금 dist 로 만든다
// 결과: <skill>/<이름>/ (커밋 대상), <skill>/<이름>.zip (커밋 안 함)

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { withChrome } from '../lib/chrome.mjs'
import { project, viteBuild } from '../lib/project.mjs'
import { ensureModules } from '../lib/worktree.mjs'

export default async function skill(args) {
  const p = project()
  ensureModules(p.root, p.web)
  if (!p.skillDir) return console.log('이 갤러리는 Skill 을 만들지 않는다 (package.json gallery.skill = false)')
  if (!args.includes('--no-build')) viteBuild(p)
  if (!existsSync(p.dist)) throw new Error(`${p.dist} 이 없다`)
  const { entries, zip } = await withChrome(async page => {
    await page.goto(`${pathToFileURL(p.dist).href}#/`)
    await page.sleep(1000)
    return { entries: await page.evaluate('window.__gallery.skill()'), zip: await page.evaluate('window.__gallery.skillZip()') }
  })
  const name = entries[0].path.split('/')[0]
  const folder = join(p.skillDir, name)
  if (existsSync(folder)) rmSync(folder, { recursive: true, force: true })
  for (const e of entries) {
    const path = join(p.skillDir, e.path)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, Buffer.from(e.base64, 'base64'))
  }
  const zipPath = join(p.skillDir, `${name}.zip`)
  writeFileSync(zipPath, Buffer.from(zip, 'base64'))
  const md = Buffer.from(entries[0].base64, 'base64').toString('utf8')
  const description = /^description: (.*)$/m.exec(md)?.[1] ?? '""'
  console.log(`${relative(p.root, folder)}/: 파일 ${entries.length}개`)
  console.log(`${relative(p.root, zipPath)}: ${(Buffer.byteLength(zip, 'base64') / 1024).toFixed(1)} KB`)
  console.log(`SKILL.md ${md.split('\n').length}줄 (한도 500), 설명 ${JSON.parse(description).length}자 (한도 1536)`)
}

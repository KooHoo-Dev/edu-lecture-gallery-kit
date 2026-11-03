// gallery size: 표본 하나가 결과 HTML 을 얼마나 키우는지 잰다.
//   gallery size            모든 표본
//   gallery size <id> ...   지정한 표본
// 방법: 셸만(표본 0개) 빌드와 그 표본만 넣은 빌드를 비교한다. 결과는 _shots/size/ (dist 를 건드리지 않음).
// 증분 합은 전체 빌드 증분보다 조금 크다 (여러 표본이 함께 쓰는 코드가 표본마다 한 번씩 세어진다).

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { project, specimenIds, viteBuild } from '../lib/project.mjs'
import { ensureModules } from '../lib/worktree.mjs'

const kb = n => `${(n / 1024).toFixed(0)}`.padStart(6)

export default async function size(args) {
  const p = project()
  ensureModules(p.root, p.web)
  const all = specimenIds(p)
  const ids = args.length ? args : all
  for (const id of ids) if (!all.includes(id)) throw new Error(`표본 폴더가 없습니다: ${id}`)
  const measure = only => {
    const html = readFileSync(viteBuild(p, { only, outDir: join(p.out, 'size', only) }))
    return { raw: html.length, gzip: gzipSync(html, { level: 6 }).length }
  }
  console.log('표본 0개(셸만) 빌드 중…')
  const base = measure('__none__')
  const rows = ids.map(id => {
    process.stdout.write(`\r  ${id} 빌드 중…`.padEnd(60))
    const s = measure(id)
    return { id, raw: s.raw - base.raw, gzip: s.gzip - base.gzip }
  })
  rows.sort((a, b) => b.raw - a.raw)
  process.stdout.write('\r'.padEnd(61) + '\r')
  console.log(`셸(표본 0개): 원본 ${kb(base.raw)} KB · gzip ${kb(base.gzip)} KB\n`)
  console.log('표본                           증분KB  gzipKB')
  const limit = kb(p.perSpecimenGzip).trim()
  for (const r of rows) console.log(`${r.id.padEnd(30)} ${kb(r.raw)}  ${kb(r.gzip)}${r.gzip > p.perSpecimenGzip ? `  ← 표본당 gzip 기준 ${limit}KB 넘음` : ''}`)
  if (!rows.length) return
  const avg = k => rows.reduce((n, r) => n + r[k], 0) / rows.length
  console.log(`\n평균 증분: 원본 ${kb(avg('raw')).trim()} KB · gzip ${kb(avg('gzip')).trim()} KB`)
  if (existsSync(p.dist) && ids.length === all.length) {
    const html = readFileSync(p.dist)
    const cur = { raw: html.length, gzip: gzipSync(html, { level: 6 }).length }
    const room = Math.floor(Math.min((p.budget.raw - cur.raw) / Math.max(1, avg('raw')), (p.budget.gzip - cur.gzip) / Math.max(1, avg('gzip'))))
    console.log(`현재 dist: 원본 ${kb(cur.raw).trim()} / ${kb(p.budget.raw).trim()} KB · gzip ${kb(cur.gzip).trim()} / ${kb(p.budget.gzip).trim()} KB`)
    console.log(`평균 크기 표본 기준으로 약 ${Math.max(0, room)}개 더 들어갑니다.`)
  }
}

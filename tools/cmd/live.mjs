// gallery live: 실제 시간으로 흘려 보며 찍는 캡처 도구.
//
//   gallery live <표본id> [옵션] [동작...]
//   gallery live state-player-actions --query="auto=0&p.jumpHeight=2" wait:800 stage:mid key:j wait:300 stage:off
//   gallery live home --dist shot:home
//
// 옵션
//   --query="..."     #/s/<id>? 뒤에 붙일 쿼리 (예: preset=x&off=1&step=2&t=1.3&p.<key>=<값>). 한 번에 하나만 받는다
//   --size=1440x1000  창 크기
//   --dist            dist/index.html 을 쓴다 (먼저 빌드). 기본은 이 표본만 넣어 _shots/build-<id> 로 빌드
//   --no-build        _shots/build-<id> 를 다시 빌드하지 않는다
// 동작 (차례대로 실행, 없으면 wait:2500 shot:live)
//   wait:<ms>                 실제 시간 대기
//   click:<버튼 글자>          글자가 들어간 첫 번째 button 클릭 (JS click)
//   tap:<x>,<y>               창 좌표 클릭 (무대에 포커스 줄 때)
//   key:<Key>                 키 입력 (ArrowDown, Enter, Escape, Space, q, 1 …)
//   js:<식>                   페이지에서 실행하고 결과 출력
//   shot:<이름>               _shots/<id>/live-<이름>-<시각>.png (Read 도구로 확인)
//   stage:<이름>              무대 부분만 잘라 저장
//   burst:<이름>,<장수>,<간격ms>  연속 촬영 (기본 6장, 100ms). 무대 시간을 간격만큼 직접 옮겨 가며 찍는다.
//                             실제 시간과 상관없이 매번 같은 순간이 찍힌다. 시트 한 장과 이웃한 장의 변화량을 남긴다

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { withChrome } from '../lib/chrome.mjs'
import { diffs, settle, sheet } from '../lib/pixels.mjs'
import { project, viteBuild } from '../lib/project.mjs'
import { ensureModules } from '../lib/worktree.mjs'

export default async function live(argv) {
  const p = project()
  ensureModules(p.root, p.web)
  const id = argv.find(a => !a.startsWith('--'))
  if (!id) {
    console.log('사용법: gallery live <표본id|home> [--query=...] [--size=WxH] [--dist] [--no-build] [동작...]')
    process.exitCode = 2
    return
  }
  const opt = name => argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3)
  const flag = name => argv.includes(`--${name}`)
  const actions = argv.filter(a => !a.startsWith('--') && a !== id)
  if (!actions.length) actions.push('wait:2500', 'shot:live')
  const [w, h] = (opt('size') ?? '1440x1000').split('x').map(Number)

  let html
  if (flag('dist') || id === 'home') html = p.dist
  else if (flag('no-build')) html = join(p.out, `build-${id}`, 'index.html')
  else {
    try {
      html = viteBuild(p, { only: id })
    } catch (e) {
      console.log(e.message)
      process.exitCode = 1
      return
    }
  }
  if (!existsSync(html)) {
    console.log(`${html} 이 없습니다`)
    process.exitCode = 1
    return
  }
  const query = opt('query')
  const url = pathToFileURL(html).href + (id === 'home' ? '#/' : `#/s/${id}${query ? `?${query}` : ''}`)
  const outDir = join(p.out, id)
  mkdirSync(outDir, { recursive: true })
  const stamp = new Date().toTimeString().slice(0, 8).replaceAll(':', '')

  await withChrome(
    async page => {
      await page.goto(url)
      await page.sleep(1200)
      const stageError = () => page.evaluate('window.__gallery?.stage?.()?.error ?? ""')
      const first = await stageError()
      if (first) console.log(`무대 오류: ${first}`)

      const burst = async spec => {
        const [name = 'burst', countText, stepText] = spec.split(',')
        const count = Math.max(2, Math.min(16, Number(countText) || 6))
        const stepMs = Number(stepText) || 100
        const start = await page.evaluate('window.__gallery?.stage?.()?.time')
        const rect = await page.rect('.stage')
        if (typeof start !== 'number' || !rect) return console.log('burst: 무대를 찾지 못했습니다')
        const shots = []
        for (let k = 0; k < count; k++) {
          const t = start + (k * stepMs) / 1000
          const before = (await page.evaluate('window.__gallery.stage()'))?.frames ?? 0
          await page.evaluate(`window.__gallery.seek(${t})`)
          await settle(page, before)
          const data = await page.screenshot(rect)
          writeFileSync(join(outDir, `live-${name}-t${t.toFixed(2)}-${stamp}.png`), Buffer.from(data, 'base64'))
          shots.push({ t, data })
        }
        await page.evaluate('window.__gallery.seek(null)')
        const d = await diffs(page, shots.map(s => s.data))
        console.log(`burst ${name}: t=${start.toFixed(2)}~${shots.at(-1).t.toFixed(2)} 초, ${count}장, ${stepMs}ms 간격`)
        d.forEach((x, k) => console.log(`  ${shots[k].t.toFixed(2)}→${shots[k + 1].t.toFixed(2)}  평균 차이 ${x.mean.toFixed(2)}  바뀐 픽셀 ${(x.changed * 100).toFixed(1)}%`))
        if (d.every(x => x.mean < 0.05)) console.log('  움직임 없음: 모든 장이 같다')
        const file = join(outDir, `live-${name}-sheet-${stamp}.png`)
        writeFileSync(file, Buffer.from(await sheet(page, shots.map(s => s.data), shots.map(s => `t=${s.t.toFixed(2)}`)), 'base64'))
        console.log(`sheet: ${file}`)
      }

      const KEYS = { Enter: ['Enter', 13, '\r'], Escape: ['Escape', 27], Backspace: ['Backspace', 8], Tab: ['Tab', 9], ArrowUp: ['ArrowUp', 38], ArrowDown: ['ArrowDown', 40], ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39], Space: ['Space', 32, ' '], ' ': ['Space', 32, ' '] }
      for (const a of actions) {
        const [kind, ...rest] = a.split(':')
        const v = rest.join(':')
        if (kind === 'wait') await page.sleep(Number(v))
        else if (kind === 'click') {
          const res = await page.evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(v)})); if (!b) return '없음'; b.click(); return '클릭' })()`)
          console.log(`click ${v}: ${res}`)
        } else if (kind === 'tap') {
          const [x, y] = v.split(',').map(Number)
          for (const type of ['mousePressed', 'mouseReleased']) await page.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
        } else if (kind === 'key') {
          const [code, keyCode, text] = KEYS[v] ?? [/^[0-9]$/.test(v) ? `Digit${v}` : `Key${v.toUpperCase()}`, v.toUpperCase().charCodeAt(0), v]
          const key = v === 'Space' ? ' ' : v
          await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, text })
          await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode })
        } else if (kind === 'js') console.log('js:', JSON.stringify(await page.evaluate(v)))
        else if (kind === 'burst') await burst(v)
        else if (kind === 'shot' || kind === 'stage') {
          const rect = kind === 'stage' ? await page.rect('.stage') : null
          const file = join(outDir, `live-${v}-${stamp}.png`)
          writeFileSync(file, Buffer.from(await page.screenshot(rect), 'base64'))
          console.log(`shot: ${file}`)
        } else console.log(`모르는 동작: ${a}`)
      }
      const last = await stageError()
      if (last) {
        console.log(`실패: 무대 오류: ${last}`)
        process.exitCode = 1
      }
      for (const log of page.logs.slice(0, 5)) console.log(`페이지 오류: ${String(log).slice(0, 300)}`)
    },
    { size: [w, h] },
  )
}

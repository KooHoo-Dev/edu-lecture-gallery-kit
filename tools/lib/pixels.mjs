// 이미지 라이브러리 없이 페이지의 캔버스로 PNG 들을 비교하고 시트를 만든다.

/** PNG base64 목록 -> 이웃한 장 사이 { mean, changed }. mean 은 0~255 평균 차이, changed 는 8 넘게 바뀐 픽셀 비율 */
export function diffs(page, pngs) {
  return page.evaluate(`(async () => {
    const pngs = ${JSON.stringify(pngs)}
    const imgs = await Promise.all(pngs.map(d => new Promise((ok, fail) => { const im = new Image(); im.onload = () => ok(im); im.onerror = fail; im.src = 'data:image/png;base64,' + d })))
    const w = imgs[0].naturalWidth, h = imgs[0].naturalHeight
    const pixels = imgs.map(im => { const c = new OffscreenCanvas(w, h); const g = c.getContext('2d'); g.drawImage(im, 0, 0, w, h); return g.getImageData(0, 0, w, h).data })
    const out = []
    for (let k = 1; k < pixels.length; k++) {
      const a = pixels[k - 1], b = pixels[k]
      let sum = 0, changed = 0
      for (let p = 0; p < a.length; p += 4) {
        const d = (Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2])) / 3
        sum += d
        if (d > 8) changed++
      }
      out.push({ mean: sum / (w * h), changed: changed / (w * h) })
    }
    return out
  })()`)
}

/** PNG base64 목록 -> 라벨 붙은 시트 PNG base64 */
export function sheet(page, pngs, labels) {
  return page.evaluate(`(async () => {
    const pngs = ${JSON.stringify(pngs)}, labels = ${JSON.stringify(labels)}
    const imgs = await Promise.all(pngs.map(d => new Promise((ok, fail) => { const im = new Image(); im.onload = () => ok(im); im.onerror = fail; im.src = 'data:image/png;base64,' + d })))
    const w = imgs[0].naturalWidth, h = imgs[0].naturalHeight
    const cols = Math.min(4, imgs.length), rows = Math.ceil(imgs.length / cols), gap = 4
    const cw = Math.min(w, 480), ch = Math.round((h * cw) / w)
    const sheet = new OffscreenCanvas(cols * cw + (cols - 1) * gap, rows * ch + (rows - 1) * gap)
    const g = sheet.getContext('2d')
    g.fillStyle = '#000'
    g.fillRect(0, 0, sheet.width, sheet.height)
    g.font = 'bold 16px sans-serif'
    imgs.forEach((im, k) => {
      const x = (k % cols) * (cw + gap), y = Math.floor(k / cols) * (ch + gap)
      g.drawImage(im, x, y, cw, ch)
      g.fillStyle = 'rgba(0, 0, 0, 0.7)'
      g.fillRect(x, y, g.measureText(labels[k]).width + 12, 24)
      g.fillStyle = '#fff'
      g.fillText(labels[k], x + 6, y + 17)
    })
    const blob = await sheet.convertToBlob({ type: 'image/png' })
    const url = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(blob) })
    return url.slice(url.indexOf(',') + 1)
  })()`)
}

/** PNG base64 -> WebP base64 (폭을 width 로 줄인다) */
export function toWebp(page, png, width, quality = 0.85) {
  return page.evaluate(`(async () => {
    const im = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = 'data:image/png;base64,${png}' })
    const w = Math.min(${width}, im.naturalWidth), h = Math.round(im.naturalHeight * w / im.naturalWidth)
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, w, h)
    const url = c.toDataURL('image/webp', ${quality})
    return url.slice(url.indexOf(',') + 1)
  })()`)
}

/** 무대가 프레임을 하나 더 그리고 화면에 올라올 때까지 기다린다 */
export async function settle(page, previousFrames) {
  for (let i = 0; i < 150; i++) {
    const s = await page.evaluate('window.__gallery?.stage?.() ?? null')
    if (s && s.frames > (previousFrames ?? 0)) break
    await page.sleep(20)
  }
  await page.evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))')
}

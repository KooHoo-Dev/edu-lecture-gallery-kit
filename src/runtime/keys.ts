/** 키가 입력 칸에서 왔는가 (갤러리 단축키를 무시한다). 슬라이더·체크박스·색은 입력 칸이 아니다 */
export function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  if (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true
  if (t.tagName === 'INPUT') return !['range', 'checkbox', 'radio', 'color', 'button'].includes((t as HTMLInputElement).type)
  return false
}

/**
 * 게임 루프용 시계. requestAnimationFrame 마다 dt(초, 배속 반영, 큰 공백은 0.1초로 자름)를 준다.
 * React 밖(무대 클래스)에서도 쓸 수 있게 훅이 아니라 함수다. 멈추는 함수를 돌려준다
 */
export function startLoop(onFrame: (dt: number, now: number) => void): () => void {
  let raf = 0
  let last = performance.now()
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick)
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000))
    last = now
    onFrame(dt, now)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

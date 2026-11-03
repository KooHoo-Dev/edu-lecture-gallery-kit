import { num, startLoop, TrackPlayer, type BaseSpecimen, type StageHandle, type StageProps } from '@koohoo/gallery-kit'
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'

/** 예제 무대: 캔버스에 원 하나. 반지름 값을 트랙이 움직이고, 단계 1 은 테두리만, 단계 2 는 중심점, 효과 끄기는 회색 사각형 */
export function CircleStage({ ref, specimen, values, step, off, playing, speed, auto, startTime, onLive, thumbnail, children }: StageProps<BaseSpecimen> & { ref?: Ref<StageHandle> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const player = useRef(new TrackPlayer(specimen.meta))
  const state = useRef({ frames: 0, held: false, dirty: true })
  const props = useRef({ values, step, off, playing, speed, auto, onLive })
  props.current = { values, step, off, playing, speed, auto, onLive }

  useImperativeHandle(ref, () => ({
    fire: id => {
      player.current.fire(id)
      state.current.dirty = true
    },
    capture: () => new Promise(ok => (canvas.current ? canvas.current.toBlob(b => ok(b), 'image/png') : ok(null))),
    seek: time => {
      state.current.held = time !== null
      if (time !== null) player.current.jump(time, props.current.auto)
      state.current.dirty = true
    },
    status: () => ({ frames: state.current.frames, time: player.current.time, error: null }),
  }))

  useEffect(() => {
    player.current.reset(startTime ?? 0)
  }, [specimen, startTime])

  useEffect(() => {
    state.current.dirty = true
  }, [values, step, off, auto])

  useEffect(
    () =>
      startLoop(dt => {
        const p = props.current
        const s = state.current
        if (p.playing && !s.held) {
          player.current.advance(dt * p.speed, p.auto)
          s.dirty = true
        }
        if (!s.dirty || !canvas.current) return
        s.dirty = false
        const v = player.current.apply(p.values, p.auto, thumbnail ? undefined : p.onLive)
        const c = canvas.current
        const g = c.getContext('2d')!
        g.fillStyle = '#0b1220'
        g.fillRect(0, 0, c.width, c.height)
        const r = num(v, 'radius', 100) + num(v, 'pop', 0) * 60
        g.beginPath()
        if (p.off) g.rect(c.width / 2 - r, c.height / 2 - r, r * 2, r * 2)
        else g.arc(c.width / 2, c.height / 2, r, 0, Math.PI * 2)
        if (p.step === 1) {
          g.strokeStyle = '#ffffff'
          g.lineWidth = 6
          g.stroke()
        } else {
          g.fillStyle = p.off ? '#666666' : String(v.color ?? '#7ee081')
          g.fill()
          if (p.step === 2) {
            g.fillStyle = '#0b1220'
            g.fillRect(c.width / 2 - 12, c.height / 2 - 12, 24, 24)
          }
        }
        s.frames++
      }),
    [thumbnail],
  )

  return (
    <div className="stage">
      <canvas ref={canvas} className="stage-canvas" width={960} height={540} />
      {children}
    </div>
  )
}

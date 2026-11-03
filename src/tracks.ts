import type { BaseMeta, Ease, ParamValues, Track } from './contract'
import { requestFlash } from './runtime/flash'

/* 트랙 엔진: 이벤트와 자동 데모가 range 값을 시간에 따라 움직인다 (셰이더 갤러리에서 옮김).
 * 무대는 매 프레임 advance(dt) 다음 apply(값) 으로 덮어쓴 값을 얻는다. */

export const EASE: Record<Ease, (t: number) => number> = {
  linear: t => t,
  inOutSine: t => 0.5 - 0.5 * Math.cos(Math.PI * t),
  outQuad: t => 1 - (1 - t) * (1 - t),
  inQuad: t => t * t,
}

/** 트랙의 t 초 값. 범위를 벗어나면 양 끝 값 */
export function evalTrack(track: Track, t: number): number {
  const f = track.frames
  if (t <= f[0][0]) return f[0][1]
  for (let i = 1; i < f.length; i++) {
    if (t <= f[i][0]) {
      const u = (t - f[i - 1][0]) / Math.max(1e-5, f[i][0] - f[i - 1][0])
      return f[i - 1][1] + (f[i][1] - f[i - 1][1]) * EASE[track.ease ?? 'linear'](u)
    }
  }
  return f[f.length - 1][1]
}

export const trackEnd = (track: Track) => track.frames[track.frames.length - 1][0]

export class TrackPlayer {
  /** 무대 시간 (초) */
  time = 0
  /** 자동 데모 시간 (자동 데모가 켜져 있을 때만 흐른다) */
  demoTime = 0
  private active: { tracks: Track[]; start: number }[] = []
  private fireClock = new Map<string, number>()
  private liveKeys = new Set<string>()

  private meta: BaseMeta
  private onFire?: (eventId: string) => void

  /** onFire: 트랙이 없는 이벤트도 포함해 이벤트가 일어날 때마다 (무대가 직접 처리할 때) */
  constructor(meta: BaseMeta, onFire?: (eventId: string) => void) {
    this.meta = meta
    this.onFire = onFire
  }

  reset(time = 0) {
    this.time = time
    this.demoTime = 0
    this.active = []
    this.fireClock.clear()
    this.liveKeys.clear()
  }

  /** 이벤트를 일으킨다. 번쩍이는 표본은 제한기를 거친다. 일어났으면 true */
  fire(eventId: string): boolean {
    const event = this.meta.events.find(e => e.id === eventId)
    if (!event) return false
    if (this.meta.flashes && !requestFlash()) return false
    if (event.tracks?.length) this.active.push({ tracks: event.tracks, start: this.time })
    this.onFire?.(eventId)
    return true
  }

  /** dt 초 진행. auto 면 자동 데모 시간도 흐르고 데모 이벤트가 일어난다 */
  advance(dt: number, auto: boolean) {
    this.time += dt
    if (auto) this.demoTime += dt
    this.fireDemoEvents(auto)
  }

  /** 시간을 직접 옮긴다 (검사용 seek) */
  jump(time: number, auto: boolean) {
    const dt = time - this.time
    this.time = time
    if (auto) this.demoTime = Math.max(0, this.demoTime + dt)
    this.fireDemoEvents(auto)
  }

  /** 조절 값 위에 자동 데모와 이벤트 트랙을 덮어쓴 값. onLive 로 바뀐 키를 알린다 */
  apply(values: ParamValues, auto: boolean, onLive?: (key: string, value: number | null) => void): ParamValues {
    const out = { ...values }
    const live = new Map<string, number>()
    if (auto) {
      for (const track of this.meta.demo?.loops ?? []) {
        const value = evalTrack(track, this.demoTime % Math.max(0.001, trackEnd(track)))
        out[track.key] = value
        live.set(track.key, value)
      }
    }
    this.active = this.active.filter(a => this.time - a.start <= Math.max(...a.tracks.map(trackEnd)))
    for (const a of this.active) {
      for (const track of a.tracks) {
        const value = evalTrack(track, this.time - a.start)
        out[track.key] = value
        live.set(track.key, value)
      }
    }
    if (onLive) for (const key of new Set([...live.keys(), ...this.liveKeys])) onLive(key, live.get(key) ?? null)
    this.liveKeys = new Set(live.keys())
    return out
  }

  private fireDemoEvents(auto: boolean) {
    const fires = auto ? this.meta.demo?.fire : undefined
    if (!fires) return
    for (const f of fires) {
      const count = Math.floor(this.demoTime / f.every)
      if (count > (this.fireClock.get(f.event) ?? 0)) {
        this.fireClock.set(f.event, count)
        this.fire(f.event)
      }
    }
  }
}

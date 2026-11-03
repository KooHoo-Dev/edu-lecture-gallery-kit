import { useMemo, useState, type CSSProperties } from 'react'
import { useGallery, type Chip } from '../config'
import type { BaseSpecimen, PlannedSpecimen } from '../contract'
import { defaultParams, thumbnailOf } from '../params'
import { prefersReducedMotion } from '../runtime/flash'
import { hrefSpecimen } from './router'

/** 실행 중인 카드는 하나뿐이다. 새 카드가 깨어나면 앞의 카드를 끈다 (무대가 공유 캔버스여도 안전하게) */
let sleepPrevious: (() => void) | null = null

export function ChipView({ chip, small }: { chip: Chip; small?: boolean }) {
  const cls = ['chip', small && 'chip-sm', chip.outline && 'chip-outline', chip.warn && 'chip-warn'].filter(Boolean).join(' ')
  return (
    <span className={cls} title={chip.title} data-tone={chip.tone ? '' : undefined} style={chip.tone ? ({ '--tone': chip.tone } as CSSProperties) : undefined}>
      {chip.label}
    </span>
  )
}

/**
 * 갤러리 카드: 평소엔 정적 썸네일, 마우스를 올리거나 포커스하면 무대를 실행한다.
 * 표본 수가 늘어도 첫 화면이 느려지지 않는다 (UI 갤러리에서 홈 카드 실시간 렌더가 첫 화면을 가장 늦췄다)
 */
export function SpecimenCard({ specimen }: { specimen: BaseSpecimen }) {
  const g = useGallery()
  const m = specimen.meta
  const [live, setLive] = useState(false)
  const values = useMemo(() => defaultParams(m.params), [m.params])
  const canRun = !prefersReducedMotion() && (g.cardLive?.() ?? true)
  const thumb = thumbnailOf(specimen)
  const chip = g.cardChip?.(specimen)
  const Stage = g.Stage
  const wake = () => {
    if (!canRun) return
    sleepPrevious?.()
    sleepPrevious = () => setLive(false)
    setLive(true)
  }

  return (
    <a className="card" href={hrefSpecimen(m.id)} onPointerEnter={wake} onPointerLeave={() => setLive(false)} onFocus={wake} onBlur={() => setLive(false)}>
      <div className="card-stage">
        {thumb ? <img src={thumb} alt={`${m.title} ${g.shotAlt}`} loading="lazy" decoding="async" /> : <span className="card-noshot">촬영 전</span>}
        {live && (
          <div className="card-live">
            <Stage specimen={specimen} values={values} step={0} off={false} playing speed={1} auto thumbnail />
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-tags">
          {chip && <ChipView chip={chip} small />}
          <span className="stars" aria-label={`난이도 ${m.difficulty}`}>
            {'★'.repeat(m.difficulty)}
            <span aria-hidden className="stars-off">
              {'★'.repeat(3 - m.difficulty)}
            </span>
          </span>
        </div>
        <h3>{m.title}</h3>
        <p>{m.oneLiner}</p>
        {m.inspiredBy.length > 0 && <p className="card-inspired">Inspired by {m.inspiredBy.map(i => i.title).join(' · ')}</p>}
      </div>
    </a>
  )
}

export function PlannedCard({ p }: { p: PlannedSpecimen }) {
  const g = useGallery()
  return (
    <div className="card card-planned" aria-label={`${p.title} (제작 중)`}>
      <div className="card-stage card-stage-planned">
        <span className="planned-label">제작 중</span>
        <span className="planned-group" aria-hidden>
          {p.group} · {g.groups[p.group]?.name}
        </span>
      </div>
      <div className="card-body">
        <h3>{p.title}</h3>
        <p>{p.oneLiner}</p>
      </div>
    </div>
  )
}

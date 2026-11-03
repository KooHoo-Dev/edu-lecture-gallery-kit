import { useMemo, useState } from 'react'
import { useGallery } from '../config'
import type { BaseSpecimen } from '../contract'
import { load, save } from '../runtime/storage'
import { PlannedCard, SpecimenCard } from './SpecimenCard'

interface Filters {
  q: string
  facet: string
  tag: string
}
const EMPTY: Filters = { q: '', facet: '', tag: '' }

export function Home() {
  const g = useGallery()
  const [f, setF] = useState<Filters>(() => ({ ...EMPTY, ...load<Partial<Filters>>('filters', EMPTY) }))
  // 완성된 표본이 먼저 보이도록 제작 중 카드는 눌렀을 때만 펼친다
  const [showPlanned, setShowPlanned] = useState(false)
  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch }
    setF(next)
    save('filters', next)
  }
  const planned = useMemo(() => (g.planned ?? []).filter(p => !g.specimens.some(s => s.meta.id === p.id)), [g])
  const active = f.q || f.facet || f.tag
  const tags = useMemo(() => [...new Set(g.specimens.flatMap(s => s.meta.tags))].sort((a, b) => a.localeCompare(b)), [g])

  const match = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    return (s: BaseSpecimen) => {
      const m = s.meta
      return (
        (!q || [m.title, m.titleEn, m.oneLiner, ...m.tags, ...m.inspiredBy.map(i => i.title)].join(' ').toLowerCase().includes(q)) &&
        (!f.facet || !g.facet || g.facet.of(s) === f.facet) &&
        (!f.tag || m.tags.includes(f.tag))
      )
    }
  }, [f, g])

  const shown = g.specimens.filter(match)
  const groups = Object.keys(g.groups).map(id => ({
    id,
    items: shown.filter(s => s.meta.group === id),
    planned: active || !showPlanned ? [] : planned.filter(p => p.group === id),
  }))

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">{g.hero.eyebrow}</p>
          <h1>{g.hero.title}</h1>
          <p className="lead">{g.hero.lead}</p>
        </div>
        {g.facet?.legend && (
          <ul className="kind-legend" aria-label={g.facet.label}>
            {g.facet.options.map(o => (
              <li key={o.value}>
                <button
                  className="kind-item"
                  data-tone={o.tone ? '' : undefined}
                  style={o.tone ? ({ '--tone': o.tone } as React.CSSProperties) : undefined}
                  aria-pressed={f.facet === o.value}
                  onClick={() => update({ facet: f.facet === o.value ? '' : o.value })}
                >
                  <span className="kind-icon" aria-hidden />
                  <span>
                    <b>{o.label}</b>
                    {o.desc && <span className="kind-desc">{o.desc}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="filters" aria-label="필터">
        <label className="search">
          <span className="sr-only">검색</span>
          <input type="search" placeholder={g.searchPlaceholder} value={f.q} onChange={e => update({ q: e.target.value })} />
        </label>
        {g.facet && <Select label={g.facet.label} value={f.facet} onChange={v => update({ facet: v })} options={g.facet.options.map(o => [o.value, o.label])} />}
        {tags.length > 0 && <Select label={g.tagLabel} value={f.tag} onChange={v => update({ tag: v })} options={tags.map(t => [t, t])} />}
        {active && (
          <button className="btn btn-ghost" onClick={() => update(EMPTY)}>
            필터 초기화
          </button>
        )}
        <span className="filters-count">표본 {shown.length}개</span>
        {!active && planned.length > 0 && (
          <button className="btn btn-toggle" aria-pressed={showPlanned} onClick={() => setShowPlanned(v => !v)}>
            제작 중 {planned.length}개 {showPlanned ? '숨기기' : '보기'}
          </button>
        )}
      </section>

      {groups.map(
        group =>
          (group.items.length > 0 || group.planned.length > 0) && (
            <section key={group.id} className="group" aria-labelledby={`g-${group.id}`}>
              <header className="group-head">
                <span className="group-letter" aria-hidden>
                  {group.id}
                </span>
                <div>
                  <h2 id={`g-${group.id}`}>{g.groups[group.id].name}</h2>
                  <p>{g.groups[group.id].desc}</p>
                </div>
              </header>
              <div className="grid">
                {group.items.map(s => (
                  <SpecimenCard key={s.meta.id} specimen={s} />
                ))}
                {group.planned.map(p => (
                  <PlannedCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          ),
      )}
      {shown.length === 0 && <p className="empty">조건에 맞는 표본이 없습니다. 필터를 바꿔 보세요.</p>}
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="select">
      <span>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">전체</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

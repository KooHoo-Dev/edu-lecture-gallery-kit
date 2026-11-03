import hljs from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import { useMemo, useState, type RefObject } from 'react'
import { useGallery } from '../config'
import type { BaseSpecimen, ParamValues, StageHandle } from '../contract'
import { downloadBlob, imageUrlToPng, useCopy, writeImage, writeText } from './clipboard'
import { collectSkill } from './skill'
import { createZip } from './zip'

hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)

/** AI 지시 세트: 프롬프트, 이미지, 원본 코드, Skill. 지금 조절 값이 코드와 프롬프트에 그대로 들어간다 */
export function AiKit({ specimen, values, stage }: { specimen: BaseSpecimen; values: ParamValues; stage: RefObject<StageHandle | null> }) {
  const g = useGallery()
  return (
    <div className="kit">
      <p className="kit-intro">{g.ai.intro}</p>
      <div className="kit-row">
        <PromptPanel specimen={specimen} values={values} />
        <ImagePanel specimen={specimen} stage={stage} />
      </div>
      <CodePanel specimen={specimen} values={values} />
      <SkillPanel specimen={specimen} />
    </div>
  )
}

function PromptPanel({ specimen, values }: { specimen: BaseSpecimen; values: ParamValues }) {
  const g = useGallery()
  const kinds = g.ai.prompts
  const [kindId, setKindId] = useState(kinds[0]?.id)
  const kind = kinds.find(k => k.id === kindId) ?? kinds[0]
  const text = useMemo(() => kind?.build(specimen, values) ?? '', [kind, specimen, values])
  const [status, copy] = useCopy()
  if (!kind) return null
  return (
    <div className="kit-panel">
      <h3>프롬프트</h3>
      <div className="tabs" role="tablist" aria-label="프롬프트 종류">
        {kinds.map(k => (
          <button key={k.id} role="tab" aria-selected={kind.id === k.id} onClick={() => setKindId(k.id)}>
            {k.name}
          </button>
        ))}
      </div>
      <p className="kit-hint">{kind.desc}</p>
      <textarea className="kit-prompt" readOnly value={text} aria-label={`${kind.name} 프롬프트`} />
      <button className="btn btn-primary" onClick={() => copy(() => writeText(text))}>
        {status ?? '프롬프트 복사'}
      </button>
      <span className="kit-hint">{text.length.toLocaleString()}자 · 어떤 AI 채팅에든 붙여 넣으면 됩니다</span>
    </div>
  )
}

function ImagePanel({ specimen, stage }: { specimen: BaseSpecimen; stage: RefObject<StageHandle | null> }) {
  const g = useGallery()
  const cfg = g.ai.images
  const options = useMemo(() => cfg.list(specimen), [cfg, specimen])
  const [selected, setSelected] = useState(0)
  const shot = options[Math.min(selected, options.length - 1)]
  const [shotStatus, copyShot] = useCopy()
  const [liveStatus, copyLive] = useCopy()
  const id = specimen.meta.id

  return (
    <div className="kit-panel">
      <h3>{cfg.title}</h3>
      {shot ? (
        <>
          {options.length > 1 && (
            <div className="seg seg-sm" role="radiogroup" aria-label="촬영 상태">
              {options.map((o, i) => (
                <button key={o.name} role="radio" aria-checked={shot === o} onClick={() => setSelected(i)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
          <img className="kit-shot" src={shot.url} alt={`${specimen.meta.title}: ${shot.label}`} />
        </>
      ) : (
        <p className="kit-hint">아직 촬영하지 않았습니다.</p>
      )}
      <div className="kit-actions">
        {shot && (
          <button className="btn" onClick={() => copyShot(async () => writeImage(await imageUrlToPng(shot.url), `${id}-${shot.name}.png`))}>
            {shotStatus ?? '이 이미지 복사'}
          </button>
        )}
        {cfg.liveLabel && (
          <button
            className="btn"
            onClick={() =>
              copyLive(async () => {
                const blob = await stage.current?.capture()
                if (!blob) throw new Error('무대를 캡처하지 못했습니다')
                return writeImage(blob, `${id}-web.png`)
              })
            }
          >
            {liveStatus ?? cfg.liveLabel}
          </button>
        )}
      </div>
      {cfg.note && <p className="kit-hint">{cfg.note}</p>}
    </div>
  )
}

function CodePanel({ specimen, values }: { specimen: BaseSpecimen; values: ParamValues }) {
  const g = useGallery()
  const files = useMemo(() => g.ai.files(specimen, values), [g, specimen, values])
  const sheet = g.ai.sheet
  const table = useMemo(() => sheet?.markdown(specimen, values) ?? '', [sheet, specimen, values])
  const [selected, setSelected] = useState(0)
  const [allStatus, copyAll] = useCopy()
  const allText = useMemo(() => files.map(f => `// ===== ${f.path} =====\n${f.code.replace(/\r\n/g, '\n').trimEnd()}`).join('\n\n'), [files])
  const tabs = [...files.map(f => f.name), ...(sheet ? [sheet.tab] : [])]
  const current = files[selected]

  return (
    <div className="kit-panel">
      <h3>원본 코드</h3>
      <div className="file-tabs" role="tablist" aria-label="파일">
        {tabs.map((name, i) => (
          <button key={`${i}-${name}`} role="tab" aria-selected={selected === i} onClick={() => setSelected(i)} title={files[i]?.path}>
            {name}
          </button>
        ))}
      </div>
      {current ? <CodeBlock code={current.code} lang={current.lang} name={current.name} /> : sheet && <Sheet table={table} />}
      <div className="kit-actions">
        <button className="btn" onClick={() => copyAll(() => writeText(allText))}>
          {allStatus ?? '파일 전부 복사'}
        </button>
        {g.ai.codeNote && <span className="kit-hint">{g.ai.codeNote(specimen)}</span>}
      </div>
    </div>
  )
}

/** 3열 Markdown 표를 화면 표로 */
function Sheet({ table }: { table: string }) {
  const lines = table.split('\n')
  const cells = (line: string) => line.split('|').slice(1, -1).map(cell => cell.trim().replace(/`/g, ''))
  const head = cells(lines[0] ?? '')
  const rows = lines.slice(2).map(cells)
  const [status, copy] = useCopy()
  return (
    <div className="kit-material">
      <table>
        <thead>
          <tr>
            {head.map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row[0]}>
              <td className="mono">{row[0]}</td>
              <td>{row[1]}</td>
              <td className="mono">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn" onClick={() => copy(() => writeText(table))}>
        {status ?? '표 복사'}
      </button>
    </div>
  )
}

function SkillPanel({ specimen }: { specimen: BaseSpecimen }) {
  const g = useGallery()
  const [status, setStatus] = useState<string | null>(null)
  const save = async (specimens: BaseSpecimen[], single: boolean) => {
    try {
      const entries = await collectSkill(g.ai.skill, specimens, __APP_VERSION__, single)
      const name = entries[0].path.split('/')[0]
      downloadBlob(new Blob([createZip(entries) as BlobPart], { type: 'application/zip' }), `${name}.zip`)
      setStatus(null)
    } catch (e) {
      setStatus(`만들지 못했습니다: ${(e as Error).message}`)
    }
  }
  return (
    <div className="kit-panel kit-skill">
      <h3>Skill 로 받기</h3>
      <p className="kit-hint">
        Claude Code 의 <code>.claude/skills/</code> 에 풀거나 claude.ai 에 올리면 AI 가 필요할 때 이 자료를 읽습니다. 인터넷 없이 받을 수 있습니다.
      </p>
      <div className="kit-actions">
        <button className="btn" onClick={() => save([specimen], true)}>
          이 표본만 zip
        </button>
        <button className="btn" onClick={() => save(g.specimens, false)}>
          전체 {g.specimens.length}개 zip
        </button>
        {status && <span className="kit-hint">{status}</span>}
      </div>
    </div>
  )
}

export function CodeBlock({ code, lang, name }: { code: string; lang: string; name: string }) {
  const html = useMemo(() => {
    const text = code.replace(/\r\n/g, '\n').trimEnd()
    return hljs.getLanguage(lang) ? hljs.highlight(text, { language: lang }).value : hljs.highlightAuto(text).value
  }, [code, lang])
  const [status, copy] = useCopy()
  return (
    <div className="code">
      <button className="btn btn-ghost code-copy" onClick={() => copy(() => writeText(code))} aria-label={`${name} 복사`}>
        {status ?? '복사'}
      </button>
      <pre>
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}

import { useGallery } from '../config'

/** kit 이 쓰는 라이브러리·글꼴. 갤러리가 about.libs 로 더한다 (three.js 등) */
const KIT_LIBS: [string, string, string][] = [
  ['React · React DOM', 'MIT', 'https://github.com/facebook/react'],
  ['highlight.js', 'BSD-3-Clause', 'https://github.com/highlightjs/highlight.js'],
  ['Chakra Petch (글꼴)', 'SIL OFL 1.1', 'https://github.com/cadsondemak/chakra-petch'],
  ['JetBrains Mono (글꼴)', 'SIL OFL 1.1', 'https://github.com/JetBrains/JetBrainsMono'],
  ['Vite · vite-plugin-singlefile (빌드 도구)', 'MIT', 'https://github.com/vitejs/vite'],
]

export function About() {
  const g = useGallery()
  const libs = [...KIT_LIBS, ...(g.about.libs ?? [])]
  return (
    <div className="about">
      <h1>크레딧 · 정책</h1>

      <section className="sec">
        <h2>이 갤러리는 무엇인가</h2>
        {g.about.intro}
      </section>

      <section className="sec">
        <h2>콘텐츠 원칙: 원리는 배우고, 코드는 새로</h2>
        <ul>
          {g.about.principles.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <p className="notice">
          언급된 게임명과 상표는 각 권리자의 소유이며, 이 프로젝트는 해당 권리자와 제휴하거나 보증받지 않았습니다. 권리 관련 요청은 저장소의 Issues로 보내 주시면 지체 없이 조치합니다.
          <br />
          <span lang="en">{g.about.noticeEn}</span>
        </p>
      </section>

      <section className="sec">
        <h2>수강생 여러분께</h2>
        {g.about.students}
      </section>

      <section className="sec">
        <h2>사용한 라이브러리 · 글꼴</h2>
        <table className="licenses">
          <thead>
            <tr>
              <th>이름</th>
              <th>라이선스</th>
            </tr>
          </thead>
          <tbody>
            {libs.map(([name, lic, url]) => (
              <tr key={name}>
                <td>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {name}
                  </a>
                </td>
                <td className="mono">{lic}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">한글 본문은 각 PC의 시스템 글꼴(맑은 고딕 등)로 표시합니다. 갤러리 틀: edu-lecture-gallery-kit (MIT).</p>
      </section>
    </div>
  )
}

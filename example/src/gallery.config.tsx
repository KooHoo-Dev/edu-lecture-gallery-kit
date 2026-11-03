import { bullets, codeSection, defaultParams, defineGallery, numbered, promptDoc, valueTable, type BaseSpecimen } from '@koohoo/gallery-kit'
import { CircleStage } from './CircleStage'
import { GROUPS, SPECIMENS } from './registry'

const ENV = '- Unity 6.3 LTS (6000.3)\n- 새 Input System'
const RULES = '- 외부 패키지를 쓰지 않는다.\n- 각 파일 맨 위에 무엇을 하는지 한국어 주석을 둔다.'

const filesWith = (s: BaseSpecimen) => s.files

export const config = defineGallery({
  id: 'kit-example',
  name: 'Kit Example',
  brand: { title: 'KIT EXAMPLE', tagline: 'gallery-kit 예제 · 셸 검사용' },
  storageKey: 'jaytools.kitexample.v1.',
  downloadName: 'KitExample.html',
  envLabel: 'Unity 6.3 LTS',
  footer: '예제 코드는 kit 검사용으로 새로 작성했습니다.',
  hero: { eyebrow: 'gallery-kit 예제', title: <>kit 이 <em>잘 도는지</em> 본다</>, lead: '표본 하나와 캔버스 무대 하나로 셸, 검사, 썸네일, Skill 을 확인한다.' },
  searchPlaceholder: '검색: 원, 트랙…',
  groups: GROUPS,
  tagLabel: '기법',
  specimens: SPECIMENS,
  planned: [{ id: 'second-shape', title: '두 번째 도형', group: 'A', order: 2, oneLiner: '제작 중 카드 표시 확인용' }],
  Stage: CircleStage,
  shotAlt: '웹 무대 화면',
  cardChip: () => ({ label: '캔버스', tone: '#7ee081' }),
  finalStep: { label: '최종', body: '모든 단계를 합친 결과.' },
  ai: {
    intro: '이 세트는 지금 조절 값을 그대로 담습니다.',
    prompts: [
      {
        id: 'direct',
        name: '그대로 넣기',
        desc: '코드를 바꾸지 않고 내 프로젝트에 추가한다',
        build: (s, values) =>
          promptDoc(`Unity 예제 추가: ${s.meta.title}`, s.meta.prompt.goal, [
            ['환경', ENV],
            ['할 일', numbered([...s.meta.unity.setup, `확인: ${s.meta.unity.verify}`])],
            ['값', valueTable(s.meta.params, values, ['필드', '뜻', '값'])],
            ['지킬 것', RULES],
            ['주의할 점', bullets(s.meta.unity.pitfalls)],
            ['파일', codeSection(filesWith(s))],
          ]),
      },
      {
        id: 'troubleshoot',
        name: '문제 해결',
        desc: '넣었는데 안 될 때',
        build: s => promptDoc(`문제 해결: ${s.meta.title}`, '이 코드를 넣었는데 제대로 동작하지 않아.', [['먼저 확인할 것', bullets(s.meta.mistakes.map(m => `${m.title}: ${m.body}`))], ['파일', codeSection(filesWith(s))]]),
      },
    ],
    files: s => filesWith(s),
    sheet: { tab: 'Inspector 값', markdown: (s, values) => valueTable(s.meta.params, values, ['필드', '뜻', '값']) },
    images: { title: '무대 화면', list: s => (s.shots.default ? [{ name: 'default', label: '기본값', url: s.shots.default }] : []), liveLabel: '현재 무대 복사' },
    skill: {
      name: 'kit-example',
      description: all => `gallery-kit 예제 Skill. 포함: ${all.map(s => s.meta.title).join(', ')}.`,
      compatibility: 'Unity 6.3 LTS (6000.3)',
      title: 'Kit Example',
      intro: '예제 표본의 `references/<id>/guide.md` 만 읽는다.',
      kindOf: () => '캔버스',
      steps: ['`references/<id>/guide.md` 를 읽는다.', '같은 폴더의 C# 를 프로젝트에 복사한다.'],
      rules: RULES,
      notes: ['예제라 실제 수업에는 쓰지 않는다.'],
      guide: s => `# ${s.meta.title}\n\n${s.meta.oneLiner}\n\n## 넣는 순서\n${numbered(s.meta.unity.setup)}\n\n## 기본 값\n${valueTable(s.meta.params, defaultParams(s.meta.params))}\n`,
      files: async s => s.files.map(f => ({ name: f.name, content: f.code })),
    },
  },
  about: {
    intro: <p>gallery-kit 이 셸을 깨뜨리지 않았는지 보는 예제입니다.</p>,
    principles: ['예제 코드는 새로 썼습니다.'],
    noticeEn: 'Example gallery for gallery-kit.',
    students: <p>예제입니다.</p>,
  },
})

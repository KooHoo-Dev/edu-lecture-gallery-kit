import type { BaseMeta } from '@koohoo/gallery-kit'

export const meta: BaseMeta = {
  id: 'pulse-circle',
  title: '맥동하는 원',
  titleEn: 'Pulse Circle',
  group: 'A',
  order: 1,
  oneLiner: '반지름을 트랙으로 움직이는 원',
  goals: ['조절 값이 무대에 바로 반영되는 것을 확인할 수 있다.', '이벤트 트랙이 값을 잠깐 바꿨다 돌려놓는 것을 볼 수 있다.', '단계 보기와 효과 끄기가 화면을 바꾸는 것을 볼 수 있다.'],
  tags: ['트랙', '캔버스'],
  difficulty: 1,
  params: [
    { key: 'radius', label: '반지름', type: 'range', min: 40, max: 200, step: 1, default: 100, unit: 'px', hint: '원의 크기' },
    { key: 'color', label: '색', type: 'color', default: '#7ee081' },
    { key: 'pop', label: '튀는 정도', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '이벤트가 0 에서 1 로 올렸다 내린다' },
  ],
  presets: [
    { id: 'small', name: '작게', values: { radius: 60 } },
    { id: 'warm', name: '따뜻한 색', values: { color: '#ffb547' } },
  ],
  events: [{ id: 'pop', label: '튀기', tracks: [{ key: 'pop', frames: [[0, 0], [0.1, 1], [0.5, 0]], ease: 'outQuad' }] }],
  demo: { loops: [{ key: 'radius', frames: [[0, 80], [1, 140], [2, 80]], ease: 'inOutSine' }], fire: [{ event: 'pop', every: 3 }] },
  steps: [
    { n: 1, label: '테두리', body: '원의 테두리만 그린다.' },
    { n: 2, label: '채우기와 중심', body: '테두리 안을 색으로 채우고 중심점을 찍는다. 최종은 중심점을 뺀다.' },
  ],
  offNote: '원 대신 회색 사각형이 그려진다. 예제용 나쁜 예다.',
  mistakes: [
    { title: '원이 안 보인다', body: '반지름이 0 이면 보이지 않는다.' },
    { title: '색이 안 바뀐다', body: '색 값을 다시 읽지 않으면 바뀌지 않는다.' },
    { title: '튀기가 끝나지 않는다', body: '트랙 마지막 값이 0 이 아니면 그대로 남는다.' },
  ],
  unity: {
    setup: ['`PulseCircle.cs` 를 빈 오브젝트에 붙인다.', 'Inspector 에서 반지름을 바꿔 본다.'],
    verify: '반지름을 바꾸면 원의 크기가 바뀐다.',
    pitfalls: ['예제라 실제 렌더링은 하지 않는다.', 'Gizmos 는 Scene 뷰에서만 보인다.'],
  },
  prompt: { goal: '반지름과 색을 조절할 수 있는 원을 그린다.', adaptIdeas: ['원 대신 별을 그리고 싶다.', '튀기 연출을 소리와 함께 하고 싶다.'] },
  inspiredBy: [],
  original: '예제용으로 새로 썼다.',
  references: [{ label: 'Unity 문서: Gizmos', url: 'https://docs.unity3d.com/ScriptReference/Gizmos.html' }],
}

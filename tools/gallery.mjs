#!/usr/bin/env node
// 교안 갤러리 도구. 갤러리 리포 루트에서 부른다 (갤러리의 tools/gallery.mjs 가 이 파일을 부른다).
//
//   gallery check [id...] [--links] [--no-build]   규격, 격리 빌드, 무대 동작, (전체면) 용량·오프라인·Skill·타입
//   gallery live <id|home> [--query=..] [동작...]   실제 시간 캡처와 연속 촬영(burst)
//   gallery thumbs [id...]                          웹 무대 썸네일과 captures 를 촬영 이미지로
//   gallery skill                                   Skill 폴더와 zip 을 만든다
//   gallery size [id...]                            표본별 용량 증분
//   gallery unity-compile [id|폴더...]              Unity 내장 Roslyn 으로 C# 컴파일 확인
//
// 설정은 갤러리 package.json 의 "gallery" 필드 (tools/lib/project.mjs 머리말).

const [command, ...args] = process.argv.slice(2)
const COMMANDS = ['check', 'live', 'thumbs', 'skill', 'size', 'unity-compile']
if (!COMMANDS.includes(command)) {
  console.log(`사용법: gallery <${COMMANDS.join(' | ')}> ...`)
  process.exit(2)
}
const mod = await import(new URL(`./cmd/${command}.mjs`, import.meta.url))
await mod.default(args)

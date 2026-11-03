// gallery unity-compile: Unity 에디터 없이 Unity 내장 Roslyn 으로 C# 를 컴파일해 본다.
//   gallery unity-compile                 모든 표본의 Unity 코드 (package.json gallery.unityFolders, 예 "unity/{id}")
//   gallery unity-compile <id|폴더> ...    지정한 표본 또는 폴더
// 참조·정의·분석기는 그 버전으로 한 번 열어 둔 Unity 프로젝트의 Assembly-CSharp.csproj 에서 빌린다.
// C# 9, 미사용 필드 경고(0169, 0649)는 끈다 (인스펙터에서 채우는 필드라서). .NET 에만 있는 API 와 C# 10 이상 문법을 여기서 잡는다.
// 환경변수: GALLERY_UNITY_PROJECT (기본 C:\Users\user\UIGallery-compile), GALLERY_UNITY_EDITOR (기본 6000.3.20f1 에디터)
// 한계: 컴파일만 본다. UXML·USS 임포트와 장면 동작은 에디터로 확인한다.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { project, specimenIds } from '../lib/project.mjs'

const PROJECT = process.env.GALLERY_UNITY_PROJECT ?? 'C:\\Users\\user\\UIGallery-compile'
const EDITOR = process.env.GALLERY_UNITY_EDITOR ?? 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.3.20f1\\Editor'

const walk = dir =>
  readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : name.endsWith('.cs') ? [p] : []
  })

export default async function unityCompile(args) {
  const p = project()
  const folderOf = id => (p.unityFolders ? join(p.root, p.unityFolders.replaceAll('{id}', id)) : null)
  const targets = (args.length ? args : specimenIds(p)).map(a => (existsSync(join(p.root, a)) ? join(p.root, a) : folderOf(a))).filter(Boolean)
  const folders = targets.filter(f => existsSync(f))
  if (!folders.length) {
    console.log('컴파일할 폴더가 없다 (package.json gallery.unityFolders 를 확인)')
    process.exitCode = 1
    return
  }
  const csprojPath = join(PROJECT, 'Assembly-CSharp.csproj')
  if (!existsSync(csprojPath)) {
    console.log(`Unity 프로젝트를 한 번 열어 csproj 를 만들어야 한다: ${csprojPath}`)
    process.exitCode = 1
    return
  }
  const csproj = readFileSync(csprojPath, 'utf8')
  const abs = q => (isAbsolute(q) ? q : join(PROJECT, q))
  const refs = [...csproj.matchAll(/<HintPath>([^<]+)<\/HintPath>/g)].map(m => abs(m[1])).filter(q => !/Assembly-CSharp(-Editor)?\.dll$/.test(q))
  const analyzers = [...csproj.matchAll(/<Analyzer Include="([^"]+)"/g)].map(m => abs(m[1]))
  const defines = [...csproj.matchAll(/<DefineConstants>([^<]*)<\/DefineConstants>/g)].map(m => m[1]).join(';')
  const files = folders.flatMap(walk)
  const out = join(tmpdir(), 'gallery-unity-compile')
  mkdirSync(out, { recursive: true })
  const q = s => `"${s}"`
  const rsp = [
    '-target:library',
    '-nologo',
    '-preferreduilang:en',
    '-langversion:9.0',
    '-nostdlib+',
    '-unsafe-',
    `-out:${q(join(out, 'Check.dll'))}`,
    `-define:${defines}`,
    '-warn:4',
    '-nowarn:0169,0649',
    ...refs.map(r => `-r:${q(r)}`),
    ...analyzers.map(a => `-analyzer:${q(a)}`),
    ...files.map(q),
  ]
  writeFileSync(join(out, 'check.rsp'), rsp.join('\n'))
  console.log(`C# ${files.length}개 컴파일 (참조 ${refs.length}, 분석기 ${analyzers.length})`)
  const data = join(EDITOR, 'Data')
  const r = spawnSync(join(data, 'NetCoreRuntime', 'dotnet.exe'), [join(data, 'DotNetSdkRoslyn', 'csc.dll'), `@${join(out, 'check.rsp')}`], { encoding: 'utf8' })
  const lines = `${r.stdout}${r.stderr}`
    .split(/\r?\n/)
    .filter(l => l && !/CS2023|USG0001/.test(l))
    .map(l => l.replaceAll(`${p.root}\\`, ''))
  if (lines.length) console.log(lines.join('\n'))
  console.log(r.status === 0 ? '통과' : `실패 (exit ${r.status})`)
  process.exitCode = r.status === 0 ? 0 : 1
}

// 갤러리 리포의 자리와 설정. 설정은 갤러리 package.json 의 "gallery" 필드에 둔다 (모두 선택).
//   web          Vite 앱 폴더 (기본 ".", 셰이더 갤러리는 "web")
//   specimens    표본 meta 폴더들의 부모 (web 기준, 기본 "src/specimens")
//   shots        촬영 이미지 폴더 (web 기준, 기본 "src/shots")
//   skill        Skill 출력 폴더 (리포 기준, 기본 "skill". false 면 Skill 을 만들지 않는다)
//   budget       { raw, gzip } 바이트 (기본 5MB, 1.5MB)
//   perSpecimenGzip  표본 하나의 gzip 증분 기준 (기본 45KB)
//   thumbTime    썸네일을 찍을 무대 시간 (초, 기본 1)
//   thumbQuery   썸네일 링크 옵션 (기본 "auto=0". 입력이 있어야 보이는 갤러리는 "auto=1" 로 자동 데모를 그 시간까지 돌린다)
//   checkQuery   무대 검사 링크 옵션 (기본 "auto=0")
//   unityFolders 표본의 Unity 코드 폴더 (리포 기준, {id} 자리, 예 "unity/{id}")
//   domainCheck  도메인 검사 모듈 (리포 기준, 예 "tools/check-domain.mjs")

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

export function project(root = process.cwd()) {
  root = resolve(root)
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const g = pkg.gallery ?? {}
  const web = join(root, g.web ?? '.')
  return {
    root,
    pkg,
    web,
    webPkg: g.web && g.web !== '.' ? JSON.parse(readFileSync(join(web, 'package.json'), 'utf8')) : pkg,
    srcDir: join(web, 'src'),
    specimensDir: join(web, g.specimens ?? 'src/specimens'),
    shotsDir: join(web, g.shots ?? 'src/shots'),
    dist: join(web, 'dist', 'index.html'),
    skillDir: g.skill === false ? null : join(root, g.skill ?? 'skill'),
    budget: { raw: g.budget?.raw ?? 5 * 1024 * 1024, gzip: g.budget?.gzip ?? 1.5 * 1024 * 1024 },
    perSpecimenGzip: g.perSpecimenGzip ?? 45 * 1024,
    thumbTime: g.thumbTime ?? 1,
    thumbQuery: g.thumbQuery ?? 'auto=0',
    checkQuery: g.checkQuery ?? 'auto=0',
    unityFolders: g.unityFolders ?? null,
    domainCheck: g.domainCheck ? join(root, g.domainCheck) : null,
    out: join(root, '_shots'),
  }
}

/** 표본 id 목록 (meta.ts 가 있는 폴더) */
export function specimenIds(p) {
  if (!existsSync(p.specimensDir)) return []
  return readdirSync(p.specimensDir)
    .filter(d => existsSync(join(p.specimensDir, d, 'meta.ts')))
    .sort()
}

/** web 폴더의 node_modules 에서 패키지 bin 경로를 찾는다 */
export function binOf(p, pkgName, binName = pkgName) {
  const req = createRequire(join(p.web, 'package.json'))
  const pkgPath = req.resolve(`${pkgName}/package.json`)
  const meta = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const bin = typeof meta.bin === 'string' ? meta.bin : meta.bin[binName]
  return join(dirname(pkgPath), bin)
}

/** vite build. only 가 있으면 그 표본만 넣는다 ('__none__' 이면 셸만). 결과 index.html 경로, 실패하면 throw */
export function viteBuild(p, { only, outDir } = {}) {
  const out = outDir ?? (only ? join(p.out, `build-${only}`) : join(p.web, 'dist'))
  const r = spawnSync(process.execPath, [binOf(p, 'vite'), 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], {
    cwd: p.web,
    env: { ...process.env, ...(only ? { GALLERY_ONLY: only } : {}) },
    encoding: 'utf8',
  })
  if (r.status !== 0) throw new Error(`빌드 실패${only ? ` (${only})` : ''}\n${(r.stdout + r.stderr).slice(-3000)}`)
  return join(out, 'index.html')
}

/** tsc --noEmit. 오류 글을 돌려준다 (없으면 '') */
export function typecheck(p) {
  const r = spawnSync(process.execPath, [binOf(p, 'typescript', 'tsc'), '--noEmit'], { cwd: p.web, encoding: 'utf8' })
  return r.status === 0 ? '' : (r.stdout + r.stderr).trim()
}

/** 결과 출력 모음 */
export function reporter() {
  const errors = []
  const warnings = []
  return {
    errors,
    warnings,
    err: m => errors.push(m),
    warn: m => warnings.push(m),
    done(okText = '통과') {
      for (const w of warnings) console.log(`경고: ${w}`)
      for (const e of errors) console.log(`오류: ${e}`)
      console.log(errors.length ? `실패: 오류 ${errors.length}개, 경고 ${warnings.length}개` : `${okText} (경고 ${warnings.length}개)`)
      process.exitCode = errors.length ? 1 : 0
    },
  }
}

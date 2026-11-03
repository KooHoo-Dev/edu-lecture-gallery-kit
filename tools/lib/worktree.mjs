// dispatch 잡처럼 git worktree 에서 도구를 돌릴 때 쓰는 공용 도구.
// worktree 에는 무시 파일(node_modules)이 없으므로 메인 작업 폴더의 것을 정션으로 잇는다.
// 메인 작업 폴더에서는 아무 일도 하지 않는다. 갤러리의 tools/gallery.mjs 에도 같은 코드가 있다 (kit 을 찾기 전에 필요해서).

import { spawnSync } from 'node:child_process'
import { existsSync, symlinkSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const same = (a, b) => resolve(a).toLowerCase() === resolve(b).toLowerCase()

/** git 메인 작업 폴더. git 이 없거나 리포 밖이면 root 를 그대로 돌려준다 */
export function mainRoot(root) {
  const r = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, encoding: 'utf8' })
  if (r.status !== 0) return root
  return dirname(resolve(r.stdout.trim()))
}

/** web 폴더의 node_modules 가 없으면 메인 작업 폴더의 같은 자리를 정션으로 연결한다 */
export function ensureModules(root, web = root) {
  const target = join(web, 'node_modules')
  if (existsSync(target)) return
  const main = mainRoot(root)
  const source = join(main, relative(root, web), 'node_modules')
  if (same(main, root) || !existsSync(source)) return
  symlinkSync(source, target, 'junction')
}

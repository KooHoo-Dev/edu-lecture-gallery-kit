import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GalleryContext, type GalleryConfig } from './config'
import type { BaseSpecimen } from './contract'
import { setStorageNamespace } from './runtime/storage'
import { App } from './shell/App'
import { installTestApi } from './testApi'
import './styles/index.css'

/** 갤러리 시작점. 갤러리의 main.tsx 가 설정을 넘겨 부른다 */
export function mountGallery<S extends BaseSpecimen>(config: GalleryConfig<S>, root: HTMLElement = document.getElementById('root')!) {
  setStorageNamespace(config.storageKey)
  installTestApi(config)
  createRoot(root).render(
    <StrictMode>
      <GalleryContext.Provider value={config as unknown as GalleryConfig}>
        <App />
      </GalleryContext.Provider>
    </StrictMode>,
  )
}

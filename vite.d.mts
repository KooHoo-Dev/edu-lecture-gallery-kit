import type { UserConfig } from 'vite'

/** 갤러리 공통 Vite 설정 (단일 HTML, 격리 빌드 GALLERY_ONLY, 버전·날짜 상수) */
export declare function galleryVite(options?: { root?: string; registry?: RegExp }): UserConfig

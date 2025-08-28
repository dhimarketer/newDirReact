/// <reference types="vite/client" />

// 2025-01-28: Code review implementation - TypeScript declarations for Vite environment variables

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_API_RETRY_ATTEMPTS: string
  readonly VITE_API_RETRY_DELAY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_APP_AUTHOR: string
  readonly VITE_APP_SUPPORT_EMAIL: string
  readonly VITE_DEV_SERVER_PORT: string
  readonly VITE_DEV_SERVER_OPEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

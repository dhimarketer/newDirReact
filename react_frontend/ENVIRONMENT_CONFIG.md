# Environment Configuration

## Overview

This document describes the environment configuration approach implemented to address code review feedback regarding API URL configuration and environment variable management.

## Code Review Issues Addressed

### 1. API URL Configuration Problems
- **Issue**: Hardcoded URLs and "double /api/api/" issues
- **Previous Solution**: Using `window.location.hostname` to switch BASE_URL
- **New Solution**: Vite environment variables (`import.meta.env.VITE_API_URL`)

### 2. Environment Variable Management
- **Issue**: Developer struggled with `import.meta.env` usage
- **Solution**: Proper TypeScript declarations and environment file templates

## Environment Files

### Development (`.env.development`)
```bash
VITE_API_URL=/api
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3
VITE_API_RETRY_DELAY=1000
VITE_APP_NAME=dirFinal
VITE_APP_VERSION=2.0.0
# ... other development-specific variables
```

### Production (`.env.production`)
```bash
VITE_API_URL=/api
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3
VITE_API_RETRY_DELAY=1000
VITE_APP_NAME=dirFinal
VITE_APP_VERSION=2.0.0
# ... other production-specific variables
```

### Local Override (`.env.local`)
- **Purpose**: Developer-specific overrides
- **Status**: Ignored by git (see .gitignore)
- **Usage**: Copy from `.env.development` and modify as needed

## Implementation Details

### Constants File (`src/utils/constants.ts`)
```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000'),
} as const;
```

### Vite Configuration (`vite.config.js`)
```javascript
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    server: {
      port: parseInt(env.VITE_DEV_SERVER_PORT) || 3000,
      proxy: {
        [env.VITE_API_URL || '/api']: {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(new RegExp(`^${env.VITE_API_URL || '/api'}`), '/api'),
        },
      },
    },
  }
})
```

### TypeScript Declarations (`src/vite-env.d.ts`)
```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_TIMEOUT: string
  // ... other environment variables
}
```

## Benefits of New Approach

1. **Environment-Specific Configuration**: Different settings for development, staging, and production
2. **Type Safety**: Full TypeScript support for environment variables
3. **No Runtime Logic**: Configuration is resolved at build time
4. **Standard Practice**: Follows Vite and React best practices
5. **Maintainable**: Centralized configuration management
6. **Secure**: Environment files can be excluded from version control

## Migration Guide

### For Developers
1. Copy `.env.development` to `.env.local`
2. Modify `.env.local` as needed for your local setup
3. Use `import.meta.env.VITE_*` variables in your code

### For Deployment
1. Set appropriate environment variables in your deployment environment
2. Ensure `.env.production` contains production values
3. Build with `npm run build` (production mode)

## Troubleshooting

### Common Issues
1. **Environment variables not loading**: Ensure file names match exactly (`.env.development`, `.env.production`)
2. **TypeScript errors**: Check that `src/vite-env.d.ts` is properly configured
3. **Build issues**: Verify environment variables are set in deployment environment

### Debug Information
The constants file logs environment configuration on load:
```javascript
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
```

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files.html)

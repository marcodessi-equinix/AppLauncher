import fs from "fs"
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const resolvePackageVersion = (): string => {
  const candidatePaths = [
    path.resolve(__dirname, '../package.json'),
    path.resolve(__dirname, './package.json'),
  ]

  for (const packageJsonPath of candidatePaths) {
    if (!fs.existsSync(packageJsonPath)) {
      continue
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version?: string }
      if (packageJson.version) {
        return packageJson.version
      }
    } catch {
      continue
    }
  }

  return '0.1.0'
}

const resolvedAppVersion = process.env.VITE_APP_VERSION || `v${resolvePackageVersion()}`
const resolvedBuildDate = new Date().toISOString().slice(0, 10)

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(resolvedAppVersion),
    __BUILD_DATE__: JSON.stringify(resolvedBuildDate),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5001,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: "0.0.0.0",
    port: 5001,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      maxParallelFileOps: 20,
      output: {
      }
    }
  }
})

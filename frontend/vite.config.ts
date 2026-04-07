import fs from "fs"
import path from "path"
import { execFileSync } from "child_process"
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

const normalizeBuildNumber = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    return '001'
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed.padStart(3, '0')
  }

  return trimmed
}

const createDisplayBuildVersion = (releaseVersion: string, buildNumber: string): string => {
  const normalizedReleaseVersion = releaseVersion.replace(/^v/i, '')
  const versionParts = normalizedReleaseVersion.split('.')

  if (versionParts.length >= 3 && versionParts[2] === '0') {
    return `${versionParts[0]}.${versionParts[1]}.${buildNumber}`
  }

  return `${normalizedReleaseVersion}.${buildNumber}`
}

const runGit = (args: string[], cwd: string): string =>
  execFileSync('git', args, {
    cwd,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString().trim()

const resolveGitBuildNumber = (releaseVersion: string): string | null => {
  try {
    const repoRoot = path.resolve(__dirname, '..')
    const gitDir = path.join(repoRoot, '.git')
    if (!fs.existsSync(gitDir)) {
      return null
    }

    const normalizedReleaseVersion = releaseVersion.replace(/^v/i, '')
    const anchorCandidates = runGit([
      'log',
      '--reverse',
      '--format=%H',
      '-S',
      `"version": "${normalizedReleaseVersion}"`,
      '--',
      'package.json',
    ], repoRoot)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (anchorCandidates.length > 0) {
      const anchorCommit = anchorCandidates[0]
      const commitsSinceAnchor = runGit(['rev-list', '--count', `${anchorCommit}..HEAD`], repoRoot)
      const sequence = Number.parseInt(commitsSinceAnchor || '0', 10) + 1
      return normalizeBuildNumber(String(sequence))
    }

    const count = runGit(['rev-list', '--count', 'HEAD'], repoRoot)

    return count ? normalizeBuildNumber(count) : null
  } catch {
    return null
  }
}

const resolveBuildNumber = (releaseVersion: string): string => {
  const explicitBuildNumber = process.env.VITE_BUILD_NUMBER || process.env.BUILD_NUMBER
  if (explicitBuildNumber) {
    return normalizeBuildNumber(explicitBuildNumber)
  }

  return resolveGitBuildNumber(releaseVersion) || '001'
}

const resolvedAppVersion = process.env.VITE_APP_VERSION || `v${resolvePackageVersion()}`
const resolvedBuildNumber = resolveBuildNumber(resolvedAppVersion)
const resolvedBuildVersion = createDisplayBuildVersion(resolvedAppVersion, resolvedBuildNumber)
const resolvedBuildDate = new Date().toISOString().slice(0, 10)

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(resolvedAppVersion),
    __APP_BUILD_VERSION__: JSON.stringify(resolvedBuildVersion),
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
    strictPort: true,
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
    strictPort: true,
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

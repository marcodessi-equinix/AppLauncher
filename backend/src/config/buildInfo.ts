import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { runtimeConfig } from './runtime';

export interface BuildInfo {
  releaseVersion: string;
  gitSha: string;
  buildDate: string;
  buildTime: string;
  buildNumber: string;
}

export interface PublicVersionInfo {
  version: string;
  buildDate: string;
  gitSha: string;
}

const UNKNOWN_VALUE = 'unknown';

const repoRoot = path.resolve(runtimeConfig.backendRoot, '..');
const rootPackageJsonPath = path.join(repoRoot, 'package.json');
const backendPackageJsonPath = path.join(runtimeConfig.backendRoot, 'package.json');

const readPackageVersion = (filePath: string): string | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { version?: string };
    return typeof packageJson.version === 'string' && packageJson.version.trim()
      ? packageJson.version.trim()
      : null;
  } catch {
    return null;
  }
};

const normalizeReleaseVersion = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return UNKNOWN_VALUE;
  }

  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`;
};

const normalizeValue = (value: string | undefined): string => {
  const trimmed = value?.trim() || '';
  return trimmed || UNKNOWN_VALUE;
};

const runGit = (args: string[]): string => {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch {
    return '';
  }
};

const isProductionRuntime = runtimeConfig.nodeEnv === 'production';

const resolveReleaseVersion = (): string => {
  const envVersion = process.env.BUILD_VERSION;
  if (envVersion?.trim()) {
    return normalizeReleaseVersion(envVersion);
  }

  if (isProductionRuntime) {
    return UNKNOWN_VALUE;
  }

  const rootVersion = readPackageVersion(rootPackageJsonPath);
  if (rootVersion) {
    return normalizeReleaseVersion(rootVersion);
  }

  const backendVersion = readPackageVersion(backendPackageJsonPath);
  if (backendVersion) {
    return normalizeReleaseVersion(backendVersion);
  }

  return 'v0.1.0';
};

const resolveGitSha = (): string => {
  const envSha = process.env.GIT_SHA;
  if (envSha?.trim()) {
    return envSha.trim().slice(0, 12);
  }

  if (isProductionRuntime) {
    return UNKNOWN_VALUE;
  }

  const gitSha = runGit(['rev-parse', '--short=7', 'HEAD']);
  return gitSha || UNKNOWN_VALUE;
};

const resolveBuildNumber = (): string => {
  const explicitBuildNumber = process.env.BUILD_NUMBER
    || process.env.GITHUB_RUN_NUMBER
    || process.env.CI_PIPELINE_IID
    || process.env.CI_PIPELINE_ID;

  if (explicitBuildNumber?.trim()) {
    return explicitBuildNumber.trim();
  }

  if (isProductionRuntime) {
    return UNKNOWN_VALUE;
  }

  return runGit(['rev-list', '--count', 'HEAD']) || UNKNOWN_VALUE;
};

const resolveBuildDate = (): string => {
  if (process.env.BUILD_DATE?.trim()) {
    return process.env.BUILD_DATE.trim();
  }

  if (isProductionRuntime) {
    return UNKNOWN_VALUE;
  }

  return new Date().toISOString().slice(0, 10);
};

const resolveBuildTime = (): string => {
  if (process.env.BUILD_TIME?.trim()) {
    return process.env.BUILD_TIME.trim();
  }

  if (isProductionRuntime) {
    return UNKNOWN_VALUE;
  }

  return new Date().toISOString().slice(11, 19);
};

export const getBuildInfo = (): BuildInfo => {
  return {
    releaseVersion: resolveReleaseVersion(),
    gitSha: resolveGitSha(),
    buildDate: resolveBuildDate(),
    buildTime: resolveBuildTime(),
    buildNumber: resolveBuildNumber(),
  };
};

export const getPublicVersionInfo = (): PublicVersionInfo => {
  const buildInfo = getBuildInfo();

  return {
    version: normalizeReleaseVersion(buildInfo.releaseVersion),
    buildDate: normalizeValue(buildInfo.buildDate),
    gitSha: normalizeValue(buildInfo.gitSha),
  };
};

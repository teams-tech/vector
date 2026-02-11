#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const NEXT_DIR = path.join(PROJECT_ROOT, '.next');
const JS_EXTENSIONS = new Set(['.js', '.mjs']);

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function toKiB(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

function isJavaScriptFile(filePath) {
  return JS_EXTENSIONS.has(path.extname(filePath));
}

function normalizeAssetPath(filePath) {
  const buildManifestMatch = filePath.match(/^static\/[^/]+\/(_(?:build|ssg)Manifest\.js)$/);
  if (buildManifestMatch) {
    return `static/<build-id>/${buildManifestMatch[1]}`;
  }

  return filePath;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function dedupeSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function readBudgetEnv(name) {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative integer.`);
  }

  return parsed;
}

function resolveOutputPath() {
  const envOutput = process.env.PERF_BASELINE_OUTPUT?.trim();
  if (!envOutput) {
    return path.join(PROJECT_ROOT, 'reports', 'perf-baseline.json');
  }

  return path.isAbsolute(envOutput) ? envOutput : path.join(PROJECT_ROOT, envOutput);
}

async function readJsonFile(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Missing required build artifact: ${toPosixPath(path.relative(PROJECT_ROOT, filePath))}`);
  }

  try {
    return JSON.parse(contents);
  } catch {
    throw new Error(`Invalid JSON in build artifact: ${toPosixPath(path.relative(PROJECT_ROOT, filePath))}`);
  }
}

async function walkFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkFiles(fullPath);
      results.push(...nested);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

async function collectClientAssets() {
  const staticDir = path.join(NEXT_DIR, 'static');
  let files;
  try {
    files = await walkFiles(staticDir);
  } catch {
    throw new Error('Missing .next/static directory. Run "npm run build" first.');
  }

  const clientJsAssetMap = new Map();
  for (const filePath of files) {
    if (!isJavaScriptFile(filePath)) {
      continue;
    }

    const stats = await fs.stat(filePath);
    const relativePath = normalizeAssetPath(toPosixPath(path.relative(NEXT_DIR, filePath)));
    const existing = clientJsAssetMap.get(relativePath) ?? 0;
    clientJsAssetMap.set(relativePath, existing + stats.size);
  }

  const clientJsAssets = [...clientJsAssetMap.entries()].map(([file, bytes]) => ({ file, bytes }));
  clientJsAssets.sort((a, b) => a.file.localeCompare(b.file));
  return clientJsAssets;
}

function getUserRoutes(routesManifest) {
  const routes = new Set();

  for (const entry of [...asArray(routesManifest.staticRoutes), ...asArray(routesManifest.dynamicRoutes)]) {
    if (!entry || typeof entry.page !== 'string') {
      continue;
    }

    if (entry.page.startsWith('/api/') || entry.page.startsWith('/_')) {
      continue;
    }

    routes.add(entry.page);
  }

  return [...routes].sort((a, b) => a.localeCompare(b));
}

function evaluateBudget(actual, budget) {
  if (budget === null) {
    return { status: 'not_set' };
  }

  if (actual <= budget) {
    return { status: 'pass', budgetBytes: budget, deltaBytes: budget - actual };
  }

  return { status: 'fail', budgetBytes: budget, deltaBytes: actual - budget };
}

async function main() {
  const buildManifest = await readJsonFile(path.join(NEXT_DIR, 'build-manifest.json'));
  const routesManifest = await readJsonFile(path.join(NEXT_DIR, 'routes-manifest.json'));
  const clientAssets = await collectClientAssets();
  const assetBytes = new Map(clientAssets.map((asset) => [asset.file, asset.bytes]));

  const sharedClientFiles = dedupeSorted(
    [...asArray(buildManifest.rootMainFiles), ...asArray(buildManifest.polyfillFiles)].filter(isJavaScriptFile)
  );

  let userRoutes = getUserRoutes(routesManifest);
  if (userRoutes.length === 0) {
    const fallbackRoutes = Object.keys(buildManifest.pages ?? {}).filter(
      (route) => !route.startsWith('/api/') && !route.startsWith('/_')
    );
    userRoutes = dedupeSorted(fallbackRoutes);
  }

  const routeSummaries = userRoutes.map((route) => {
    const pageFiles = asArray(buildManifest.pages?.[route]).filter(isJavaScriptFile);
    const files = dedupeSorted([...sharedClientFiles, ...pageFiles]);
    const clientJsBytes = files.reduce((sum, file) => sum + (assetBytes.get(file) ?? 0), 0);

    return {
      route,
      clientJsBytes,
      clientJsKiB: toKiB(clientJsBytes),
      files,
    };
  });

  const totalClientJsBytes = clientAssets.reduce((sum, asset) => sum + asset.bytes, 0);
  const sharedClientJsBytes = sharedClientFiles.reduce((sum, file) => sum + (assetBytes.get(file) ?? 0), 0);
  const maxRouteClientJsBytes = routeSummaries.reduce(
    (max, summary) => Math.max(max, summary.clientJsBytes),
    0
  );

  const budgetTotalClientJsBytes = readBudgetEnv('PERF_BUDGET_TOTAL_CLIENT_JS_BYTES');
  const budgetMaxRouteClientJsBytes = readBudgetEnv('PERF_BUDGET_MAX_ROUTE_CLIENT_JS_BYTES');
  const totalBudgetStatus = evaluateBudget(totalClientJsBytes, budgetTotalClientJsBytes);
  const maxRouteBudgetStatus = evaluateBudget(maxRouteClientJsBytes, budgetMaxRouteClientJsBytes);

  const outputPath = resolveOutputPath();
  const relativeOutputPath = toPosixPath(path.relative(PROJECT_ROOT, outputPath));

  const report = {
    schemaVersion: 1,
    generatedBy: 'scripts/perf-baseline.mjs',
    inputArtifacts: {
      buildManifest: '.next/build-manifest.json',
      routesManifest: '.next/routes-manifest.json',
    },
    summary: {
      totalClientJsFiles: clientAssets.length,
      totalClientJsBytes,
      totalClientJsKiB: toKiB(totalClientJsBytes),
      sharedClientJsBytes,
      sharedClientJsKiB: toKiB(sharedClientJsBytes),
      routeCount: routeSummaries.length,
      maxRouteClientJsBytes,
      maxRouteClientJsKiB: toKiB(maxRouteClientJsBytes),
    },
    budgets: {
      totalClientJsBytes: budgetTotalClientJsBytes,
      maxRouteClientJsBytes: budgetMaxRouteClientJsBytes,
    },
    budgetStatus: {
      totalClientJs: totalBudgetStatus,
      maxRouteClientJs: maxRouteBudgetStatus,
    },
    routes: routeSummaries,
    largestClientChunks: [...clientAssets]
      .sort((a, b) => b.bytes - a.bytes || a.file.localeCompare(b.file))
      .slice(0, 25),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`[perf-baseline] Wrote report to ${relativeOutputPath}`);
  console.log(`[perf-baseline] Total client JS: ${totalClientJsBytes} bytes (${toKiB(totalClientJsBytes)} KiB)`);
  console.log(`[perf-baseline] Max route JS: ${maxRouteClientJsBytes} bytes (${toKiB(maxRouteClientJsBytes)} KiB)`);

  const hasBudgetFailure =
    totalBudgetStatus.status === 'fail' || maxRouteBudgetStatus.status === 'fail';
  if (hasBudgetFailure) {
    console.error('[perf-baseline] Budget check failed.');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`[perf-baseline] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

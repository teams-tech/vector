#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const TARGET_DIRECTORIES = ['src'];
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx']);

const FLOOR_PLAN_WITH_LENDER_PATTERN = /\bfloor plans?\b.*\blenders?\b/i;
const AFC_NEXTGEAR_WITH_LENDER_PATTERN = /\b(?:afc|nextgear)\b.*\blenders?\b/i;
const LENDER_PATTERN = /\blenders?\b/i;
const LENDER_FINANCE_CONTEXT_PATTERN =
  /\b(f&i|f&amp;i|finance|consumer finance|consumer|contract|warranty|deal structuring|loan|credit)\b/i;

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

async function walkFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name.startsWith('.')) {
        continue;
      }
      files.push(...(await walkFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && ALLOWED_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkLineRules(relativePath, lineText, lineNumber) {
  const findings = [];
  const normalizedLine = lineText.trim();
  if (normalizedLine.length === 0) {
    return findings;
  }

  if (FLOOR_PLAN_WITH_LENDER_PATTERN.test(normalizedLine)) {
    findings.push({
      ruleId: 'DG001',
      message: 'Floor-plan context must use FPC/floor plan company terminology, not lender.',
      file: relativePath,
      line: lineNumber,
      content: normalizedLine,
    });
  }

  if (AFC_NEXTGEAR_WITH_LENDER_PATTERN.test(normalizedLine)) {
    findings.push({
      ruleId: 'DG002',
      message: 'AFC/NextGear references in floor-plan context must not use lender wording.',
      file: relativePath,
      line: lineNumber,
      content: normalizedLine,
    });
  }

  if (LENDER_PATTERN.test(normalizedLine) && !LENDER_FINANCE_CONTEXT_PATTERN.test(normalizedLine)) {
    findings.push({
      ruleId: 'DG003',
      message: 'Lender wording must be clearly tied to consumer finance/F&I context.',
      file: relativePath,
      line: lineNumber,
      content: normalizedLine,
    });
  }

  return findings;
}

async function run() {
  const allFiles = [];
  for (const relativeDir of TARGET_DIRECTORIES) {
    const fullDir = path.join(PROJECT_ROOT, relativeDir);
    try {
      const stats = await fs.stat(fullDir);
      if (!stats.isDirectory()) {
        continue;
      }
      allFiles.push(...(await walkFiles(fullDir)));
    } catch {
      // Skip missing target directories.
    }
  }

  const findings = [];
  for (const filePath of allFiles) {
    const relativePath = toPosixPath(path.relative(PROJECT_ROOT, filePath));
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      findings.push(...checkLineRules(relativePath, line, index + 1));
    });
  }

  if (findings.length > 0) {
    console.error('[domain:check] Domain glossary violations found:');
    for (const finding of findings) {
      console.error(
        `${finding.file}:${finding.line} [${finding.ruleId}] ${finding.message}\n  -> ${finding.content}`
      );
    }
    process.exit(1);
  }

  console.log(`[domain:check] Passed. Checked ${allFiles.length} files.`);
}

run().catch((error) => {
  console.error(`[domain:check] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

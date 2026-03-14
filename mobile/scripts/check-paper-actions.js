const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const FILE_PATTERN = /\.(js|jsx|ts|tsx)$/;
const ACTION_BLOCK_RE = /<(Card|Dialog)\.Actions\b[^>]*>([\s\S]*?)<\/\1\.Actions>/g;

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (FILE_PATTERN.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split('\n').length;
}

function findProblems(source, filePath) {
  const findings = [];
  for (const match of source.matchAll(ACTION_BLOCK_RE)) {
    const actionType = match[1];
    const body = match[2];
    const line = lineNumberForIndex(source, match.index || 0);
    if (/<>\s*|<\/>/.test(body)) {
      findings.push(`${filePath}:${line} ${actionType}.Actions should not wrap children in a React Fragment.`);
    }
    if (/<Text\b/.test(body)) {
      findings.push(`${filePath}:${line} ${actionType}.Actions should not render Text directly; keep actions as Button components.`);
    }
  }
  return findings;
}

const problems = collectFiles(SRC_DIR)
  .flatMap((filePath) => findProblems(fs.readFileSync(filePath, 'utf8'), filePath));

if (problems.length > 0) {
  console.error('react-native-paper actions guard failed:\n');
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log('react-native-paper actions guard passed.');

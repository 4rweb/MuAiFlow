const fs = require('fs');
const path = require('path');

const USER_FILE_PATHS = new Set([
  'plans/.gitkeep',
  'prompts/.gitkeep'
]);

const PLAN_GITIGNORE = `# Per-task context is user workspace data.
context.md

# Legacy top-level generated plans are user workspace data.
????-??-??-*.md

# Local plans are private scratch files by default.
local/*
!local/
!local/.gitignore
`;

function normalizePath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function isPlanMarkdown(fileName) {
  return /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(fileName);
}

function isUserOwnedWorkflowFile(relativePath) {
  const normalized = normalizePath(relativePath);

  if (normalized === 'plans/context.md' || USER_FILE_PATHS.has(normalized)) {
    return true;
  }

  if (normalized.startsWith('plans/tracked/')) {
    return normalized !== 'plans/tracked/.gitkeep';
  }

  if (normalized.startsWith('plans/local/')) {
    return normalized !== 'plans/local/.gitignore';
  }

  if (normalized.startsWith('plans/')) {
    return isPlanMarkdown(path.basename(normalized));
  }

  return false;
}

function shouldCopyManagedFile(relativePath) {
  const normalized = normalizePath(relativePath);
  return !isUserOwnedWorkflowFile(normalized) || normalized.endsWith('/.gitkeep');
}

function copyManagedDir(srcDir, destDir, relativeBase = '') {
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    const relativePath = relativeBase ? relativeBase + '/' + entry.name : entry.name;

    if (entry.isDirectory()) {
      copyManagedDir(srcPath, destPath, relativePath);
      continue;
    }

    if (!shouldCopyManagedFile(relativePath)) {
      continue;
    }

    if (fs.existsSync(destPath) && isUserOwnedWorkflowFile(relativePath)) {
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
  }
}

function ensureContextFile(aiDir) {
  const plansDir = path.join(aiDir, 'plans');
  const contextPath = path.join(plansDir, 'context.md');
  const templatePath = path.join(plansDir, 'CONTEXT_TEMPLATE.md');

  if (!fs.existsSync(contextPath) && fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, contextPath);
  }
}

function ensurePlanGitignore(aiDir) {
  const plansDir = path.join(aiDir, 'plans');
  fs.mkdirSync(plansDir, { recursive: true });
  fs.writeFileSync(path.join(plansDir, '.gitignore'), PLAN_GITIGNORE);
}

module.exports = {
  copyManagedDir,
  ensureContextFile,
  ensurePlanGitignore,
  isUserOwnedWorkflowFile
};

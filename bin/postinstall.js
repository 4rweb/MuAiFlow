#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.env.INIT_CWD || process.cwd();
const src = path.resolve(__dirname, '..', '.ai');
const dest = path.resolve(projectRoot, '.ai');

if (!fs.existsSync(src)) {
  return;
}

const userFiles = [
  'plans/context.md',
  'plans/.gitkeep',
  'prompts/.gitkeep'
];

function isUserPlan(relativePath) {
  return relativePath.startsWith('plans/') &&
    relativePath !== 'plans/TEMPLATE.md' &&
    relativePath !== 'plans/context.md' &&
    relativePath !== 'plans/.gitkeep';
}

function isUserFile(relativePath) {
  return userFiles.includes(relativePath) || isUserPlan(relativePath);
}

function copyDir(srcDir, destDir, relativeBase) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    const relativePath = relativeBase ? relativeBase + '/' + entry.name : entry.name;

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, relativePath);
    } else {
      if (fs.existsSync(destPath) && isUserFile(relativePath)) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const isUpdate = fs.existsSync(dest);
  copyDir(src, dest, '');
  if (isUpdate) {
    console.log('\n  muaiflow: .ai/ updated with latest templates.');
    console.log('  Your plans and context.md were preserved.\n');
  } else {
    console.log('\n  muaiflow: .ai/ created at ' + dest);
    console.log('  Next: npx muaiflow examples');
    console.log('  Docs: .ai/SETUP.md\n');
  }
} catch (err) {
  console.log('\n  muaiflow: auto-setup failed. Run manually:');
  console.log('  npx muaiflow init');
  console.log('  Error: ' + err.message + '\n');
}

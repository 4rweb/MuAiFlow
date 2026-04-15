#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { copyManagedDir, ensureContextFile, ensurePlanGitignore } = require('./lib/workflow-files');

const projectRoot = process.env.INIT_CWD || process.cwd();
const src = path.resolve(__dirname, '..', '.ai');
const dest = path.resolve(projectRoot, '.ai');

if (!fs.existsSync(src)) {
  return;
}

try {
  const isUpdate = fs.existsSync(dest);
  copyManagedDir(src, dest);
  ensurePlanGitignore(dest);
  ensureContextFile(dest);
  if (isUpdate) {
    console.log('\n  muaiflow: .ai/ updated with latest templates.');
    console.log('  Your tracked plans, local plans, and context.md were preserved.\n');
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

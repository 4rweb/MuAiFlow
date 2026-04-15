#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', '.ai');
const dest = path.resolve(process.env.INIT_CWD || process.cwd(), '.ai');

if (fs.existsSync(dest)) {
  console.log('\n  muaiflow: .ai/ already exists — skipping copy (your files are safe).');
  console.log('  To get the latest templates, run: npx muaiflow init --force\n');
  return;
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyDir(src, dest);
  console.log('\n  muaiflow: .ai/ directory created in your project.');
  console.log('  Next: copy an example config →  cp node_modules/muaiflow/examples/AGENTS.md.example AGENTS.md');
  console.log('  Docs: .ai/SETUP.md\n');
} catch (err) {
  console.error('  muaiflow postinstall: failed to copy .ai/ —', err.message);
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
  muaiflow — Multi-AI Workflow Framework

  Usage:
    npx muaiflow init [--force]   Copy .ai/ directory into your project
    npx muaiflow examples         Copy example AGENTS.md and CLAUDE.md
    npx muaiflow version          Show installed version
    npx muaiflow help             Show this help

  More info: https://github.com/4rweb/MuAiFlow
`);
}

function getVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'));
  return pkg.version;
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

function init(force) {
  const src = path.resolve(__dirname, '..', '.ai');
  const dest = path.resolve(process.cwd(), '.ai');

  if (fs.existsSync(dest) && !force) {
    console.log('\n  .ai/ already exists. Use --force to overwrite.\n');
    return;
  }

  if (force && fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }

  copyDir(src, dest);
  console.log('\n  .ai/ directory created in your project.');
  console.log('  Next: run `npx muaiflow examples` to copy AGENTS.md / CLAUDE.md templates.');
  console.log('  Docs: .ai/SETUP.md\n');
}

function examples() {
  const examplesDir = path.resolve(__dirname, '..', 'examples');
  const cwd = process.cwd();

  const files = ['AGENTS.md.example', 'CLAUDE.md.example'];
  for (const file of files) {
    const src = path.join(examplesDir, file);
    const dest = path.join(cwd, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  Copied ${file}`);
    }
  }
  console.log('\n  Rename to AGENTS.md or CLAUDE.md and customize for your project.\n');
}

switch (command) {
  case 'init':
    init(args.includes('--force'));
    break;
  case 'examples':
    examples();
    break;
  case 'version':
  case '-v':
  case '--version':
    console.log(getVersion());
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp();
    break;
  default:
    console.error(`  Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}

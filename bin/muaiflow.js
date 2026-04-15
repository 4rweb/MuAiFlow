#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { copyManagedDir, ensureContextFile, ensurePlanGitignore } = require('./lib/workflow-files');

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
  muaiflow — Multi-AI Workflow Framework

  Usage:
    npx muaiflow init [--force]             Copy/update .ai/ without deleting plans or context
    npx muaiflow plan <title> [--tracked]   Create a tracked plan in .ai/plans/tracked/
    npx muaiflow plan <title> --local       Create a local ignored plan in .ai/plans/local/
    npx muaiflow context                    Create .ai/plans/context.md from CONTEXT_TEMPLATE.md if missing
    npx muaiflow context --reset            Reset context.md from CONTEXT_TEMPLATE.md
    npx muaiflow context --clear            Empty context.md
    npx muaiflow examples                   Copy example AGENTS.md and CLAUDE.md
    npx muaiflow version                    Show installed version
    npx muaiflow help                       Show this help

  More info: https://github.com/4rweb/MuAiFlow
`);
}

function getVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'));
  return pkg.version;
}

function init(force) {
  const src = path.resolve(__dirname, '..', '.ai');
  const dest = path.resolve(process.cwd(), '.ai');
  const isUpdate = fs.existsSync(dest);

  if (isUpdate && !force) {
    console.log('\n  .ai/ already exists. Use --force to overwrite.\n');
    return;
  }

  copyManagedDir(src, dest);
  ensurePlanGitignore(dest);
  ensureContextFile(dest);

  if (isUpdate) {
    console.log('\n  .ai/ directory updated in your project.');
  } else {
    console.log('\n  .ai/ directory created in your project.');
  }
  console.log('  Existing plans and context.md are preserved.');
  console.log('  Next: run `npx muaiflow examples` to copy AGENTS.md / CLAUDE.md templates.');
  console.log('  Docs: .ai/SETUP.md\n');
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatLocalDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function slugifyTitle(title) {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'plan';
}

function requireAiTemplate(templatePath) {
  if (!fs.existsSync(templatePath)) {
    console.error('\n  Missing template: ' + templatePath);
    console.error('  Run `npx muaiflow init` first.\n');
    process.exit(1);
  }
}

function createPlan(commandArgs) {
  const local = commandArgs.includes('--local');
  const tracked = commandArgs.includes('--tracked');
  const force = commandArgs.includes('--force');
  const title = commandArgs.filter((arg) => !arg.startsWith('--')).join(' ').trim();

  if (local && tracked) {
    console.error('\n  Choose either --tracked or --local, not both.\n');
    process.exit(1);
  }

  if (!title) {
    console.error('\n  Usage: npx muaiflow plan <title> [--tracked|--local] [--force]\n');
    process.exit(1);
  }

  const aiDir = path.resolve(process.cwd(), '.ai');
  const templatePath = path.join(aiDir, 'plans', 'TEMPLATE.md');
  requireAiTemplate(templatePath);

  const planDir = path.join(aiDir, 'plans', local ? 'local' : 'tracked');
  const fileName = `${formatLocalDate(new Date())}-${slugifyTitle(title)}.md`;
  const destPath = path.join(planDir, fileName);

  fs.mkdirSync(planDir, { recursive: true });

  if (fs.existsSync(destPath) && !force) {
    console.error('\n  Plan already exists: ' + path.relative(process.cwd(), destPath));
    console.error('  Use --force to overwrite.\n');
    process.exit(1);
  }

  fs.copyFileSync(templatePath, destPath);
  console.log('\n  Plan created: ' + path.relative(process.cwd(), destPath));
  console.log('  Next: ask an AI to fill it using .ai/prompts/plan-generation.prompt.md\n');
}

function createContext(commandArgs) {
  const reset = commandArgs.includes('--reset') || commandArgs.includes('--force');
  const clear = commandArgs.includes('--clear');
  const plansDir = path.resolve(process.cwd(), '.ai', 'plans');
  const templatePath = path.join(plansDir, 'CONTEXT_TEMPLATE.md');
  const contextPath = path.join(plansDir, 'context.md');

  requireAiTemplate(templatePath);

  if (reset && clear) {
    console.error('\n  Choose either --reset or --clear, not both.\n');
    process.exit(1);
  }

  if (clear) {
    fs.writeFileSync(contextPath, '');
    console.log('\n  context.md cleared.');
    console.log('  Add task-specific context before generating a plan.\n');
    return;
  }

  if (fs.existsSync(contextPath) && !reset) {
    console.log('\n  context.md already exists and was preserved.');
    console.log('  Use `npx muaiflow context --reset` to reset it from CONTEXT_TEMPLATE.md.');
    console.log('  Use `npx muaiflow context --clear` to empty it.\n');
    return;
  }

  fs.copyFileSync(templatePath, contextPath);
  console.log('\n  context.md created from CONTEXT_TEMPLATE.md.');
  console.log('  Edit .ai/plans/context.md before generating a plan.\n');
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
  case 'plan':
    createPlan(args.slice(1));
    break;
  case 'context':
    createContext(args.slice(1));
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

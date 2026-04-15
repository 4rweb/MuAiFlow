#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const cli = path.join(repoRoot, 'bin', 'muaiflow.js');
const postinstall = path.join(repoRoot, 'bin', 'postinstall.js');

function runNode(args, cwd, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env || {}) }
  });

  if (options.expectFailure) {
    assert.notStrictEqual(result.status, 0, 'command was expected to fail: node ' + args.join(' '));
    return result;
  }

  assert.strictEqual(
    result.status,
    0,
    'command failed: node ' + args.join(' ') + '\nstdout:\n' + result.stdout + '\nstderr:\n' + result.stderr
  );
  return result;
}

function runCommand(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });

  if (options.optional && result.error && result.error.code === 'ENOENT') {
    return null;
  }

  if (options.expectFailure) {
    assert.notStrictEqual(result.status, 0, command + ' was expected to fail');
    return result;
  }

  assert.strictEqual(
    result.status,
    0,
    command + ' failed with ' + args.join(' ') + '\nstdout:\n' + result.stdout + '\nstderr:\n' + result.stderr
  );
  return result;
}

function exists(relativePath, cwd) {
  return fs.existsSync(path.join(cwd, relativePath));
}

function read(relativePath, cwd) {
  return fs.readFileSync(path.join(cwd, relativePath), 'utf8');
}

function write(relativePath, cwd, content) {
  const fullPath = path.join(cwd, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function todayPrefix() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'muaiflow-cli-'));
let postinstallRoot = null;

try {
  runNode([cli, 'init'], tempRoot);

  assert(exists('.ai', tempRoot), '.ai directory should exist');
  assert(exists('.ai/plans/TEMPLATE.md', tempRoot), 'TEMPLATE.md should exist');
  assert(exists('.ai/plans/CONTEXT_TEMPLATE.md', tempRoot), 'CONTEXT_TEMPLATE.md should exist');
  assert(exists('.ai/plans/.gitignore', tempRoot), 'plans/.gitignore should exist');
  assert(exists('.ai/plans/context.md', tempRoot), 'context.md should be created');
  assert(exists('.ai/plans/tracked/.gitkeep', tempRoot), 'tracked/.gitkeep should exist');
  assert(exists('.ai/plans/local/.gitignore', tempRoot), 'local/.gitignore should exist');

  const date = todayPrefix();
  const template = read('.ai/plans/TEMPLATE.md', tempRoot);

  runNode([cli, 'plan', 'my-feature', '--tracked'], tempRoot);
  const trackedPlan = `.ai/plans/tracked/${date}-my-feature.md`;
  assert.strictEqual(read(trackedPlan, tempRoot), template, 'tracked plan should be copied from TEMPLATE.md');

  runNode([cli, 'plan', 'my-feature', '--tracked'], tempRoot, { expectFailure: true });

  runNode([cli, 'plan', 'my-feature', '--local'], tempRoot);
  const localPlan = `.ai/plans/local/${date}-my-feature.md`;
  assert.strictEqual(read(localPlan, tempRoot), template, 'local plan should be copied from TEMPLATE.md');

  write('.ai/plans/context.md', tempRoot, 'custom context');
  runNode([cli, 'context'], tempRoot);
  assert.strictEqual(read('.ai/plans/context.md', tempRoot), 'custom context', 'context command should preserve existing context');

  runNode([cli, 'context', '--force'], tempRoot);
  assert.strictEqual(
    read('.ai/plans/context.md', tempRoot),
    read('.ai/plans/CONTEXT_TEMPLATE.md', tempRoot),
    'context --force should reset from CONTEXT_TEMPLATE.md'
  );

  write('.ai/plans/context.md', tempRoot, 'preserve context');
  write('.ai/plans/tracked/2099-01-01-user-plan.md', tempRoot, 'preserve tracked');
  write('.ai/plans/local/2099-01-01-local-plan.md', tempRoot, 'preserve local');
  write('.ai/plans/2099-01-01-legacy-plan.md', tempRoot, 'preserve legacy');

  runNode([cli, 'init', '--force'], tempRoot);
  assert.strictEqual(read('.ai/plans/context.md', tempRoot), 'preserve context', 'init --force should preserve context.md');
  assert.strictEqual(read('.ai/plans/tracked/2099-01-01-user-plan.md', tempRoot), 'preserve tracked', 'init --force should preserve tracked plans');
  assert.strictEqual(read('.ai/plans/local/2099-01-01-local-plan.md', tempRoot), 'preserve local', 'init --force should preserve local plans');
  assert.strictEqual(read('.ai/plans/2099-01-01-legacy-plan.md', tempRoot), 'preserve legacy', 'init --force should preserve legacy top-level plans');

  write(
    '.ai/plans/tracked/2099-01-02-tracked-handoff.md',
    tempRoot,
    '---\nstatus: DRAFT\n---\n\n- **Next step**: older tracked\n- **Blockers**: none\n'
  );
  write(
    '.ai/plans/local/2099-01-03-local-handoff.md',
    tempRoot,
    '---\nstatus: EXECUTING\n---\n\n- **Next step**: newer local\n- **Blockers**: none\n'
  );
  fs.utimesSync(
    path.join(tempRoot, '.ai/plans/tracked/2099-01-02-tracked-handoff.md'),
    new Date('2099-01-02T00:00:00Z'),
    new Date('2099-01-02T00:00:00Z')
  );
  fs.utimesSync(
    path.join(tempRoot, '.ai/plans/local/2099-01-03-local-handoff.md'),
    new Date('2099-01-03T00:00:00Z'),
    new Date('2099-01-03T00:00:00Z')
  );

  const handoff = runCommand('bash', ['.ai/scripts/handoff.sh', 'codex'], tempRoot);
  assert(
    handoff.stdout.includes('.ai/plans/local/2099-01-03-local-handoff.md'),
    'handoff should report newest plan from local/'
  );
  assert(handoff.stdout.includes('Status:  EXECUTING'), 'handoff should parse status with portable awk');

  postinstallRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'muaiflow-postinstall-'));
  runNode([postinstall], repoRoot, { env: { INIT_CWD: postinstallRoot } });
  assert(exists('.ai/plans/context.md', postinstallRoot), 'postinstall should create context.md');
  write('.ai/plans/context.md', postinstallRoot, 'postinstall preserve context');
  runNode([postinstall], repoRoot, { env: { INIT_CWD: postinstallRoot } });
  assert.strictEqual(
    read('.ai/plans/context.md', postinstallRoot),
    'postinstall preserve context',
    'postinstall should preserve existing context.md'
  );

  const gitVersion = runCommand('git', ['--version'], tempRoot, { optional: true });
  if (gitVersion) {
    runCommand('git', ['init'], tempRoot);
    runCommand('git', ['check-ignore', localPlan], tempRoot);
  }

  console.log('muaiflow CLI smoke tests passed');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
  if (postinstallRoot) {
    fs.rmSync(postinstallRoot, { recursive: true, force: true });
  }
}

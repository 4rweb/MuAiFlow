# MuAiFlow File Reference — VS Code Extension

VS Code extension that lets you reference project files inside Markdown files using `@path/to/file` syntax.

## How It Works

- **Type `@` in any `.md` file** → opens a Quick Pick with all workspace files and folders
- **`Cmd+Alt+R`** (Mac) / **`Ctrl+Alt+R`** (Win/Linux) → same Quick Pick, without typing `@`
- **Select an item** → inserts `@relative/path/to/file` at the cursor position

## Development Setup

```bash
npm install
npm run compile      # compile once
npm run watch        # watch mode (recompiles on save)
```

## Testing Locally

1. Compile with `npm run compile`
2. In VS Code, press `F5` to open the **Extension Development Host**
3. In the new window, open any `.md` file and type `@`

Or package and install manually:

```bash
vsce package --no-dependencies --allow-missing-repository
code --install-extension muaiflow-file-ref-*.vsix --force
```

> **Important**: VS Code silently skips reinstallation if the version is the same. Always bump `version` in `package.json` before packaging.

## Architecture

Everything lives in a single file: `src/extension.ts`. The structure is:

```
extension.ts
│
├── Cache layer
│   ├── buildFileList()      Scans workspace via vscode.workspace.findFiles
│   ├── getFiles()           Returns cache or triggers build (deduplicates concurrent requests)
│   ├── invalidateCache()    Clears cache
│   └── refreshCache()       Invalidates + pre-loads in background
│
├── UI layer
│   ├── showFilePicker()     Quick Pick opened via Cmd+Alt+R (inserts at cursor)
│   └── handleAtTrigger()    Quick Pick opened via @ (replaces the @ with @path)
│
└── activate()
    ├── Cache pre-warm        getFiles() called immediately on activation
    ├── Command registered    muaiflow.insertFileRef → showFilePicker
    ├── @ listener            onDidChangeTextDocument → handleAtTrigger (100ms debounce)
    ├── FileSystemWatcher     File created/deleted → refreshCache
    └── Config watcher        muaiflow.fileRef.* changed → refreshCache
```

### Why `onDidChangeTextDocument` instead of `CompletionItemProvider`?

VS Code only invokes a `CompletionItemProvider` if the extension is **already active**. The extension activates via `onLanguage:markdown` — which fires when the first `.md` file is opened. If the user opens a `.md` and types `@` too quickly, the CompletionProvider doesn't exist yet. Using `onDidChangeTextDocument` avoids this race condition because the listener is registered inside `activate()`, which has already run.

### Cache

- The cache is **permanent in memory** — no TTL
- It is invalidated only when:
  - `FileSystemWatcher` detects a file creation or deletion
  - The user changes a `muaiflow.fileRef.*` setting
- If two requests arrive while the cache is being built, they share the same `Promise` (dedup)
- `activate()` fires `getFiles()` to pre-warm the cache before the first `@`

### Two UI Paths

| Trigger | Function | Behavior |
|---------|----------|----------|
| `@` typed in editor | `handleAtTrigger()` | Replaces the `@` character with `@path/selected` |
| `Cmd+Alt+R` / Command Palette | `showFilePicker()` | Inserts `@path/selected` at cursor position |

Both open the Quick Pick with `busy = true` (spinner) while the cache loads, and populate it when ready.

## Configuration

Defined in `package.json` → `contributes.configuration`:

| Setting | Default | Description |
|---------|---------|-------------|
| `muaiflow.fileRef.include` | `**/*` | Glob pattern for files to include |
| `muaiflow.fileRef.exclude` | `**/node_modules/**,**/.git/**,...` | Glob patterns to exclude (comma-separated) |
| `muaiflow.fileRef.includeDirectories` | `true` | Include directories in suggestions |

## File Structure

```
vscode-extension/
├── src/
│   └── extension.ts       # Source code (single file)
├── out/
│   └── extension.js       # Compiled output (CommonJS, ES2020)
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript config
├── .vscodeignore           # Excludes src/ and node_modules/ from .vsix
└── *.vsix                  # Generated packages (not committed)
```

## Design Decisions and Trade-offs

### Single file
All logic lives in `extension.ts` (~215 lines). At the current scope, splitting isn't justified — but if it grows (e.g., multiple triggers, syntax highlighting for `@refs`, hover preview), it's worth separating into `cache.ts`, `picker.ts`, `trigger.ts`.

### No automated tests
The extension is tested manually. To add tests, use the [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension) framework with `@vscode/test-electron`.

### 15,000 file limit
`findFiles` is capped at 15k to avoid freezing in large monorepos. If that's insufficient, adjust the call at `findFiles(includePattern, excludePattern, 15000)`.

### 100ms debounce on `@`
Prevents opening multiple Quick Picks if the user types `@@` or pastes text containing `@`. If it feels sluggish, it can be reduced to 50ms.

## Contribution Ideas

- [ ] Syntax highlighting for `@path/to/file` in Markdown
- [ ] Hover provider showing a preview of the referenced file
- [ ] Multi-root workspace support (currently uses `workspaceFolders[0]`)
- [ ] Automated tests with `@vscode/test-electron`
- [ ] Visual decoration on `@references` (underline, different color)
- [ ] Ctrl+Click on `@reference` to open the file

import * as vscode from 'vscode'
import * as path from 'path'

interface FileItem extends vscode.QuickPickItem {
  relativePath: string
  isDirectory: boolean
}

let cachedItems: FileItem[] | null = null
let cachePromise: Promise<FileItem[]> | null = null

function getWorkspaceRoot(): vscode.Uri | null {
  const folders = vscode.workspace.workspaceFolders
  if (!folders || folders.length === 0) return null
  return folders[0].uri
}

/** Patterns that should never trigger a cache rebuild */
const IGNORED_SEGMENTS = [
  'node_modules', '.git', 'dist', 'out', '.next', 'build', '.cache',
  '.turbo', '.parcel-cache', '__pycache__', '.tox', '.venv',
]

function isIgnoredPath(fsPath: string): boolean {
  const segments = fsPath.split(path.sep)
  return segments.some(s => IGNORED_SEGMENTS.includes(s))
}

async function buildFileList(): Promise<FileItem[]> {
  const rootUri = getWorkspaceRoot()
  if (!rootUri) return []

  const config = vscode.workspace.getConfiguration('muaiflow.fileRef')
  const includeDirectories = config.get<boolean>('includeDirectories', true)
  const excludeRaw = config.get<string>(
    'exclude',
    '**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/.next/**,**/build/**'
  )

  const includePattern = new vscode.RelativePattern(rootUri, '**/*')
  const excludePattern = `{${excludeRaw}}`

  // Reduced from 15000 → 5000 to lower memory footprint
  const uris = await vscode.workspace.findFiles(includePattern, excludePattern, 5000)

  const items: FileItem[] = []
  const seenDirs = new Set<string>()

  for (const uri of uris) {
    const relativePath = path.relative(rootUri.fsPath, uri.fsPath).replace(/\\/g, '/')

    items.push({
      label: `$(file) ${path.basename(uri.fsPath)}`,
      description: relativePath,
      relativePath,
      isDirectory: false
    })

    if (includeDirectories) {
      let dir = path.dirname(relativePath)
      while (dir && dir !== '.' && !seenDirs.has(dir)) {
        seenDirs.add(dir)
        items.push({
          label: `$(folder) ${path.basename(dir)}`,
          description: dir,
          relativePath: dir,
          isDirectory: true
        })
        dir = path.dirname(dir)
      }
    }
  }

  items.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.relativePath.localeCompare(b.relativePath)
  })

  return items
}

async function getFiles(forceRefresh = false): Promise<FileItem[]> {
  if (!forceRefresh && cachedItems) {
    return cachedItems
  }

  if (!forceRefresh && cachePromise) {
    return cachePromise
  }

  cachePromise = buildFileList().then(items => {
    cachedItems = items
    cachePromise = null
    return items
  }).catch(() => {
    cachePromise = null
    return []
  })

  return cachePromise
}

function invalidateCache() {
  cachedItems = null
  cachePromise = null
}

/**
 * Debounced cache refresh — collapses rapid file-system events
 * (npm install, git checkout, builds) into a single rescan.
 */
let refreshTimer: ReturnType<typeof setTimeout> | null = null
const REFRESH_DEBOUNCE_MS = 2000

function debouncedRefreshCache() {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => {
    refreshTimer = null
    invalidateCache()
    // Don't eagerly rebuild — let the next getFiles() call do it (lazy)
  }, REFRESH_DEBOUNCE_MS)
}

async function showFilePicker(editor: vscode.TextEditor) {
  const quickPick = vscode.window.createQuickPick<FileItem>()
  quickPick.placeholder = 'Loading workspace files...'
  quickPick.busy = true
  quickPick.matchOnDescription = true
  quickPick.show()

  const items = await getFiles()

  quickPick.items = items
  quickPick.busy = false
  quickPick.placeholder = 'Type to filter — select a file or folder to insert @reference'

  quickPick.onDidAccept(() => {
    const selected = quickPick.selectedItems[0]
    quickPick.dispose()
    if (!selected) return

    const reference = `@${selected.relativePath}`
    editor.edit(editBuilder => {
      if (editor.selection.isEmpty) {
        editBuilder.insert(editor.selection.active, reference)
      } else {
        editBuilder.replace(editor.selection, reference)
      }
    })
  })

  quickPick.onDidHide(() => quickPick.dispose())
}

async function handleAtTrigger(editor: vscode.TextEditor, atPosition: vscode.Position) {
  const quickPick = vscode.window.createQuickPick<FileItem>()
  quickPick.placeholder = 'Loading workspace files...'
  quickPick.busy = true
  quickPick.matchOnDescription = true
  quickPick.show()

  const items = await getFiles()

  quickPick.items = items
  quickPick.busy = false
  quickPick.placeholder = 'Select a file or folder to insert @reference'

  quickPick.onDidAccept(() => {
    const selected = quickPick.selectedItems[0]
    quickPick.dispose()
    if (!selected) return

    const replaceRange = new vscode.Range(atPosition, atPosition.translate(0, 1))
    editor.edit(editBuilder => {
      editBuilder.replace(replaceRange, `@${selected.relativePath}`)
    })
  })

  quickPick.onDidHide(() => quickPick.dispose())
}

export function activate(context: vscode.ExtensionContext) {
  // LAZY: don't scan on activation — only scan when the user actually needs the picker
  // (removed: getFiles().catch(() => {}))

  context.subscriptions.push(
    vscode.commands.registerCommand('muaiflow.insertFileRef', () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        vscode.window.showWarningMessage('MuAiFlow: No active editor')
        return
      }
      if (editor.document.languageId !== 'markdown') {
        vscode.window.showWarningMessage('MuAiFlow: Only works in Markdown files')
        return
      }
      showFilePicker(editor)
    })
  )

  let atDebounce: ReturnType<typeof setTimeout> | null = null
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.languageId !== 'markdown') return
      if (event.contentChanges.length === 0) return

      const change = event.contentChanges[0]
      if (change.text !== '@') return

      const editor = vscode.window.activeTextEditor
      if (!editor || editor.document !== event.document) return

      const pos = change.range.start

      if (atDebounce) clearTimeout(atDebounce)
      atDebounce = setTimeout(() => {
        atDebounce = null
        handleAtTrigger(editor, pos)
      }, 100)
    })
  )

  // Watcher: only invalidate cache (debounced), and skip ignored paths
  const watcher = vscode.workspace.createFileSystemWatcher('**/*')

  const onFsEvent = (uri: vscode.Uri) => {
    if (isIgnoredPath(uri.fsPath)) return
    debouncedRefreshCache()
  }

  watcher.onDidCreate(onFsEvent)
  watcher.onDidDelete(onFsEvent)
  // Also handle renames (shows as create+delete, but explicit rename events come here)
  watcher.onDidChange(onFsEvent)
  context.subscriptions.push(watcher)

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('muaiflow.fileRef')) {
        invalidateCache()
        // Lazy: don't rebuild immediately — next getFiles() call will do it
      }
    })
  )
}

export function deactivate() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  invalidateCache()
}

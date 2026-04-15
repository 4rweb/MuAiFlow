import * as vscode from 'vscode'
import * as path from 'path'

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('muaiflow.insertFileRef', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
    if (!workspaceFolder) {
      vscode.window.showWarningMessage('MuAiFlow: No workspace folder open.')
      return
    }

    const config = vscode.workspace.getConfiguration('muaiflow.fileRef')
    const includePattern = config.get<string>(
      'include',
      '**/*.{ts,tsx,js,jsx,json,md,yml,yaml,sh,css,scss,sql,html}'
    )
    const excludeRaw = config.get<string>(
      'exclude',
      '**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/.next/**,**/build/**'
    )
    const includeDirectories = config.get<boolean>('includeDirectories', true)
    const excludeGlob = `{${excludeRaw.split(',').map(p => p.trim()).join(',')}}`
    const workspaceRoot = workspaceFolder.uri.fsPath

    // Build items list
    const items: vscode.QuickPickItem[] = []

    // Directories first
    if (includeDirectories) {
      const allFiles = await vscode.workspace.findFiles('**/*', excludeGlob, 5000)
      const dirs = new Set<string>()
      for (const file of allFiles) {
        let dir = path.relative(workspaceRoot, path.dirname(file.fsPath))
        while (dir && dir !== '.') {
          dirs.add(dir.split(path.sep).join('/'))
          dir = path.dirname(dir)
        }
      }
      for (const dir of Array.from(dirs).sort()) {
        items.push({
          label: '$(folder) ' + dir + '/',
          description: 'directory',
          detail: dir + '/',
        })
      }
    }

    // Files
    const files = await vscode.workspace.findFiles(includePattern, excludeGlob, 2000)
    const sortedFiles = files
      .map(f => path.relative(workspaceRoot, f.fsPath).split(path.sep).join('/'))
      .sort()

    for (const rel of sortedFiles) {
      items.push({
        label: '$(file) ' + rel,
        description: 'file',
        detail: rel,
      })
    }

    const pick = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a file or folder to insert as @reference',
      matchOnDetail: true,
      matchOnDescription: false,
    })

    if (!pick || !pick.detail) return

    const editor = vscode.window.activeTextEditor
    if (!editor) return

    // Insert @path at cursor
    editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, '@' + pick.detail)
    })
  })

  context.subscriptions.push(command)
}

export function deactivate() {}

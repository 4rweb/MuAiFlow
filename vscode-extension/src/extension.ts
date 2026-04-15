import * as vscode from 'vscode'
import * as path from 'path'

export function activate(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
    { language: 'markdown' },
    {
      async provideCompletionItems(document, position) {
        const lineText = document.lineAt(position).text
        const linePrefix = lineText.substring(0, position.character)

        // Only trigger right after @
        const atIndex = linePrefix.lastIndexOf('@')
        if (atIndex === -1) return undefined

        // What the user typed after @
        const typed = linePrefix.substring(atIndex + 1)

        // Ignore if there's a space after @ (not a path reference)
        if (typed.includes(' ')) return undefined

        const config = vscode.workspace.getConfiguration('muaiflow.fileRef')
        const includePattern = config.get<string>('include', '**/*.{ts,tsx,js,jsx,json,md,yml,yaml,sh,css,scss,sql,html}')
        const excludeRaw = config.get<string>('exclude', '**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/.next/**,**/build/**')
        const includeDirectories = config.get<boolean>('includeDirectories', true)

        const excludePatterns = excludeRaw.split(',').map(p => p.trim())
        const excludeGlob = `{${excludePatterns.join(',')}}`

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
        if (!workspaceFolder) return undefined

        const workspaceRoot = workspaceFolder.uri.fsPath
        const items: vscode.CompletionItem[] = []

        // Files
        const files = await vscode.workspace.findFiles(includePattern, excludeGlob, 2000)

        for (const file of files) {
          const relativePath = path.relative(workspaceRoot, file.fsPath)
          const normalizedPath = relativePath.split(path.sep).join('/')

          // Filter by what user already typed after @
          if (typed && !normalizedPath.toLowerCase().includes(typed.toLowerCase())) continue

          const item = new vscode.CompletionItem(normalizedPath, vscode.CompletionItemKind.File)
          item.insertText = normalizedPath
          // Replace from the @ character to current position
          const replaceRange = new vscode.Range(
            position.line,
            atIndex + 1,
            position.line,
            position.character
          )
          item.range = replaceRange
          item.detail = 'file'
          item.sortText = '1_' + normalizedPath
          items.push(item)
        }

        // Directories
        if (includeDirectories) {
          const allFiles = await vscode.workspace.findFiles('**/*', excludeGlob, 5000)
          const dirs = new Set<string>()

          for (const file of allFiles) {
            let dirPath = path.relative(workspaceRoot, path.dirname(file.fsPath))
            while (dirPath && dirPath !== '.') {
              dirs.add(dirPath.split(path.sep).join('/'))
              dirPath = path.dirname(dirPath)
            }
          }

          for (const dir of dirs) {
            if (typed && !dir.toLowerCase().includes(typed.toLowerCase())) continue

            const item = new vscode.CompletionItem(dir + '/', vscode.CompletionItemKind.Folder)
            item.insertText = dir + '/'
            const replaceRange = new vscode.Range(
              position.line,
              atIndex + 1,
              position.line,
              position.character
            )
            item.range = replaceRange
            item.detail = 'directory'
            item.sortText = '0_' + dir
            items.push(item)
          }
        }

        return items
      }
    },
    '@'
  )

  context.subscriptions.push(provider)
}

export function deactivate() {}

import { createSingletonComposable, EffectScope, effectScope, extensionContext, useDisposable, useFsWatcher } from "reactive-vscode";
import { CancellationToken, CustomDocument, CustomReadonlyEditorProvider, Uri, WebviewPanel, window } from "vscode";
import { indexHtml, logger } from "./utils";

interface SpeedscopeDocument extends CustomDocument {
  scope: EffectScope
}

export const useEditorProvider = createSingletonComposable(() => {
  const provider: CustomReadonlyEditorProvider<SpeedscopeDocument> = {
    openCustomDocument(uri: Uri): SpeedscopeDocument {
      const scope = effectScope(true)
      return {
        uri,
        scope,
        dispose: () => scope.stop(),
      }
    },
    resolveCustomEditor(
      document: SpeedscopeDocument,
      webviewPanel: WebviewPanel,
      _token: CancellationToken
    ) {
      webviewPanel.webview.options = {
        enableScripts: true,
      }

      const profileURL = webviewPanel.webview.asWebviewUri(document.uri)
      const title = document.uri.path.split('/').pop()
      const hash = JSON.stringify(`#profileURL=${profileURL}&title=${title}`)
      const vendorRoot = Uri.joinPath(extensionContext.value!.extensionUri, 'vendor')
      const fontUrl = webviewPanel.webview.asWebviewUri(Uri.joinPath(vendorRoot, 'SourceCodePro-Regular.ttf.woff2'))
      const html = indexHtml.value!
        .replace(/<link href="source-code-pro\..*?\.css" rel="stylesheet">/, `<style> @font-face{font-family:Source Code Pro;font-weight:400;font-style:normal;font-stretch:normal;src:url(${fontUrl}) format("woff2")} </style>`)
        .replaceAll(/(src|href)="(.*?)"/g, (_, name, href) => {
          const uri = webviewPanel.webview.asWebviewUri(Uri.joinPath(vendorRoot, href))
          return `${name}="${uri}"`
        })
        .replace('<body>', `<body><script>window.location.hash = ${hash}</script>`)

      function update() {
        webviewPanel.webview.html = html + `<!-- ${Date.now()} -->`
        logger.info(`Content updated for ${document.uri}`)
      }

      document.scope.run(() => {
        const watcher = useFsWatcher(document.uri.fsPath)
        watcher.onDidChange(update)
        update()
      })
    }
  }
  useDisposable(window.registerCustomEditorProvider('speedscope-vscode.speedscope', provider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
    supportsMultipleEditorsPerDocument: false,
  }))
})

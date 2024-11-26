import { readFileSync } from 'fs'
import { computed, defineLogger, extensionContext } from 'reactive-vscode'

export const logger = defineLogger('Speedscope')

export const indexHtml = computed(() => {
  const context = extensionContext.value
  if (!context) return null
  return readFileSync(context.asAbsolutePath('vendor/index.html'), 'utf-8')
})


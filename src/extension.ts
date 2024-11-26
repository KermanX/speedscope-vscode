import { defineExtension } from 'reactive-vscode'
import { useEditorProvider } from './editor'
import { logger } from './utils'

export = defineExtension(() => {
  logger.info('Extension Activated')

  useEditorProvider()
})

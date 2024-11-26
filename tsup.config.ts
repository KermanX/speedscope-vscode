import { defineConfig } from 'tsup'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  minify: true,
  external: [
    'vscode',
  ],
  async onSuccess() {
    const src = path.resolve(__dirname, 'node_modules/speedscope/dist/release')
    const dest = path.resolve(__dirname, 'vendor')
    fs.rmSync(dest, { recursive: true })
    fs.mkdirSync(dest, { recursive: true })
    let replaced = 0
    for (const file of fs.readdirSync(src)) {
      const source = path.join(src, file)
      let target = path.join(dest, file)
      if (/^speedscope\..*\.js$/.test(file)) {
        fs.writeFileSync(target, fs.readFileSync(source, 'utf-8').replace(`"http:"===x||"https:"===x`, () => {
          replaced++
          return 'true'
        }))
      } else {
        if (/^source-code-pro\..*\.css$/.test(file)) {
          replaced++
          target = path.join(dest, 'SourceCodePro-Regular.ttf.woff2')
        }
        fs.copyFileSync(path.join(src, file), path.join(dest, file))
      }
    }
    if (replaced !== 2) {
      throw new Error('Failed to replace the protocol check')
    }
  }
})

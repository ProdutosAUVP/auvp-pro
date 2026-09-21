/**
 * Build do site estatico da AUVP Pro.
 *
 * - monta as paginas de src/pages a partir dos parciais de src/partials
 * - compila o Tailwind para dist/assets/css/main.css
 * - copia os assets estaticos e o Swiper (vendor) para dist/
 *
 * Uso: node build.mjs [--watch] [--serve]
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(root, 'dist')
const watch = process.argv.includes('--watch')
const serve = process.argv.includes('--serve')
const port = Number(process.env.PORT) || 4000

const VENDOR = [
  ['node_modules/swiper/swiper-bundle.min.css', 'assets/vendor/swiper-bundle.min.css'],
  ['node_modules/swiper/swiper-bundle.min.js', 'assets/vendor/swiper-bundle.min.js'],
]

/** Le todos os parciais de src/partials como { nome: conteudo }. */
async function loadPartials() {
  const dir = path.join(root, 'src/partials')
  const entries = await fs.readdir(dir)
  const partials = {}
  for (const entry of entries) {
    if (!entry.endsWith('.html')) continue
    partials[path.basename(entry, '.html')] = await fs.readFile(path.join(dir, entry), 'utf8')
  }
  return partials
}

/** Lista as paginas de src/pages recursivamente, com o caminho relativo. */
async function listPages(dir = path.join(root, 'src/pages'), prefix = '') {
  const pages = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) pages.push(...(await listPages(path.join(dir, entry.name), rel)))
    else if (entry.name.endsWith('.html')) pages.push(rel)
  }
  return pages
}

/**
 * Resolve os tokens de um template:
 *   {{> nome }}  inclui src/partials/nome.html (recursivo)
 *   {{base}}     prefixo relativo ate a raiz do site ('' ou '../')
 *   {{key}}      qualquer variavel passada em vars
 */
function render(template, partials, vars, depth = 0) {
  if (depth > 10) throw new Error('Inclusao de parciais circular ou profunda demais')
  const withPartials = template.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in partials)) throw new Error(`Parcial nao encontrado: ${name}`)
    return render(partials[name], partials, vars, depth + 1)
  })
  return withPartials.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (match, key) =>
    key in vars ? vars[key] : match,
  )
}

async function copyDir(from, to) {
  await fs.cp(from, to, { recursive: true, force: true })
}

function runTailwind() {
  const bin = path.join(root, 'node_modules/.bin/tailwindcss')
  const args = [
    '-i', path.join(root, 'src/css/main.css'),
    '-o', path.join(dist, 'assets/css/main.css'),
    '--minify',
  ]
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'inherit'] })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`tailwindcss saiu com codigo ${code}`)),
    )
  })
}

async function build() {
  const started = Date.now()
  await fs.rm(dist, { recursive: true, force: true })
  await fs.mkdir(path.join(dist, 'assets/css'), { recursive: true })

  const partials = await loadPartials()
  const pages = await listPages()

  for (const page of pages) {
    const depth = page.split('/').length - 1
    const vars = {
      base: depth === 0 ? '' : '../'.repeat(depth),
      // usado para marcar o item ativo no menu; cada pagina sobrescreve via {{page-id}}
    }
    const template = await fs.readFile(path.join(root, 'src/pages', page), 'utf8')
    const out = path.join(dist, page)
    await fs.mkdir(path.dirname(out), { recursive: true })
    await fs.writeFile(out, render(template, partials, vars))
  }

  await copyDir(path.join(root, 'src/js'), path.join(dist, 'assets/js'))
  if (await fs.stat(path.join(root, 'static')).then(() => true, () => false)) {
    await copyDir(path.join(root, 'static'), dist)
  }
  for (const [from, to] of VENDOR) {
    const src = path.join(root, from)
    if (!(await fs.stat(src).then(() => true, () => false))) {
      throw new Error(`Vendor ausente: ${from}. Rode "npm install" antes do build.`)
    }
    await fs.mkdir(path.dirname(path.join(dist, to)), { recursive: true })
    await fs.copyFile(src, path.join(dist, to))
  }

  await runTailwind()
  // O Pages do GitHub roda Jekyll por padrao; .nojekyll desliga isso.
  await fs.writeFile(path.join(dist, '.nojekyll'), '')

  console.log(`build: ${pages.length} paginas em ${Date.now() - started}ms`)
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function startServer() {
  createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = path.join(dist, url)
    if (url.endsWith('/')) file = path.join(file, 'index.html')
    if (!file.startsWith(dist)) {
      res.writeHead(403).end('Forbidden')
      return
    }
    try {
      const body = await fs.readFile(file)
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
      res.end('<h1>404</h1>')
    }
  }).listen(port, () => console.log(`servindo dist/ em http://localhost:${port}`))
}

await build()
if (serve) startServer()
if (watch) {
  let timer
  for (const dir of ['src', 'static']) {
    const abs = path.join(root, dir)
    if (!(await fs.stat(abs).then(() => true, () => false))) continue
    const watcher = fs.watch(abs, { recursive: true })
    ;(async () => {
      for await (const _ of watcher) {
        clearTimeout(timer)
        timer = setTimeout(() => build().catch((err) => console.error(err.message)), 80)
      }
    })()
  }
  console.log('watch: aguardando mudancas em src/')
}

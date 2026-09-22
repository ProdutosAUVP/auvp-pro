# AUVP Pro

Site estático da AUVP Pro, migrado do WordPress/Elementor. O repositório é o ponto de
deploy: um push em `main` publica no GitHub Pages.

## Como rodar

```bash
npm install
npm run dev     # build + servidor em http://localhost:4000 + watch
npm run build   # gera dist/
```

## Estrutura

```
src/
  css/main.css        Tailwind (entrada) + estilos dos componentes
  js/site.js          comportamentos de todas as páginas (cada init é no-op se o bloco não existe)
  partials/           head, header, footer, logos e o FAQ compartilhado
  pages/              uma pasta por URL — index, hp12c/, termos/, obrigado/
static/               arquivos copiados como estão (logos, favicon, robots.txt)
brand/                pacote de marca (origem); não vai para o ar — ver brand/README.md
build.mjs             monta as páginas, compila o Tailwind e copia os assets para dist/
```

### Páginas

| URL         | Arquivo                       |
| ----------- | ----------------------------- |
| `/`         | `src/pages/index.html`        |
| `/hp12c/`   | `src/pages/hp12c/index.html`  |
| `/termos/`  | `src/pages/termos/index.html` |
| `/obrigado/`| `src/pages/obrigado/index.html` |

### Template

O `build.mjs` resolve três tokens nos arquivos de `src/pages` e `src/partials`:

- `{{> nome }}` — inclui `src/partials/nome.html` (pode aninhar)
- `{{base}}` — prefixo relativo até a raiz (`` na home, `../` nas subpastas).
  É o que faz o site funcionar tanto em `usuario.github.io/auvp-pro/` quanto na raiz
  de um domínio próprio, sem alterar nada.

## Deploy

`.github/workflows/deploy.yml` roda `npm ci && npm run build` e publica `dist/` no
GitHub Pages a cada push em `main`.

Para ativar: **Settings → Pages → Source: GitHub Actions**.

### Migrar para o domínio próprio

1. Criar `static/CNAME` com o domínio (ex.: `pro.auvp.com.br`) — o build copia para `dist/`.
2. Apontar o DNS para o GitHub Pages.
3. **Settings → Pages → Custom domain** e marcar *Enforce HTTPS*.

Nenhum caminho precisa mudar: tudo já é relativo.

## Pontos que dependem de material externo

- **Logo da AUVP Capital**: o rodapé dos prints usa a marca da Capital, que não veio no
  pacote de logos. Está com o logo da AUVP Pro em branco no lugar — ver `brand/README.md`.
- **Imagem de fundo do hero**: definida em `--hero-image` no topo de `src/css/main.css`.
- **Foto do banner "mercado de trabalho"**: definir `--banner-mercado-image` com a
  `url(...)` da foto; hoje o bloco usa só o gradiente escuro.
- **Links de checkout**: os botões de preço estão com `href="#"` em `src/pages/index.html`.

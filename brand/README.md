# Marca

Arquivos de origem da identidade visual. **Esta pasta não vai para o ar** — o `build.mjs`
publica apenas `src/` e `static/`. Para usar um arquivo no site, copie-o para
`static/assets/img/`.

```
auvp-pro/
  svg/                 vetor, formato preferido para a web
  png-2000w/           bitmap 2000px de largura, para apresentações e materiais
  pdf/                 vetor para impressão e para a gráfica
  whatsapp/            avatar quadrado para perfis de mensageria
  _antigas-nao-usar/   versões descontinuadas — mantidas só por histórico
```

Cada variante existe em três cores: `preta` (fundo claro), `branca` (fundo escuro) e
`amarela`; e em duas orientações: `horizontal` e `vertical`.

## O que o site usa hoje

| Arquivo publicado                        | Origem                                  | Onde aparece              |
| ---------------------------------------- | --------------------------------------- | ------------------------- |
| `static/assets/img/logo-auvp-pro.svg`        | `svg/auvp-pro-horizontal-preta.svg`  | cabeçalho, página de obrigado |
| `static/assets/img/logo-auvp-pro-branca.svg` | `svg/auvp-pro-horizontal-branca.svg` | rodapé                    |
| `static/assets/img/favicon.svg`              | olho recortado de `svg/auvp-pro-vertical-preta.svg` | aba do navegador |

Para trocar uma dessas três, copie o novo arquivo por cima e rode `npm run build`.

## Falta

O rodapé dos prints usa o logo da **AUVP Capital**, que não está neste pacote. Está
com o logo da AUVP Pro em branco no lugar. Quando o pacote da Capital chegar, é só
adicioná-lo aqui, copiar para `static/assets/img/` e apontar `src/partials/footer.html`.

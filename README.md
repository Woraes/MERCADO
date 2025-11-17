# 🛒 WillCompras

Aplicativo de listas de compras pensado para famílias brasileiras, com foco em praticidade para idosos e responsáveis pelo lar. Permite criar listas rápidas, ir para o mercado no mesmo fluxo, registrar valores e salvar modelos para reutilização.

## ✨ Principais recursos

- 👥 **Multiusuários** com seleção e exclusão, cada um com seu histórico (armazenados via `sql.js` em SQLite no navegador).
- 🧾 **Listas inteligentes**: adição rápida em casa com quantidade, edição inline e limpeza total com confirmação.
- 🛍️ **Modo Mercado**: edição de nome/quantidade/valor durante a compra, botão “selecionar todos”, inclusão de itens na hora e cálculo de total por quantidade.
- 📦 **Templates reutilizáveis**: salve listas finalizadas, visualize itens e gere novas cópias em poucos cliques.
- 📊 **Histórico detalhado**: meses agrupados, valores, itens comprados por data e exportação (PDF/Impressão).
- 📱 **PWA responsivo**: instalado no celular, funciona offline e pode ser convertido em APK.
- 👵 **Onboarding para primeira visita**: tutorial simples explicando o fluxo “Criar → Mercado → Finalizar”.

## 🧭 Fluxo sugerido

1. Criar usuário (ou selecionar um existente).
2. Adicionar itens e quantidades na tela principal.
3. Ir para “Mercado” e registrar preços + marcar concluídos.
4. Selecionar todos e finalizar.
5. No modal final: baixar PDF, imprimir ou salvar como modelo.

## 🚀 Como executar

```bash
npm install       # instala dependências
npm run dev       # modo desenvolvimento em http://localhost:5173
npm run build     # build de produção (dist/)
npm run preview   # serve a pasta dist localmente
```

## 📱 Transformar em APK

### Método recomendado: PWA Builder
1. Faça o build (`npm run build`) e publique o conteúdo de `dist/` (GitHub Pages, Netlify, Vercel...).
2. Acesse [pwabuilder.com](https://pwabuilder.com/), informe a URL publicada e gere o pacote Android.

### Método alternativo: Capacitor + Android Studio
1. `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. `npx cap init` e configure o app.
3. `npm run build && npx cap add android`
4. `npx cap sync && npx cap open android`
5. Gere o APK direto no Android Studio.

📖 Veja o passo a passo com screenshots no arquivo [GUIA_APK.md](./GUIA_APK.md).

## 🎨 Identidade visual

- **Primária**: Laranja comércio `#ff7a1f`
- **Secundária**: Verde feira `#1f6b3f`
- **Base**: Creme suave `#fff6ec`
- Cards com cantos arredondados, sombras macias e tipografia Inter/Manrope.

## 🗄️ Persistência e dados

- Banco em SQLite (sql.js) salvo em `localStorage` para permitir dados complexos sem backend.
- Migrations automáticas garantem colunas como `quantity` e `is_template`.
- Histórico de compras, listas e templates respeitam o usuário selecionado.

## 🖼️ Ícones e favicon

Coloque na pasta `public/`:
- `favicon.ico` (32x32 ou 64x64) — já incluído com o “W” laranja.
- `pwa-192x192.png`
- `pwa-512x512.png`

Ferramentas úteis:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## 🔧 Tecnologias

- React 18 + Hooks
- Vite + VitePWA
- sql.js (SQLite no navegador)
- jsPDF para recibos
- PWA Builder / Capacitor para APK

## 📄 Licença

Distribuído sob a [licença MIT](./LICENSE) © William de Moraes Rodrigues (CPF 106.822.577-70).


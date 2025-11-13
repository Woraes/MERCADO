# 🛒 Smart DEA List

Um app estilo "Smart Grocery List" com design clean e funcional, inspirado em apps como AnyList mas com foco brasileiro. Interface rápida para adicionar produtos, calcular totais automaticamente, e salvar suas listas.

## ✨ Features

- ✅ Adicionar produtos com nome e valor
- ✅ Cálculo automático do total
- ✅ Editar/remover itens
- ✅ Salvar lista (localStorage)
- ✅ Limpar lista
- ✅ PWA configurado (instalável no celular)
- ✅ Design moderno com cores vibrantes

## 🚀 Como usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Build para produção

```bash
npm run build
```

## 📱 Transformar em APK

Existem duas formas de transformar este app em um APK instalável no Android:

### Método 1: PWA Builder (Recomendado - Mais Simples) 🚀

O [PWA Builder](https://pwabuilder.com/) é a forma mais fácil de gerar um APK, sem precisar instalar Android Studio.

1. **Publique seu PWA online:**
   - Faça build: `npm run build`
   - Publique a pasta `dist` em GitHub Pages, Netlify ou Vercel (todos gratuitos)

2. **Use o PWA Builder:**
   - Acesse [https://pwabuilder.com/](https://pwabuilder.com/)
   - Cole a URL do seu PWA publicado
   - Clique em "Build My PWA" > Android
   - Baixe o APK gerado!

**Vantagens:** Não precisa Android Studio, processo muito mais simples.

### Método 2: Capacitor (Alternativa)

Para mais controle sobre o código nativo:

1. Instale: `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. Inicialize: `npx cap init`
3. Adicione Android: `npm run build && npx cap add android`
4. Sincronize: `npx cap sync`
5. Abra no Android Studio: `npx cap open android`
6. Gere o APK no Android Studio

**📖 Guia Completo:** Veja o arquivo [GUIA_APK.md](./GUIA_APK.md) para instruções detalhadas de ambos os métodos.

## 🎨 Design

- **Primary**: Verde vibrante (#22c55e) - tema mercado/fresco
- **Accent**: Laranja (#f97316) - para ações importantes
- **Cards**: Com sombras suaves e bordas arredondadas
- **Animações**: Transições fluidas em todas as interações
- **Gradientes**: Sutis para dar profundidade

## 📝 Notas

- Os dados são salvos localmente no navegador (localStorage)
- O app funciona offline após o primeiro carregamento
- Pode ser instalado como PWA no celular através do navegador

## 🖼️ Criar Ícones do PWA

Para que o PWA funcione completamente, você precisa criar os ícones. Coloque os seguintes arquivos na pasta `public/`:

- `pwa-192x192.png` (192x192 pixels)
- `pwa-512x512.png` (512x512 pixels)

Você pode usar ferramentas online como:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

Ou criar manualmente usando qualquer editor de imagens.

## 🔧 Tecnologias

- React 18
- Vite
- PWA (Progressive Web App)
- PWA Builder / Capacitor (para gerar APK)


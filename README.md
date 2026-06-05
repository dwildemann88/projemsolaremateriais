# Projem Materiais — Orçamento online em React/Vite

Este projeto é uma refação em JSX/React focada em mobile-first, mantendo a integração original com Make, WhatsApp, UTMs, eventos e payloads.

## O que foi preservado

- `makeWebhookUrl`
- `whatsappNumber`
- `schemaVersion: orcamento_lead_v3`
- `sourceSystem: catalogo_orcamento_projem`
- `sourceEvent: pagina_orcamento`
- Storage keys: `projem_customer_v4` e `projem_cart_v2`
- Eventos: `generate_lead`, `quote_requested`, `whatsapp_quote_click`, `add_to_cart`, `begin_checkout`, etc.
- Payload de cadastro enviado ao Make.
- Payload de orçamento enviado ao Make.
- Consulta de CPF/CNPJ antes de cadastrar.
- Bloqueio de envio caso o Make não retorne `lead_id`.
- Captura de UTM, gclid, gbraid, wbraid, fbclid, fbp e fbc.

## Como rodar no VS Code

1. Descompacte este projeto.
2. Abra a pasta no VS Code.
3. Rode:

```bash
npm install
npm run dev
```

4. Abra a URL que o Vite mostrar no terminal.

## Como gerar para publicar

```bash
npm run build
```

A pasta final será `dist/`.

## Arquivos principais

- `src/App.jsx`: página principal e estado da lista.
- `src/services/config.js`: configuração original preservada.
- `src/services/customerService.js`: consulta/cadastro no Make e payload de lead.
- `src/services/cartService.js`: payload do orçamento, envio ao Make e abertura do WhatsApp.
- `src/services/analyticsService.js`: dataLayer, gtag e fbq.
- `src/components/CustomerModal.jsx`: fluxo de CPF/CNPJ, dados e revisão.
- `src/components/ProductCatalog.jsx`: busca, categorias e cards.
- `src/styles.css`: layout mobile-first.

## Atenção

A rota de WhatsApp de ajuda abre conversa direta e não registra orçamento no Make. O botão correto para rastreio completo continua sendo `Solicitar orçamento`, dentro da lista.

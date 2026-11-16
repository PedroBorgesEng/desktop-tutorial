# Doce Ofício — versão de loja virtual em homologação

**Projeto:** Cupcake Gourmet · PITE Engenharia de Software II  
**Data da sincronização:** 16/11/2026

- **Site publicado:** https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app
- **Editor Base44:** https://app.base44.com/apps/6af46ee5dcb326846e0cb87a/editor/preview
- **Código do site:** esta pasta (`base44-site/`)
- **Implementação independente:** pasta irmã `../app/` (Python/FastAPI), mantida sem alterações.
- **Documentação PDF acadêmica:** `../docs/Documentacao_Versao_Base44_Situacao_2.pdf` (anterior à evolução comercial).

## Capacidades implementadas

Catálogo de doces, páginas de produtos, carrinho, retirada ou entrega, pedidos com processamento de preços no servidor, painel administrativo, estoque opcional por produto e prazo mínimo de produção. O checkout usa Stripe e o webhook verifica a assinatura e confere o valor.

## Atenção: pagamentos exclusivamente em teste

A conexão Stripe está em modo **sandbox**, não há conta live validada e **não existe cobrança real**. O site mostra aviso de homologação. As fotos, descrições, preços, taxas, políticas e dados do estabelecimento precisam ser conferidos pelo proprietário antes de vender. A implementação não deve ser apresentada ao público como loja habilitada para vendas reais.

## Arquitetura

- React 19 + TanStack Start, rotas em `src/routes/`
- Funções de servidor JavaScript, Zod e API HTTP (`/api/checkout`, `/api/catalogo`, `/api/stripe-webhook`)
- Entidades Base44: `Produto`, `Pedido`, `User`
- Back-end persistente, autenticação e restrições administrativas gerenciadas pela Base44
- Chaves de pagamentos via segredos do servidor, **não** armazenadas no GitHub

## Como desenvolver

O projeto não depende apenas de executar JavaScript local: é preciso conectar um projeto Base44 com entidades e credenciais configuradas. Use o editor Base44 ou CLI correspondente; `package.json` oferece os comandos `npm run dev`, `npm run build` e `npm run lint`.

## Homologação e pendências

- Código compilado no Base44 e pré-visualização disponível; o construtor testou funções Stripe em sandbox.
- Um teste de navegação automatizado foi cadastrado, mas **não executado** por limite mensal da conta Base44.
- Ainda é necessária validação independente em navegador, revisão de concorrência/expiração de reservas de estoque, teste de reembolsos, consentimento e informações comerciais, além de configurar provedores live.
- A sincronização GitHub ↔ Base44 é **manual** neste plano, logo futuras mudanças devem ser exportadas novamente.

Para mais detalhes, veja `docs/PREPARACAO_PARA_VENDAS.md` e `../docs/EVOLUCAO_COMERCIAL_2026-11-16.md`.

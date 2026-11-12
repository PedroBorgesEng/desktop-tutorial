# Registro de sincronização — Base44 → GitHub

**Data:** 11 de novembro de 2026.

**Origem:** aplicativo Base44 `6af46ee5dcb326846e0cb87a` (versão publicada no mesmo dia).

**Destino:** `base44-site/` neste repositório. A implementação alternativa Python/FastAPI permanece na pasta `app/` e não foi alterada.

## Escopo

- Catálogo de doces artesanais e detalhes do produto;
- Carrinho e envio de pedidos sem pagamento online;
- Administração de produtos e pedidos;
- Backend JavaScript com TanStack Start, validações Zod e persistência Base44;
- Modelos de dados em `base44/entities/`.

## Evidências de qualidade

- Histórico de compilação com correção de importação no painel de produtos;
- Base44 reportou testes internos de funções de backend;
- Revisão estrutural dos arquivos de rota, esquemas e regras de cálculo;
- Não foram confirmados testes E2E reais no navegador nessa sincronização.

## Documentação acadêmica

- [PDF técnico do Base44](https://base44.app/api/apps/6af46ee5dcb326846e0cb87a/files/mp/public/6af46ee5dcb326846e0cb87a/7b5f2e18c_Doce-Oficio-Documentacao-PITE-II.pdf) — documento separado do site.
- [Site publicado](https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app).
- [Projeto Python independente](../README.md) — inclui matriz de testes para o projeto FastAPI, que não deve ser confundida com os testes da versão Base44.

**Observação:** esta atualização é uma cópia pontual dos arquivos. O Base44 não está conectado diretamente ao GitHub neste plano, então futuras mudanças na aplicação não serão sincronizadas automaticamente.

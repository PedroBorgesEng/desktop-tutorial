# Relatório acadêmico de implementação — Situação-Problema 2

**Curso:** Engenharia de Software
**Disciplina:** Projeto Integrador Transdisciplinar em Engenharia de Software II
**Tema do sistema:** Loja virtual de Cupcakes Gourmet
**Entrega técnica:** Front-end HTML5/CSS3/JavaScript e back-end Python/FastAPI em arquitetura MVC com camada de serviços e SQLite
**Data da implementação e testes:** 11/11/2026

## 1. Contextualização

O problema estudado consiste em informatizar a vitrine de uma confeitaria artesanal, facilitar a escolha de produtos e permitir que clientes registrem pedidos. A solução usa o planejamento desenvolvido no Projeto Integrador I como ponto de partida e abrange o ciclo principal do negócio: catálogo, cadastro, autenticação, carrinho, endereço, pedido, consulta e cancelamento, além de operações administrativas.

## 2. Objetivo geral

Construir e testar uma aplicação web que integre uma interface acessível a usuários não técnicos e regras de back-end responsáveis por persistência, validação, autorização e consistência do estoque, utilizando separação de responsabilidades.

## 3. Implementação do front-end

O arquivo `index.html` contém navegação, vitrine, filtros, formulários e seções de informação. `styles.css` define cores, tipografia, componentes visuais e layout responsivo. `app.js` consulta a API via `fetch`, apresenta o carrinho e controla as telas/modais. `logic.mjs` contém funções puras de cálculo e formatação submetidas a testes unitários. O site adapta a vitrine a desktop, tablet e celular por regras de CSS.

## 4. Implementação do back-end

Os controllers em `main.py` expõem uma API REST, utilizando validações Pydantic em `schemas.py`. O modelo SQLAlchemy em `models.py` representa contas, sessões, produtos, endereços, pedidos, itens e avaliações. `services.py` centraliza cálculo de frete, validação de estoque, criação e cancelamento de pedidos. O sistema diferencia rotas públicas, autenticadas e administrativas. Valores monetários são inteiros em centavos; a criação do pedido e a baixa do estoque são transacionais.

## 5. Testes e tratamento de erros

Executados **14 testes backend/integrados** via Pytest/TestClient e **5 testes de funções JavaScript** via Node Test Runner, com resultados **19/19 aprovados**. A suíte inclui negativas: credencial incorreta, usuário sem privilégio, estoque insuficiente, status indevido, CEP inválido, pedido sem autenticação e recuperação de senha inválida. Foi implementado script E2E no navegador, mas sua execução foi impedida por política do Chromium da infraestrutura; essa limitação foi documentada em `TESTES.md`.

## 6. Entregáveis e correspondência ao enunciado

| Exigência do material da Situação 2 | Evidência |
|---|---|
| Construção da interface HTML, CSS e JS | `app/static/index.html`, `styles.css`, `app.js` |
| Back-end em linguagem sugerida | `app/main.py`, `models.py`, `services.py` (Python) |
| MVC recomendado | `docs/ARQUITETURA.md` e estrutura do projeto |
| Front/back funcionais e testados | `tests/test_api.py`, `tests/frontend.test.mjs`, `docs/TESTES.md` |
| Tratamento de erros e dados | Validações Pydantic, 401/403/404/409/422, transações |
| Manual e documentação | `README.md`, `docs/MANUAL.md`, `docs/REQUISITOS.md` |
| GIT/repositório | Arquivos distribuídos para versionamento; registrar URL final após envio ao GitHub |
| Vídeo narrado | Roteiro fornecido em `docs/ROTEIRO_VIDEO.md`; gravação humana pendente |

## 7. Considerações finais

A implementação permite demonstrar um fluxo de pedido com persistência e controle de acesso, sem presumir pagamentos reais. Os testes automatizados aprovados dão evidências pontuais da correção dos cenários cobertos, sem substituir validação de uso por pessoas ou teste real de navegador. Futuras evoluções incluem gateway financeiro, integração de e-mail, SGBD de produção, CI/CD e avaliações de usuários reais.

## Referência principal

CRUZEIRO DO SUL VIRTUAL. *Projeto Integrador Transdisciplinar em Engenharia de Software II*. Material didático, seções “Situação-Problema 2” (p. 32–34) e “Problema em Foco: Situação 2” (p. 38). Arquivo fornecido pelo estudante.

# Requisitos e rastreabilidade — Cupcake Gourmet

## Escopo do PITE II

O PDF de referência estabelece na **Situação-Problema 2**: criar código de interface HTML/CSS/JavaScript, construir código de processamento de dados no back-end (MVC recomendado), usar uma linguagem sugerida (neste projeto, Python), demonstrar componentes funcionais e testados, tratar erros e manter o código disponível em GIT. A seção "Problema em Foco" solicita documentação, manual e demonstração narrada.

O domínio foi recuperado do planejamento anterior do Projeto Integrador I: vitrine de cupcakes gourmet, cadastro, login, busca, carrinho, pagamento, endereço, pedidos, cancelamento e controle administrativo de produtos/estoque/pedidos. **Adaptação de escopo:** o pagamento está simulado por ausência de credenciais do meio de pagamento; não são coletados números de cartão.

## Requisitos funcionais implementados

| ID | Requisito | Implementação | Testes |
|---|---|---|---|
| RF01 | Cadastro e autenticação do cliente | `POST /auth/register`, `/auth/login`, `/auth/me`, `/auth/logout` | `test_registration_and_session` |
| RF02 | Visualizar, buscar e filtrar cupcakes | `/api/products` e vitrine responsiva | `test_catalog_search_category_and_featured` |
| RF03 | Adicionar/remover e atualizar carrinho | `app/static/app.js`, estado em `localStorage` | `frontend.test.mjs` |
| RF04 | Cadastrar endereços de entrega | `/api/addresses` | `test_addresses_private_and_validation` |
| RF05 | Finalizar pedido demonstrativo com pagamento indicado | `POST /api/orders`, `make_order` | `test_checkout_calculation_order_and_inventory` |
| RF06 | Validar estoque e reservar unidades | `services.make_order` | `test_insufficient_stock_does_not_create_order` |
| RF07 | Consultar pedidos | `GET /api/orders` | `test_checkout_calculation_order_and_inventory` |
| RF08 | Cancelar pedido e recompor estoque | `POST /api/orders/{id}/cancel` | `test_cancellation_restocks_and_prevents_duplicate` |
| RF09 | Recuperar senha em modo demonstrativo | `/api/auth/forgot-password`, `/reset-password` | `test_recovery_single_use_invalidates_session` |
| RF10 | Administrador cadastrar/editar/desativar cupcakes e gerenciar estoque | `/api/admin/products` | `test_admin_role_and_product_crud` |
| RF11 | Administrador visualizar/atualizar pedidos | `/api/admin/orders`, transições | `test_order_status_transitions_and_no_cancel_after_sent` |
| RF12 | Coletar avaliações de colegas | `POST /api/feedback`, `/api/admin/feedback` | `test_feedback_for_five_external_testers_can_be_collected` |

## Não funcionais

| ID | Categoria | Critério e implementação |
|---|---|---|
| RNF01 | Usabilidade | HTML semântico, rótulos de formulário, mensagens de erro e modal com botão de fechar |
| RNF02 | Responsividade | Breakpoints a 1000 px e 720 px, cartões adaptativos |
| RNF03 | Segurança | Hash PBKDF2 com salt; token opaco com SHA-256 em banco; acesso por papel; validação com Pydantic; erros sem stack trace para usuário |
| RNF04 | Integridade | Preços em centavos, atomicidade do pedido, reserva de estoque condicional, rejeição de quantidades inválidas |
| RNF05 | Manutenibilidade | Separação `models`, `schemas`, `services`, `main` e `static` |
| RNF06 | Testabilidade | 14 testes de API/integrados, 5 testes de lógica JS, banco isolado |
| RNF07 | Acessibilidade | Atributos `lang`, `label`, `aria-label`, contraste básico; auditoria WCAG automatizada não executada |

## Regras de negócio

- RN01: pedido exige usuário e endereço pertencente a ele.
- RN02: preço unitário e nome do produto são registrados como snapshot na compra.
- RN03: estoque não pode ficar negativo; pedido só confirma após reserva de todas as unidades.
- RN04: compras a partir de R$ 80 recebem frete demonstrativo grátis; abaixo, R$ 9,90.
- RN05: máximo de 30 unidades por produto em um pedido.
- RN06: usuário comum não pode consultar ou alterar dados administrativos nem pedidos alheios.
- RN07: status segue `recebido → preparando → enviado → entregue` ou cancelado antes do envio.
- RN08: PIX e cartão são apenas tipos demonstrativos; `payment_status` permanece `pendente`.
- RN09: URLs de redefinição de senha expiram após 15 minutos e o token só é aceito uma vez.

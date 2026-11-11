# Relatório de verificação e validação — 11/11/2026

## Ambiente e execução

**Aplicação:** Cupcake Gourmet 1.0.0 | **Backend:** Python 3.13 / FastAPI / SQLite / Pytest | **Frontend:** HTML/CSS/JavaScript ES Modules / Node.js 22.

Comandos executados a partir da raiz do projeto:

```text
$ python -m pytest -q
..............                                                           [100%]
14 passed in 3.08s

$ node --test tests/frontend.test.mjs
1..5
# tests 5
# pass 5
# fail 0
```

Os testes de API usam `fastapi.testclient.TestClient` com um banco temporário recriado a cada teste, de modo que os pedidos não contaminam a base de outros casos.

## Matriz de testes de backend/integrados

| Caso | Cenário validado | Resultado |
|---|---|---|
| TB01 | API viva, HTML entregue e OpenAPI acessível | Aprovado |
| TB02 | Catálogo, categoria, texto e destaques | Aprovado |
| TB03 | Registro válido/inválido, login, logout, sessão e e-mail duplicado | Aprovado |
| TB04 | Recuperação por token de uso único e invalidação de sessões | Aprovado |
| TB05 | Endereços privados e CEP inválido | Aprovado |
| TB06 | Fechamento de pedido, estoque, valores e frete | Aprovado |
| TB07 | Frete grátis a partir de R$80 e junção de itens repetidos | Aprovado |
| TB08 | Estoque insuficiente não gera pedido | Aprovado |
| TB09 | Endereço inexistente ou de outra pessoa bloqueado | Aprovado |
| TB10 | Cancelamento repõe estoque e impede cancelamento duplicado | Aprovado |
| TB11 | Permissões administrativas e CRUD de produtos | Aprovado |
| TB12 | Etapas do pedido e proibição de cancelamento após envio | Aprovado |
| TB13 | Payload inválido e autenticação obrigatória | Aprovado |
| TB14 | Gravação e leitura administrativa de feedback | Aprovado |

## Matriz de front-end — testes de funções puras

| Caso | Cenário validado | Resultado |
|---|---|---|
| TF01 | Conversão de centavos em BRL | Aprovado |
| TF02 | Quantidade do carrinho e subtotal | Aprovado |
| TF03 | Regra de frete grátis exatamente em R$80 | Aprovado |
| TF04 | Escape de marcação HTML de textos dinâmicos | Aprovado |
| TF05 | Restrições de quantidades e estoque | Aprovado |

## Testes de navegador (E2E)

O script `tests/e2e_smoke.py` foi implementado para tentar testar: carregamento da vitrine, categoria, carrinho, registro/login, endereço, finalização e acompanhamento de pedido, painel administrativo e viewport mobile. **Não há resultado E2E aprovado nesta entrega.** A tentativa em Chromium/Playwright foi interrompida no primeiro `page.goto` pela política da infraestrutura: `net::ERR_BLOCKED_BY_ADMINISTRATOR` tanto em `http://127.0.0.1:8771` quanto em `localhost` e arquivo local. Assim, **não há capturas de tela validadas**, e não foi alegado que esse roteiro passou. O servidor respondeu a `/api/health` com HTTP 200 via `curl`.

Para reexecutar em máquina própria com navegador permitido:

```bash
pip install playwright
playwright install chromium
# terminal 1: execute o servidor na porta 8771, com admin configurado
# terminal 2:
E2E_BASE_URL=http://127.0.0.1:8771 E2E_SCREENSHOTS=1 python tests/e2e_smoke.py
```

Em PowerShell, defina `$env:E2E_BASE_URL`, `$env:E2E_SCREENSHOTS` e execute `python tests/e2e_smoke.py`. Ajuste `CHROMIUM_PATH` para o binário local se necessário. **Atenção:** o script usa o usuário demo `admin@cupcake.test` / `SenhaForte123!`; só execute contra um banco de testes com conta criada explicitamente, nunca produção.

## Limitações conhecidas e testes futuros

- Sem auditoria WCAG automatizada nem avaliação com cinco usuários reais (Situação 3).
- Sem teste E2E concluído em navegador real; recomendada execução local após liberação do ambiente.
- Sem teste de carga, concorrência multi-instância, análise SAST ou teste contra PostgreSQL.
- Gateway de pagamento, entrega real e serviço de recuperação por e-mail **não** implementados.
- SQLite é suficiente para uso local; publicar uma loja real requer um banco de dados de produção, HTTPS e controles extras.

## Critério de conclusão

**Verificação automatizada das rotas, regras de negócio e funções puras de front-end: aprovada (19/19).** **Validação completa da interface em navegador e com usuários reais: pendente.** Esses resultados não significam que todo o sistema foi testado exaustivamente; registram apenas as evidências e cenários executados.

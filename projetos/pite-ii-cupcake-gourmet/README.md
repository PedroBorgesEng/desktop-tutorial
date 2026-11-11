# 🧁 Cupcake Gourmet — Projeto Integrador em Engenharia de Software II

**Situação-Problema 2 · Implementação e testes de front-end/back-end · 11/11/2026**

Aplicação web full-stack de uma confeitaria artesanal, que dá continuidade ao planejamento do Projeto Integrador I. O cliente visualiza cupcakes, pesquisa produtos, cria conta, salva endereço, monta carrinho, emite pedidos demonstrativos e acompanha ou cancela pedidos. O administrador controla catálogo, preços, estoque, pedidos e avaliações.

> **Pagamento acadêmico/simulado.** PIX e cartão **não** efetuam pagamentos reais. Não existe gateway financeiro, captura de dados bancários ou envio de e-mail. A implementação serve para demonstrar regras de negócio e integrações de software.

## Tecnologias

| Camada | Implementação |
|---|---|
| Front-end | HTML5 semântico, CSS3 responsivo, JavaScript ES Modules |
| Back-end | Python, FastAPI, Pydantic, SQLAlchemy |
| Banco de dados | SQLite (persistência local e testes isolados) |
| Arquitetura | Model / View / Controller com camada de serviços |
| Testes | Pytest + HTTPX/TestClient; `node --test` para funções puras de interface |
| Documentação de API | Swagger automático em `/docs` |

## Rodar o software

Requer **Python 3.11+** e, para testar funções de interface, **Node.js 20+**.

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Abra **http://127.0.0.1:8000/** (site) ou **http://127.0.0.1:8000/docs** (endpoints). O servidor prepara o banco `cupcake.db` e carrega **oito produtos fictícios** quando o banco está vazio.

Para acessar o painel administrativo, crie a conta admin na primeira inicialização **por variáveis de ambiente**:

```powershell
# PowerShell — configure ANTES de iniciar o servidor
$env:ADMIN_EMAIL="admin@exemplo.com"
$env:ADMIN_PASSWORD="SuaSenhaForteEUnica123!"
python -m uvicorn app.main:app --reload
```

```bash
# Bash/Linux/macOS
export ADMIN_EMAIL='admin@exemplo.com'
export ADMIN_PASSWORD='SuaSenhaForteEUnica123!'
python -m uvicorn app.main:app --reload
```

Depois, entre na loja com a conta e selecione **Minha conta → Painel administrativo**. **Não publique senhas no GitHub.** `ADMIN_EMAIL`/`ADMIN_PASSWORD` só criam o primeiro usuário administrador, não alteram senhas de contas existentes.

## Testar

```bash
python -m pytest -q
node --test tests/frontend.test.mjs
```

Resultados verificados em 11/11/2026: **14/14 testes de API e regras de negócio aprovados** e **5/5 testes unitários JS aprovados**. Consulte [`docs/TESTES.md`](docs/TESTES.md) para a matriz de testes, comandos, limitações e evidências. O script opcional de testes de navegador é `tests/e2e_smoke.py`; testes E2E **não foram aprovados/executados integralmente** nesta entrega, pois o navegador da infraestrutura bloqueou todas as navegações por política administrativa.

## Organização

```text
app/
  database.py       # Sessões e engine SQLAlchemy
  models.py         # Entidades do domínio / tabelas
  schemas.py        # DTOs e validações
  security.py       # Senhas PBKDF2 e tokens opacos
  services.py       # Regras de pedido, estoque e cancelamento
  main.py           # Rotas HTTP e controllers
  seed.py           # Produtos demonstrativos
  static/
    index.html      # View HTML5
    styles.css      # Design responsivo
    app.js          # Interações com a API, estado e formulários
    logic.mjs       # Funções puras testadas

tests/
  test_api.py        # 14 testes de integração / backend
  frontend.test.mjs # 5 testes de JS do frontend
  e2e_smoke.py      # Cenários de navegador (não concluídos aqui)
docs/               # Requisitos, modelagem, arquitetura, manual, testes, roteiro
```

## Endpoints principais

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/products` | Catálogo, filtros e busca |
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Autenticar e emitir token |
| GET | `/api/auth/me` | Usuário autenticado |
| POST | `/api/auth/forgot-password` | Solicitar recuperação demo |
| POST | `/api/auth/reset-password` | Trocar senha por token válido |
| GET/POST | `/api/addresses` | Listar/adicionar endereços |
| POST | `/api/orders` | Criar pedido, validar e reservar estoque |
| GET | `/api/orders` | Histórico de pedidos do cliente |
| POST | `/api/orders/{id}/cancel` | Cancelar e repor estoque |
| GET | `/api/admin/summary` | Indicadores para administrador |
| GET/POST/PATCH/DELETE | `/api/admin/products` | Gerir catálogo, preços e estoque |
| GET/PATCH | `/api/admin/orders` | Gestão e transição de status |
| POST | `/api/feedback` | Avaliações para testes com colegas |

Rotas com dados privados exigem `Authorization: Bearer <token>`; as administrativas exigem o papel `is_admin`. Todos os dados de pedidos persistem no banco local, não no navegador.

## Regras importantes

- Preços em **centavos inteiros** para evitar erros de ponto flutuante.
- Frete demonstrativo: **R$ 9,90** para compras abaixo de **R$ 80,00**, grátis a partir desse valor.
- Um produto precisa estar ativo, ter estoque e a quantidade por produto deve ficar entre 1 e 30.
- Cadastro de pedido utiliza **transação SQL** e atualização condicional do estoque para impedir venda acima do disponível.
- Cancelamento antes do envio repõe o estoque. Pedidos enviados/entregues não podem ser cancelados pelo cliente.
- Endereço e preços dos itens são copiados para o pedido, preservando o histórico.
- Recuperação de senha: token de uso único, 15 minutos; exibição de token **apenas** quando `APP_ENV=development` e o e-mail existe. Em produção, integrar serviço SMTP/transactional antes de usar a função.

## Limites conhecidos

Este MVP **não** implementa cobrança real, cálculo logístico por CEP, envio automático de e-mails, migrações formais, NF-e, hospedagem pública nem autenticação social. Antes de disponibilizar a clientes reais, configurar `APP_ENV=production`, `SEED_DEMO=0`, HTTPS, rate limiting, serviço de e-mail, proteção reforçada da sessão, banco gerenciado e auditoria de segurança. O sistema é um projeto acadêmico demonstrativo, não uma loja pronta para processamento de pagamentos.

## Documentação da disciplina

- [`docs/REQUISITOS.md`](docs/REQUISITOS.md) — requisitos, regras e rastreabilidade.
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — MVC, serviços, fluxo e DER.
- [`docs/TESTES.md`](docs/TESTES.md) — testes executados, resultados, cobertura e limitações.
- [`docs/MANUAL.md`](docs/MANUAL.md) — manual do cliente e do administrador.
- [`docs/RELATORIO_SITUACAO2.md`](docs/RELATORIO_SITUACAO2.md) — síntese acadêmica de implementação.
- [`docs/ROTEIRO_VIDEO.md`](docs/ROTEIRO_VIDEO.md) — roteiro de gravação para apresentação.

**Referência do enunciado:** `PITESoftwareII.pdf`, seções "Situação-Problema 2" (páginas 32–34) e "Problema em Foco", Situação 2 (página 38). Linguagem escolhida entre as sugeridas pelo enunciado: **Python**.

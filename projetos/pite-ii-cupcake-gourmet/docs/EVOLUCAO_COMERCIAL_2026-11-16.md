# Evolução comercial — 16/11/2026

## Objetivo

Preparar a loja Doce Ofício (Cupcake Gourmet) para uma futura operação comercial com pedidos e pagamento online.

## Entrega técnica

- Stripe instalado e configurado no **sandbox** (não live).
- Endpoint `POST /api/checkout` cria um pedido validado no servidor, usa preços do catálogo e solicita uma sessão Stripe.
- Endpoint `POST /api/stripe-webhook` valida assinatura de origem Stripe, estado de pagamento, moeda e valor.
- Entidade `Pedido` com `pagamento_status`, `stripe_session_id`; entidade `Produto` com `estoque` e `prazo_dias`.
- Aviso visível de homologação em páginas públicas e carrinho.
- Desativado o `POST /api/pedidos` legado (410), que permitia reservar sem checkout.
- Retorno do checkout fixado ao domínio oficial, não ao cabeçalho enviado pelo cliente.
- Novo código sincronizado manualmente na pasta `base44-site` do repositório.

## Verificação e status

- Base44: aplicação em estado ready; pré-visualização gerada e site publicado.
- Stripe: modo sandbox, nenhum credencial live configurado.
- Histórico do construtor: execuções de teste de funções de pagamento e webhook.
- Teste automatizado de navegador: **não executado** (limite mensal do serviço); não reportar como aprovado.
- Dados pessoais existentes: mantidos no banco Base44, **não** copiados ao GitHub.

## Pendências antes de aceitar vendas reais

1. Confirmar proprietário e dados reais do estabelecimento, atendimento, telefone, e-mail, fotos, descrições, preços e disponibilidade de cada produto.
2. Definir regiões de entrega, taxa de entrega, retirada, prazos, horário de funcionamento e limite de capacidade.
3. Completar onboarding/KYC do provedor de pagamento e cadastrar método de recebimento; não inserir chaves privadas no código/GitHub.
4. Testar pagamento real controlado, confirmação de webhook, cancelamento, reembolso e conciliação financeira.
5. Rever concorrência no estoque e recuperação de reservas cujo checkout foi abandonado ou expirou; o snapshot atual não comprova processamento transacional seguro.
6. Publicar termos de venda, privacidade, política de cancelamento e dados do fornecedor, revisados conforme legislação aplicável.
7. Realizar testes ponta a ponta em dispositivos móveis e desktop antes da abertura comercial.

## Links

- [Loja em homologação](https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app)
- [Código atual da versão Base44](../base44-site/)
- [Documentação acadêmica em PDF](./Documentacao_Versao_Base44_Situacao_2.pdf)

**Situação:** versão de homologação comercial publicada; ainda não apta a receber pagamentos reais.

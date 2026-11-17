# Manual do usuário e administrador

## Cliente

1. Acesse `/` pelo navegador e navegue pela vitrine; escolha uma categoria ou digite na busca.
2. Clique no botão `+` do produto para incluir no carrinho; o contador no cabeçalho aumenta.
3. Abra **Carrinho**, altere quantidades com `+`/`−` e clique em **Finalizar pedido**.
4. Se for seu primeiro acesso, crie uma conta com nome, e-mail e senha de pelo menos oito caracteres. Entre em seguida.
5. Cadastre um endereço com rua, número, bairro, cidade, UF e CEP de oito dígitos.
6. Confira o resumo, escolha **PIX (simulação)**, **Cartão (simulação)** ou **Pagamento na entrega** e confirme.
7. O sistema emite o número do pedido e o registra com pagamento pendente. Acesse **Minha conta → Meus pedidos** para acompanhar.
8. Se o pedido ainda não foi enviado, use **Cancelar pedido**; o estoque é reposto.
9. Para recuperar a senha em **desenvolvimento**, escolha **Esqueci minha senha**: o sistema exibe a tela de redefinição sem enviar e-mail. Em produção, o envio de e-mail ainda precisa ser integrado.

**Importante:** Esta loja é demonstrativa. Não compre acreditando que existe entrega ou processamento financeiro real. As opções financeiras não capturam cartão nem executam PIX.

## Administrador

1. Inicie o servidor com `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos antes de o usuário admin ser criado.
2. Entre normalmente pelo botão **Entrar** e abra **Minha conta → Painel administrativo**.
3. Em **Produtos**, cadastre, edite preço, estoque, categoria e disponibilidade de cupcakes.
4. Em **Pedidos**, veja as encomendas, destino e valores; avance o status na ordem definida.
5. Em **Visão geral**, veja contadores. O total financeiro mostrado é **valor de pedidos não cancelados**, e não receita recebida.
6. Em **Avaliações**, consulte os feedbacks das pessoas que testaram o software.

## Mensagens esperadas

- `E-mail já cadastrado` (409): usar outro e-mail ou fazer login.
- `Sessão inválida ou expirada` (401): entrar novamente.
- `Acesso restrito ao administrador` (403): usuário sem privilégios.
- `Estoque insuficiente` (409): reduzir quantidade e atualizar a vitrine.
- `Transição de status não permitida` (409): usar a sequência correta.
- `422`/erro de formulário: corrigir campo obrigatório, CEP, senha ou quantidade.

## Testes com colegas (Situação 3 opcional)

Acesse o link **Avaliar o site** no rodapé e registre nome do testador, funcionalidade, se funcionou e comentário. A coleta de cinco participantes reais **ainda não foi realizada**; não foram inventadas opiniões. Para o relatório final com consentimento dos avaliadores, solicite data, função testada, falhas e capturas de tela se houver.

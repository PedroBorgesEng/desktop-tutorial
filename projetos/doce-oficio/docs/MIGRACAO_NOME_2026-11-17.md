# Alteração de identidade do projeto — 17/11/2026

A aplicação pública mudou o **nome de exibição** no Base44 de `Cupcake Gourmet | PITE II` para **Doce Ofício**. O endereço hospedado originalmente permanece o mesmo para evitar quebrar links existentes.

No GitHub, o diretório do projeto foi renomeado de `projetos/pite-ii-cupcake-gourmet/` para `projetos/doce-oficio/`.

O código da loja foi renomeado de `base44-site/` para `loja-web/`. A implementação acadêmica em `app/`, os documentos em `docs/` e os testes foram preservados.

A configuração oficial `is_remixable=false` foi aplicada à aplicação para desativar a opção de remix e ocultar o selo de Base44 **quando permitido pelo plano/plataforma**. Nenhum CSS de ocultação foi incluído.

A conta PagBank **não foi conectada**. Nenhum token foi gerado ou armazenado. O checkout PagBank continua em homologação, com a trava `LIVE_RELEASE_APPROVED=false` impedindo cobrança real.

A sincronização entre o app Base44 e o repositório GitHub é manual. Mudanças futuras devem usar `projetos/doce-oficio/loja-web/`.

# PhraseForge

Gerador de frases naturais em inglês para Anki, com a identidade visual Explorer da Teacher Luma Neiva.

## Pronto
- Página única responsiva.
- Visual Explorer: verde floresta, creme/papel e terracota.
- 5 frases por estrutura.
- Frente em inglês + verso em português.
- Botão de copiar para cada lado e copiar tudo.
- Backend serverless para manter a API key fora do navegador.
- Configurado para Vercel + Node 24.

## IA
O PhraseForge usa a API compatível com OpenAI do OpenRouter e, por padrão, o roteador gratuito `openrouter/free`. O OpenRouter informa que esse roteador não cobra pelos tokens de entrada ou saída, embora existam limites e a disponibilidade dos modelos gratuitos possa variar.

## Deploy
Na Vercel, adicione nas Environment Variables:

`OPENROUTER_API_KEY` = sua chave do OpenRouter

`OPENROUTER_MODEL` = `openrouter/free` (opcional; esse é o padrão)

Nunca coloque a chave do OpenRouter no frontend.

## Segurança
A chave fica somente no backend serverless da Vercel.

## Deploy fix
A configuração do runtime do Vercel foi simplificada para permitir que o projeto use o runtime Node configurado no package.json.

## Trigger
GitHub integration verified; latest commit is intended to trigger the Vercel deployment from main.
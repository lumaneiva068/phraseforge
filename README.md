# PhraseForge

Gerador de frases naturais em inglês para Anki, com a identidade visual Explorer da Teacher Luma Neiva.

## Pronto
- Página única responsiva.
- Visual Explorer: verde floresta, creme/papel e terracota.
- 5 frases por estrutura.
- Copiar individual e copiar tudo.
- Backend serverless para manter a API key fora do navegador.
- Configurado para Vercel + Node 24.

## Deploy
Importe este repositório na Vercel e adicione nas Environment Variables:

`OPENAI_API_KEY` = sua chave

`OPENAI_MODEL` = modelo escolhido para sua conta (opcional; o código usa `gpt-5.6-luna` como padrão).

Nunca coloque a chave da OpenAI no frontend.
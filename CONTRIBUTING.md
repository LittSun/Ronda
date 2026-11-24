# Como contribuir

Obrigado pelo interesse no Ronda! Toda ajuda é bem-vinda: relatos de erro, sugestões, revisão de textos e código.

## Relatar um erro ou sugerir algo

- Pelo GitHub: abra uma *issue* descrevendo a página em que aconteceu, o que você fez, o que esperava e o que aconteceu. Se possível, inclua o que apareceu no console do navegador (F12).
- Pela wiki: deixe uma mensagem na [discussão do autor](https://pt.wikipedia.org/wiki/Usuário_Discussão:Little_Sunshine).
- Para opinar sobre a ferramenta em geral, há o questionário em [docs/questionario.wiki](docs/questionario.wiki).

Não publique em issues informações privadas de usuários (dados de CheckUser, IPs de contas, e-mails).

## Enviar alterações

1. Leia [docs/desenvolvimento.md](docs/desenvolvimento.md) e rode `npm install`.
2. Crie um branch a partir do `main`. Altere só `src/`, `ferramentas/` e `docs/`; `wiki/` e `dist/` são gerados.
3. Teste no console da wiki com o modo de simulação (`npm run console` e o pacote `dist/Ronda-console.js`).
4. Rode `npm run verificar` antes de abrir o pull request.
5. No pull request, descreva a mudança e como testou.

## Convenções

- **Interface:** só o jQuery UI 1.9.2 que vem com o MediaWiki (`dialog`, `button`, `autocomplete`, `progressbar`, `tooltip`), controles nativos do HTML e classes nativas. Nada de APIs do jQuery UI 1.10+.
- **Textos:** todo texto da interface vai em `src/Ronda-mensagens.js` e é usado com `ronda.msg( 'chave' )`, com o prefixo do arquivo (`core-`, `patrulha-`, `paginas-`, `admin-`). Conteúdo gravado na wiki (resumos, predefinições) e catálogos ficam fora.
- **Catálogos:** avisos, marcações, regras e motivos ficam em `src/Ronda-catalogo.js`, não espalhados pelo código.
- **Idioma:** português do Brasil, em textos, comentários e mensagens de commit; frases completas e sem jargão desnecessário.
- **Estilo:** tabulação para indentar e espaços dentro de parênteses e colchetes, como no código do MediaWiki.
- **Versão e histórico:** toda mudança visível ganha uma entrada no [CHANGELOG.md](CHANGELOG.md) (veja [Versões](docs/desenvolvimento.md#versões)).

## Licença

Ao contribuir, você concorda em licenciar o código sob a [MIT](LICENSE) e os textos sob a CC BY-SA 4.0, como descrito em [CREDITOS.md](CREDITOS.md).

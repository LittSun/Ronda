# Ronda

Versão **0.9.0** — veja o [histórico de versões](CHANGELOG.md).

Barra de patrulha, manutenção e administração para a **Wikipédia em português**. O Ronda reúne o **FastButtons** e o **DiffTools** (Reversão e avisos) numa só ferramenta, com recursos inspirados no **Twinkle**: reversão rápida, avisos com nível sugerido, marcações de manutenção, propostas de eliminação, pedidos, listas de patrulha e, para quem tem as permissões, eliminação, restauro, bloqueio, proteção, remoção de ligações e ações em lote.

A barra fica acima do título de cada página, muda conforme a página aberta e só mostra o que o usuário pode fazer. Ela funciona no computador e no celular, também no modo escuro.

**Estado:** beta, em uso como script de usuário na pt.wiki. A versão 1.0 será oferecida como gadget.

## Usar

A documentação para usuários fica na wiki: **[Usuário:Little Sunshine/Ronda](https://pt.wikipedia.org/wiki/Usuário:Little_Sunshine/Ronda)** (o texto-fonte está em [docs/documentacao.wiki](docs/documentacao.wiki)). Para instalar, acrescente à sua [common.js](https://pt.wikipedia.org/wiki/Especial:Minha_página/common.js):

```js
importScript( 'Usuário:Little Sunshine/Scripts/Ronda-loader.js' );
```

Para experimentar sem gravar nada, ligue o **modo de simulação** em *Preferências do Ronda*, no menu de ações.

## Desenvolver

```sh
npm install          # Node.js 18 ou mais novo
npm run verificar    # sintaxe, versão e mensagens
npm run construir    # verifica e gera wiki/ e dist/
```

O código fica em `src/`; as pastas `wiki/` (o conteúdo de cada página da wiki) e `dist/` (o pacote para o console) são geradas. Para testar sem criar páginas, cole `dist/Ronda-console.js` no console de qualquer página da wiki: ele já vem no modo de simulação.

| Documento | Para quê |
|---|---|
| [docs/desenvolvimento.md](docs/desenvolvimento.md) | Estrutura, comandos, testes, versões, integração contínua e publicação na wiki |
| [docs/referencia.md](docs/referencia.md) | Princípios, módulos, mensagens de interface, configuração e API interna |
| [docs/roteiro.md](docs/roteiro.md) | O que já foi feito, o que falta e as decisões para a 1.0 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Como relatar erros e enviar alterações |

## Créditos e licença

Código sob a [licença MIT](LICENSE); textos e documentação sob a CC BY-SA 4.0. Partes adaptadas de outras ferramentas continuam sob as licenças originais. Detalhes e créditos completos em [CREDITOS.md](CREDITOS.md).

Baseado no trabalho dos autores do **FastButtons** (Racso, Macy, Danilo.mac, Helder, !Silent e outros), do **DiffTools** (Lorian, Helder, !Silent, Albertoleoncio) e do **Twinkle** (AzaToth e colaboradores). Desenvolvimento: [Little Sunshine](https://pt.wikipedia.org/wiki/Usuário:Little_Sunshine).

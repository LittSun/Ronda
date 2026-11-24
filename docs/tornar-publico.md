# Lista para tornar o repositório público

O que conferir antes de mudar a visibilidade em *Settings › General › Danger Zone › Change visibility*.

## Já feito

- [x] Estrutura organizada (`src/`, `ferramentas/`, `docs/`, arquivos gerados em `wiki/` e `dist/`).
- [x] Licenças: [LICENSE](../LICENSE) (MIT, código) e [CREDITOS.md](../CREDITOS.md) (CC BY-SA 4.0 para textos, créditos das ferramentas de origem).
- [x] [README](../README.md), [CONTRIBUTING.md](../CONTRIBUTING.md) e documentação em `docs/`.
- [x] Nenhuma senha ou token no código: a publicação usa os segredos `WIKI_BOT_USER` e `WIKI_BOT_PASSWORD` do GitHub, que não ficam visíveis num repositório público.
- [x] E-mail pessoal retirado do histórico (os commits passaram a usar o endereço `noreply` do GitHub).
- [x] Capturas de tela de teste que tinham entrado por engano retiradas.

## Antes de publicar

- [ ] **Referências de pull requests antigos.** O GitHub guarda uma cópia de cada pull request (`refs/pull/N/head`), que não pode ser apagada pelo dono do repositório. Os PRs #1 a #10 foram abertos antes da reescrita do histórico e ainda mostram os commits antigos, com o e-mail. Há duas saídas:
  - criar um **repositório novo** (ex.: `LittSun/Ronda` → renomear este para `Ronda-arquivo`, privado, e criar um `Ronda` novo, público, com `git push` do `main` atual); ou
  - pedir ao [suporte do GitHub](https://support.github.com/) que remova as referências dos PRs.
- [ ] **Branches antigos** (`watchlist-preferencias`, `menus-por-contexto` etc.): já estão mesclados; apague-os em *Branches* (eles também guardam os commits antigos).
- [ ] **Licença das partes adaptadas.** O código derivado do FastButtons, do DiffTools e do Twinkle veio de páginas da wiki, que estão sob CC BY-SA. O [CREDITOS.md](../CREDITOS.md) já diz que essas partes continuam sob as licenças originais; se quiser o repositório inteiro em MIT sem ressalvas, peça a concordância dos autores dessas ferramentas ou troque a licença do código para CC BY-SA 4.0.
- [ ] **Configurações do repositório:** ativar *Issues*; em *Settings › Branches*, proteger o `main` (exigir pull request e a verificação *Construir*), deixando o robô do Actions gravar os arquivos gerados; em *Settings › Actions › General*, manter "Read and write permissions" para o `GITHUB_TOKEN`.
- [ ] Descrição e tópicos do repositório (ex.: `wikipedia`, `mediawiki`, `gadget`, `userscript`, `pt-wiki`) e o link para a documentação na wiki.

# Ronda — desenvolvimento

Como o repositório está organizado e como gerar, testar e publicar o Ronda. Para a API interna e os módulos, veja [referencia.md](referencia.md).

## Estrutura

| Pasta ou arquivo | Conteúdo |
|---|---|
| `src/Ronda-loader.js` | Carregador para uso como script de usuário (não faz parte do gadget) |
| `src/Ronda-mensagens.js` | Mensagens de interface: todos os textos que a interface mostra, por chave. Roda antes do núcleo |
| `src/Ronda-core.js` | Contexto, API, componentes de interface, ajudantes comuns, preferências, barra e inicialização. Guarda a versão em `ronda.version` |
| `src/Ronda-catalogo.js` | Catálogos: manutenção, avisos, motivos de eliminação, ER, ESR, pedidos, busca e PetScan |
| `src/Ronda-patrulha.js` | Reverter, Avisar, Usuário, Listar e reversão rápida/restaurar versão |
| `src/Ronda-paginas.js` | Manutenção, ER, ESR, Consenso, Mover, #R, Esboço, Fusão, Busca, PetScan, Informações, Pedido e Não assinou |
| `src/Ronda-admin.js` | Eliminar, Desligar, Proteger, Bloquear, Restaurar e Lote |
| `src/Ronda.css` | Estilo da barra, layout mínimo dos formulários e modo escuro |
| `ferramentas/` | Scripts em Node: verificar, gerar os arquivos da wiki, gerar o pacote de console, publicar na wiki e carregar no console a partir de um servidor local |
| `wiki/` | **Gerado.** Conteúdo exato de cada página em `Usuário:Little Sunshine/Scripts/` (sem comentários, com o cabeçalho) e `Ronda-Versao.wiki` |
| `dist/Ronda-console.js` | **Gerado.** Pacote único para colar no console |
| `docs/` | Referência técnica, roteiro, a página de documentação da wiki (`documentacao.wiki`) e o questionário (`questionario.wiki`) |

Edite só `src/`, `ferramentas/` e `docs/`. As pastas `wiki/` e `dist/` são geradas e o GitHub Actions as atualiza sozinho no `main`.

## Preparar

Precisa do [Node.js](https://nodejs.org/) 18 ou mais novo.

```sh
npm install
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm test` | Roda os testes de `tests/` (funções puras e regressões de segurança, em jsdom com API simulada; nada sai para a rede) |
| `npm run verificar` | Confere a sintaxe de todos os arquivos, se a versão do `package.json` é a mesma de `ronda.version` e se toda chave usada em `ronda.msg()` existe em `src/Ronda-mensagens.js` |
| `npm run wiki` | Gera `wiki/` |
| `npm run console` | Gera `dist/Ronda-console.js` |
| `npm run construir` | Verifica, testa e gera (`verificar`, `test`, `wiki` e `console`, nessa ordem) |
| `npm run publicar` | Publica na wiki as páginas de `wiki/` que mudaram (veja [Publicar](#publicar-na-wiki)) |

O gerador da wiki tira os comentários com um analisador de JavaScript (não toca em strings nem em expressões regulares), acrescenta o cabeçalho (`@target` para o carregador, descrição, ligação para a documentação, ligações para todos os arquivos, `<nowiki>`; no CSS, as mesmas linhas como comentários de CSS) e confere se o resultado continua válido. Para outro prefixo de páginas, use a variável `RONDA_BASE`; para outra página de documentação, `RONDA_DOC`.

## Testar antes de publicar

Não é preciso criar nenhuma página na wiki. Nas duas formas abaixo, a barra aparece com a marca **Simulação**: as leituras vão para a API normalmente, mas nenhuma escrita é enviada. Cada edição, eliminação, bloqueio, proteção ou moção aparece no console com todos os parâmetros.

**A. Pacote único.** Gere `npm run console`, abra qualquer página da wiki, abra o console (F12), cole o conteúdo inteiro de `dist/Ronda-console.js` e pressione Enter.

**B. Arquivos do seu computador.** Na pasta `src/`, rode `python3 -m http.server 8000` (ou `npx http-server -p 8000`) e cole `ferramentas/carregar-no-console.js` no console. Os arquivos são baixados sem cache; a cada alteração, basta colar o trecho de novo.

Dicas:
- Ative **Preservar log** no console, porque alguns módulos recarregam a página ao terminar.
- Salve o trecho como *Snippet* nas ferramentas do navegador para não colar sempre.
- Colar de novo remove a barra anterior.
- Para gravar de verdade, troque `dryRun: true` por `dryRun: false` no início do trecho, em páginas de teste.
- As funções puras podem ser testadas direto no console, por exemplo `ronda.unlinkText( '[[Brasil|país]] e [[Brasil]]', 0, 'Brasil' )`.

## Modo de teste

Só para a conta do desenvolvedor (`ronda.TEST_USER`, hoje `Little Sunshine`). No console do navegador:

```js
ronda.modoTeste( true );   // liga e recarrega a página
ronda.modoTeste( false );  // desliga e recarrega
ronda.modoTeste();         // true se estiver ligado
```

Ligado, a barra mostra **todos os módulos em todos os domínios**, inclusive os que normalmente só abrem por outros (ER, ESR, Consenso), sem consultar a disponibilidade de cada um, e ganha o selo **Teste**. Se um módulo falhar ao abrir fora do contexto previsto, o erro vai para o console e para uma notificação. Os direitos da conta continuam valendo: o que ela não pode fazer, a API recusa. Fica salvo só neste navegador (`localStorage`, chave `ronda-modo-teste`). Para testar sem gravar nada, combine com o modo de simulação (`window.rondaConfig = { dryRun: true }`).

## Versões

1. Suba o número em **dois** lugares: `version` em `src/Ronda-core.js` e em `package.json` (o `npm run verificar` acusa se ficarem diferentes).
2. Atualize `ronda.news` em `src/Ronda-core.js` (até três frases curtas com as novidades para quem usa; aparecem no meta-painel e na faixa que se abre depois da atualização). Acrescente a entrada no topo de [CHANGELOG.md](../CHANGELOG.md) e atualize a versão no topo do [README](../README.md). A versão da infobox da documentação é preenchida na geração, ligada ao histórico (`[[/Changelog#0.7.15|0.7.15]]`).
3. Para marcar uma versão fechada: `git tag v1.0.0 && git push --tags`. O Actions anexa `Ronda-wiki.zip` e `Ronda-console.js` à versão no GitHub.

Esquema: `0.MENOR.CORREÇÃO` até a 1.0, que será a primeira publicada como gadget.

- **MENOR** (0.7.x → 0.8.0): função, botão, painel, opção ou tema novo, ou mudança de comportamento que quem usa percebe.
- **CORREÇÃO** (0.8.0 → 0.8.1): erro corrigido, texto ajustado, entrada nova num catálogo que já existe, ajuste visual pequeno.
- Várias mudanças juntas: vale a maior. Ferramentas de desenvolvimento (como o modo de teste) não sobem a versão.

## Integração contínua

O workflow [`.github/workflows/construir.yml`](../.github/workflows/construir.yml) roda `npm run construir`:

| Quando | O que faz |
|---|---|
| Pull request | Verifica e gera; os arquivos ficam para download na aba *Actions* |
| Push no `main` que mexa em `src/`, `ferramentas/`, `package*.json`, `CHANGELOG.md` ou `docs/documentacao.wiki` | Verifica, gera, grava `wiki/` e `dist/` num único commit do robô (se mudaram) e publica na wiki |
| *Run workflow* | O mesmo, sob demanda; com **Só simular**, mostra o que mudaria na wiki, sem editar |
| Tag `v*` | Anexa os arquivos gerados à versão |

Como o robô grava no `main` depois de cada push, rode `git pull --rebase` antes do próximo `git push`.

## Publicar na wiki

**Aprovação manual (recomendado):** em *Settings › Environments*, crie (ou abra) o ambiente `wiki` e marque **Required reviewers** com a sua conta. Assim, cada publicação espera um clique de aprovação na aba *Actions*. Os segredos podem ficar no repositório ou no próprio ambiente.

Além do código, o workflow publica:

| Origem | Página | Como |
|---|---|---|
| [CHANGELOG.md](../CHANGELOG.md) | `Usuário:Little Sunshine/Ronda/Changelog` | Convertido em wikitexto; cada versão tem âncora com o número (`#0.7.15`). Seções que não são versões (ex.: "Repositório") ficam de fora |
| [docs/documentacao.wiki](documentacao.wiki) | `Usuário:Little Sunshine/Ronda` | Como está, com a versão da infobox atualizada |

**Documentação:** é para quem usa a ferramenta, não para quem a desenvolve. Registre nela só o que muda o uso (botões, opções, comportamentos que a pessoa nota), em linguagem simples; detalhes internos e correções pequenas ficam só no CHANGELOG.

**Edições feitas na wiki:** a documentação e o histórico só são substituídos se a última edição foi da própria publicação (resumo "Atualização do Ronda…"). Se alguém editou na wiki, a página é pulada com um aviso no Actions: leve a mudança para o arquivo do repositório e rode o workflow com **Substituir a documentação mesmo se editada na wiki**.

O workflow publica as páginas que mudaram em `Usuário:Little Sunshine/Scripts/` com uma senha de robô. O carregador vai por último, para que só peça arquivos já atualizados.

1. Em [Especial:BotPasswords](https://pt.wikipedia.org/wiki/Especial:BotPasswords), crie uma senha de robô (ex.: `Ronda`) com as permissões **Editar páginas existentes**, **Criar, editar e mover páginas** e **Editar o seu CSS/JSON/JavaScript de usuário**.
2. No repositório, em *Settings › Secrets and variables › Actions*, crie os segredos `WIKI_BOT_USER` (ex.: `Little Sunshine@Ronda`) e `WIKI_BOT_PASSWORD`. Sem eles, a publicação é pulada.

No computador: `WIKI_BOT_USER=… WIKI_BOT_PASSWORD=… npm run publicar` (com `DRY_RUN=true` para simular).

## Instalação

### Como script de usuário

Acrescente ao `common.js` (no celular, ao `minerva.js`, ou ao `global.js` no Meta para valer em todos os temas):

```js
importScript( 'Usuário:Little Sunshine/Scripts/Ronda-loader.js' );
```

O carregador pede todos os arquivos ao mesmo tempo, executa as mensagens, o núcleo e os demais arquivos na ordem, e monta a barra quando o documento fica pronto. Um arquivo ou módulo com erro não derruba os demais.

### Como gadget

1. Crie as páginas `MediaWiki:Gadget-<arquivo>` com o conteúdo de cada arquivo de `wiki/` (exceto o carregador).
2. Acrescente a definição em `MediaWiki:Gadgets-definition`, **nesta ordem**:

   ```
   * Ronda[ResourceLoader|dependencies=jquery.ui,mediawiki.api,mediawiki.util,mediawiki.user,mediawiki.storage,mediawiki.notification]|Ronda-mensagens.js|Ronda-core.js|Ronda-catalogo.js|Ronda-patrulha.js|Ronda-paginas.js|Ronda-admin.js|Ronda.css
   ```

3. Crie `MediaWiki:Gadget-Ronda` com a descrição exibida nas preferências.

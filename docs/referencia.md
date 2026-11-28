# Ronda — referência técnica

Como o Ronda funciona por dentro: princípios, módulos, mensagens, configuração e a API interna para quem quer criar ou alterar módulos. Para gerar, testar e publicar, veja [desenvolvimento.md](desenvolvimento.md).

## Princípios

- **Interface nativa.** Só o módulo `jquery.ui` do MediaWiki, que é o **jQuery UI 1.9.2** (`dialog`, `button`, `buttonset`, `autocomplete`, `progressbar`, `tooltip`), controles nativos do HTML (`<select>`, caixas de seleção) e classes nativas (`ui-widget`, `ui-state-highlight`, `ui-state-error`, `wikitable`). APIs do jQuery UI 1.10+ (`controlgroup`, `checkboxradio`, `selectmenu`, opção `classes`) não existem no MediaWiki e não devem ser usadas.
- **Visual nativo.** Os diálogos usam o tema do jQuery UI do próprio skin; os botões principais usam as classes nativas do Vector (`ui-button-blue`, `ui-button-red`). A barra de botões da página tem um estilo leve, com as variáveis de cor do MediaWiki. No **modo escuro** nativo, a barra, os diálogos, campos, menus e dicas passam a usar as variáveis do Codex (o tema do jQuery UI só tem cores claras).
- **Sem reinventar a roda.** Motivos e durações vêm das mesmas mensagens que os formulários especiais usam (`MediaWiki:Ipbreason-dropdown`, `Ipboptions`, `Deletereason-dropdown`, `Protect-dropdown`, `Protect-expiry-options`). Os níveis de proteção vêm do `siteinfo` do próprio wiki.
- **Edição segura.** As alterações de texto usam `mw.Api#edit`, que recalcula o conteúdo sobre a versão atual e detecta conflitos de edição. Todo pedido à API leva `assert: 'user'`: se a sessão expirar, a API recusa o pedido (`assertuserfailed`) em vez de gravar a ação deslogada, e o Ronda mostra um aviso para entrar de novo.
- **Catálogos separados da lógica.** Avisos, marcações, regras e motivos ficam em `src/Ronda-catalogo.js`; as opções pessoais, nas preferências. O catálogo de motivos de eliminação prevalece sobre o menu nativo.
- **Rastreável.** Toda edição feita como script de usuário leva `(via [[User:Little Sunshine/Ronda|script]] #Ronda)` no fim do resumo; esse texto não pode ser alterado pelas preferências.


## Módulos

A regra geral segue o FastButtons: o que marca o texto da página aparece na leitura, na edição e em diffs (nunca na página principal); o que age sobre a página como um todo aparece em qualquer ação dela, inclusive no histórico; o que age sobre um usuário aparece em Especial:Contribuições e em qualquer ação da página ou da discussão dele. As regras ficam em `ronda.isTaggable`, `ronda.isPageContext` e `ronda.isUserContext` (`src/Ronda-core.js`).

| Módulo | Botão | Onde aparece | Direito exigido |
|---|---|---|---|
| Reverter | Reverter | Diff | `edit` (`rollback` para a reversão rápida) |
| Avisar | Avisar | **Sempre** em diff, reversão e versão antiga (pergunta o usuário se não for identificado); contribuições e página/discussão de usuário (qualquer ação, inclusive histórico) | `edit` |
| Usuário | Usuário | Contribuições e página/discussão de usuário (qualquer ação, inclusive histórico) | — |
| Listar | Listar | Todas as páginas | — (`patrol` para páginas novas e edições a revisar) |
| Manutenção | Manutenção | Artigos (por padrão, domínio 0), na leitura, na edição e em diffs | `edit` |
| Esboço | Esboço | Artigos, também no formulário de edição | `edit` |
| #R | #R | Domínios pares, exceto Ficheiro, MediaWiki e Módulo (inclusive páginas inexistentes) | `edit` |
| Fusão | Fusão | Artigos e predefinições | `edit` |
| Mover | Mover | Páginas existentes, em qualquer ação (inclusive histórico; página raiz de usuário só com `move-rootuserpages`) | `move` (`delete` para eliminar o destino, `suppressredirect` para não criar redirecionamentos) |
| Eliminação rápida | ER | Páginas existentes com alguma regra aplicável ao domínio, também no formulário de edição | `edit` |
| Eliminação semirrápida | ESR | Artigos e ficheiros (não redirecionamentos), também no formulário de edição | `edit` |
| Eliminação por consenso | Consenso | Páginas existentes, exceto MediaWiki e Módulo | `edit` (`move` para arquivar discussões anteriores) |
| Busca | Busca | Artigos | — |
| PetScan | PetScan | Categorias | — |
| Informações | Informações | Todas as páginas (inclusive inexistentes), em qualquer ação, inclusive histórico | — (`deletedhistory` para contar edições eliminadas) |
| Pedido | Pedido | Todas as páginas | `edit` |
| Não assinou | Não assinou | Formulário de edição de discussões e do domínio Wikipédia | `edit` |
| Eliminação | Eliminar | Páginas existentes, exceto discussões de usuário, em qualquer ação | `delete` |
| Restaurar | Restaurar | Páginas eliminadas (inexistentes com edições eliminadas) | `undelete` |
| Lote | Lote | Páginas (leitura e histórico), categorias, contribuições, página/discussão de usuário | `delete`, `undelete` ou `protect` (as ações aparecem conforme o direito) |
| Reversão rápida | links `[reverter (BF) \| reverter \| reverter (vandalismo)]` e `[restaurar]` | Diff, versão antiga, histórico, contribuições, mudanças recentes, páginas vigiadas | `edit` (`rollback` para a reversão rápida da API) |
| Desligar | Desligar | Páginas, exceto categorias, em qualquer ação | `delete` (configurável) |
| Bloqueio | Bloquear | Diff, reversão, página/discussão de usuário, contribuições | `block` (reversores com limites: só não confirmados, até 24 h, por vandalismo) |
| Proteção | Proteger | Páginas (inclusive inexistentes, para proteção contra criação), em qualquer ação | `protect` |

**Modo móvel (Minerva)**: a barra vai para o topo do conteúdo, com botões maiores; os diálogos ocupam a largura da tela; sem o menu de ações, tocar no nome "Ronda" recolhe/expande a barra e o link "Preferências" fica na própria barra. Reverter e Avisar funcionam no diff do celular (Especial:MobileDiff). Para carregar no celular, veja [Como script de usuário](desenvolvimento.md#como-script-de-usuário).

**Modo escuro**: com o tema escuro da Wikipédia (ou o automático, com o sistema escuro), o Ronda usa as cores do tema. Os botões azul e vermelho mantêm o estilo nativo.

**Formulário de edição** (como no FastButtons): Manutenção, Esboço, #R, ER e ESR aplicam a alteração na caixa de texto e acrescentam o resumo, sem salvar. Os avisos ao criador e os registros posteriores são enviados quando você clica em "Publicar alterações".

### Reverter
Substitui o "Reverter" e o "+comentário" do DiffTools.
- Volta à versão da esquerda do diff com `undo`/`undoafter`, a partir da versão atual. O DiffTools gravava o texto antigo por cima, o que apagava sem aviso edições de outras pessoas feitas depois.
- Antes de reverter, lista quem editou depois da versão da esquerda. Se houver outras pessoas além do usuário revertido, mostra os nomes e só prossegue com a confirmação "Reverter mesmo assim".
- Com o direito `rollback`, oferece a reversão rápida quando ela tem exatamente o mesmo efeito (todas as edições posteriores são do usuário revertido e a versão restaurada é de outra pessoa).
- Comentário opcional acrescentado ao resumo; marca a edição como patrulhada quando o diff tem o link "Marcar como patrulhada".
- Os avisos escolhidos no mesmo diálogo só são enviados se a reversão der certo.

### Avisar (múltipla escolha)
Substitui os avisos do DiffTools e o menu "Aviso" do FastButtons, com um catálogo único (`ronda.catalog.warnings`, 60 avisos em 7 grupos).
- Vários avisos de uma vez, numa única edição da discussão do usuário. Campos extras (regra da ER, URL copiada etc.) aparecem ao marcar o aviso.
- **Nível sugerido** para os avisos em série. O Ronda olha a discussão do usuário dos últimos 30 dias (configurável):
  - marcas ocultas que ele mesmo deixa depois de cada aviso (`<!-- ronda-aviso:vandalismo:2:2026-11-09 -->`);
  - resumos de edição do DiffTools ("Aviso sobre…", "Segundo aviso sobre…", "Bem vindo + Aviso sobre…") e, quando possível, do FastButtons.
  
  A ficha mostra o último nível recebido (ex.: "Vandalismo · 2") e o menu já vem no nível seguinte. Depois do terceiro aviso, o Ronda sugere o bloqueio: abre o módulo Bloquear para quem pode bloquear ou leva aos pedidos de notificação de vandalismo.
- Os resumos seguem o padrão do DiffTools ("Segundo aviso sobre vandalismo"), para que o histórico continue legível pelas duas ferramentas durante a transição.
- Boas-vindas opcionais junto do aviso (o "bv+1" do DiffTools); a opção vem marcada quando a discussão ainda não existe.
- Avisos só para IPs ou só para contas aparecem conforme o caso.
- **Favoritos**: a estrela ao lado de cada aviso o põe no grupo **Favoritos**, no topo da lista, no Avisar e no Reverter. A lista fica salva na conta (opção `userjs-ronda-favoritos`, separada das preferências) e vale em qualquer navegador.
- **Nome impróprio**: aviso, com observação opcional (parâmetro 1 da predefinição, como no FastButtons), e, opcionalmente, pedido em WP:Pedidos/Revisão de nomes de usuário (marcado por padrão no caso ofensivo/difamatório).

### Manutenção (múltipla escolha)
- Lista todas as marcações do catálogo, agrupadas por tema (fontes e referências, formatação e estilo, categorias, conteúdo, perspectiva global, estado da página), um quadro por grupo. As que já estão na página aparecem marcadas no topo, e desmarcar remove.
- O filtro procura pelo nome da marcação ou da predefinição e esconde os grupos sem resultado.
- Detecta marcações soltas e dentro de `{{Múltiplos problemas}}`, reconhecendo os redirecionamentos de cada predefinição.
- Agrupa ou desagrupa em `{{Múltiplos problemas}}`.
- Os campos de parâmetro aparecem no próprio diálogo.
- Só a introdução é reorganizada; marcações dentro de seções não são alteradas. `{{Sem sinopse}}` fica antes das categorias.
- Ações posteriores:
  - aviso ao criador ("Sem fontes", "Sem categoria"), com os mesmos critérios do FastButtons;
  - registro em WP:Páginas precisando de manutenção, para "Em manutenção".

### Mover
Portado do "Mover" do FastButtons: domínio e novo título, motivo (do `MediaWiki:Movepage-reason-dropdown`, se existir), mover a discussão e criar redirecionamento.
- O destino é verificado ao sair do campo de título ou trocar o domínio, e de novo ao clicar em Mover. O diálogo mostra se ele está livre, se é um redirecionamento (e para onde) e se a discussão do destino existe.
- Destino existente: quem pode eliminar elimina-o antes, com R2 (`move.deleteReason`), e também a discussão do destino, se a discussão for movida junto. Há um alerta se o destino não for um redirecionamento simples para a página. Quem não pode eliminar é avisado e a moção não é feita.
- **Suprimir redirecionamento da página de discussão** (com `suppressredirect`): quando a escolha difere da página principal, a página e a discussão são movidas em duas operações, cada uma com o seu redirecionamento. Todas as combinações de opções funcionam juntas.
- Se a discussão do destino existir e não for eliminada, só a página principal é movida.
- Numa página de usuário raiz, a discussão do usuário nunca é movida junto, e as opções sobre a discussão não aparecem.

### Eliminação por consenso (inclusive conjunta)
Faz o que o FastButtons já fazia, com as páginas opcionais de uma proposta conjunta.

1. Arquiva a discussão anterior da página, se houver (move para `/1`, `/2`…).
2. Cria `Wikipédia:Páginas para eliminar/<página>` a partir de `Predefinição:Página para eliminar`, com a justificativa. Esta é a **discussão mestra**.
3. Para cada **página adicional** incluída na proposta:
   - arquiva a discussão anterior dela, se houver;
   - cria `Wikipédia:Páginas para eliminar/<página adicional>` como **redirecionamento** para a discussão mestra.
4. Marca todas as páginas com `{{subst:apagar}}`. Como a marca `{{Apagar4}}` aponta para a discussão de cada página, o redirecionamento leva todas à mestra.
5. Avisa o criador de cada página com `{{subst:Aviso-PE|<página>}}`, com os critérios do FastButtons (não avisa a si mesmo, nem IP que criou há mais de 24 h, nem páginas criadas por moção).

Formato da discussão mestra numa proposta conjunta (o título da página continua sendo o da página mestra; o "+ N semelhantes" vai só no cabeçalho de seção):

```
=== [[:Página mestra]] + 2 semelhantes ===
<div class="mw-notalk">
{{PE-ferramentas2|Página mestra}}
{{PE-ferramentas2|Página 2}}
{{PE-ferramentas2|Página 3}}
Justificativa…
```

Detalhes:
- Com uma só página adicional, o cabeçalho fica "+ 1 semelhante".
- As páginas adicionais são validadas ao serem incluídas: precisam existir, estar num domínio permitido e não ter outra marcação de eliminação (ER, ESR ou Apagar). O campo de título sugere páginas enquanto se digita.
- As etapas rodam em sequência, com barra de progresso e registro. Se a discussão mestra não puder ser criada, nada mais é feito. Falhas nas demais etapas ficam no registro, sem interromper o processo.

### Eliminação rápida (ER)

- Só aparecem as regras do domínio da página: artigos veem A2–A6, G3, G4 e G6; categorias, C1; discussões, D1 e D2; predefinições, P1 e P2; ficheiros, F1; usuário, U1 e U2. Num redirecionamento só aparecem R1 e R2, com aviso se houver afluentes. G1, G2, G5 e G7 valem em qualquer domínio.
- Gera `{{ER|<regra>|3=<observação>|2=~~~~}}` no topo, dentro de `<noinclude>` em predefinições, userboxes e páginas transcluídas.
- Aviso ao criador: `Aviso-ER` (com a regra e a observação), `Aviso-não remova` ou nenhum. Nas regras técnicas (C1, D1, D2, P1, R1, R2 e G1) não há aviso, como no FastButtons.
- O criador não é avisado se for você, se a página veio de uma moção ou se for um IP que criou a página há mais de 24 horas.

### Eliminação semirrápida (ESR)

- Artigos: assunto com justificativa-padrão (o texto do FastButtons, que pode ser editado antes de enviar). Banda e Pessoas usam `ESR-banda` e `ESR-bio`; os demais, `ESR|assunto=…`. A opção "Má tradução" usa `ESR-matrad` com o código da língua.
- Ficheiros: `ESR-arquivo` com a justificativa.
- A marca entra depois das notas de topo (desambiguação etc.). Aviso opcional com `Aviso-ESR`.

Nos dois módulos, a página não pode ter outra marcação de eliminação, as etapas rodam com registro e a página é marcada como patrulhada se houver o link de patrulha.

### Eliminação
- Motivos de `MediaWiki:Deletereason-dropdown`, expandidos para o domínio da página, porque o menu da pt.wiki varia por domínio. Em ficheiros, os de `MediaWiki:Filedelete-reason-dropdown` vêm primeiro. Ficam em cache por uma semana e há um botão para atualizar a lista.
- O catálogo `ronda.catalog.deletionReasons` prevalece: uma regra de ER do catálogo substitui a do menu com o mesmo código, ou entra se faltar (como a D2 em discussões); opções sem código marcadas com `add: true` entram sempre (ex.: "Discussão de página de redirecionamento").
- Motivo sugerido no topo do menu:
  - a regra da marcação `{{ER|…}}`;
  - D1 para discussões sem página principal;
  - D2 para discussões de páginas existentes.
- Alertas de ESR/PE em andamento e contagem de afluentes, transclusões e usos de ficheiro.
- Pode eliminar também a discussão e os redirecionamentos **para** a página (da tabela de redirecionamentos; um afluente que é redirecionamento para outra página não entra), e abrir o Desligar em seguida.

### Desligar
- Domínios: os de `unlink.namespaces` e, com `unlink.currentNamespace` (padrão), também o da própria página (ex.: ao desligar uma predefinição, as predefinições que ligam a ela).
- `[[Alvo|texto]]` → `texto`. Reconhece os nomes alternativos do domínio e trata a primeira letra como maiúscula ou minúscula.
- Ficheiros:
  - remove `[[Ficheiro:…]]`, mesmo com ligações na legenda;
  - remove as linhas de `<gallery>`;
  - comenta os parâmetros de infocaixa (`| imagem = X.jpg`).
- Edita as páginas uma a uma, com barra de progresso e registro do resultado de cada uma. Ligações vindas de predefinições são listadas para revisão manual.

### Bloqueio
- Detecta bloqueios de intervalo que já cobrem o IP e os bloqueios do próprio alvo. **Multibloqueio**: se o alvo já está bloqueado, um menu "O que fazer" lista cada bloqueio (número, total/parcial, autor, prazo, motivo) e deixa escolher entre alterar um deles (`id`, com as opções preenchidas a partir dele), acrescentar outro bloqueio (`newblock`) ou remover um deles (`action=unblock` com `id`, motivo opcional; reversores só removem bloqueios feitos por eles).
- Opções adequadas a IP ou conta, todas como restrições ("Impedir…": marcar sempre bloqueia mais), bloqueio parcial (páginas/domínios) e ocultação de nome para quem tem `hideuser`.
- Notificação opcional. `{{Bloqueado}}`, `{{Bloqueado-disc}}` e `{{Bloqueado parcial}}` vão pelo módulo da comunidade `mw.libs.blockNotificationButton` (gadget `blockNotificationButton-api`); `{{bloqueado-CPV}}` e `{{proxy}}`, ou se o módulo não carregar, numa seção nova feita pelo Ronda.
- **Reversores** (quem tem `block` sem ser `sysop`): os mesmos limites do gadget validateBlockRollbackers e da política — só IPs e contas não confirmadas (conta com `autoconfirmed` ou `confirmed` é recusada antes de abrir o diálogo, que então oferece notificar vandalismo ou incidente pelo Pedido), durações de até 24 horas do `ipboptions` (sem indefinido nem duração livre), só os motivos de vandalismo do `ipbreason-dropdown` (ou o primeiro grupo, se nenhum mencionar vandalismo), sem texto livre, sem bloqueio parcial e sem `nocreate`. As regras ficam em `ronda.blockLimits`.

### Proteção
- Tabela por tipo de ação (editar, mover, criar, carregar), com nível e duração; permite manter a duração atual.
- Corrente entre edição e moção, ligada por padrão: mudar uma muda a outra; clicar separa (corrente aberta) e, ao religar, a moção passa a seguir a edição.
- Proteção em cascata validada contra os níveis permitidos pelo wiki.

### Painel do usuário
Substitui o botão "Usuário" do FastButtons. Em páginas e discussões de usuário e em Especial:Contribuições, o botão **Usuário** abre e fecha uma faixa dentro da barra (os dados são buscados no primeiro clique):
- **situação**: bloqueado (parcial ou total, até quando, por quem e o motivo; para IPs, inclusive bloqueio de intervalo), bloqueio global, travado globalmente ou inexistente;
- **dados**: registro (ou primeira edição), número de edições, grupos locais e globais no gênero do usuário, com a data em que cada grupo local foi atribuído (ligação para o registro de permissões);
- **histórico**: bloqueios anteriores (quantos e o último), edições revertidas entre as 100 mais recentes, páginas criadas e quantas não existem mais, contribuições eliminadas (com `deletedhistory`);
- **atividade**: última edição, edições em 24 h e 7 dias e os domínios mais editados;
- **avisos** em série recebidos na janela de `warnings.window` dias (nível 3 em destaque);
- **ligações**: contribuições, registros, bloqueios e conta global; CheckUser (verificar, investigar, registro de verificações) para quem tem o direito;
- **IPs**: faixa /24 ou /64 (contribuições, bloqueios locais e globais), WHOIS, localização, proxy, Spur, contribuições globais e, com o direito `ipinfo`, as informações de IP da wiki (só ao clicar, porque o acesso fica registrado);
- **atalhos**: enviar aviso, bloquear/alterar bloqueio, **reverter todas no topo** (reversão rápida, com lista para conferir) e **eliminar as criadas** (abre o Lote já carregado).

As faixas (Usuário, Busca, PetScan, Informações, Listar) ficam dentro da barra, como o submenu do FastButtons: abrir uma fecha as outras, e clicar de novo no botão esconde a faixa.

### Reversão rápida (como no Twinkle)
Ao lado da edição atual, em diffs, no histórico, nas contribuições, nas mudanças recentes e nas páginas vigiadas:
- **reverter (BF)**: pede um motivo e reverte com o resumo de boa-fé (`revert.agfSummary`);
- **reverter**: reverte direto (`revert.summary`);
- **reverter (vandalismo)**: reverte (`revert.vandalSummary`) e abre o Avisar com "Vandalismo" marcado, a página preenchida e o nível sugerido.

Com o direito `rollback` usa a reversão rápida da API; sem ele, desfaz até a última versão de outra pessoa. Se a última edição não for do usuário (outra pessoa editou depois), não reverte. A confirmação antes de reverter é opcional (`revert.confirm`). As mudanças recentes e as páginas vigiadas recarregam a lista sozinhas; os links são acrescentados de novo a cada atualização.

**Restaurar esta versão**: `[restaurar]` na versão da esquerda do diff, na página de uma versão antiga e em cada linha do histórico. Pede um motivo opcional e grava o texto daquela versão (`revert.restoreSummary`), com detecção de conflito.

### Confirmações e prévia no Avisar
- Antes de enviar, como no Twinkle, o Ronda pede confirmação se o mesmo aviso já foi deixado nas últimas 24 horas ou se a discussão foi editada há menos de um minuto (`warnings.confirm`).
- O botão **Prévia** mostra os avisos escolhidos já renderizados, como vão aparecer na discussão.
- Depois do terceiro aviso de uma série, além da sugestão de bloqueio, aparece **Notificar em WP:Pedidos/Notificações de vandalismo (pedido preenchido)**, marcado por padrão para quem não pode bloquear. O pedido usa o modelo `/Padrão` da página, com o usuário e a página do aviso.

### Restaurar e Lote
- **Restaurar**: numa página eliminada, mostra quantas edições existem e o último registro de eliminação e restaura a página (e, se quiser, a discussão).
- **Lote**: carrega páginas de uma origem — ligações da página atual, membros da categoria, páginas criadas pelo usuário (nas contribuições e na página/discussão de usuário), um prefixo ou uma lista digitada (até 50) — e elimina (com as discussões, se quiser), restaura ou protege as marcadas, uma a uma, com registro. Eliminar só oferece páginas existentes; restaurar, só as eliminadas; proteger usa criação para as inexistentes. Depois de carregar, a seção **Filtros** (como o filtro de listas do AWB) restringe a lista: domínios presentes, com a contagem; manter só os títulos que contêm um texto; tirar os que contêm outro; expressões regulares (opcional); e comparação com outra lista (tirar as que estão nela ou manter só as que também estão). Só as páginas que passam pelos filtros são executadas.
- Cada ação usa o menu de motivos oficial (eliminação, restauro, proteção). Na eliminação, o menu é expandido para cada domínio das páginas carregadas e os motivos são juntados (com os de ficheiros e as regras do catálogo, se for o caso).

### Preferências
O link **Preferências do Ronda** no menu de ações abre um diálogo com as opções principais (vigilância, ícone, simulação, reversão, links rápidos, avisos, Desligar e Manutenção). Elas ficam salvas na sua conta (opção `userjs-ronda`) e valem em qualquer navegador. O `window.rondaConfig` do common.js, se existir, continua valendo por cima. O sufixo do resumo e a etiqueta (`summarySuffix`, `tag`) são fixos: não aparecem no diálogo e valores salvos por versões antigas são ignorados. Páginas criadas de propósito pelo Ronda (discussão de PE, redirecionamentos da proposta conjunta, #R numa página nova) são vigiadas por padrão, a menos que a opção escolhida seja "Deixar de vigiar".

**Vigilância com prazo** (`watchExpiry`): cada escrita informa o seu tipo de ação com `watchlistexpiry: ronda.watchExpiry( 'tipo' )`, que devolve o prazo escolhido ou `undefined` (sem prazo, ou `watchlist` em `nochange`/`unwatch`); `ronda.params` tira o parâmetro quando ele é `undefined`. Antes de uma escrita com prazo, o núcleo consulta `prop=info&inprop=watched`: se a página já é vigiada sem prazo, ou com prazo que termina depois, o prazo sai do pedido (`ronda.keepWatch`), porque a API trocaria a vigilância atual pela nova, mais curta.

### Avisar fora do contexto de usuário
Em diffs, reversões e versões antigas o Avisar sempre aparece. Se o diff não identifica o usuário (nome oculto, edição sua), o Ronda pergunta quem avisar antes de abrir o diálogo. O catálogo também tem as notificações de bloqueio do FastButtons (`bloqueado`, `bloqueado-disc`, `bloqueado-CPV`, `proxy`), que entram sob o título "Notificação de bloqueio", e o "Vandalismo repetido" vai para o topo da discussão.

### Listar
Portado do "Listar" do FastButtons. Mostra até 10 páginas de cada lista, uma por linha, com a diferença de tamanho (verde ou vermelha, em negrito a partir de 500 bytes), o autor e o resumo; em Edições a revisar, também as pontuações de dano e de boa-fé. A lista aberta fica destacada:
- **Páginas vigiadas**: edições recentes nas suas páginas vigiadas (sem robôs e sem as suas);
- **Mudanças recentes**: edições não autopatrulhadas no domínio principal;
- **Páginas novas**: páginas novas não patrulhadas (sem redirecionamentos), abrindo com o link de patrulha;
- **Edições a revisar**: uma consulta a `list=recentchanges` com `rcshow=!patrolled|oresreview` e `rcprop=oresscores` (extensão ORES da wiki, mesmo limite dos filtros de Mudanças recentes); as de provável má-fé (*goodfaith* < 50%) vêm primeiro e, em cada grupo, da mais danosa para a menos;
- **Eliminação rápida**: páginas em Categoria:!Páginas para eliminação rápida.

### #R, Esboço e Fusão
- **#R**: substitui o conteúdo por `#REDIRECIONAMENTO [[Destino]]` (em categorias, `{{Redirecionamento de categoria|Destino|2=motivo}}`, com motivo obrigatório). Funciona em páginas inexistentes, criando o redirecionamento.
- **Esboço**: `{{Esboço}}` ou `{{Esboço-<tema>}}`, com sugestões das predefinições existentes, antes das categorias. Recusa se já houver um esboço.
- **Fusão**: `{{subst:f-de|B}}` na página que permanece e `{{subst:f-com|A}}` na outra, em `<noinclude>` quando for predefinição, userbox ou página transcluída.

### Busca, PetScan e Informações
- **Busca**: o título (entre aspas, se tiver espaços) no Google, Google Notícias, Livros, Acadêmico, Brasil e Portugal e no Bing.
- **PetScan**: páginas da categoria que precisam de fontes, revisão ou wikificação, ou com menos de 1 000/500 bytes.
- **Informações**, em três linhas, como o painel Usuário: o estado da página por extenso (com/sem referências, categorias e afluentes, em verde ou vermelho, e se já foi proposta para eliminação); os dados (tamanho, qualidade pela estrela de destaque/bom ou pelas categorias da discussão, qualidade estimada automaticamente pelos critérios do quadro "Parâmetros de qualidade", com o detalhe em janela, última edição, vigilantes, edições eliminadas); e as ligações (registros, visualizações, "Mais informações"). Para páginas inexistentes, a data da eliminação.

### Pedido
Os dez pedidos do FastButtons (vandalismo, desproteção, edição, histórico, proteção, restauro, ocultação, nome impróprio, incidente e outro), com o modelo de `<página de pedidos>/Padrão`. O alvo vem preenchido com o usuário (em páginas de usuário e contribuições) ou com a página atual; pedidos sobre usuários podem ocultar o nome. Depois de enviar, abre a página de pedidos na seção criada.

### Não assinou
No formulário de edição de discussões e do domínio Wikipédia, insere `{{subst:Não assinou|usuário|data}}` no cursor e acrescenta o resumo.


## Mensagens de interface

Os textos da interface ficam em `src/Ronda-mensagens.js`, num objeto `chave: texto` agrupado pelo arquivo que os usa (prefixos `core-`, `patrulha-`, `paginas-`, `admin-`). O código nunca escreve um texto de interface direto: chama `ronda.msg( 'chave', parâmetros… )`. **Mensagens novas entram nesse arquivo.**

- `$1`, `$2`… são os parâmetros, na ordem passada a `ronda.msg`.
- `{{PLURAL:$1|singular|plural}}` escolhe a forma pelo número (singular para 0 e 1).
- Uma chave que não existe aparece como `⧼chave⧽`, com um aviso no console.
- Não ficam lá o conteúdo gravado na wiki (resumos, predefinições, textos de avisos e pedidos) nem os catálogos (`src/Ronda-catalogo.js`).
- Para mudar um texto só para você: `window.rondaConfig = { messages: { 'core-fechar': 'Fechar janela' } };`

## Configuração

Todos os valores são opcionais. As principais opções podem ser mudadas pelo diálogo **Preferências do Ronda** (salvas na conta). Também é possível defini-las no próprio `common.js`, antes de o gadget carregar; o `common.js` vale por cima das preferências:

```js
window.rondaConfig = {
	dryRun: false,                      // true = simulação: nenhuma escrita é enviada à wiki
	// summarySuffix e tag são fixos (não vêm das preferências):
	// summarySuffix: ' (via [[User:Little Sunshine/Ronda|script]] #Ronda)', tag: null
	icon: 'UserScript Ronda Icon.svg',  // ícone do Commons ao lado do nome na barra; null = sem ícone
	watchlist: 'preferences',           // vigilância das páginas editadas: 'preferences' (segue as preferências do MediaWiki), 'watch', 'nochange' ou 'unwatch'
	watchExpiry: {                      // prazo da vigilância por tipo de ação: '' (sem prazo), '1 week', '2 weeks', '1 month', '3 months', '6 months'
		revert: '',                     // reversões, links rápidos, reverter todas no topo, restaurar versão
		warn: '',                       // avisos e notificações em discussões de usuários
		tag: '',                        // Manutenção, Esboço, Fusão, Redirecionar
		deletion: '',                   // ER, ESR, consenso (a página e a discussão criada)
		request: '',                    // pedidos e registros em páginas do domínio Wikipédia
		move: ''                        // Mover, Restaurar e as edições do Desligar
	},
	unlink: {
		right: 'delete',                // direito exigido para ver o Desligar
		namespaces: '0',                // domínios onde as ligações são removidas, ex.: '0|14' ou [ 0, 14 ]
		currentNamespace: true          // incluir também o domínio da página desligada
	},
	maintenance: {
		namespaces: [ 0 ]               // domínios onde o módulo Manutenção aparece
	},
	consensus: {
		template: 'Predefinição:Página para eliminar',  // modelo da discussão
		prefix: 'Wikipédia:Páginas para eliminar/',
		tagCode: 'subst:apagar',                         // gera {{Apagar4}}
		warnTemplate: 'Aviso-PE',
		toolsTemplate: 'PE-ferramentas2',                // uma linha por página na proposta conjunta
		headerSuffix: ' + $1 semelhantes',               // acrescentado ao cabeçalho de seção
		headerSuffixSingular: ' + 1 semelhante'
	},
	blockNotification: {
		gadget: 'ext.gadget.blockNotificationButton-api',   // módulo das notificações de bloqueio
		page: 'MediaWiki:Gadget-blockNotificationButton-api.js'
	},
	deletion: {
		redirectReason: '[[WP:ER|ER]] R1: redirecionamento para página eliminada'
	},
	move: {
		deleteReason: '[[WP:ER|ER]] R2: eliminado para permitir a moção de [[$1]]'  // $1 = página movida
	},
	revert: {
		// $1 = autor da versão restaurada, $2 = usuário revertido, $3 = versão, $4 = motivo
		summary: 'Desfeita(s) uma ou mais edições de [[Special:Contribs/$2|$2]]',
		rollbackSummary: 'Revertida(s) uma ou mais edições de [[Special:Contribs/$2|$2]]', // quando usa a reversão rápida (rollback)
		agfSummary: 'Revertidas edições de boa-fé de [[Special:Contribs/$2|$2]]: $4',
		vandalSummary: 'Revertidas edições de [[Special:Contribs/$2|$2]] identificadas como vandalismo',
		restoreSummary: 'Restaurada a versão $3 de [[Special:Contribs/$1|$1]]',
		patrol: true,                   // marcar como patrulhada por padrão
		confirm: false,                 // confirmar antes de reverter pelos links rápidos
		vandalWarn: true,               // abrir o Avisar depois de reverter vandalismo
		links: { diff: true, history: true, contribs: true, recentchanges: true, watchlist: true }
	},
	warnings: {
		window: 30,                     // dias considerados para sugerir o nível do próximo aviso
		marker: true,                   // marca oculta depois de cada aviso
		reportPage: 'Wikipédia:Pedidos/Revisão de nomes de usuário',
		vandalismPage: 'Wikipédia:Pedidos/Notificações de vandalismo',
		confirm: true                   // confirmar aviso repetido (24 h) ou discussão editada há < 1 min
	}
};
```

### Catálogo de marcações

Cada item de `ronda.catalog.maintenance` (em `src/Ronda-catalogo.js`) aceita:

| Campo | Descrição |
|---|---|
| `id` | Identificador interno |
| `label` / `title` | Texto da opção e dica |
| `template` | Nome real da predefinição depois de salva (usado para detectar; os redirecionamentos são resolvidos pela API) |
| `action` | Código inserido, podendo usar `subst:` |
| `extra` | Texto fixo antes de `}}` (ex.: `\|{{subst:DATA}}`) |
| `params` | `[ { name, label, required, external } ]`. `external` não vai para a predefinição |
| `groupable` | `false` impede o agrupamento em `{{Múltiplos problemas}}` |
| `placement` | `'fim'` insere antes das categorias |
| `warn` / `sameEditor` | Aviso `Aviso-<warn>` ao criador / só se ele for o único editor |
| `listing` | Abre seção em WP:Páginas precisando de manutenção |

### Catálogos de eliminação

- `ronda.catalog.speedy`: regras de ER. Campos: `rule`, `title`, `ns` (lista de domínios; sem ela, todos), `talk` (só discussões), `redirect` (só redirecionamentos), `noWarn` (sem aviso ao criador).
- `ronda.catalog.deletionReasons`: motivos de eliminação que prevalecem sobre o menu nativo (mesma base da ferramenta de eliminação em massa de en:User:Animum/massdelete.js). Grupos `{ label, ns, options }`, em que `ns` é uma lista de domínios, `'talk'` (discussões) ou ausente (todos). Cada opção `{ label, value, add }`: rótulos com código de regra ("D2 - …") substituem ou completam a regra do menu; `add: true` faz uma opção sem código entrar sempre.
- `ronda.catalog.esrSubjects`: assuntos da ESR. Campos: `label`, `text` (justificativa-padrão), `template` (predefinição própria, opcional).

### Catálogo de avisos

Cada item de `ronda.catalog.warnings` aceita:

| Campo | Descrição |
|---|---|
| `id` | Identificador interno (vai também na marca oculta) |
| `group` / `label` / `title` | Grupo no diálogo, texto da ficha e dica |
| `code` | Conteúdo do `{{subst:…}}`, com as variáveis `$pagina` e `$<campo>` |
| `levels` | `{ 1: código, 2: código, 3: código }` para avisos em série (`$nivel` também vale) |
| `summary` | Resumo do nível 1; os níveis 2 e 3 viram "Segundo/Terceiro aviso…" |
| `match` | Outros textos que identificam o aviso em resumos antigos (ex.: nome da predefinição no FastButtons) |
| `fields` | `[ { key, label, required, options } ]`; `options` vira um menu |
| `ip` | `true` só para IPs, `false` só para contas |
| `welcome` / `subst` / `sign` | `false` desliga as boas-vindas junto, o `subst:` ou a assinatura |
| `report` | `'default'` ou `'optional'`: oferece o pedido de revisão de nome de usuário |

As predefinições de boas-vindas usadas com "Incluir boas-vindas" ficam em `ronda.catalog.welcome`.

## Cache

O cache usa `mw.storage` e expira em uma semana:

| Chave | Conteúdo |
|---|---|
| `ronda-reasons-v2-<mensagem>-<domínio>` | Menus de motivos (só o de eliminação é expandido, por domínio; os demais vêm como texto cru da mensagem) |
| `ronda-tag-aliases-v1` | Nomes alternativos das predefinições de manutenção |
| `ronda-hidden` | Estado da barra (escondida ou visível) |

As preferências do diálogo ficam na conta (opção de usuário `userjs-ronda`), não no navegador.

Para atualizar os motivos, use o botão ⟳ ao lado do menu. Para atualizar os nomes alternativos, use o botão "Atualizar nomes alternativos" no diálogo de Manutenção.


## Para desenvolvedores

O gadget expõe `window.ronda` e dispara o hook `ronda.ready` com ele.

### Criar um módulo

```js
( function ( ronda ) {
	ronda.registerModule( {
		id: 'exemplo',
		label: 'Exemplo',
		title: 'Dica do botão',
		order: 50,                      // posição na barra
		isAvailable: function ( ctx ) {
			return ctx.type === 'diff' && ronda.can( 'rollback' );
		},
		open: function ( ctx ) {
			var $dlg = ronda.ui.dialog( {
				title: 'Exemplo',
				content: ronda.ui.message( 'highlight', 'Olá, ' + ctx.targetUser )
			} );
		}
	} );
}( window.ronda ) );
```

### Contexto (`ctx`)

`type` (`view` · `edit` · `diff` · `rollback` · `contribs` · `special` · `other`), `isRevision` (versão antiga, `?oldid=`), `ns`, `page`, `title`, `exists`, `isRedirect`, `oldId`, `newId`, `targetUser`, `rights`.

### Utilitários principais

| Função | Uso |
|---|---|
| `ronda.can( direito )` | Verifica um direito do usuário |
| `ronda.post( params )` | POST com token CSRF e a etiqueta configurada |
| `ronda.api` | Instância de `mw.Api` (`formatversion=2`) |
| `ronda.reasons( mensagem, ctx, [atualizar] )` | Grupos de motivos expandidos e em cache |
| `ronda.notifyUser( usuário, título, texto, sumário )` | Nova seção na discussão do usuário |
| `ronda.sequence( itens, fn, [aoAvançar] )` | Executa operações uma a uma, sem parar nos erros |
| `ronda.ui.dialog`, `row`, `text`, `checkbox`, `message`, `reasonFields`, `expirySelect` | Componentes de interface em jQuery UI |
| `ronda.unlinkText( texto, ns, título )` | Função pura do Desligar |
| `ronda.tags.apply / analyze` | Funções puras do módulo Manutenção |
| `ronda.consensus.buildMasterText / buildTaggedText / hasEliminationTag` | Funções puras do módulo de consenso |
| `ronda.warnings.build / previous / suggest / summaryFor` | Funções puras do Avisar (montagem, nível anterior, sugestão) |
| `ronda.revert.analyze / summary` | Funções puras do Reverter (plano e resumo) |
| `ronda.editPage( título, transform )` | Edita via `mw.Api#edit`; na página atual em modo de edição, altera a caixa de texto e o resumo |
| `ronda.warnCreator( título, código, [resumo] )` / `ronda.eligibleCreator( título )` | Aviso ao criador com os critérios do FastButtons |
| `ronda.hasEliminationTag`, `ronda.useNoinclude`, `ronda.patrolRcid` | Ajudantes comuns de marcação |
| `ronda.ui.runner`, `ronda.ui.finishButtons`, `ronda.ui.togglePanel`, `ronda.ui.onSave` | Etapas com registro, faixas da barra e ações ao publicar |
| `ronda.pageTools`, `ronda.lists`, `ronda.proposal`, `ronda.move` | Funções puras de #R/Esboço/Pedido/Informações, Listar, ER/ESR e Mover |
| `ronda.userInfo` | Funções puras do painel do usuário (grupos, atividade, bloqueios anteriores, datas dos grupos, faixa de IP) |
| `ronda.withCatalogRules( domínios, grupos )` | Aplica `ronda.catalog.deletionReasons` a um menu de motivos |
| `ronda.unlinkNamespaces( ctx )` | Domínios do Desligar para a página |
| `ronda.batch` | Funções puras do Lote (lista de títulos, junção de menus de motivos, filtros) |

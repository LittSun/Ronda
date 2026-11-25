# Histórico de versões

O número da versão fica em `ronda.version` (em `src/Ronda-core.js`) e no `package.json`, e aparece na dica do nome "Ronda" na barra.
Esquema: `0.MENOR.CORREÇÃO` até a versão 1.0, que será a primeira publicada como gadget. Veja como subir a versão em [docs/desenvolvimento.md](docs/desenvolvimento.md#versões).

## 0.7.14 — 25/11/2026
- **Reversão rápida**: só o link **reverter (vandalismo)** usa a reversão rápida (rollback), para reversores; **reverter** e **reverter (BF)** passam a usar o desfazimento comum, com o resumo correspondente.
- **Usuário**: nova disposição do painel. À esquerda, uma tabela com um tema por linha (Situação, Conta, Bloqueios, Contribuições, Atividade, Avisos, Filtro e, para IPs, Faixa); à direita, uma coluna com **Ações** (avisar, bloquear, reverter todas no topo, eliminar as criadas), **Ver**, **CheckUser** e **IP**. Em telas estreitas a coluna desce para baixo da tabela.
- **Usuário**: linha do **registro do filtro de abusos** nos últimos 30 dias, com o total (link para o registro), quantas foram impedidas (em destaque) ou só avisadas, e **ver ocorrências**, que abre as dez mais recentes com hora, filtro, página e ação.
- **Usuário**: linha **Outras wikis** com os bloqueios locais em outros projetos: cada wiki com a duração e o link para o registro de bloqueios (motivo na dica); com muitas, mostra cinco e "e mais N".
- **Usuário**: contagem de **edições ocultadas** (conteúdo ou resumo) entre as 500 mais recentes, com as suprimidas à parte.
- **Usuário**: o último bloqueio em "Bloqueios anteriores" mostra a duração em português ("3 semanas" em vez de "3 weeks") e o motivo no próprio texto, não só na dica.

## 0.7.13 — 24/11/2026
- **Boas-vindas**: na primeira vez que a barra aparece, uma faixa explica que o Ronda pode ser ajustado nas preferências e onde elas ficam (menu de ações ou, no celular, a própria barra), com os botões **Abrir preferências**, **Documentação** e **Entendi**. Aparece uma vez por conta (opção `userjs-ronda-boasvindas`, gravada mesmo na simulação) e não aparece para quem já salvou preferências.

## 0.7.12 — 24/11/2026
- Observações e campos de avisos (nome impróprio, ER, bloqueio e outros): as barras verticais dentro de predefinições e ligações, como em `{{User|Fulano}}` ou `[[Página|texto]]`, não são mais trocadas por `{{!}}`. Só as barras soltas no texto continuam escapadas.

## Repositório — 24/11/2026
- Repositório reorganizado para ficar público no futuro: código em `src/`, scripts em `ferramentas/`, documentação em `docs/`, pacote de console em `dist/`; `package.json` com `npm run verificar` e `npm run construir`; um único workflow (*Construir*) no lugar dos dois anteriores, com um só commit do robô por push; licença MIT para o código e CC BY-SA 4.0 para os textos ([CREDITOS.md](CREDITOS.md)); guia de contribuição. O código da ferramenta não mudou.

## 0.7.11 — 24/11/2026
- Menus de motivos (Eliminar, Restaurar, Bloquear, Proteger, Mover, Lote): escolher um motivo-padrão pela busca do campo "Detalhes" não substitui mais o motivo principal já escolhido; o motivo encontrado entra nos detalhes. Sem motivo principal ("Outro motivo"), ele continua virando o principal.

## 0.7.10 — 23/11/2026
- **Reverter**: botão **Reverter agora** na caixa de reversão, que reverte (e marca como patrulhada, se escolhido) na hora, enquanto os avisos ainda são escolhidos. Depois disso, a caixa fica travada com "Revertido…" e o botão principal passa a "Enviar aviso", que manda só os avisos. O botão principal continua fazendo tudo de uma vez para quem não usar o novo.

## 0.7.9 — 23/11/2026
- Menus de motivos (Eliminar, Restaurar, Bloquear, Proteger, Mover, Lote): botão **Limpar** (×) abaixo do campo "Detalhes", que esvazia o campo de uma vez — útil quando ele já vem preenchido, como com a observação de uma marcação de ER.

## 0.7.8 — 23/11/2026
- **Lote** e **Eliminar**: a discussão de usuário (PDU) nunca é eliminada por padrão junto da página de usuário (PU). No Lote, "Eliminar também as páginas de discussão" deixa de valer para páginas de usuário, e há uma opção separada, desmarcada, "Eliminar também as discussões de usuário (PDU) das páginas de usuário", que só aparece quando a lista tem páginas de usuário. No Eliminar, numa PU, a opção vira "Eliminar também a discussão do usuário (PDU)", desmarcada. No Restaurar, a discussão de uma PU também deixa de vir marcada.

## 0.7.7 — 22/11/2026
- **Manutenção**: quando várias marcações aplicadas pedem aviso ao criador (ex.: "Sem fontes BPV" e "Sem categoria"), os avisos vão numa **única edição** da discussão dele, cada um com a sua assinatura, com o resumo "Aviso sobre a marcação da página "X" com as predefinições "A" e "B"". Antes, cada aviso era uma edição separada.

## 0.7.6 — 22/11/2026
- **Avisar**: aviso **Assinatura não permitida** (`{{Aviso-assinatura não permitida}}`), no grupo "Estilo e edição", com uma caixa para cada ponto das regras para assinaturas (1.1 a 5.1; a dica de cada uma traz o texto da regra). Os pontos marcados vão no parâmetro 1 ("2.2 e 3.5"); é preciso marcar ao menos um.
- Catálogo de avisos: novo tipo de campo `checks` (várias caixas de seleção), cujo valor é a lista dos marcados.

## 0.7.5 — 21/11/2026
- **Reverter** e **Avisar**: em diffs, reversões e versões antigas de páginas e discussões de usuário, o campo "Página" do aviso passa a vir preenchido com a página editada (antes ficava vazio nesses domínios). Nas contribuições e ao só visitar a página ou a discussão do usuário, continua vazio.

## 0.7.4 — 21/11/2026
- **Bloquear, desbloqueio**: o menu "O que fazer" ganhou o grupo **Desbloquear**, com uma opção para remover cada bloqueio do alvo (`action=unblock` pelo número do bloqueio, com motivo opcional), além dos grupos de alterar e de acrescentar. Reversores só podem remover bloqueios feitos por eles mesmos.

## 0.7.3 — 21/11/2026
- **Bloquear, multibloqueio**: quando o alvo já está bloqueado, o diálogo lista cada bloqueio dele (número, total ou parcial, autor, prazo e motivo) e pergunta o que fazer: alterar um deles (as opções vêm preenchidas com as daquele bloqueio, e a alteração vai pelo número dele) ou acrescentar um novo bloqueio, que vale junto com os atuais (`newblock`). Antes, o Ronda sempre substituía o primeiro bloqueio encontrado.
- **Bloquear, reversores**: ao tentar bloquear uma conta confirmada, o Ronda explica que não pode e oferece **Notificar vandalismo** ou **Notificar incidente**, que abrem o Pedido já com o tipo e o usuário preenchidos.

## 0.7.2 — 21/11/2026
- **Bloquear** para reversores (quem pode bloquear sem ser administrador), com os mesmos limites do gadget validateBlockRollbackers e da política: só IPs e contas não confirmadas (uma conta autoconfirmada ou confirmada é recusada, com aviso para pedir o bloqueio em WP:Pedidos/Notificações de vandalismo); durações de até 24 horas, sem "indefinido" nem duração livre; só os motivos de vandalismo do menu, sem texto livre; sem bloqueio parcial e sem impedir a criação de contas. O diálogo explica os limites.

## 0.7.1 — 19/11/2026
- **Lote**: filtros para a lista carregada, como o filtro de listas do AWB: domínios presentes (com a contagem de cada um), manter só os títulos que contêm um texto, tirar os que contêm outro (com a opção de expressão regular; uma expressão inválida fica marcada e é ignorada) e comparação com outra lista (tirar as que estão nela ou manter só as que também estão). A contagem mostra quantas páginas passam; só elas são executadas, e as caixas desmarcadas à mão continuam desmarcadas ao mudar os filtros. Ordem alfabética e remoção de duplicadas já eram feitas.

## 0.7.0 — 19/11/2026
- **Avisos favoritos** no Avisar e no Reverter: a estrela (☆/★) ao lado de cada aviso o leva para o grupo "Favoritos", no topo da lista, na ordem do catálogo; clicar de novo devolve ao grupo de origem. A lista é salva na conta, na opção `userjs-ronda-favoritos` (separada das preferências, que não a apagam), e é gravada de verdade mesmo no modo de simulação, como as preferências.

## 0.6.6 — 19/11/2026
- **Avisar**, nome impróprio:
  - o resumo liga cada tipo à seção da política de nome de usuário (WP:NOMEATAQUE e WP:ABUSOBPV para ofensivo/difamatório, WP:NOMEPROMO, WP:NOMECONF e WP:NOMECOMPRIDO, WP:NOMEENGANOSO, WP:NOEMOJI), em vez de ligar só a WP:PNU com o nome da predefinição entre parênteses; ex.: `Aviso sobre nome impróprio ([[WP:NOMEPROMO|promocional]])`;
  - "Promocional/compartilhado" passa a "Promocional" (a política admite nomes que sugerem uso compartilhado, se declarado).

## 0.6.5 — 19/11/2026
- **Reversão**: quando feita pela reversão rápida (rollback) — no Reverter, nos links rápidos e em "reverter todas no topo" —, o resumo passa a ser "Revertida(s) uma ou mais edições de …" em vez de "Desfeita(s)…"; desfazer pela edição continua com "Desfeita(s)". Nova opção `revert.rollbackSummary`.

## 0.6.4 — 19/11/2026
- Sumário: passa a ser ` (via [[User:Little Sunshine/Ronda|script]] #Ronda)`, com a ligação para a documentação em "script" e a hashtag fora da ligação.

## 0.6.3 — 19/11/2026
- **Avisar**: os cinco avisos de nome impróprio aceitam uma observação opcional, como no FastButtons; ela vai no parâmetro 1 da predefinição (`{{subst:Nome impróprio/…|1=observação}}`). Sem observação, a predefinição sai sem o parâmetro.

## 0.6.2 — 19/11/2026
- Sumário: passa a ser ` (via #Ronda — [[User:Little Sunshine/Ronda|Ronda]])`, com a hashtag fora da ligação (o Hashtags não a reconhece dentro de uma).
- **ER**: no resumo da marcação, a regra vira ligação (`[[WP:G1|G1]]`).
- **Painel Usuário**: nomes de mais grupos globais (visualizador global de IP de contas temporárias, editor global de interface, ouvidoria, U4C, grupos da Fundação Wikimedia etc.).

## 0.6.0 — 18/11/2026
- **Mensagens de interface** num arquivo próprio, `Ronda-mensagens.js` (Usuário:Little Sunshine/Scripts/Ronda-mensagens.js): os cerca de 500 textos da interface (botões, dicas, rótulos, diálogos, notificações, registros de progresso, preferências) saem do código e passam a ser chamados por chave com `ronda.msg( 'chave', … )`, com parâmetros `$1`, `$2`… e `{{PLURAL:…}}`. Mensagens novas entram lá. O arquivo roda antes do núcleo (carregador, gadget e pacote de console atualizados). Nenhum texto mudou.
- Opção `messages` no `window.rondaConfig`, para trocar textos só para si.

## 0.5.9 — 18/11/2026
- **Informações**, **Listar**, **Busca** e **PetScan** passam a seguir o visual do painel Usuário:
  - Informações em três linhas (estado, dados, ligações); os códigos `ref cat afl` riscados do FastButtons viram "com/sem referências", "com/sem categorias", "com/sem afluentes", em verde ou vermelho; "nunca proposta para eliminação" ou a ligação para a proposta anterior; corrigido "Nenhuma edições eliminadas";
  - Listar: a lista aberta fica destacada e cada resultado ocupa uma linha, com a diferença de tamanho colorida, o autor (ligação para as contribuições) e o resumo visíveis, sem depender da dica; em Edições a revisar, também as pontuações de dano e de boa-fé;
  - Busca e PetScan como linhas do painel.

## 0.5.8 — 18/11/2026
- **Onde cada botão aparece**, com a mesma lógica do FastButtons:
  - marcações no texto da página (Manutenção, Esboço, #R, Fusão, ER, ESR, Consenso, Busca, PetScan): leitura, edição e diffs, nunca na página principal;
  - ações sobre a página como um todo (Informações, Mover, Eliminar, Desligar, Proteger): em qualquer ação dela, inclusive no histórico;
  - ações sobre o usuário (painel Usuário, Avisar, Lote de páginas criadas, alvo dos pedidos): em Especial:Contribuições e em qualquer ação da página ou da discussão do usuário, inclusive no histórico;
  - Pedido e Listar: em todas as páginas, inclusive no formulário de edição.

## 0.5.7 — 18/11/2026
- **Vigilância de páginas criadas**: processos que criam páginas de propósito vigiam a página criada por padrão — a discussão da eliminação por consenso, os redirecionamentos da proposta conjunta e o #R numa página que não existia —, a menos que a opção escolhida seja "Deixar de vigiar".

## 0.5.6 — 18/11/2026
- **Vigilância**: o padrão passa a ser seguir as preferências do MediaWiki ("Adicionar à lista de páginas vigiadas as páginas que eu editar"); antes era "não mudar", o que ignorava essa preferência. Preferências salvas por versões anteriores com o antigo padrão são descartadas. No diálogo, as opções ficam "Seguir as minhas preferências do MediaWiki (padrão)", "Sempre vigiar", "Não mudar a vigilância" e "Deixar de vigiar".

## 0.5.5 — 17/11/2026
- **Proteger**: botão de corrente entre as linhas de edição e de moção, já ligado: mudar o nível ou a duração de uma muda a outra; clicar separa (corrente aberta) e, ao religar, a moção passa a seguir a edição.

## 0.5.4 — 17/11/2026
- **Bloquear**: todas as opções passam a ser restrições ("Impedir…"): a criação de contas, a edição pelos IPs da conta, as contas registradas no mesmo IP, o envio de e-mail e a edição da própria discussão (antes, "Permitir editar a própria discussão" e "Bloquear apenas não registrados" funcionavam ao contrário das demais).

## 0.5.3 — 17/11/2026
- **Bloquear**: a notificação (`{{Bloqueado}}`, `{{Bloqueado-disc}}` e `{{Bloqueado parcial}}`) passa a ser enviada pelo módulo da comunidade `mw.libs.blockNotificationButton`; CPV e proxy, ou se o módulo não carregar, continuam pelo Ronda.
- Seções novas na discussão do usuário: o título da seção não leva mais o "(via … Ronda)" (o MediaWiki usava o resumo como título).

## 0.5.2 — 16/11/2026
- Sumário: passa a ser ` (via #[[Usuário:Little Sunshine/Ronda|Ronda]])` e não pode mais ser alterado pelas preferências (o valor gravado por versões anteriores do diálogo é ignorado).

## 0.5.1 — 16/11/2026
- **Painel Usuário**: retirada a linha de nomes anteriores.

## 0.5.0 — 16/11/2026
- **Painel Usuário**, com muito mais informação:
  - bloqueios anteriores (quantos e o último, com data, autor e duração), edições revertidas entre as 100 mais recentes, páginas criadas e quantas não existem mais, contribuições eliminadas (ligação), nomes anteriores;
  - atividade: última edição, edições em 24 h e 7 dias e os domínios mais editados;
  - data em que cada grupo local atual foi atribuído, com ligação para o registro de permissões;
  - CheckUser: verificar, investigar e registro de verificações, para quem tem o direito;
  - IPs: faixa /24 ou /64 (contribuições, bloqueios locais e globais), bloqueio global, WHOIS, localização, proxy, Spur, contribuições globais e, com a ferramenta de informações de IP da wiki, os dados do IP (só ao clicar, porque o acesso fica registrado);
  - ações: **reverter todas no topo** (reversão rápida, com lista para conferir) e **eliminar as criadas** (abre o Lote já carregado).
- **Lote**: a fonte "páginas criadas por" também aparece na página e na discussão do usuário.
- Arquivos da wiki: todos os .js trazem no cabeçalho as ligações para os demais arquivos do Ronda.

## 0.4.11 — 16/11/2026
- **Eliminar** e **Lote**: o catálogo de motivos prevalece sobre o menu nativo — uma regra de ER do catálogo substitui a do menu com o mesmo código (texto e ligação do catálogo), ou entra se faltar; opções sem código marcadas com `add: true` entram sempre, depois das regras do grupo (ex.: "Discussão de página de redirecionamento", caso particular da D2).

## 0.4.10 — 16/11/2026
- **Eliminar** e **Lote**: as regras de ER que faltam no menu nativo do domínio (como a D2 em discussões) são completadas a partir de um catálogo de motivos com a mesma base da ferramenta de eliminação em massa (en:User:Animum/massdelete.js), com o mesmo texto e ligação; entram junto das regras irmãs (D2 depois da D1).

## 0.4.9 — 16/11/2026
- **Eliminar** e **Lote** em páginas de discussão: a regra D2 entra no menu de motivos logo depois da D1 (o menu da pt.wiki só traz a D1 nesses domínios); uma marcação `{{ER|D2}}` agora deixa a D2 pré-selecionada.

## 0.4.8 — 15/11/2026
- **Eliminar**: os redirecionamentos eliminados junto agora vêm da lista de redirecionamentos *para* a página (antes, qualquer afluente que fosse um redirecionamento era tratado como tal, e um módulo que redirecionava para outro e só ligava à /doc eliminada foi eliminado por R1); a opção lista os títulos quando são até cinco.

## 0.4.7 — 15/11/2026
- **Desligar**: remove também as ligações vindas do domínio da própria página (ex.: predefinições que ligam a uma predefinição), além dos domínios configurados; opção `unlink.currentNamespace` (padrão: ligada), também nas preferências. `unlink.namespaces` aceita texto (`'0|14'`) ou lista (`[ 0, 14 ]`).

## 0.4.6 — 14/11/2026
- **Modo escuro** nativo da Wikipédia (escuro ou automático com o sistema escuro): barra, diálogos, campos, mensagens, menus de sugestão, dicas e barra de progresso passam a usar as cores do tema; os botões azul e vermelho mantêm o estilo nativo.

## 0.4.5 — 13/11/2026
- **Manutenção**: marcações agrupadas por tema (fontes e referências, formatação e estilo, categorias, conteúdo, perspectiva global, estado da página), um quadro por grupo; o filtro esconde os grupos sem resultado.

## 0.4.4 — 13/11/2026
- **Lote**: o menu de eliminação é expandido para cada domínio das páginas carregadas e os motivos são juntados (antes só vinha o de um domínio e faltavam regras); com ficheiros, entra também o menu de ficheiros.

## 0.4.3 — 13/11/2026
- **Lote**: menu de motivos nativo de cada ação (eliminação, restauro, proteção), com busca e detalhes, no lugar do campo de texto.

## 0.4.2 — 13/11/2026
- **Eliminar** em ficheiros: o menu de motivos traz primeiro os de MediaWiki:Filedelete-reason-dropdown, seguidos dos de eliminação rápida.

## 0.4.1 — 13/11/2026
- **Mover**: em página de usuário raiz, a discussão do usuário não é mais oferecida nem movida junto.

## 0.4.0 — 13/11/2026
- **Modo móvel (Minerva)**: barra no topo do conteúdo, botões maiores, diálogos na largura da tela; sem o menu de ações, o nome "Ronda" recolhe/expande a barra e "Preferências" fica na própria barra. Reverter e Avisar funcionam em Especial:MobileDiff.
- **Reversão rápida** como no Twinkle: `[reverter (BF) | reverter | reverter (vandalismo)]` em diffs, histórico, contribuições, mudanças recentes e páginas vigiadas; a de vandalismo abre o Avisar já preenchido.
- **Restaurar esta versão** no diff, em versões antigas e no histórico.
- **Avisar**: confirmação para aviso repetido em 24 h ou discussão editada há menos de 1 minuto; botão Prévia; notificação de vandalismo preenchida depois do terceiro aviso.
- **Restaurar** (página eliminada) e **Lote** (eliminar, restaurar ou proteger várias páginas).
- **Preferências do Ronda**: diálogo com as opções principais, salvas na conta (`userjs-ronda`).
- Ícone do Commons ao lado do nome na barra.
- Menus de motivos: só o de eliminação é expandido (o de bloqueio mostrava o HTML das predefinições).

## 0.3.0 — 12/11/2026
- **Consolidação**: de 14 para 7 arquivos (núcleo, catálogos, patrulha, páginas, administração, estilo, carregador); ajudantes comuns no núcleo; inicialização no núcleo.
- Restante do FastButtons: **#R, Esboço, Fusão, Busca, PetScan, Informações, Pedido, Não assinou e Listar** (com Edições a revisar via LiftWing).
- **Modo de edição**: Manutenção, Esboço, #R, ER e ESR no formulário de edição, com avisos enviados ao publicar.
- Avisar sempre disponível em diffs, reversões e versões antigas (pergunta o usuário quando não identificado); notificações de bloqueio no catálogo.
- Módulo com erro fica fora da barra sem derrubar os outros.

## 0.2.0 — 10 e 11/11/2026
- **Reverter e Avisar** (sucessores do DiffTools): desfazer com `undo` ou reversão rápida, avisos de múltipla escolha num catálogo único e nível sugerido.
- **ER e ESR** (propostas de eliminação rápida e semirrápida), **Mover** (com eliminação R2 do destino e supressão do redirecionamento da discussão) e **painel do usuário**.
- Carregador para uso como script de usuário (`Ronda-loader.js`).
- Sufixo "via Ronda" em todos os resumos e motivos.
- Visual nativo do jQuery UI do skin.

## 0.1.0 — 09/11/2026
- Primeira versão, como "Novo Patrulhamento": barra adaptada à página, Manutenção (múltipla escolha), eliminação por consenso (inclusive conjunta), Eliminar, Desligar, Proteger e Bloquear.
- Pacote para o console com modo de simulação e workflow do GitHub Actions.

# Ronda — roteiro e decisões

- [x] Avisos de múltipla escolha com catálogo único (unificando as listas do FastButtons e do DiffTools)
- [x] Reversão no diff com `undo`/`rollback` e o fluxo "reverter + avisar"
- [x] Nível do aviso sugerido a partir da discussão do usuário
- [x] Modo móvel (Minerva): barra recolhível, diálogos responsivos, Especial:MobileDiff (a testar num celular)
- [x] Proposta de eliminação por consenso, inclusive conjunta
- [x] Proposta de eliminação rápida e semirrápida (ER/ESR)
- [ ] Encerramento de PE conjunta: ao eliminar a página mestra, oferecer a eliminação das páginas cujas discussões redirecionam para ela
- [x] Mover
- [x] Pedidos, Informações, Busca, PetScan, Esboço, #R, Fusão, Listar e Não assinou
- [x] Modo de edição (FastButtons): Manutenção, Esboço, #R, ER e ESR no formulário
- [x] Avisar sempre disponível em diffs, reversões e versões antigas
- [x] Reversão rápida (BF / normal / vandalismo) em diffs, histórico, contribuições, mudanças recentes e páginas vigiadas; restaurar versão
- [x] Confirmações e prévia no Avisar; notificação de vandalismo depois do terceiro aviso
- [x] Restaurar páginas e ações em lote (eliminar, restaurar, proteger)
- [x] Preferências salvas na conta
- [ ] Fila de patrulha com "Próxima" a partir de "Edições a revisar" (extensão ORES)
- [ ] Talkback, IP compartilhado, ER com várias regras, registro pessoal das propostas, marcações de redirecionamento e de ficheiro
- [ ] Versões de compatibilidade de `window.fastButtons` e do hook `fastButtons.ready`
- [x] Painel do usuário ampliado (histórico, atividade, CheckUser, IPs, ações em massa)
- [x] Modo escuro nativo
- [ ] Criar a etiqueta `ronda`

### Decisões para a 1.0

| Tema | Decisão |
|---|---|
| Público | Gadget opcional para todos, desligado por padrão |
| FastButtons e DiffTools | Substitui o FastButtons; convive com o DiffTools, sem detecção (o Ronda mostra tudo) |
| Interface | jQuery UI (as bibliotecas mais novas têm espaçamento demais) |
| Distribuição | Gadget estável em `MediaWiki:Gadget-Ronda-*` e scripts de usuário como canal de testes; o gadget recebe só versões fechadas (1.1, 1.2…), com correções urgentes (1.0.1) a qualquer momento |
| Catálogos | Continuam no código |
| Rastreio | Gadget: só a etiqueta `ronda`; script: só o resumo |
| Ações em massa | Lista para conferir, confirmação a partir de 15 páginas e limite de 50 por operação (acima disso, marca as 50 primeiras e avisa quantas ficaram de fora) |
| Marcas ocultas nos avisos | Deixam de ser gravadas; as já existentes continuam sendo lidas |
| Celular | O gadget também carrega no site móvel |
| Documentação | Passa para Wikipédia:Ronda (a página atual vira redirecionamento) |

Ainda a decidir: a ligação do resumo no canal de script (Wikipédia:Ronda ou a página de usuário) e se a documentação continua ensinando a instalar o script como versão de testes.

Ainda a implementar: as marcas ocultas e os números das ações em massa acima.

### Questões em aberto
- **Avisos com duas predefinições**: quando o DiffTools e o FastButtons usavam predefinições diferentes para o mesmo aviso (ex.: `Vandalismo` × `aviso-vandalismo`, `Aviso-autobiografia` × `autobiografia`, `Aviso-categoria` × `av-categoria`), ficou a do DiffTools. Vale conferir se as outras são redirecionamentos. O nível "b" (notificação de bloqueio) do FastButtons ficou de fora: as notificações estão no módulo Bloquear.
- **Boas-vindas**: o "bv+1" do DiffTools usa `{{bv}}` para todos; o FastButtons separa `bem-vindo(a)` e `bem-vindo IP`. O Ronda segue o FastButtons (`ronda.catalog.welcome`).
- **Renomear página**: o FastButtons acrescenta `|{{subst:DATA}}` sem nome depois de `1=`/`2=`, o que sobrescreve o parâmetro 1. A data foi omitida até confirmar a assinatura da predefinição.
- **Modelo da PE**: as linhas `{{PE-ferramentas2|…}}` das páginas adicionais entram logo depois da linha da página mestra que vem de `Predefinição:Página para eliminar`. Se o modelo deixar de ter essa linha, elas entram antes da justificativa.
- **Nomes após o `subst`**: os nomes reais das predefinições do catálogo vieram do FastButtons e precisam ser conferidos.

---

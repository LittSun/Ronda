/**
 * Ronda — pacote para o console (gerado por gerar-pacote-console.js).
 * Cole este arquivo inteiro no console de qualquer página da wiki.
 * Simulação ligada: nada é gravado. Para gravar de verdade, troque para dryRun: false.
 */
window.rondaConfig = { dryRun: true };

mw.loader.using( ["jquery.ui","mediawiki.api","mediawiki.util","mediawiki.user","mediawiki.storage","mediawiki.notification"] ).then( function () {
// Permite colar de novo sem duplicar a barra
$( '#ronda-toolbar, #ca-ronda-toggle, #ronda-console-css' ).remove();
$( '<style id="ronda-console-css"></style>' ).text( "/**\n * Ronda — estilo\n *\n * Os diálogos usam o tema nativo do jQuery UI do skin (cores, botões, barra\n * de título). Aqui ficam só:\n * - a barra de botões da página, com um estilo próprio e discreto;\n * - o mínimo de layout dos formulários (espaçamentos e larguras);\n * - o modo móvel e o modo escuro nativo (o tema do jQuery UI só tem cores claras).\n * Cores vêm das variáveis do MediaWiki (Codex), com valores de reserva.\n */\n\n/* ------------------------------------------------------------------ *\n * Barra de botões da página\n * ------------------------------------------------------------------ */\n\n/*\n * Estilo \"cartão com título\": o nome Ronda numa aba escura à esquerda e os\n * botões planos dentro do cartão. O botão do painel aberto fica marcado com\n * um traço azul embaixo. O tema do jQuery UI usa !important no fundo e na\n * borda dos botões; por isso também aqui. As cores vêm das variáveis do Codex,\n * que já mudam no modo escuro.\n */\nhtml:not( .ronda-tema-original ) #ronda-toolbar {\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\talign-items: stretch;\n\tgap: 0;\n\tmargin: 0.5em 0 0.8em;\n\tpadding: 0;\n\tfont-size: 0.875em;\n\tbackground: var( --background-color-neutral-subtle, #f8f9fa );\n\tborder: 1px solid var( --border-color-subtle, #c8ccd1 );\n\tborder-radius: 3px;\n\toverflow: hidden;\n}\n\n#ronda-toolbar .ronda-brand img {\n\tvertical-align: middle;\n\twidth: auto;\n\tmargin: -0.15em 0.3em 0 0;\n}\n\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-brand {\n\tdisplay: flex;\n\talign-items: center;\n\tpadding: 0.45em 0.9em;\n\tfont-weight: bold;\n\tletter-spacing: 0.03em;\n\tcolor: var( --color-inverted, #fff );\n\tbackground: var( --background-color-inverted, #202122 );\n\tcursor: default;\n}\n\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-toolbar-group {\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\talign-items: stretch;\n}\n\n/* Separador entre o grupo de patrulha e o administrativo */\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-toolbar-admin {\n\tmargin-left: auto;\n\tborder-left: 1px solid var( --border-color-subtle, #c8ccd1 );\n}\n\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-btn.ui-button {\n\tmargin: 0;\n\tfont-size: 1em;\n\tfont-weight: normal;\n\tcolor: var( --color-base, #202122 ) !important;\n\tbackground: transparent !important;\n\tborder: 0 !important;\n\tborder-radius: 0 !important;\n\tbox-shadow: none !important;\n}\n\n/* No jQuery UI 1.9 o espaçamento do botão fica em .ui-button-text */\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-btn .ui-button-text {\n\tpadding: 0.45em 0.8em;\n}\n\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-btn.ui-button.ui-state-hover,\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-btn.ui-button.ui-state-focus,\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-btn.ui-button.ui-state-active {\n\tbackground: var( --background-color-interactive-subtle--hover, #eaecf0 ) !important;\n}\n\n/* Botão do painel aberto */\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-btn.ronda-btn-on.ui-button {\n\tcolor: var( --color-progressive, #36c ) !important;\n\tbackground: var( --background-color-base, #fff ) !important;\n\tbox-shadow: inset 0 -2px 0 var( --color-progressive, #36c ) !important;\n}\n\n/* Ações administrativas em vermelho */\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-btn-admin.ui-button {\n\tcolor: var( --color-destructive, #d73333 ) !important;\n}\n\n/* Marca do modo de simulação */\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-dry {\n\talign-self: center;\n\tmargin: 0 0.5em;\n\tpadding: 0.1em 0.5em;\n\tfont-size: 0.85em;\n}\n\n/* Faixas dentro da barra: Informações (página e usuário), Busca, PetScan, Filas */\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-userpanel {\n\tflex-basis: 100%;\n\tpadding: 0.4em 0.8em;\n\tborder-top: 1px solid var( --border-color-subtle, #c8ccd1 );\n\tbackground: var( --background-color-base, #fff );\n\tline-height: 1.6;\n}\n\n/* Boas-vindas (uma vez por conta) */\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-welcome {\n\tflex-basis: 100%;\n\tpadding: 0.4em 0.8em;\n\tborder-top: 1px solid var( --border-color-subtle, #c8ccd1 );\n\tbackground: var( --background-color-base, #fff );\n\tline-height: 1.5;\n}\n\n#ronda-toolbar .ronda-welcome p {\n\tmargin: 0 0 0.4em;\n}\n\n#ronda-toolbar .ronda-welcome-actions {\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\talign-items: center;\n\tgap: 0.4em 0.8em;\n}\n\n#ronda-toolbar .ronda-welcome-actions .ui-button {\n\tmargin: 0;\n\tfont-size: 1em;\n}\n\n#ronda-toolbar .ronda-welcome-actions .ui-button-text {\n\tpadding: 0.2em 0.7em;\n}\n\n#ronda-toolbar .ronda-up-line {\n\tmargin: 0.1em 0;\n}\n\n/* Painel Usuário: tabela de informações à esquerda, ações e links à direita */\n#ronda-toolbar .ronda-up-grid {\n\tdisplay: flex;\n\talign-items: flex-start;\n\tgap: 1em;\n}\n\n#ronda-toolbar .ronda-up-table {\n\tflex: 1 1 auto;\n\tborder-collapse: collapse;\n}\n\n#ronda-toolbar .ronda-up-table th,\n#ronda-toolbar .ronda-up-table td {\n\tpadding: 0.15em 0.6em 0.15em 0;\n\tborder-bottom: 1px solid var( --border-color-muted, #eaecf0 );\n\ttext-align: left;\n\tvertical-align: top;\n}\n\n#ronda-toolbar .ronda-up-table th {\n\twidth: 1%;\n\tpadding-right: 1em;\n\tfont-weight: normal;\n\tcolor: var( --color-subtle, #54595d );\n\twhite-space: nowrap;\n}\n\n#ronda-toolbar .ronda-up-table tr:last-child th,\n#ronda-toolbar .ronda-up-table tr:last-child td {\n\tborder-bottom: 0;\n}\n\n#ronda-toolbar .ronda-up-side {\n\tflex: 0 0 19em;\n\tbox-sizing: border-box;\n\tpadding-left: 0.8em;\n\tborder-left: 1px solid var( --border-color-subtle, #c8ccd1 );\n}\n\n/* Links dentro dos avisos vermelhos (ex.: wikis em que está bloqueado) */\n#ronda-toolbar .ronda-badge a {\n\tcolor: inherit;\n\ttext-decoration: underline;\n}\n\n#ronda-toolbar .ronda-up-group + .ronda-up-group {\n\tmargin-top: 0.4em;\n}\n\n#ronda-toolbar .ronda-up-heading {\n\tfont-size: 0.85em;\n\tfont-weight: bold;\n\tletter-spacing: 0.04em;\n\ttext-transform: uppercase;\n\tcolor: var( --color-subtle, #54595d );\n}\n\n#ronda-toolbar .ronda-up-main {\n\tfont-weight: bold;\n}\n\n/* Tela estreita: a coluna de ações desce para baixo da tabela */\n@media screen and ( max-width: 720px ) {\n\t#ronda-toolbar .ronda-up-grid {\n\t\tflex-direction: column;\n\t}\n\n\t#ronda-toolbar .ronda-up-side {\n\t\tflex-basis: auto;\n\t\tpadding: 0.4em 0 0;\n\t\tborder-left: 0;\n\t\tborder-top: 1px solid var( --border-color-subtle, #c8ccd1 );\n\t}\n}\n\n/* Informações com os dois painéis (páginas de usuário): título de cada parte */\n#ronda-toolbar .ronda-info-heading {\n\tmargin: 0.4em 0 0.2em;\n\tfont-size: 0.85em;\n\tfont-weight: bold;\n\tletter-spacing: 0.04em;\n\ttext-transform: uppercase;\n\tcolor: var( --color-subtle, #54595d );\n}\n\n#ronda-toolbar .ronda-info-heading + .ronda-info-part {\n\tpadding-top: 0;\n}\n\n/* Manutenção: motivo de cada sugestão */\n.ronda-form .ronda-sug-reason {\n\tmargin-left: 0.4em;\n\tfont-size: 0.85em;\n\tcolor: var( --color-subtle, #54595d );\n}\n\n.ronda-form .ronda-sug-reason::before {\n\tcontent: '— ';\n}\n\n/* Filas: prévia ao passar o mouse */\n.ronda-hover-preview {\n\tposition: absolute;\n\tz-index: 1000;\n\twidth: 660px;\n\tmax-width: calc( 100vw - 16px );\n\tmax-height: 340px;\n\toverflow: hidden;\n\tpadding: 0.5em 0.7em;\n\tfont-size: 0.82em;\n\tcolor: var( --color-base, #202122 );\n\tbackground: var( --background-color-base, #fff );\n\tborder: 1px solid var( --border-color-base, #a2a9b1 );\n\tborder-radius: 2px;\n\tbox-shadow: 0 4px 16px rgba( 0, 0, 0, 0.2 );\n\tpointer-events: none;\n}\n\n.ronda-hover-preview table.diff {\n\twidth: 100%;\n\ttable-layout: fixed;\n}\n\n.ronda-hover-preview p {\n\tmargin: 0;\n}\n\n/* Informações: alerta de recriação no botão */\n#ronda-toolbar .ronda-alert-badge,\n#ronda-toolbar .ronda-btn-alert.ui-button .ui-button-text::after {\n\tcontent: '!';\n\tdisplay: inline-block;\n\tmargin-left: 0.35em;\n\tpadding: 0 0.4em;\n\tfont-size: 0.8em;\n\tfont-weight: bold;\n\tline-height: 1.3;\n\tcolor: var( --color-inverted-fixed, #fff );\n\tbackground: var( --background-color-error, #d73333 );\n\tborder-radius: 999px;\n}\n\n#ronda-toolbar .ronda-alert-badge {\n\tmargin: 0 0.35em 0 0;\n}\n\n/* Propor eliminação: escolha do tipo */\n.ronda-elim-type {\n\tdisplay: block;\n\tmargin: 0 0 0.5em;\n\tpadding: 0.5em 0.7em;\n\tborder: 1px solid var( --border-color-subtle, #c8ccd1 );\n\tborder-radius: 2px;\n\tcursor: pointer;\n}\n\n.ronda-elim-type:has( input:checked ) {\n\tborder-color: var( --border-color-progressive, #36c );\n\tbackground: var( --background-color-progressive-subtle, #eaf3ff );\n}\n\n.ronda-elim-desc {\n\tdisplay: block;\n\tmargin: 0.2em 0 0 1.6em;\n\tfont-size: 0.9em;\n\tcolor: var( --color-subtle, #54595d );\n}\n\n.ronda-elim-vda {\n\tmargin: 0.4em 0 0;\n\tfont-size: 0.9em;\n}\n\n/* Qualidade automática: janela com os critérios */\n.ronda-qf details {\n\tmargin: 8px 0;\n\tpadding: 2px 10px;\n\tborder: 1px solid var( --border-color-base, #a2a9b1 );\n\tborder-radius: 2px;\n}\n\n.ronda-qf summary {\n\tpadding: 4px 0;\n\tfont-weight: bold;\n\tcursor: pointer;\n}\n\n.ronda-qf table {\n\twidth: 100%;\n\tmargin: 4px 0;\n\tborder-collapse: collapse;\n}\n\n.ronda-qf td:last-child {\n\twhite-space: nowrap;\n}\n\n.ronda-qf td {\n\tpadding: 3px 6px;\n\tvertical-align: top;\n\tborder-top: 1px solid var( --border-color-subtle, #eaecf0 );\n}\n\n.ronda-qf-nivel {\n\tpadding: 0 8px;\n\tborder-radius: 2px;\n\tcolor: #fff;\n\tbackground: var( --background-color-progressive, #36c );\n}\n\n.ronda-qf-nota {\n\tfont-size: 0.85em;\n\tcolor: var( --color-subtle, #54595d );\n}\n\n/* Ocorrências do filtro de abusos, abertas ao clicar */\n#ronda-toolbar .ronda-up-list {\n\tmargin: 0.2em 0 0.2em 1.6em;\n\tpadding: 0;\n}\n\n#ronda-toolbar .ronda-badge {\n\tpadding: 0.1em 0.5em;\n}\n\n#ronda-toolbar .ronda-up-hot {\n\tfont-weight: bold;\n\tcolor: var( --color-destructive, #d73333 );\n}\n\n#ronda-toolbar .ronda-up-action {\n\tfont-weight: bold;\n}\n\n/* Informações e Listar: o que está bem (verde) e o que falta (vermelho) */\n#ronda-toolbar .ronda-ok,\n.ronda-qf .ronda-ok {\n\tcolor: var( --color-success, #14866d );\n}\n\n#ronda-toolbar .ronda-bad,\n.ronda-qf .ronda-bad {\n\tcolor: var( --color-destructive, #d73333 );\n}\n\n/* Listar: a lista aberta */\n#ronda-toolbar .ronda-up-current {\n\tfont-weight: bold;\n\tcolor: var( --color-base, #202122 );\n\ttext-decoration: none;\n\tcursor: default;\n}\n\n/* Listar: um resultado por linha */\n#ronda-toolbar .ronda-feed {\n\tmargin: 0.2em 0 0;\n\tpadding: 0;\n\tlist-style: none;\n}\n\n#ronda-toolbar .ronda-feed li {\n\tmargin: 0;\n\toverflow: hidden;\n\twhite-space: nowrap;\n\ttext-overflow: ellipsis;\n}\n\n#ronda-toolbar .ronda-feed-muted,\n#ronda-toolbar .ronda-feed-comment {\n\tcolor: var( --color-subtle, #72777d );\n}\n\n#ronda-toolbar .ronda-feed-comment {\n\tfont-style: italic;\n}\n\n#ronda-toolbar .ronda-feed-big {\n\tfont-weight: bold;\n}\n\n#ronda-toolbar .ronda-up-admin {\n\tcolor: var( --color-destructive, #d73333 );\n}\n\n/* ------------------------------------------------------------------ *\n * Formulários dos diálogos (só layout)\n * ------------------------------------------------------------------ */\n\n.ronda-form .ronda-row {\n\tmargin: 0.6em 0;\n}\n\n.ronda-form .ronda-row > label {\n\tdisplay: block;\n\tmargin-bottom: 0.2em;\n\tfont-weight: bold;\n}\n\n.ronda-form .ronda-input,\n.ronda-form select {\n\tbox-sizing: border-box;\n\twidth: 100%;\n}\n\n.ronda-form table select,\n.ronda-form select.ronda-level {\n\twidth: auto;\n}\n\n/* Proteger: corrente que liga edição e moção, entre as duas linhas */\n.ronda-form .ronda-chain-cell {\n\tvertical-align: middle;\n\ttext-align: center;\n\tpadding: 0 0.3em;\n}\n\n.ronda-form .ronda-chain.ui-button {\n\tmargin: 0;\n}\n\n.ronda-form .ronda-chain .ui-button-text {\n\tpadding: 0.3em 0.4em;\n\tline-height: 0;\n}\n\n/* Mover: domínio e título na mesma linha */\n.ronda-form .ronda-move-title {\n\tdisplay: flex;\n\tgap: 0.4em;\n}\n\n.ronda-form .ronda-move-title .ronda-input {\n\tflex: 1;\n}\n\n.ronda-form .ronda-check {\n\tmargin: 0.3em 0;\n}\n\n.ronda-form fieldset {\n\tmargin: 0.6em 0;\n}\n\n.ronda-form .ronda-refresh {\n\tmargin-top: 0.3em;\n\ttext-align: right;\n}\n\n.ronda-form .ronda-msg {\n\tmargin: 0 0 0.6em;\n\tpadding: 0.4em 0.6em;\n}\n\n.ronda-form .ronda-msg .ui-icon {\n\tfloat: left;\n\tmargin: 0.1em 0.4em 0 0;\n}\n\n/* Opções de Manutenção e Avisar: caixas de seleção lado a lado */\n.ronda-form .ronda-tag {\n\tdisplay: inline-block;\n\tvertical-align: top;\n\tmargin: 0.1em 1em 0.1em 0;\n}\n\n.ronda-form .ronda-tag.ronda-tag-open {\n\tdisplay: block;\n}\n\n/* Presente na página e desmarcada = será removida */\n.ronda-form .ronda-tag-present > input:not( :checked ) + label {\n\ttext-decoration: line-through;\n}\n\n.ronda-form .ronda-tag-params {\n\tmargin: 0.3em 0 0.4em 1em;\n}\n\n.ronda-form .ronda-tag-params .ronda-input {\n\tmargin-top: 0.3em;\n}\n\n.ronda-form .ronda-checks .ronda-check {\n\tmargin: 0.1em 0;\n}\n\n.ronda-form .ronda-checks.ui-state-error {\n\tpadding: 0.2em;\n}\n\n.ronda-form fieldset.ronda-batch-filters {\n\tmargin: 0.5em 0;\n}\n\n.ronda-form .ronda-batch-count {\n\tmargin-top: 0.3em;\n\tfont-size: 0.9em;\n}\n\n.ronda-form fieldset.ronda-warn-group {\n\tmargin: 0.5em 0;\n}\n\n/* Avisos favoritos: estrela ao lado do nome */\n.ronda-form .ronda-fav {\n\tmargin-left: 0.3em;\n\ttext-decoration: none;\n\tcolor: var( --color-subtle, #72777d );\n}\n\n.ronda-form .ronda-fav[ aria-pressed='true' ] {\n\tcolor: var( --color-warning, #a66200 );\n}\n\n.ronda-form .ronda-warn-note {\n\tmargin-top: 0.3em;\n\tfont-size: 0.9em;\n}\n\n.ronda-form .ronda-list {\n\tmax-height: 16em;\n\toverflow: auto;\n\tpadding: 0.4em 0.6em;\n}\n\n.ronda-form .ronda-list label {\n\tdisplay: block;\n}\n\n.ronda-form .ronda-list .ronda-check label {\n\tdisplay: inline;\n}\n\n.ronda-form .ronda-bundle {\n\tmargin: 0.4em 0 0.6em 1.4em;\n}\n\n.ronda-form .ronda-progress {\n\theight: 1em;\n\tmargin-top: 0.6em;\n}\n\n.ronda-form .ronda-log {\n\tmax-height: 10em;\n\toverflow: auto;\n\tmargin: 0.6em 0 0 1.4em;\n}\n\n.ronda-form .ronda-log:empty {\n\tdisplay: none;\n}\n\n/* ------------------------------------------------------------------ *\n * Links rápidos (reverter / restaurar) em diffs, histórico e listas\n * ------------------------------------------------------------------ */\n\n.ronda-quick {\n\twhite-space: nowrap;\n\tfont-size: 0.92em;\n}\n\n.ronda-quick .ronda-quick-vandal {\n\tcolor: var( --color-destructive, #d73333 );\n}\n\n.ronda-quick .ronda-quick-ok {\n\tcolor: var( --color-success, #14866d );\n}\n\n.ronda-quick .ronda-quick-error {\n\tcolor: var( --color-error, #d73333 );\n}\n\n/* Prévia dos avisos */\n.ronda-preview {\n\tmax-height: 60vh;\n\toverflow: auto;\n}\n\n/* ------------------------------------------------------------------ *\n * Modo móvel (Minerva) e telas estreitas\n * ------------------------------------------------------------------ */\n\n/* Barra recolhida: só o nome (que expande ao toque) */\n#ronda-toolbar.ronda-collapsed > :not( .ronda-brand ) {\n\tdisplay: none !important;\n}\n\n/* Nome \"Ronda\": abre o meta-painel */\n#ronda-toolbar .ronda-brand-toggle {\n\tcursor: pointer;\n}\n\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-brand-toggle:hover,\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-brand-toggle:focus {\n\tcolor: var( --color-inverted, #fff );\n\tbackground: var( --background-color-progressive, #36c );\n}\n\n#ronda-toolbar .ronda-brand-caret {\n\tfont-weight: normal;\n\tfont-size: 0.85em;\n}\n\n#ronda-toolbar .ronda-meta-news {\n\tmargin: 0 0 0 1.2em;\n\tpadding: 0;\n}\n\n#ronda-toolbar .ronda-meta-quick {\n\tdisplay: inline-block;\n\tmargin-right: 1em;\n}\n\n/* Selo \"novo\" no nome, até as novidades serem vistas */\n#ronda-toolbar .ronda-news-badge {\n\tmargin-left: 0.3em;\n\tpadding: 0 0.45em;\n\tborder-radius: 0.8em;\n\tbackground: var( --background-color-progressive, #36c );\n\tcolor: var( --color-inverted-fixed, #fff );\n\tfont-size: 0.75em;\n\tfont-weight: bold;\n\tvertical-align: middle;\n}\n\n/* Faixa de novidades depois de uma atualização */\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-userpanel.ronda-news {\n\tpadding: 0.4em 0.8em;\n\tborder-top-width: 1px;\n}\n\n#ronda-toolbar .ronda-news .ronda-meta-news {\n\tmargin: 0.2em 0 0.3em 1.2em;\n}\n\n#ronda-toolbar .ronda-not-again {\n\tfont-size: 0.9em;\n}\n\n.ronda-report-env {\n\tmargin: 0.3em 0 0 1.2em;\n\tfont-size: 0.85em;\n\tcolor: var( --color-subtle, #54595d );\n\tword-break: break-word;\n}\n\nhtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-prefs-link {\n\talign-self: center;\n\tmargin-left: auto;\n\tpadding: 0 0.8em;\n\tfont-size: 0.9em;\n}\n\n#ronda-toolbar.ronda-mobile {\n\tmargin: 0.5em 0;\n\tfont-size: 1em;\n}\n\n/* Alvos de toque maiores */\nhtml:not( .ronda-tema-original ) #ronda-toolbar.ronda-mobile .ronda-btn .ui-button-text {\n\tpadding: 0.65em 0.9em;\n}\n\nhtml:not( .ronda-tema-original ) #ronda-toolbar.ronda-mobile .ronda-toolbar-admin {\n\tmargin-left: 0;\n\tborder-left: 0;\n}\n\n.ronda-dialog-narrow .ronda-form .ronda-input,\n.ronda-dialog-narrow .ronda-form select,\n.ronda-dialog-narrow .ronda-form textarea {\n\tfont-size: 16px; /* evita o zoom automático do iOS */\n}\n\n.ronda-dialog-narrow .ui-dialog-buttonpane .ui-dialog-buttonset {\n\tfloat: none;\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\tjustify-content: flex-end;\n\tgap: 0.3em;\n}\n\n.ronda-dialog-narrow .ronda-form .ronda-tag {\n\tdisplay: block;\n\tmargin: 0.3em 0;\n}\n\n@media ( max-width: 720px ) {\n\thtml:not( .ronda-tema-original ) #ronda-toolbar .ronda-toolbar-admin {\n\t\tborder-left: 0;\n\t}\n\n\t.ronda-quick {\n\t\twhite-space: normal;\n\t}\n}\n\n/* ------------------------------------------------------------------ *\n * Janelas do Ronda no estilo da barra (\"cartão com título\"): o nome Ronda\n * numa aba escura antes do título, grupos como cartões, rodapé cinza com\n * botões planos e o principal em azul. Continuam sendo diálogos do jQuery UI;\n * o tema dele usa !important no fundo, na borda e na barra de título, por isso\n * também aqui, sempre restrito a .ronda-dialog. As cores vêm das variáveis do\n * Codex, que já mudam no modo escuro.\n * ------------------------------------------------------------------ */\n\nhtml:not( .ronda-tema-original ) .ronda-dialog.ui-dialog {\n\tpadding: 0 !important;\n\toverflow: hidden;\n\tcolor: var( --color-base, #202122 ) !important;\n\tbackground: var( --background-color-base, #fff ) !important;\n\tborder: 1px solid var( --border-color-subtle, #c8ccd1 ) !important;\n\tborder-radius: 3px !important;\n\tbox-shadow: 0 4px 18px rgba( 0, 0, 0, 0.18 ) !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-titlebar {\n\tdisplay: flex;\n\talign-items: stretch;\n\tmargin: 0 !important;\n\tpadding: 0 !important;\n\tcolor: var( --color-base, #202122 ) !important;\n\tbackground: var( --background-color-neutral-subtle, #f8f9fa ) !important;\n\tborder: 0 !important;\n\tborder-bottom: 1px solid var( --border-color-subtle, #c8ccd1 ) !important;\n\tborder-radius: 0 !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-titlebar::before {\n\tcontent: 'Ronda';\n\tdisplay: flex;\n\talign-items: center;\n\tpadding: 0.55em 0.9em;\n\tfont-weight: bold;\n\tletter-spacing: 0.03em;\n\tcolor: var( --color-inverted, #fff );\n\tbackground: var( --background-color-inverted, #202122 );\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-title {\n\tflex: 1;\n\tfloat: none !important;\n\twidth: auto !important;\n\tmargin: 0 !important;\n\tpadding: 0.55em 0.9em;\n\toverflow: hidden;\n\tfont-weight: bold;\n\twhite-space: nowrap;\n\ttext-overflow: ellipsis;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-titlebar-close {\n\tposition: static !important;\n\tdisplay: flex !important;\n\tflex: 0 0 2.8em;\n\talign-items: center;\n\tjustify-content: center;\n\twidth: auto !important;\n\theight: auto !important;\n\tmargin: 0 !important;\n\tpadding: 0 !important;\n\tfont-size: 0 !important;\n\tcolor: var( --color-subtle, #54595d ) !important;\n\tbackground: transparent !important;\n\tborder: 0 !important;\n\tborder-radius: 0 !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-titlebar-close::after {\n\tcontent: '✕';\n\tfont-size: 14px;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-titlebar-close:hover,\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-titlebar-close:focus {\n\tbackground: var( --background-color-interactive-subtle--hover, #eaecf0 ) !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-titlebar-close .ui-icon,\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-titlebar-close .ui-button-text {\n\tdisplay: none !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-content {\n\tpadding: 0.8em 1em !important;\n\tcolor: inherit !important;\n\tbackground: transparent !important;\n}\n\n/* Grupos como cartões, com o título pequeno em cima */\nhtml:not( .ronda-tema-original ) .ronda-dialog .ronda-form fieldset {\n\tmargin: 0.7em 0 !important;\n\tpadding: 0.35em 0.8em 0.55em !important;\n\tcolor: inherit !important;\n\tbackground: var( --background-color-base, #fff ) !important;\n\tborder: 1px solid var( --border-color-subtle, #c8ccd1 ) !important;\n\tborder-radius: 2px !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ronda-form fieldset fieldset {\n\tborder-color: var( --border-color-muted, #eaecf0 ) !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ronda-form legend {\n\tpadding: 0 0.35em !important;\n\tfont-size: 0.85em !important;\n\tfont-weight: bold !important;\n\tcolor: var( --color-subtle, #54595d ) !important;\n}\n\n/* Favoritos (Avisar) e Sugeridas (Manutenção): traço azul à esquerda */\n.ronda-dialog .ronda-form fieldset.ronda-warn-fav,\n.ronda-dialog .ronda-form fieldset.ronda-tag-sug {\n\tborder-left: 3px solid var( --color-progressive, #36c ) !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ronda-form input[ type=\"text\" ],\nhtml:not( .ronda-tema-original ) .ronda-dialog .ronda-form input[ type=\"number\" ],\nhtml:not( .ronda-tema-original ) .ronda-dialog .ronda-form textarea,\nhtml:not( .ronda-tema-original ) .ronda-dialog .ronda-form select {\n\tborder-radius: 2px;\n}\n\n/* Rodapé: faixa cinza, botões planos, o principal em azul e os perigosos em vermelho */\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane {\n\tmargin: 0 !important;\n\tpadding: 0.5em 0.8em !important;\n\tbackground: var( --background-color-neutral-subtle, #f8f9fa ) !important;\n\tborder: 0 !important;\n\tborder-top: 1px solid var( --border-color-subtle, #c8ccd1 ) !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button {\n\tmargin: 0.15em 0 0.15em 0.4em !important;\n\tfont-weight: normal;\n\tcolor: var( --color-base, #202122 ) !important;\n\tbackground: transparent !important;\n\tborder: 1px solid var( --border-color-base, #a2a9b1 ) !important;\n\tborder-radius: 2px !important;\n\tbox-shadow: none !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button .ui-button-text {\n\tpadding: 0.4em 1em;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button.ui-state-hover,\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button.ui-state-focus {\n\tbackground: var( --background-color-interactive-subtle--hover, #eaecf0 ) !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button.ui-button-blue,\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button.ui-priority-primary {\n\tfont-weight: bold;\n\tcolor: var( --color-inverted-fixed, #fff ) !important;\n\tbackground: var( --background-color-progressive, #36c ) !important;\n\tborder-color: var( --background-color-progressive, #36c ) !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button.ui-button-red {\n\tcolor: var( --color-inverted-fixed, #fff ) !important;\n\tbackground: var( --background-color-destructive, #d73333 ) !important;\n\tborder-color: var( --background-color-destructive, #d73333 ) !important;\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button.ui-button-blue.ui-state-hover,\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button.ui-priority-primary.ui-state-hover,\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button.ui-button-red.ui-state-hover {\n\tfilter: brightness( 1.1 );\n}\n\nhtml:not( .ronda-tema-original ) .ronda-dialog .ui-dialog-buttonpane .ui-button.ui-state-disabled {\n\topacity: 0.5;\n}\n\n/* ------------------------------------------------------------------ *\n * Modo escuro nativo (Vector 2022 / Minerva): skin-theme-clientpref-night,\n * ou \"automático\" com o sistema em modo escuro. O tema do jQuery UI do\n * MediaWiki só tem cores claras (e usa !important nos botões e na barra de\n * título); aqui a barra, os diálogos, campos, menus e dicas do Ronda passam a\n * usar as variáveis do Codex. Os botões azul e vermelho ficam como estão.\n * ------------------------------------------------------------------ */\n\nhtml.skin-theme-clientpref-night .ronda-tooltip.ui-tooltip,\nhtml.skin-theme-clientpref-night .ronda-menu.ui-menu {\n\tbackground: var( --background-color-base, #101418 );\n\tborder-color: var( --border-color-base, #72777d );\n\tcolor: var( --color-base, #eaecf0 );\n}\n\nhtml.skin-theme-clientpref-night:not( .ronda-tema-original ) .ronda-dialog .ronda-list.ui-widget-content {\n\tbackground: transparent;\n\tborder-color: var( --border-color-subtle, #54595d );\n\tcolor: inherit;\n}\n\nhtml.skin-theme-clientpref-night .ronda-form input[ type=\"text\" ],\nhtml.skin-theme-clientpref-night .ronda-form input[ type=\"number\" ],\nhtml.skin-theme-clientpref-night .ronda-form textarea,\nhtml.skin-theme-clientpref-night .ronda-form select {\n\tbackground: var( --background-color-base, #101418 );\n\tborder: 1px solid var( --border-color-interactive, #72777d );\n\tcolor: var( --color-base, #eaecf0 );\n}\n\nhtml.skin-theme-clientpref-night .ronda-form .ui-state-error,\nhtml.skin-theme-clientpref-night .ronda-form input.ui-state-error,\nhtml.skin-theme-clientpref-night .ronda-form select.ui-state-error,\nhtml.skin-theme-clientpref-night .ronda-form textarea.ui-state-error {\n\tbackground: var( --background-color-error-subtle, #3c1a19 );\n\tborder-color: var( --color-error, #fd7865 );\n\tcolor: var( --color-base, #eaecf0 );\n}\n\nhtml.skin-theme-clientpref-night .ronda-form .ui-state-highlight,\nhtml.skin-theme-clientpref-night #ronda-toolbar .ui-state-highlight {\n\tbackground: var( --background-color-warning-subtle, #2f2610 );\n\tborder-color: var( --border-color-subtle, #54595d );\n\tcolor: var( --color-base, #eaecf0 );\n}\n\nhtml.skin-theme-clientpref-night .ronda-form .ui-state-highlight a,\nhtml.skin-theme-clientpref-night .ronda-form .ui-state-error a {\n\tcolor: var( --color-progressive, #88a3e8 );\n}\n\nhtml.skin-theme-clientpref-night .ronda-form .ronda-log .ui-state-error,\nhtml.skin-theme-clientpref-night .ronda-form .ronda-log .ui-state-highlight {\n\tbackground: transparent;\n}\n\nhtml.skin-theme-clientpref-night .ronda-form .ronda-log .ui-state-error {\n\tcolor: var( --color-error, #fd7865 );\n}\n\nhtml.skin-theme-clientpref-night .ronda-form .ui-progressbar {\n\tbackground: var( --background-color-neutral, #27292d );\n\tborder-color: var( --border-color-subtle, #54595d );\n}\n\nhtml.skin-theme-clientpref-night .ronda-form .ui-progressbar-value {\n\tbackground: var( --background-color-progressive, #36c );\n\tborder-color: var( --background-color-progressive, #36c );\n}\n\nhtml.skin-theme-clientpref-night .ronda-dialog .ui-icon,\nhtml.skin-theme-clientpref-night #ronda-toolbar .ui-icon {\n\tfilter: invert( 1 );\n}\n\nhtml.skin-theme-clientpref-night .ronda-dialog .ui-button-blue .ui-icon,\nhtml.skin-theme-clientpref-night .ronda-dialog .ui-button-red .ui-icon {\n\tfilter: none;\n}\n\nhtml.skin-theme-clientpref-night .ronda-menu.ui-menu .ui-menu-item a {\n\tcolor: var( --color-base, #eaecf0 );\n}\n\nhtml.skin-theme-clientpref-night .ronda-menu.ui-menu .ui-menu-item a.ui-state-focus,\nhtml.skin-theme-clientpref-night .ronda-menu.ui-menu .ui-menu-item a.ui-state-hover {\n\tbackground: var( --background-color-interactive-subtle--hover, #3a3d42 );\n\tborder-color: var( --border-color-base, #72777d );\n\tcolor: var( --color-emphasized, #f8f9fa );\n}\n\n@media screen and ( prefers-color-scheme: dark ) {\n\n\thtml.skin-theme-clientpref-os .ronda-tooltip.ui-tooltip,\n\thtml.skin-theme-clientpref-os .ronda-menu.ui-menu {\n\t\tbackground: var( --background-color-base, #101418 );\n\t\tborder-color: var( --border-color-base, #72777d );\n\t\tcolor: var( --color-base, #eaecf0 );\n\t}\n\n\thtml.skin-theme-clientpref-os:not( .ronda-tema-original ) .ronda-dialog .ronda-list.ui-widget-content {\n\t\tbackground: transparent;\n\t\tborder-color: var( --border-color-subtle, #54595d );\n\t\tcolor: inherit;\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-form input[ type=\"text\" ],\n\thtml.skin-theme-clientpref-os .ronda-form input[ type=\"number\" ],\n\thtml.skin-theme-clientpref-os .ronda-form textarea,\n\thtml.skin-theme-clientpref-os .ronda-form select {\n\t\tbackground: var( --background-color-base, #101418 );\n\t\tborder: 1px solid var( --border-color-interactive, #72777d );\n\t\tcolor: var( --color-base, #eaecf0 );\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-form .ui-state-error,\n\thtml.skin-theme-clientpref-os .ronda-form input.ui-state-error,\n\thtml.skin-theme-clientpref-os .ronda-form select.ui-state-error,\n\thtml.skin-theme-clientpref-os .ronda-form textarea.ui-state-error {\n\t\tbackground: var( --background-color-error-subtle, #3c1a19 );\n\t\tborder-color: var( --color-error, #fd7865 );\n\t\tcolor: var( --color-base, #eaecf0 );\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-form .ui-state-highlight,\n\thtml.skin-theme-clientpref-os #ronda-toolbar .ui-state-highlight {\n\t\tbackground: var( --background-color-warning-subtle, #2f2610 );\n\t\tborder-color: var( --border-color-subtle, #54595d );\n\t\tcolor: var( --color-base, #eaecf0 );\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-form .ui-state-highlight a,\n\thtml.skin-theme-clientpref-os .ronda-form .ui-state-error a {\n\t\tcolor: var( --color-progressive, #88a3e8 );\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-form .ronda-log .ui-state-error,\n\thtml.skin-theme-clientpref-os .ronda-form .ronda-log .ui-state-highlight {\n\t\tbackground: transparent;\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-form .ronda-log .ui-state-error {\n\t\tcolor: var( --color-error, #fd7865 );\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-form .ui-progressbar {\n\t\tbackground: var( --background-color-neutral, #27292d );\n\t\tborder-color: var( --border-color-subtle, #54595d );\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-form .ui-progressbar-value {\n\t\tbackground: var( --background-color-progressive, #36c );\n\t\tborder-color: var( --background-color-progressive, #36c );\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-dialog .ui-icon,\n\thtml.skin-theme-clientpref-os #ronda-toolbar .ui-icon {\n\t\tfilter: invert( 1 );\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-dialog .ui-button-blue .ui-icon,\n\thtml.skin-theme-clientpref-os .ronda-dialog .ui-button-red .ui-icon {\n\t\tfilter: none;\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-menu.ui-menu .ui-menu-item a {\n\t\tcolor: var( --color-base, #eaecf0 );\n\t}\n\n\thtml.skin-theme-clientpref-os .ronda-menu.ui-menu .ui-menu-item a.ui-state-focus,\n\thtml.skin-theme-clientpref-os .ronda-menu.ui-menu .ui-menu-item a.ui-state-hover {\n\t\tbackground: var( --background-color-interactive-subtle--hover, #3a3d42 );\n\t\tborder-color: var( --border-color-base, #72777d );\n\t\tcolor: var( --color-emphasized, #f8f9fa );\n\t}\n}\n\n/* Avisos de que o usuário já foi notificado (categoria na discussão): esmaecidos, ainda selecionáveis */\n.ronda-dialog .ronda-warn-done > label {\n\topacity: 0.55;\n}\n\n.ronda-dialog .ronda-warn-done.ronda-tag-open > label {\n\topacity: 1;\n}\n" ).appendTo( 'head' );
( function () {
	var v = $.ui.version.split( '.' ).map( Number ), ok = v[ 0 ] > 1 || ( v[ 0 ] === 1 && v[ 1 ] >= 9 );
	console.log( '[Ronda] jQuery UI ' + $.ui.version + ( ok ? ' (ok)' : ' — precisa da 1.9 ou mais nova' ) );
}() );

/* ===== Ronda-mensagens.js ===== */
/**
 * Ronda — mensagens de interface
 *
 * Todos os textos que o Ronda mostra na interface (botões, dicas, rótulos,
 * diálogos, avisos, registros de progresso), num só lugar. O código usa
 * ronda.msg( 'chave', parâmetros… ); mensagens novas entram aqui, no grupo do
 * arquivo que as usa, com o prefixo dele (core-, patrulha-, paginas-, admin-).
 *
 * Formato:
 *   $1, $2…                        parâmetros, na ordem passada a ronda.msg
 *   {{PLURAL:$1|singular|plural}}  singular para 0 e 1, plural para os demais
 *
 * Não ficam aqui: o conteúdo gravado na wiki (resumos, predefinições, textos de
 * avisos e pedidos) e os catálogos (Ronda-catalogo.js).
 *
 * Para mudar um texto só para você, sem editar este arquivo, no common.js:
 *   window.rondaConfig = { messages: { 'core-fechar': 'Fechar janela' } };
 *
 * Este arquivo roda antes do núcleo (Ronda-core.js).
 */
window.rondaMessages = {
	// Núcleo: barra, diálogos comuns, motivos e preferências
	'core-previa-titulo': 'Prévia da edição em $1',
	'core-previa-sem-mudancas': 'Nenhuma mudança em relação à versão atual.',
	'core-previa-botao': 'Prévia',
	'core-tema-aplicado': 'Tema aplicado.',
	'core-meta-tema': 'Tema:',
	'core-tema': 'Tema (aparência da barra e das janelas)',
	'core-desfazer': 'Desfazer',
	'core-desfazendo': 'desfazendo…',
	'core-desfazer-uma': 'O Ronda fez 1 edição: $2.',
	'core-desfazer-varias': 'O Ronda fez $1 edições: $2.',
	'core-desfazer-resumo': 'Desfazendo ação feita pelo Ronda',
	'core-desfazer-motivo-criacao': 'Desfazendo criação feita pelo Ronda',
	'core-desfeitas': 'Edições desfeitas: $1.',
	'core-desfazer-falhou': 'Não foi possível desfazer (a página mudou depois): $1.',
	'core-desfazer-criadas': 'Páginas criadas que precisam ser eliminadas por um administrador: $1.',
	'core-erro': 'Erro: $1',
	'core-nome': 'Ronda',
	'core-sem-aviso-criador-nao-elegivel': 'sem aviso (criador não elegível)',
	'core-aviso-enviado-a': 'aviso enviado a $1',
	'core-fechar': 'Fechar',
	'core-feito': ': feito',
	'core-outro-motivo': 'Outro motivo',
	'core-detalhes-opcional-digite-para-buscar-um': 'Detalhes (opcional) — digite para buscar um motivo',
	'core-atualizar-lista-de-motivos': 'Atualizar lista de motivos',
	'core-lista-de-motivos-atualizada': 'Lista de motivos atualizada.',
	'core-motivo': 'Motivo',
	'core-detalhes': 'Detalhes',
	'core-limpar': 'Limpar',
	'core-limpar-detalhes': 'Limpar os detalhes',
	'core-outra-duracao': 'Outra duração…',
	'core-nome-versao': 'Ronda $1',
	'core-paginas-editadas': 'Páginas editadas',
	'core-seguir-as-minhas-preferencias-do-mediawiki': 'Seguir as minhas preferências do MediaWiki (padrão)',
	'core-sempre-vigiar': 'Sempre vigiar',
	'core-nao-mudar-a-vigilancia': 'Não mudar a vigilância',
	'core-deixar-de-vigiar': 'Deixar de vigiar',
	'core-mostrar-o-icone-na-barra': 'Mostrar o ícone na barra',
	'core-modo-de-simulacao-nada-e-gravado': 'Modo de simulação (nada é gravado)',
	'core-meta-dica': 'Ronda $1 — versão, novidades, preferências, documentação e informar erro',
	'core-meta-versao': 'Versão',
	'core-meta-novidades': 'Novidades',
	'core-meta-rapido': 'Rápido',
	'core-meta-novidades-desta-versao': 'histórico de versões',
	'core-meta-segundo-plano': 'Carregar Informações em segundo plano',
	'core-meta-links-rapidos': 'Links rápidos de reversão',
	'core-meta-preferencias': 'Preferências…',
	'core-meta-documentacao': 'Documentação',
	'core-meta-historico': 'Histórico de versões',
	'core-meta-informar-erro': 'Informar erro',
	'core-meta-github': 'Código no GitHub',
	'core-novidades-da-versao': 'Novidades da versão $1 do Ronda',
	'core-novidades-historico': 'histórico completo',
	'core-novidades-selo': 'novo',
	'core-novidades-selo-dica': 'O Ronda foi atualizado para a versão $1: clique para ver as novidades',
	'core-recolher-a-barra': 'Recolher a barra',
	'core-modo-de-simulacao': 'Modo de simulação',
	'core-nao-mostrar-mais': 'Não mostrar mais',
	'core-nao-mostrar-mais-dica': 'Não abrir mais faixas sozinho (boas-vindas e novidades). O meta-painel continua no botão "Ronda".',
	'core-boasvindas-onde-meta': 'Clique em "Ronda", no início desta barra, para abrir as preferências, a documentação e as novidades.',
	'core-relato-titulo': 'Informar erro no Ronda',
	'core-relato-explicacao': 'O relato vai para uma seção nova em ',
	'core-relato-assunto': 'Assunto',
	'core-relato-o-que-aconteceu': 'O que aconteceu',
	'core-relato-titulo-exemplo': 'Ex.: o Mover não mostra o destino',
	'core-relato-texto-exemplo': 'O que você fez, o que esperava e o que aconteceu. A assinatura é acrescentada sozinha.',
	'core-relato-incluir-ambiente': 'Incluir informações técnicas (versão, página, tema, navegador e erros recentes)',
	'core-relato-enviar': 'Enviar',
	'core-relato-resumo': 'Relato de erro do Ronda: $1',
	'core-relato-enviado': 'Relato enviado: ',
	'core-pre-carregar-paineis': 'Carregar em segundo plano o painel Informações (abre mais rápido, mas faz consultas em toda página)',
	'core-marcar-como-patrulhada-ao-reverter': 'Marcar como patrulhada ao reverter',
	'core-pedir-confirmacao-antes-de-reverter-pelos': 'Pedir confirmação antes de reverter pelos links rápidos',
	'core-abrir-o-avisar-depois-de-reverter': 'Abrir o Avisar depois de reverter vandalismo',
	'core-links-rapidos-em-diffs-e-versoes': 'Links rápidos em diffs e versões antigas',
	'core-links-rapidos-no-historico': 'Links rápidos no histórico',
	'core-links-rapidos-nas-contribuicoes': 'Links rápidos nas contribuições',
	'core-links-rapidos-nas-mudancas-recentes': 'Links rápidos nas mudanças recentes',
	'core-links-rapidos-nas-paginas-vigiadas': 'Links rápidos nas páginas vigiadas',
	'core-dias-considerados-para-sugerir-o-nivel': 'Dias considerados para sugerir o nível',
	'core-deixar-marca-oculta-depois-de-cada': 'Deixar marca oculta depois de cada aviso',
	'core-confirmar-aviso-repetido-em-24-h': 'Confirmar aviso repetido em 24 h ou discussão editada há menos de 1 minuto',
	'core-dominios-onde-o-desligar-remove-ligacoes': 'Domínios onde o Desligar remove ligações (ex.: 0|14)',
	'core-desligar-tambem-no-dominio-da-propria': 'Desligar também no domínio da própria página',
	'core-dominios-do-botao-manutencao-ex-0': 'Domínios do botão Manutenção (ex.: 0, 4)',
	'core-preferencias-salvas-a-pagina-sera-recarregada': 'Preferências salvas. A página será recarregada.',
	'core-preferencias-restauradas-para-o-padrao': 'Preferências restauradas para o padrão.',
	'core-o-seu-common-js-ou-o': 'O seu common.js (ou o pacote de teste) define window.rondaConfig; esses valores continuam valendo por cima das preferências salvas aqui.',
	'core-preferencias-do-ronda': 'Preferências do Ronda',
	'core-salvar': 'Salvar',
	'core-restaurar-padroes': 'Restaurar padrões',
	'core-cancelar': 'Cancelar',
	'core-simulacao-nada-foi-salvo': 'Simulação: $1$2. Nada foi salvo.',
	'core-exibir-ocultar-a-barra-do-ronda': 'Exibir/ocultar a barra do Ronda',
	'core-configurar-o-ronda': 'Configurar o Ronda',
	'core-recolher-expandir-a-barra': 'Recolher/expandir a barra',
	'core-preferencias': 'Preferências',
	'core-simulacao': 'Simulação',
	'core-teste': 'Teste',
	'core-teste-dica': 'Modo de teste: todos os módulos em todos os domínios. Desligue com ronda.modoTeste( false ) no console',
	'core-teste-restrito': 'O modo de teste é só para o desenvolvedor.',
	'core-teste-erro': '$1 não abriu neste contexto: $2',
	'core-nada-e-gravado-na-wiki-as': 'Nada é gravado na wiki; as escritas aparecem no console',
	'core-boasvindas-texto': 'Boas-vindas ao Ronda! Ele pode ser ajustado ao seu jeito: vigilância das páginas, links de reversão rápida, avisos, simulação e outras opções ficam nas preferências.',
	'core-boasvindas-onde': 'Elas ficam depois em "$1", no menu de ações (aba "Mais").',
	'core-boasvindas-onde-movel': 'Elas ficam depois no link "$1", nesta barra.',
	'core-boasvindas-abrir': 'Abrir preferências',
	'core-boasvindas-documentacao': 'Documentação',
	'core-boasvindas-entendi': 'Entendi',

	// Patrulha: Reverter, Avisar, Usuário, Listar e reversão rápida
	'patrulha-previa-sem-diff': 'Sem diferença para mostrar.',
	'patrulha-previa-sem-texto': 'Sem texto para mostrar.',
	'patrulha-o-aviso-ja-foi-deixado-nas': 'O aviso "$1" já foi deixado nas últimas 24 horas.',
	'patrulha-a-discussao-do-usuario-foi-editada': 'A discussão do usuário foi editada há menos de um minuto$1.',
	'patrulha-nome-oculto': '(nome oculto)',
	'patrulha-contribuicoes': 'contribuições',
	'patrulha-pagina-relacionada-ao-aviso': 'Página relacionada ao aviso',
	'patrulha-filtrar-avisos': 'Filtrar avisos…',
	'patrulha-incluir-boas-vindas': 'Incluir boas-vindas ($1)',
	'patrulha-usuario': 'Usuário: ',
	'patrulha-discussao-ainda-nao-criada': ' — discussão ainda não criada',
	'patrulha-reversao': 'Reversão',
	'patrulha-ha-mais-de-50-edicoes-depois': 'Há mais de 50 edições depois da versão da esquerda. Reverta pelo histórico da página.',
	'patrulha-a-versao-da-esquerda-ja-e': 'A versão da esquerda já é a versão atual da página.',
	'patrulha-desfaz-edicao-oes-e-volta-a': 'Desfaz $1 edição(ões) e volta à versão de ',
	'patrulha-reverter-mesmo-assim-desfaz-tambem-as': 'Reverter mesmo assim (desfaz também as edições de $1)',
	'patrulha-depois-da-versao-da-esquerda-tambem': 'Depois da versão da esquerda também editaram: $1.',
	'patrulha-acrescentado-ao-resumo-da-edicao': 'Acrescentado ao resumo da edição',
	'patrulha-comentario-opcional': 'Comentário (opcional)',
	'patrulha-usar-a-reversao-rapida-rollback': 'Usar a reversão rápida (rollback)',
	'patrulha-marcar-a-edicao-como-patrulhada': 'Marcar a edição como patrulhada',
	'patrulha-avisos-opcional': 'Avisos (opcional)',
	'patrulha-avisos': 'Avisos',
	'patrulha-ja-notificado': 'já notificado',
	'patrulha-ja-notificado-dica': 'o usuário já está em $1',
	'patrulha-favoritos': 'Favoritos',
	'patrulha-adicionar-aos-favoritos': 'Adicionar aos favoritos (o aviso passa a aparecer no topo)',
	'patrulha-remover-dos-favoritos': 'Remover dos favoritos',
	'patrulha-pagina': 'Página',
	'patrulha-filtrar': 'Filtrar',
	'patrulha-nivel': 'Nível $1$2',
	'patrulha-ultimo-aviso-desta-serie-em': 'Último aviso desta série: $1, em $2$3.',
	'patrulha-marca-do-ronda': ' (marca do Ronda)',
	'patrulha-pelo-resumo-da-edicao': ' (pelo resumo da edição)',
	'patrulha-notificar-em-pedido-preenchido': 'Notificar em $1 (pedido preenchido)',
	'patrulha-registrar-pedido-em-wp-pedidos-revisao': 'Registrar pedido em WP:Pedidos/Revisão de nomes de usuário',
	'patrulha-ultimo-aviso-em': ' — último: $1 aviso em $2',
	'patrulha-escolha-ao-menos-um-aviso': 'Escolha ao menos um aviso.',
	'patrulha-previa-titulo': 'Prévia — $1',
	'patrulha-confirmar': 'Confirmar',
	'patrulha-enviar-mesmo-assim': 'Enviar mesmo assim?',
	'patrulha-enviar-mesmo-assim-botao': 'Enviar mesmo assim',
	'patrulha-ha-edicoes-de-outras-pessoas-depois': 'Há edições de outras pessoas depois da versão da esquerda. Confirme para reverter mesmo assim.',
	'patrulha-revertendo': 'Revertendo $1',
	'patrulha-reversao-rapida': 'reversão rápida',
	'patrulha-nada-a-desfazer': 'nada a desfazer',
	'patrulha-marcando-como-patrulhada': 'Marcando como patrulhada',
	'patrulha-pedido-de-revisao-do-nome-de': 'Pedido de revisão do nome de usuário',
	'patrulha-notificacao-de-vandalismo': 'Notificação de vandalismo',
	'patrulha-avisando': 'Avisando $1',
	'patrulha-processo-interrompido-a-reversao-falhou-entao': 'Processo interrompido: a reversão falhou, então nenhum aviso foi enviado.',
	'patrulha-concluido': 'Concluído.',
	'patrulha-nao-concluido-veja-o-registro': 'Não concluído; veja o registro.',
	'patrulha-abrir-a-discussao-do-usuario': 'Abrir a discussão do usuário',
	'patrulha-abrir-a-pagina': 'Abrir a página',
	'patrulha-reverter-titulo': 'Reverter — ',
	'patrulha-avisar-titulo': 'Avisar — ',
	'patrulha-reverter-botao': 'Reverter',
	'patrulha-reverter-agora': 'Reverter agora',
	'patrulha-reverter-agora-dica': 'Reverte já; depois escolha os avisos com calma e clique em Enviar aviso',
	'patrulha-revertido-agora': 'Revertido. Escolha os avisos e clique em "Enviar aviso".',
	'patrulha-enviar-aviso': 'Enviar aviso',
	'patrulha-previa-botao': 'Prévia',
	'patrulha-ja-recebeu-o-terceiro-aviso-de': 'Já recebeu o terceiro aviso de "$1" na janela de $2 dias. O próximo passo costuma ser o bloqueio. ',
	'patrulha-bloquear': 'Bloquear…',
	'patrulha-notificar-vandalismo': 'Notificar vandalismo',
	'patrulha-nome-de-usuario-ou-ip': 'Nome de usuário ou IP',
	'patrulha-avisar-botao': 'Avisar',
	'patrulha-usuario-a-avisar': 'Usuário a avisar',
	'patrulha-continuar': 'Continuar',
	'patrulha-desfazer-as-edicoes-ate-a-versao': 'Desfazer as edições até a versão da esquerda e, se quiser, avisar o usuário',
	'patrulha-enviar-avisos-ao-usuario-multipla-escolha': 'Enviar avisos ao usuário (múltipla escolha, com nível sugerido)',
	'patrulha-sem-prazo': 'sem prazo',
	'patrulha-ate': 'até $1',
	'patrulha-outra-pessoa-ja-editou-depois': 'outra pessoa já editou depois',
	'patrulha-o-usuario-e-o-unico-autor': 'o usuário é o único autor',
	'patrulha-reversoes-concluidas-veja-o-registro': 'Reversões concluídas; veja o registro.',
	'patrulha-reverter-todas-as-edicoes-de-no': 'Reverter todas as edições de $1 no topo',
	'patrulha-pagina-s-em-que-a-ultima': '$1 página(s) em que a última edição é de $2 (entre as 500 contribuições mais recentes). Cada uma será revertida com a reversão rápida.',
	'patrulha-consultando': 'Consultando…',
	'patrulha-local': 'Local: $1',
	'patrulha-pais': 'País: $1',
	'patrulha-provedor': 'Provedor: $1',
	'patrulha-organizacao': 'Organização: $1',
	'patrulha-asn': 'ASN: $1',
	'patrulha-conexao': 'Conexão: $1',
	'patrulha-tipo': 'Tipo: $1',
	'patrulha-proxy': 'Proxy: $1',
	'patrulha-sem-informacoes-para-este-ip': 'Sem informações para este IP.',
	'patrulha-nao-foi-possivel-consultar': 'Não foi possível consultar: $1',
	'patrulha-o-usuario': 'O usuário ',
	'patrulha-nao-existe': ' não existe.',
	'patrulha-bloqueio-parcial': 'Bloqueio parcial',
	'patrulha-bloqueado': 'Bloqueado',
	'patrulha-por': ' $1, por $2$3',
	'patrulha-travado-globalmente': 'Travado globalmente',
	'patrulha-mais-de': 'mais de ',
	'patrulha-registro': 'Registro: ',
	'patrulha-primeira-edicao': 'Primeira edição: ',
	'patrulha-edicoes': 'Edições: ',
	'patrulha-grupos': 'Grupos: ',
	'patrulha-nenhum-aviso-em-serie': 'nenhum aviso em série',
	'patrulha-a-discussao-nao-existe': 'a discussão não existe',
	'patrulha-conta-global': 'conta global',
	'patrulha-enviar-aviso-acao': 'enviar aviso',
	'patrulha-alterar-bloqueio': 'alterar bloqueio',
	'patrulha-bloqueio-global': 'Bloqueio global$1',
	'patrulha-duracao-indefinido': 'sem prazo',
	'patrulha-duracao-second': '$1 {{PLURAL:$1|segundo|segundos}}',
	'patrulha-duracao-minute': '$1 {{PLURAL:$1|minuto|minutos}}',
	'patrulha-duracao-hour': '$1 {{PLURAL:$1|hora|horas}}',
	'patrulha-duracao-day': '$1 {{PLURAL:$1|dia|dias}}',
	'patrulha-duracao-week': '$1 {{PLURAL:$1|semana|semanas}}',
	'patrulha-duracao-fortnight': '$1 {{PLURAL:$1|quinzena|quinzenas}}',
	'patrulha-duracao-month': '$1 {{PLURAL:$1|mês|meses}}',
	'patrulha-duracao-year': '$1 {{PLURAL:$1|ano|anos}}',
	'patrulha-ocultadas': 'Ocultadas: ',
	'patrulha-ocultadas-suprimidas': ' ($1 suprimidas)',
	'patrulha-ocultadas-dica': 'Edições com conteúdo ou resumo ocultado, entre as 500 mais recentes',
	'patrulha-filtro-impedidas': '$1 {{PLURAL:$1|impedida|impedidas}}',
	'patrulha-filtro-avisos': '$1 {{PLURAL:$1|aviso|avisos}}',
	'patrulha-filtro-so-registro': 'só registro',
	'patrulha-filtro-em': ' em $1 ($2)',
	'patrulha-filtro-ver': 'ver ocorrências',
	'patrulha-revertidas': 'Revertidas: ',
	'patrulha-restaurada-versao-autor-oculto': 'Restaurada a versão $1 (autor oculto)',
	'patrulha-up-situacao': 'Situação',
	'patrulha-up-conta': 'Conta',
	'patrulha-up-bloqueios': 'Bloqueios',
	'patrulha-up-outras-wikis': 'Outras wikis',
	'patrulha-bloqueado-em-n-wikis': 'bloqueado em $1:',
	'patrulha-e-mais-n': 'e mais $1',
	'patrulha-up-contribuicoes': 'Contribuições',
	'patrulha-up-atividade': 'Atividade',
	'patrulha-up-avisos': 'Avisos ($1 d)',
	'patrulha-up-filtro': 'Filtro ($1 d)',
	'patrulha-up-faixa': 'Faixa',
	'patrulha-up-acoes': 'Ações',
	'patrulha-up-ver': 'Ver',
	'patrulha-up-checkuser': 'CheckUser',
	'patrulha-up-ip': 'IP',
	'patrulha-ip': 'IP: ',
	'patrulha-ultimo-bloqueio': 'último $1, por $2$3$4',
	'patrulha-eliminar-as-criadas-n': 'eliminar as criadas ($1)',
	'patrulha-paginas-criadas': 'Páginas criadas: ',
	'patrulha-nao-existe-mais': ' não existe mais',
	'patrulha-nao-existem-mais': ' não existem mais',
	'patrulha-entre-as-200-mais-recentes': ', entre as 200 mais recentes',
	'patrulha-eliminar-as-criadas': 'eliminar as criadas',
	'patrulha-abre-o-lote-com-as-paginas': 'Abre o Lote com as páginas criadas por $1',
	'patrulha-eliminadas': 'Eliminadas: ',
	'patrulha-ultima-edicao': 'Última edição: ',
	'patrulha-7-dias': '7 dias: $1$2',
	'patrulha-dominios': 'Domínios: $1',
	'patrulha-reverter-todas-no-topo': 'reverter todas no topo ($1)',
	'patrulha-registro-de-verificacoes': 'registro de verificações',
	'patrulha-informacoes-do-ip': 'informações do IP',
	'patrulha-consulta-a-ferramenta-de-informacoes-de': 'Consulta a ferramenta de informações de IP da wiki (o acesso fica registrado)',
	'patrulha-carregando-informacoes-de': 'Carregando informações de $1…',
	'patrulha-nao-foi-possivel-obter-as-informacoes': 'Não foi possível obter as informações de $1.',
	'patrulha-usuario-botao': 'Usuário',
	'patrulha-mostrar-ou-esconder-as-informacoes-do': 'Mostrar ou esconder as informações do usuário (registro, edições, grupos, bloqueio, avisos)',
	'patrulha-paginas-vigiadas': 'Páginas vigiadas',
	'patrulha-paginas-vigiadas-alteradas-recentemente': 'Páginas vigiadas alteradas recentemente',
	'patrulha-nenhuma-alteracao-recente': 'Nenhuma alteração recente.',
	'patrulha-mudancas-recentes': 'Mudanças recentes',
	'patrulha-mudancas-recentes-nao-autopatrulhadas-no-dominio': 'Mudanças recentes não autopatrulhadas no domínio principal',
	'patrulha-paginas-novas': 'Páginas novas',
	'patrulha-paginas-novas-ainda-nao-patrulhadas': 'Páginas novas ainda não patrulhadas',
	'patrulha-nenhuma-pagina-nova-nao-patrulhada-que': 'Nenhuma página nova não patrulhada (que não seja redirecionamento) criada no último mês.',
	'patrulha-edicoes-a-revisar': 'Edições a revisar',
	'patrulha-edicoes-nao-patrulhadas-com-grande-chance': 'Edições não patrulhadas que a wiki aponta como provavelmente danosas (as de provável má-fé primeiro)',
	'patrulha-nenhuma-edicao-para-patrulhar-ou-desfazer': 'Nenhuma edição para patrulhar ou desfazer.',
	'patrulha-eliminacao-rapida': 'Eliminação rápida',
	'patrulha-paginas-marcadas-para-eliminacao-rapida': 'Páginas marcadas para eliminação rápida',
	'patrulha-nenhuma-pagina-marcada-para-eliminacao-rapida': 'Nenhuma página marcada para eliminação rápida.',
	'patrulha-boa-fe': '· boa-fé $1',
	'patrulha-carregando': 'Carregando…',
	'patrulha-nao-foi-possivel-obter-a-lista': 'Não foi possível obter a lista "$1".',
	'patrulha-listar-rotulo': 'Filas: ',
	'patrulha-listar-botao': 'Filas',
	'patrulha-paginas-vigiadas-mudancas-recentes-paginas-novas': 'Páginas vigiadas, mudanças recentes, páginas novas, edições a revisar e eliminação rápida',
	'patrulha-a-pagina-nao-tem-revisoes': 'a página não tem revisões',
	'patrulha-a-ultima-edicao-e-de-nao': 'a última edição é de $1, não de $2',
	'patrulha-ha-mais-de-50-edicoes-seguidas': 'há mais de 50 edições seguidas de $1',
	'patrulha-todas-as-edicoes-da-pagina-sao': 'todas as edições da página são de $1 (não há versão anterior de outra pessoa)',
	'patrulha-ok': 'OK',
	'patrulha-revertido-edicao-oes': 'revertido ($1 edição(ões))',
	'patrulha-revertida-s-edicao-oes-de-em': 'Revertida(s) $1 edição(ões) de $2 em $3.',
	'patrulha-nao-revertido': 'não revertido: $1',
	'patrulha-nao-foi-possivel-reverter': 'Não foi possível reverter: $1',
	'patrulha-versao-restaurada-log': 'versão restaurada',
	'patrulha-versao-restaurada': 'Versão $1 restaurada.',
	'patrulha-o-conteudo-da-versao-esta-oculto': 'o conteúdo da versão está oculto',
	'patrulha-nao-restaurada': 'não restaurada: $1',
	'patrulha-reverter-bf': 'reverter (BF)',
	'patrulha-reverter-edicoes-de-boa-fe-com': 'Reverter edições de boa-fé, com motivo',
	'patrulha-reverter-as-edicoes-de': 'Reverter as edições de $1',
	'patrulha-reverter-vandalismo': 'reverter (vandalismo)',
	'patrulha-reverter-como-vandalismo-e-abrir-o': 'Reverter como vandalismo e abrir o aviso',
	'patrulha-restaurar-esta-versao': 'Restaurar esta versão',

	// Páginas: Manutenção, ER, ESR, Consenso, Mover, #R, Esboço, Fusão, Busca, PetScan, Informações, Pedido e Não assinou
	'paginas-info-recriacao': 'Recriação',
	'paginas-info-recriada': 'recriada: já foi eliminada em $1',
	'paginas-info-recriada-alerta': 'recriação ainda não patrulhada: a página já foi eliminada em $1',
	'paginas-info-recriada-curto': 'Recriação de página eliminada, ainda não patrulhada',
	'paginas-info-recriada-proteger': 'se for eliminada de novo, considere proteger contra criação',
	'paginas-info-parecidas': 'Parecidas',
	'paginas-info-fundir': 'fundir',
	'paginas-info-redirecionar-para': 'redirecionar para',
	'paginas-elim-botao': 'Propor eliminação',
	'paginas-elim-dica': 'Propor a eliminação desta página: rápida, semirrápida ou por consenso',
	'paginas-elim-titulo': 'Propor eliminação: $1',
	'paginas-elim-rapida': 'Rápida',
	'paginas-elim-semirrapida': 'Semirrápida',
	'paginas-elim-consenso': 'Por consenso',
	'paginas-elim-rapida-desc': 'Para casos evidentes, enquadrados numa regra. Um administrador avalia em pouco tempo.',
	'paginas-elim-semirrapida-desc': 'Para problemas que podem ser corrigidos: a página fica marcada por alguns dias antes da decisão.',
	'paginas-elim-consenso-desc': 'Abre uma discussão com a comunidade, em Wikipédia:Páginas para eliminar.',
	'paginas-elim-continuar': 'Continuar',
	'paginas-elim-escolha': 'Escolha o tipo de proposta.',
	'paginas-detectar-vda': 'Detectar VDA',
	'paginas-detectar-vda-dica': 'compara o texto com a web no detector de cópia (abre numa aba nova)',
	'paginas-sugeridas': 'Sugeridas para esta página',
	'paginas-usadas-recentemente': 'Usadas recentemente',
	'paginas-sug-sem-fontes': 'nenhuma referência no texto',
	'paginas-sug-sem-notas': 'há fontes no fim, mas nenhuma nota no texto',
	'paginas-sug-mais-notas': 'seções sem referência: $1',
	'paginas-sug-uma-fonte': 'só uma referência',
	'paginas-sug-formatar-referencias': 'referência só com o endereço (URL)',
	'paginas-sug-sem-categorias': 'nenhuma categoria visível',
	'paginas-sug-poucas-ligacoes': 'só $1 ligação(ões) interna(s)',
	'paginas-sug-sem-secoes': 'texto longo sem seções',
	'paginas-sug-sem-introducao': 'começa direto numa seção, sem introdução',
	'paginas-sug-desambiguacoes': '$1 ligação(ões) para páginas de desambiguação',
	'paginas-marcacoes-salvas-mas-acao-oes-posterior': 'Marcações salvas, mas $1 ação(ões) posterior(es) falharam.',
	'paginas-filtrar-marcacoes': 'Filtrar marcações…',
	'paginas-presentes-na-pagina-desmarque-para-remover': 'Presentes na página — desmarque para remover',
	'paginas-outras': 'Outras',
	'paginas-avisar-o-criador-da-pagina-quando': 'Avisar o criador da página quando aplicável (ex.: Sem fontes, Sem categoria)',
	'paginas-nenhuma-marcacao-do-catalogo-encontrada-na': 'Nenhuma marcação do catálogo encontrada na introdução.',
	'paginas-nenhuma-alteracao-em-relacao-ao-estado': 'Nenhuma alteração em relação ao estado atual da página.',
	'paginas-marcacoes-aplicadas-ao-texto-publique-a': 'Marcações aplicadas ao texto. Publique a edição para salvar.',
	'paginas-marcacoes-atualizadas': 'Marcações atualizadas.',
	'paginas-a-versao-atual-da-pagina-ja': 'A versão atual da página já está nesse estado.',
	'paginas-manutencao-titulo': 'Manutenção — $1',
	'paginas-aplicar': 'Aplicar',
	'paginas-atualizar-nomes-alternativos': 'Atualizar nomes alternativos',
	'paginas-manutencao-botao': 'Manutenção',
	'paginas-adicionar-ou-remover-predefinicoes-de-manutencao': 'Adicionar ou remover predefinições de manutenção',
	'paginas-a-pagina-ja-tem-uma-marcacao': 'a página já tem uma marcação de eliminação',
	'paginas-conflito-de-edicao': 'conflito de edição',
	'paginas-a-pagina-nao-existe-mais': 'a página não existe mais',
	'paginas-marcando': 'Marcando $1',
	'paginas-aviso-ao-criador': 'Aviso ao criador',
	'paginas-sera-enviado-ao-publicar-a-edicao': 'será enviado ao publicar a edição',
	'paginas-marca-inserida-no-texto-publique-a': 'Marca inserida no texto. Publique a edição para salvar.',
	'paginas-a-marcacao-nao-foi-feita-veja': 'A marcação não foi feita; veja o registro.',
	'paginas-escolha-a-regra': 'Escolha a regra…',
	'paginas-observacao-para-quem-for-eliminar-opcional': 'Observação para quem for eliminar (opcional)',
	'paginas-aviso-de-eliminacao-rapida-aviso-er': 'Aviso de eliminação rápida (Aviso-ER)',
	'paginas-nao-remova-a-marcacao-aviso-nao': 'Não remova a marcação (Aviso-não remova)',
	'paginas-nao-avisar': 'Não avisar',
	'paginas-aviso-a-mais': 'Aviso a mais',
	'paginas-nenhum': '(nenhum)',
	'paginas-nivel-sugerido': 'nível sugerido',
	'paginas-nivel-n': 'nível $1',
	'paginas-favoritos': 'Favoritos',
	'paginas-o-redirecionamento-tem-afluente-s-confira': 'O redirecionamento tem $1 afluente(s). Confira antes de propor R1 — ',
	'paginas-ver-lista': 'ver lista',
	'paginas-regra': 'Regra',
	'paginas-observacao': 'Observação',
	'paginas-pagina-proposta-para-eliminacao-rapida': 'Página proposta para eliminação rápida.',
	'paginas-eliminacao-rapida': 'Eliminação rápida — $1',
	'paginas-propor': 'Propor',
	'paginas-outro-sem-assunto': 'Outro (sem assunto)',
	'paginas-justificativa-a-assinatura-e-acrescentada-automa': 'Justificativa. A assinatura é acrescentada automaticamente.',
	'paginas-ma-traducao-esr-matrad': 'Má tradução (ESR-matrad)',
	'paginas-codigo-da-lingua-de-origem-ex': 'Código da língua de origem, ex.: en, es',
	'paginas-assunto': 'Assunto',
	'paginas-lingua-de-origem': 'Língua de origem',
	'paginas-justificativa-esr-arquivo': 'Justificativa (ESR-arquivo)',
	'paginas-justificativa': 'Justificativa',
	'paginas-avisar-o-criador-aviso-esr': 'Avisar o criador (Aviso-ESR)',
	'paginas-comentario': 'Comentário',
	'paginas-pagina-proposta-para-eliminacao-semirrapida': 'Página proposta para eliminação semirrápida.',
	'paginas-eliminacao-semirrapida': 'Eliminação semirrápida — $1',
	'paginas-ja-tem-marcacao-aviso': 'A página já tem uma marcação de eliminação.',
	'paginas-er': 'ER',
	'paginas-propor-a-eliminacao-rapida-desta-pagina': 'Propor a eliminação rápida desta página',
	'paginas-esr': 'ESR',
	'paginas-propor-a-eliminacao-semirrapida-desta-pagina': 'Propor a eliminação semirrápida desta página',
	'paginas-arquivando-pedido-de-eliminacao': 'Arquivando pedido de eliminação',
	'paginas-o-modelo-da-discussao-nao-tem': 'o modelo da discussão não tem o comentário esperado ("… canceladas -->")',
	'paginas-ha-mais-de-30-discussoes-arquivadas': 'há mais de 30 discussões arquivadas',
	'paginas-a-pagina-ja-existe': 'a página já existe',
	'paginas-justificativa-da-eliminacao-nao-precisa-assinar': 'Justificativa da eliminação. Não precisa assinar.',
	'paginas-titulo-de-outra-pagina-para-incluir': 'Título de outra página para incluir na mesma discussão',
	'paginas-incluir': 'Incluir',
	'paginas-avisar-os-criadores-das-paginas': 'Avisar os criadores das páginas',
	'paginas-retirar': 'Retirar',
	'paginas-titulo-invalido': 'título inválido',
	'paginas-a-pagina-nao-existe': 'a página não existe',
	'paginas-dominio-nao-permitido': 'domínio não permitido',
	'paginas-a-pagina-ja-esta-na-proposta': 'a página já está na proposta',
	'paginas-sera-criada': 'Será criada ',
	'paginas-proposta-conjunta-opcional': 'Proposta conjunta (opcional)',
	'paginas-discussao-anterior-de': 'Discussão anterior de $1',
	'paginas-arquivada-em': 'arquivada em $1',
	'paginas-criando': 'Criando $1',
	'paginas-redirecionando': 'Redirecionando $1',
	'paginas-criador-de': 'Criador de $1',
	'paginas-processo-interrompido-a-discussao-mestra-nao': 'Processo interrompido: a discussão mestra não pôde ser preparada.',
	'paginas-proposta-de-eliminacao-criada': 'Proposta de eliminação criada.',
	'paginas-a-proposta-nao-foi-concluida-veja': 'A proposta não foi concluída; veja o registro.',
	'paginas-abrir-a-discussao': 'Abrir a discussão',
	'paginas-eliminacao-por-consenso': 'Eliminação por consenso — $1',
	'paginas-propor-eliminacao': 'Propor eliminação',
	'paginas-consenso': 'Consenso',
	'paginas-propor-a-eliminacao-por-consenso-desta': 'Propor a eliminação por consenso desta página (e de outras na mesma discussão)',
	'paginas-o-destino-ja-existe-e-voce': 'o destino já existe e você não pode eliminá-lo',
	'paginas-o-destino-ja-existe': 'o destino já existe',
	'paginas-o-destino-e-igual-a-origem': 'o destino é igual à origem',
	'paginas-o-titulo-de-destino-esta-protegido': 'o título de destino está protegido contra criação',
	'paginas-novo-titulo-sem-o-dominio': 'Novo título, sem o domínio',
	'paginas-mover-tambem-a-pagina-de-discussao': 'Mover também a página de discussão',
	'paginas-criar-um-redirecionamento': 'Criar um redirecionamento',
	'paginas-suprimir-redirecionamento-da-pagina-de-discussao': 'Suprimir redirecionamento da página de discussão',
	'paginas-eliminar-o-destino-antes-de-mover': 'Eliminar o destino antes de mover (R2)',
	'paginas-pe-aberta': 'Já existe uma discussão de eliminação desta página, criada em $1, que não está marcada como encerrada (sem {{Nomeação concluída}} nem a categoria de propostas encerradas). Não abra outra: se a marcação foi removida, restaure-a. Discussão: ',
	'paginas-pe-anterior-existe': ' já existe (criada em $1) e está encerrada. Ela pode ser arquivada numa subpágina para abrir a nova proposta.',
	'paginas-pe-anterior-arquivar': 'Arquivar $1 numa subpágina (/1, /2…) e abrir a nova',
	'paginas-pe-anterior-confirme': 'Já existe uma discussão de eliminação encerrada desta página. Marque a opção de arquivá-la para abrir a nova.',
	'paginas-pe-existe-interrompido': 'já existe uma discussão de eliminação; nada foi arquivado',
	'paginas-pe-existe-extra': '$1 já tem uma discussão de eliminação ($2) e não pode entrar numa proposta conjunta.',
	'paginas-confirmo-eliminar-destino': 'Confirmo: "$1" tem conteúdo ou histórico próprio e deve ser eliminada pela R2',
	'paginas-marque-a-confirmacao': 'O destino "$1" tem conteúdo ou histórico próprio. Para eliminá-lo, marque também a caixa de confirmação.',
	'paginas-confira-o-destino': 'O destino já existe. Confira a situação dele no formulário antes de mover.',
	'paginas-eliminar-tambem-a-discussao-do-destino': 'Eliminar também a discussão do destino (R2)',
	'paginas-principal': '(Principal)',
	'paginas-esta-livre': '$1 está livre.',
	'paginas-e-um-redirecionamento': 'é um redirecionamento$1',
	'paginas-e-uma-pagina-com-conteudo': 'é uma página com conteúdo',
	'paginas-com-mais-de-uma-edicao': ', com mais de uma edição',
	'paginas-com-uma-edicao': ', com uma edição',
	'paginas-ja-existe': ' já existe: $1.$2',
	'paginas-so-quem-pode-eliminar-paginas-pode': ' Só quem pode eliminar páginas pode mover para cá.',
	'paginas-o-destino-nao-e-um-redirecionamento': 'O destino não é um redirecionamento de uma só edição para esta página. Só elimine se tiver certeza; a eliminação pede uma segunda confirmação.',
	'paginas-tambem-ja-existe': ' também já existe.$1',
	'paginas-a-discussao-nao-sera-movida': ' A discussão não será movida.',
	'paginas-destino': 'Destino: $1.',
	'paginas-novo-titulo': 'Novo título',
	'paginas-a-pagina-de-discussao-do-usuario': 'A página de discussão do usuário não é movida junto com a página de usuário.',
	'paginas-o-destino-ja-existe-marque-eliminar': 'O destino já existe. Marque "Eliminar o destino antes de mover" ou escolha outro título.',
	'paginas-o-destino-ja-existe-sem-direito': 'O destino já existe e você não pode eliminá-lo. Escolha outro título ou peça a eliminação (R2).',
	'paginas-eliminando-r2': 'Eliminando $1 (R2)',
	'paginas-movendo-para': 'Movendo $1 para $2',
	'paginas-a-discussao-nao-sera-movida-ja': 'A discussão não será movida: $1 já existe.',
	'paginas-feito': '$1: feito',
	'paginas-pagina-movida': 'Página movida.',
	'paginas-a-mocao-nao-foi-concluida-veja': 'A moção não foi concluída; veja o registro.',
	'paginas-abrir-a-pagina-movida': 'Abrir a página movida',
	'paginas-mover-titulo': 'Mover — $1',
	'paginas-mover-botao': 'Mover',
	'paginas-mover-esta-pagina-para-outro-titulo': 'Mover esta página para outro título',
	'paginas-pagina-de-destino': 'Página de destino',
	'paginas-motivo-obrigatorio-em-categorias': 'Motivo (obrigatório em categorias)',
	'paginas-motivo-opcional': 'Motivo (opcional)',
	'paginas-redirecionamento-feito': 'Redirecionamento feito.',
	'paginas-todo-o-conteudo-atual-da-pagina': 'Todo o conteúdo atual da página será substituído pelo redirecionamento.',
	'paginas-redirecionar-para': 'Redirecionar para',
	'paginas-redirecionar': 'Redirecionar',
	'paginas-tema-ex-biografia-geografia-vazio-esboco': 'Tema, ex.: biografia, geografia (vazio = esboço genérico)',
	'paginas-ja-existe-um-esboco-nesta-pagina': 'Já existe um esboço nesta página.',
	'paginas-esboco-adicionado': 'Esboço adicionado.',
	'paginas-esboco-titulo': 'Esboço — $1',
	'paginas-marcar': 'Marcar',
	'paginas-pagina-que-permanecera': 'Página que permanecerá',
	'paginas-pagina-que-sera-fundida-com-a': 'Página que será fundida com a de cima',
	'paginas-marcando-f-de': 'Marcando $1 (f-de)',
	'paginas-marcando-f-com': 'Marcando $1 (f-com)',
	'paginas-proposta-de-fusao-adicionada': 'Proposta de fusão adicionada.',
	'paginas-fusao': 'Fusão',
	'paginas-propor-fusao': 'Propor fusão',
	'paginas-buscar-fontes': 'Buscar fontes',
	'paginas-procurar-nesta-categoria': 'Procurar nesta categoria',
	'paginas-eliminada-em': 'Eliminada em ',
	'paginas-info-nao-existe': 'A página não existe.',
	'paginas-referencias': 'referências',
	'paginas-ja-proposta-para-eliminacao': 'já proposta para eliminação',
	'paginas-nunca-proposta-para-eliminacao': 'nunca proposta para eliminação',
	'paginas-tamanho': 'Tamanho',
	'paginas-qualidade': 'Qualidade',
	'paginas-ultima-edicao': 'Última edição',
	'paginas-vigilantes': 'Vigilantes',
	'paginas-poucos-ou-nenhum': 'poucos ou nenhum',
	'paginas-edicoes-eliminadas': 'Edições eliminadas',
	'paginas-registros': 'Registros',
	'paginas-visualizacoes': 'Visualizações',
	'paginas-mais-informacoes': 'Mais informações',
	'paginas-info-situacao': 'Situação',
	'paginas-info-protecao': 'Proteção',
	'paginas-info-criacao': 'Criação',
	'paginas-info-edicoes': 'Edições',
	'paginas-info-conteudo': 'Conteúdo',
	'paginas-info-manutencao': 'Manutenção',
	'paginas-info-ligacoes': 'Ligações',
	'paginas-info-patrulha': 'Patrulha',
	'paginas-info-publico': 'Público',
	'paginas-ja-eliminada-em': 'já eliminada; última vez em ',
	'paginas-info-sem-protecao': 'sem proteção',
	'paginas-info-registro': 'registro',
	'paginas-info-por': ' por ',
	'paginas-info-eliminacao': '$1 eliminação',
	'paginas-info-eliminacoes': '$1 eliminações',
	'paginas-info-restauro': ', $1 restauro',
	'paginas-info-restauros': ', $1 restauros',
	'paginas-info-discussao-pe': 'discussão de eliminação',
	'paginas-info-ainda-ligada': 'ainda há ligações para cá no domínio principal',
	'paginas-info-sem-ligacoes': 'nenhuma ligação do domínio principal',
	'paginas-info-criada-por': 'por ',
	'paginas-info-em': ' em $1',
	'paginas-info-total': 'Total: ',
	'paginas-info-editores': 'Editores: $1$2',
	'paginas-info-ips': ' ($1 IPs)',
	'paginas-info-qualidade-auto': 'estimada automaticamente: $1',
	'paginas-info-qualidade-auto-dica': 'Critérios do quadro "Parâmetros de qualidade" verificados automaticamente; a avaliação oficial é feita por editores',
	'paginas-info-qualidade-criterios': 'ver critérios',
	'paginas-info-qualidade-falta': 'para a $1 falta: $2',
	'paginas-qualidade-titulo': 'Parâmetros de qualidade',
	'paginas-qualidade-estimada': 'Qualidade estimada',
	'paginas-qualidade-nivel': 'Qualidade $1',
	'paginas-qualidade-meta': 'meta: $1',
	'paginas-qualidade-nota': 'Estimativa automática, baseada no quadro "Parâmetros de qualidade". Contagens de referências, imagens e parágrafos são aproximadas; a avaliação oficial é feita por editores. Referência:',
	'paginas-qualidade-nota-aproximada': 'Estimativa automática, baseada no quadro "Parâmetros de qualidade". Como o painel não foi aberto na versão atual do artigo, referências e imagens foram contadas no wikitexto, de forma mais aproximada. Referência:',
	'paginas-info-referencias': '{{PLURAL:$1|1 referência|$1 referências}}',
	'paginas-info-marcacoes': '$1: $2',
	'paginas-info-nenhuma-marcacao': 'nenhuma marcação',
	'paginas-info-afluentes-principal': 'afluentes no domínio principal',
	'paginas-info-orfa': 'órfã (sem afluentes no domínio principal)',
	'paginas-info-linguas': 'em {{PLURAL:$1|outra língua|$1 outras línguas}}',
	'paginas-info-interwikis': 'interwikis',
	'paginas-info-sem-wikidata': 'sem item no Wikidata',
	'paginas-info-nova-nao-patrulhada': 'página nova não patrulhada',
	'paginas-info-marcar-patrulhada': 'marcar como patrulhada',
	'paginas-info-patrulhada': 'patrulhada',
	'paginas-info-edicoes-nao-patrulhadas': '{{PLURAL:$1|1 edição não patrulhada|$1 edições não patrulhadas}}',
	'paginas-info-tudo-patrulhado': 'tudo patrulhado',
	'paginas-info-visualizacoes': '$1 visualizações em 30 dias',
	'paginas-info-historico': 'histórico',
	'paginas-nao-foi-possivel-obter-as-informacoes': 'Não foi possível obter as informações da página.',
	'paginas-segunda-pagina': 'Página 2',
	'paginas-ocultar-o-nome-no-pedido': 'Ocultar o nome no pedido',
	'paginas-argumentacao': 'Argumentação',
	'paginas-nao-precisa-assinar': '$1 Não precisa assinar.',
	'paginas-pedido-enviado': 'Pedido enviado.',
	'paginas-pedido': 'Pedido',
	'paginas-tipo-de-pedido': 'Tipo de pedido',
	'paginas-enviar-pedido': 'Enviar pedido',
	'paginas-quem-deixou-de-assinar': 'Quem deixou de assinar',
	'paginas-data-do-comentario-opcional': 'Data do comentário (opcional)',
	'paginas-nao-assinou': 'Não assinou',
	'paginas-data': 'Data',
	'paginas-inserir': 'Inserir',
	'paginas-redirecionar-para-outro-titulo': 'Redirecionar para outro título',
	'paginas-marcar-o-artigo-como-esboco': 'Marcar o artigo como esboço',
	'paginas-propor-a-fusao-desta-pagina-com': 'Propor a fusão desta página com outra',
	'paginas-busca': 'Busca',
	'paginas-opcoes-para-a-busca-de-fontes': 'Opções para a busca de fontes',
	'paginas-petscan': 'PetScan',
	'paginas-procurar-paginas-nesta-categoria-com-o': 'Procurar páginas nesta categoria com o PetScan',
	'paginas-informacoes': 'Informações',
	'paginas-informacoes-sobre-a-pagina-ou-usuario': 'Informações sobre a página e, em páginas de usuário e contribuições, sobre o usuário',
	'paginas-info-usuario': 'Usuário: $1',
	'paginas-info-pagina': 'Página: $1',
	'paginas-redirecionar-botao': 'Redirecionar',
	'paginas-informacoes-sobre-a-pagina': 'Informações sobre a página',
	'paginas-fazer-um-pedido-sobre-uma-pagina': 'Fazer um pedido sobre uma página ou um usuário',

	// Administração: Eliminar, Desligar, Proteger, Bloquear, Restaurar e Lote
	'admin-marcada-para-eliminacao-rapida-pela-regra': 'Marcada para eliminação rápida pela regra $1.$2',
	'admin-a-regra-nao-foi-encontrada-no': ' A regra não foi encontrada no menu de motivos; informe-a nos detalhes.',
	'admin-a-pagina-esta-em-eliminacao-semirrapida': 'A página está em eliminação semirrápida ou por consenso. Verifique o processo antes de eliminar.',
	'admin-afluentes-transclusoes': 'Afluentes: $1 · Transclusões: $2$3 — ',
	'admin-usos-do-ficheiro': ' · Usos do ficheiro: $1',
	'admin-eliminar-tambem-a-pagina-de-discussao': 'Eliminar também a página de discussão',
	'admin-eliminar-tambem-a-pdu': 'Eliminar também a discussão do usuário (PDU)',
	'admin-eliminar-tambem-redirecionamento-s-para-esta': 'Eliminar também $1 redirecionamento(s) para esta página$2',
	'admin-remover-as-ligacoes-afluentes-depois-abre': 'Remover as ligações afluentes depois (abre o Desligar)',
	'admin-pagina-eliminada': 'Página eliminada.',
	'admin-redirecionamento-s-eliminado-s': '$1 redirecionamento(s) eliminado(s)$2',
	'admin-falharam': '; falharam: $1',
	'admin-eliminar-titulo': 'Eliminar $1',
	'admin-eliminar-botao': 'Eliminar',
	'admin-a-pagina-nao-existe-talvez-ja': 'A página não existe (talvez já tenha sido eliminada).',
	'admin-nao-foi-possivel-carregar-os-motivos': 'Não foi possível carregar os motivos de eliminação; use o campo de detalhes.',
	'admin-eliminar-esta-pagina': 'Eliminar esta página',
	'admin-motivo-opcional-vai-no-sumario': 'Motivo (opcional), vai no sumário',
	'admin-pagina-s-ligam-a': ' página(s) ligam a "',
	'admin-dominios': ' (domínios: ',
	'admin-revise-antes-de-continuar': '). Revise antes de continuar.',
	'admin-selecionar-todas': ' Selecionar todas',
	'admin-ligacao-nao-encontrada-no-texto-provavelmente': ' — ligação não encontrada no texto (provavelmente vem de predefinição)',
	'admin-erro': ' — erro: $1',
	'admin-de-pagina-s-editada-s': '$1 de $2 página(s) editada(s).',
	'admin-desligar-titulo': 'Desligar $1',
	'admin-remover-ligacoes': 'Remover ligações',
	'admin-nenhuma-pagina-liga-a-esta-nos': 'Nenhuma página liga a esta nos domínios configurados.',
	'admin-desligar-botao': 'Desligar',
	'admin-remover-as-ligacoes-de-outras-paginas': 'Remover as ligações de outras páginas para esta',
	'admin-todos-os-usuarios': 'Todos os usuários',
	'admin-edicao-e-mocao-ligadas-mudar-uma': 'Edição e moção ligadas: mudar uma muda a outra. Clique para separar.',
	'admin-edicao-e-mocao-separadas-clique-para': 'Edição e moção separadas. Clique para ligar (a moção passa a seguir a edição).',
	'admin-acao': 'Ação',
	'admin-nivel': 'Nível',
	'admin-duracao': 'Duração',
	'admin-protecao-atual': 'Proteção atual: $1',
	'admin-manter': 'Manter ($1)',
	'admin-ex-2-weeks': 'Ex.: 2 weeks',
	'admin-protecao-em-cascata-protege-as-paginas': 'Proteção em cascata (protege as páginas transcluídas)',
	'admin-a-cascata-exige-um-destes-niveis': 'A cascata exige um destes níveis de edição: $1.',
	'admin-protecao-aplicada': 'Proteção aplicada.',
	'admin-proteger-titulo': 'Proteger $1',
	'admin-proteger-botao': 'Proteger',
	'admin-alterar-a-protecao-desta-pagina': 'Alterar a proteção desta página',
	'admin-nao-notificar': 'Não notificar',
	'admin-bloqueado-sem-acesso-a-discussao': 'Bloqueado (sem acesso à discussão)',
	'admin-bloqueado-disc-com-acesso-a-discussao': 'Bloqueado-disc (com acesso à discussão)',
	'admin-bloqueado-cpv-conta-para-vandalismo': 'Bloqueado-CPV (conta para vandalismo)',
	'admin-proxy': 'Proxy',
	'admin-simulacao-notificacao-de-bloqueio-de-nada': 'Simulação: notificação de bloqueio de $1. Nada foi salvo.',
	'admin-ex-3-days-2027-01-01': 'Ex.: 3 days, 2027-01-01',
	'admin-pagina-1-pagina-2-ate-10': 'Página 1|Página 2 (até 10)',
	'admin-numeros-dos-dominios-ex-0-10': 'Números dos domínios, ex.: 0|10',
	'admin-impedir-a-criacao-de-contas': 'Impedir a criação de contas',
	'admin-impedir-tambem-as-contas-registradas-que': 'Impedir também as contas registradas que usam este IP',
	'admin-impedir-a-edicao-pelos-ips-usados': 'Impedir a edição pelos IPs usados pela conta (bloqueio automático)',
	'admin-impedir-o-envio-de-e-mail': 'Impedir o envio de e-mail',
	'admin-impedir-a-edicao-da-propria-pagina': 'Impedir a edição da própria página de discussão',
	'admin-ocultar-o-nome-de-usuario': 'Ocultar o nome de usuário',
	'admin-outra-duracao': 'Outra duração',
	'admin-paginas': 'Páginas',
	'admin-dominios-rotulo': 'Domínios',
	'admin-multibloqueio-info': 'Este alvo já tem {{PLURAL:$1|um bloqueio|$1 bloqueios}}. Escolha se quer alterar ou remover {{PLURAL:$1|esse bloqueio|um deles}}, ou acrescentar outro, que vale junto.',
	'admin-multibloqueio-escolha': 'O que fazer',
	'admin-multibloqueio-descricao': '$1 ($2, por $3, expira: $4; motivo: $5)',
	'admin-multibloqueio-alterar': 'Alterar o bloqueio $1',
	'admin-multibloqueio-remover': 'Remover o bloqueio $1',
	'admin-multibloqueio-grupo-alterar': 'Alterar',
	'admin-multibloqueio-grupo-remover': 'Desbloquear',
	'admin-desbloquear': 'Desbloquear',
	'admin-desbloquear-titulo': 'Desbloquear ',
	'admin-desbloqueio-motivo': 'Motivo do desbloqueio',
	'admin-desbloqueio-motivo-exemplo': 'Opcional',
	'admin-desbloqueado': 'Bloqueio #$1 de $2 removido. ',
	'admin-multibloqueio-novo': 'Acrescentar um novo bloqueio ({{PLURAL:$1|o atual continua|os atuais continuam}} valendo)',
	'admin-multibloqueio-adicionar': 'Acrescentar bloqueio',
	'admin-multibloqueio-total': 'total',
	'admin-multibloqueio-sem-prazo': 'sem prazo',
	'admin-multibloqueio-parcial': 'parcial',
	'admin-ja-coberto-por-bloqueio-de-intervalo': 'Já coberto por bloqueio de intervalo: $1.',
	'admin-alvo': 'Alvo',
	'admin-opcoes': 'Opções',
	'admin-notificar-o-usuario': 'Notificar o usuário',
	'admin-foi-bloqueado': '$1 foi bloqueado. ',
	'admin-ver-registro': 'Ver registro',
	'admin-usuario-notificado': 'Usuário notificado.',
	'admin-alterar-bloqueio-de': 'Alterar bloqueio de ',
	'admin-bloquear-titulo': 'Bloquear ',
	'admin-alterar-bloqueio': 'Alterar bloqueio',
	'admin-bloquear-botao': 'Bloquear',
	'admin-bloquear-este-usuario-ou-ip': 'Bloquear este usuário ou IP',
	'admin-reversor-limites': 'Como reversor, você pode bloquear IPs e contas não confirmadas por até 24 horas, por vandalismo. Bloqueios fora desses limites são considerados abuso da ferramenta.',
	'admin-reversor-confirmado': 'Como reversor, você não pode bloquear $1: a conta é confirmada. Se for o caso, notifique os administradores.',
	'admin-reversor-notificar-vandalismo': 'Notificar vandalismo',
	'admin-reversor-notificar-incidente': 'Notificar incidente',
	'admin-restaurar-tambem-a-pagina-de-discussao': 'Restaurar também a página de discussão',
	'admin-nao-ha-edicoes-eliminadas-desta-pagina': 'Não há edições eliminadas desta página.',
	'admin-pagina-restaurada': 'Página restaurada.',
	'admin-restaurar-titulo': 'Restaurar — $1',
	'admin-edicao-oes-eliminada-s': ' edição(ões) eliminada(s)',
	'admin-eliminada-em-por': '; eliminada em $1 por $2$3',
	'admin-escolher-edicoes': 'escolher edições',
	'admin-restaurar-botao': 'Restaurar',
	'admin-ligacoes-desta-pagina': 'Ligações desta página',
	'admin-paginas-desta-categoria': 'Páginas desta categoria',
	'admin-paginas-criadas-por': 'Páginas criadas por $1',
	'admin-paginas-com-um-prefixo': 'Páginas com um prefixo',
	'admin-lista-digitada': 'Lista digitada',
	'admin-carregar-paginas': 'Carregar páginas',
	'admin-lote-filtros': 'Filtros',
	'admin-lote-filtro-dominios': 'Domínios',
	'admin-lote-filtro-manter': 'Manter só os títulos que contêm',
	'admin-lote-filtro-manter-exemplo': 'ex.: (desambiguação)',
	'admin-lote-filtro-remover': 'Tirar os títulos que contêm',
	'admin-lote-filtro-remover-exemplo': 'ex.: /Arquivo',
	'admin-lote-filtro-regex': 'Usar expressões regulares',
	'admin-lote-filtro-outra-lista': 'Comparar com outra lista',
	'admin-lote-filtro-outra-tirar': 'Tirar as páginas que estão nesta lista',
	'admin-lote-filtro-outra-manter': 'Manter só as páginas que também estão nesta lista',
	'admin-lote-filtro-outra-lista-exemplo': 'Um título por linha',
	'admin-lote-filtro-contagem': '$1 de $2 páginas passam pelos filtros.',
	'admin-eliminar-tambem-as-paginas-de-discussao': 'Eliminar também as páginas de discussão (exceto discussões de usuário)',
	'admin-eliminar-tambem-as-pdus': 'Eliminar também as discussões de usuário (PDU) das páginas de usuário',
	'admin-indefinida': 'Indefinida',
	'admin-edicao-ou-criacao-se-nao-existir': 'Edição (ou criação, se não existir)',
	'admin-mocao': 'Moção',
	'admin-prefixo-com-o-dominio-ex-predefinicao': 'Prefixo (com o domínio, ex.: Predefinição:Info/)',
	'admin-um-titulo-por-linha-ate-50': 'Um título por linha (até 50)',
	'admin-nenhuma-pagina-encontrada': 'Nenhuma página encontrada.',
	'admin-nao-existe': ' (não existe)',
	'admin-escolha-ao-menos-uma-pagina': 'Escolha ao menos uma página.',
	'admin-lote-escolha-o-nivel': '— escolha —',
	'admin-pagina-mudou-confirmar': 'A página foi editada depois que este diálogo foi aberto (a marcação ou o conteúdo podem ter mudado). Eliminar mesmo assim?',
	'admin-reversor-so-altera-os-proprios': 'Reversores só podem alterar bloqueios feitos por eles mesmos; para os demais, acrescente um novo bloqueio ou faça um pedido aos administradores.',
	'admin-lote-remover-protecao': 'Remover proteção (todos os usuários)',
	'admin-lote-confirmar-eliminar': 'Eliminar {{PLURAL:$1|1 página|$1 páginas}}?',
	'admin-lote-confirmar-restaurar': 'Restaurar {{PLURAL:$1|1 página|$1 páginas}}?',
	'admin-lote-confirmar-proteger': 'Alterar a proteção de {{PLURAL:$1|1 página|$1 páginas}}?',
	'admin-eliminando': 'Eliminando ',
	'admin-restaurando': 'Restaurando ',
	'admin-protegendo': 'Protegendo ',
	'admin-lote-concluido': 'Lote concluído.',
	'admin-lote-interrompido-veja-o-registro': 'Lote interrompido; veja o registro.',
	'admin-lote': 'Lote',
	'admin-origem': 'Origem',
	'admin-executar': 'Executar',
	'admin-restaurar-esta-pagina-eliminada': 'Restaurar esta página eliminada',
	'admin-eliminar-restaurar-ou-proteger-varias-paginas': 'Eliminar, restaurar ou proteger várias páginas de uma vez'
};

/* ===== Ronda-core.js ===== */
/**
 * Ronda — núcleo
 *
 * Substitui o FastButtons e convive com o DiffTools (reversão e avisos).
 * Interface: somente o módulo nativo "jquery.ui" do MediaWiki — que é o
 * jQuery UI 1.9.2 — (dialog, button, buttonset, autocomplete, progressbar,
 * tooltip), controles nativos do HTML (<select>, caixas de seleção) e classes
 * nativas (ui-widget, ui-state-highlight, ui-state-error, ui-button-blue,
 * ui-button-red, wikitable). Os diálogos não têm estilo próprio, exceto as
 * cores do modo escuro nativo (Ronda.css).
 * Não usar APIs do jQuery UI 1.10+ (controlgroup, checkboxradio, selectmenu,
 * opção "classes", opções "icon"/"showLabel" do botão).
 * Listas de motivos e durações vêm das mensagens nativas do MediaWiki
 * (ipbreason-dropdown, ipboptions, deletereason-dropdown,
 * filedelete-reason-dropdown, undelete-comment-dropdown, movepage-reason-dropdown,
 * protect-dropdown, protect-expiry-options), as mesmas usadas pelos formulários
 * especiais; nos de eliminação, o catálogo ronda.catalog.deletionReasons prevalece.
 *
 * A inicialização (barra, modo de simulação) também fica aqui e roda quando o
 * documento está pronto, depois que os demais arquivos registraram os módulos.
 *
 * Definição do gadget (MediaWiki:Gadgets-definition), nesta ordem:
 * * Ronda[ResourceLoader|dependencies=jquery.ui,mediawiki.api,mediawiki.util,mediawiki.user,mediawiki.storage,mediawiki.notification]|Ronda-mensagens.js|Ronda-core.js|Ronda-catalogo.js|Ronda-patrulha.js|Ronda-paginas.js|Ronda-admin.js|Ronda.css
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function () {
'use strict';

var uid = 0,
	api = new mw.Api( { parameters: { formatversion: 2 } } ),
	ronda = window.ronda = {
		version: '0.8.0',
		api: api,
		modules: [],
		ctx: null,
		config: {
			// Etiqueta de alteração; precisa existir em Especial:Etiquetas. null = sem etiqueta.
			tag: null,
			// Acrescentado ao fim de todo resumo de edição e motivo (eliminação, bloqueio,
			// proteção, moção). '' = nada.
			summarySuffix: ' (via [[User:Little Sunshine/Ronda|script]] #Ronda)',

			icon: 'UserScript Ronda Icon.svg',
			// Tema visual (ronda.THEMES); '' = padrão. O CSS do tema vem de
			// themePath + 'Ronda-tema-<id>.css' e só é carregado quando escolhido.
			theme: '',
			themePath: 'Usuário:Little Sunshine/Scripts/',
			// Vigilância das páginas editadas; 'preferences' segue "Adicionar à lista de
			// páginas vigiadas as páginas que eu editar" das preferências do MediaWiki
			watchlist: 'preferences',
			// Buscar em segundo plano os dados dos painéis Usuário e Informações
			prefetch: true,
			unlink: {
				right: 'delete',      // direito exigido para ver o módulo Desligar
				namespaces: '0',      // domínios onde as ligações são removidas
				currentNamespace: true // incluir também o domínio da página desligada
			},
			maintenance: {
				namespaces: [ 0 ]     // domínios onde o módulo Manutenção aparece
			},
			consensus: {
				// Página-modelo da discussão (o FastButtons usa a mesma)
				template: 'Predefinição:Página para eliminar',
				prefix: 'Wikipédia:Páginas para eliminar/',
				tagCode: 'subst:apagar',          // gera a marca {{Apagar4}}
				warnTemplate: 'Aviso-PE',
				// Proposta conjunta: linha de ferramentas por página e sufixo do cabeçalho de seção
				toolsTemplate: 'PE-ferramentas2',
				headerSuffix: ' + $1 semelhantes',
				headerSuffixSingular: ' + 1 semelhante'
			},
			blockNotification: {
				// Módulo da comunidade que envia as notificações {{Bloqueado}}, {{Bloqueado-disc}}
				// e {{Bloqueado parcial}} (mw.libs.blockNotificationButton); carregado do gadget
				// ou, se não houver, da página
				gadget: 'ext.gadget.blockNotificationButton-api',
				page: 'MediaWiki:Gadget-blockNotificationButton-api.js'
			},
			deletion: {
				redirectReason: '[[WP:ER|ER]] R1: redirecionamento para página eliminada'
			},
			move: {
				// Eliminação do destino antes de mover; $1 = página que será movida para lá
				deleteReason: '[[WP:ER|ER]] R2: eliminado para permitir a moção de [[$1]]'
			},
			revert: {
				// $1 = autor da versão restaurada, $2 = usuário revertido, $3 = número da versão, $4 = motivo
				summary: 'Desfeita(s) uma ou mais edições de [[Special:Contribs/$2|$2]]',
				// Mesmo caso, quando feito pela reversão rápida (rollback)
				rollbackSummary: 'Revertida(s) uma ou mais edições de [[Special:Contribs/$2|$2]]',
				agfSummary: 'Revertidas edições de boa-fé de [[Special:Contribs/$2|$2]]: $4',
				vandalSummary: 'Revertidas edições de [[Special:Contribs/$2|$2]] identificadas como vandalismo',
				restoreSummary: 'Restaurada a versão $3 de [[Special:Contribs/$1|$1]]',
				patrol: true,         // marcar como patrulhada (quando o diff tem o link)
				confirm: false,       // pedir confirmação antes de reverter pelos links rápidos
				vandalWarn: true,     // abrir o Avisar depois de reverter vandalismo
				// Onde aparecem os links rápidos (reverter BF / reverter / vandalismo / restaurar)
				links: { diff: true, history: true, contribs: true, recentchanges: true, watchlist: true }
			},
			warnings: {
				window: 30,           // dias considerados para sugerir o nível do próximo aviso
				marker: true,         // marca oculta <!-- ronda-aviso:… --> depois de cada aviso
				reportPage: 'Wikipédia:Pedidos/Revisão de nomes de usuário',
				vandalismPage: 'Wikipédia:Pedidos/Notificações de vandalismo',
				confirm: true         // confirmar aviso repetido em 24 h ou discussão editada há < 1 min
			}
		}
	};

/* ------------------------------------------------------------------ *
 * Mensagens de interface (Ronda-mensagens.js, carregado antes do núcleo)
 * ------------------------------------------------------------------ */

ronda.messages = $.extend( {}, window.rondaMessages || {}, ( window.rondaConfig && window.rondaConfig.messages ) || {} );

/**
 * Texto de interface pela chave, com $1, $2… e {{PLURAL:$n|singular|plural}}.
 * Chave inexistente: ⧼chave⧽ e um aviso no console, como no MediaWiki.
 */
ronda.msg = function ( key ) {
	var args = [].slice.call( arguments, 1 ),
		text = Object.prototype.hasOwnProperty.call( ronda.messages, key ) ? ronda.messages[ key ] : null;

	if ( text === null ) {
		// eslint-disable-next-line no-console
		console.warn( '[Ronda] mensagem inexistente: ' + key );
		return '⧼' + key + '⧽';
	}
	return String( text )
		.replace( /\{\{PLURAL:\$(\d+)\|([^|}]*)\|([^}]*)\}\}/g, function ( m, n, one, many ) {
			return Math.abs( Number( args[ n - 1 ] ) ) < 2 ? one : many;
		} )
		.replace( /\$(\d+)/g, function ( m, n ) {
			return args[ n - 1 ] === undefined ? m : String( args[ n - 1 ] );
		} );
};

/* ------------------------------------------------------------------ *
 * Contexto
 * ------------------------------------------------------------------ */

function getTargetUser( type ) {
	var from;

	if ( type === 'rollback' ) {
		from = mw.util.getParamValue( 'from' );
		return from ? from.replace( /_/g, ' ' ) : null;
	}

	if ( type === 'diff' ) {
		return $( '#mw-diff-ntitle2 .mw-userlink bdi' ).first().text()
			|| $( '#mw-diff-ntitle2 .mw-userlink' ).first().text()
			|| null;
	}

	// Versão antiga (?oldid=), como no DiffTools
	if ( type === 'revision' ) {
		return $( '#mw-revision-name .mw-userlink bdi' ).first().text()
			|| $( '#mw-revision-name .mw-userlink' ).first().text()
			|| null;
	}

	// Páginas de usuário, discussão de usuário e Especial:Contribuições
	return mw.config.get( 'wgRelevantUserName' ) || null;
}

ronda.buildContext = function ( rights ) {
	var type,
		ns = mw.config.get( 'wgNamespaceNumber' ),
		action = mw.config.get( 'wgAction' ),
		special = mw.config.get( 'wgCanonicalSpecialPageName' ),
		isDiff = ns !== -1 && !!( mw.config.get( 'wgDiffNewId' ) || mw.util.getParamValue( 'diff' ) );

	if ( action === 'rollback' ) {
		type = 'rollback';
	} else if ( isDiff ) {
		type = 'diff';
	} else if ( special === 'Contributions' ) {
		type = 'contribs';
	} else if ( ns === -1 ) {
		type = 'special';
	} else if ( action === 'edit' || action === 'submit' ) {
		type = 'edit';
	} else if ( action === 'view' ) {
		type = 'view';
	} else if ( action === 'history' ) {
		type = 'history';
	} else {
		type = 'other';
	}

	return {
		type: type,
		isRevision: type === 'view' && ns !== -1 && !!mw.util.getParamValue( 'oldid' ),
		ns: ns,
		action: action,
		special: special,
		page: mw.config.get( 'wgPageName' ).replace( /_/g, ' ' ),
		title: mw.config.get( 'wgTitle' ),
		exists: mw.config.get( 'wgArticleId' ) > 0,
		isRedirect: !!mw.config.get( 'wgIsRedirect' ),
		isMainPage: !!mw.config.get( 'wgIsMainPage' ),
		oldId: mw.config.get( 'wgDiffOldId' ) || null,
		newId: mw.config.get( 'wgDiffNewId' ) || null,
		targetUser: getTargetUser( type === 'view' && mw.util.getParamValue( 'oldid' ) ? 'revision' : type ),
		rights: rights || []
	};
};

/*
 * Onde cada grupo de menus aparece (a mesma lógica do FastButtons):
 * - ações que marcam o texto da página (eliminação, manutenção, #R, esboço…): leitura, edição e diffs,
 *   fora da página principal;
 * - ações sobre a página como um todo (informações, mover): em qualquer ação dela, inclusive o histórico;
 * - ações sobre o usuário: em Especial:Contribuições e em qualquer ação das páginas e discussões de usuário.
 */
ronda.isTaggable = function ( ctx ) {
	return ( ctx.type === 'view' || ctx.type === 'edit' || ctx.type === 'diff' ) && ctx.ns >= 0 && !ctx.isMainPage;
};

ronda.isPageContext = function ( ctx ) {
	return ctx.ns >= 0 && ctx.type !== 'rollback';
};

ronda.isUserContext = function ( ctx ) {
	return !!ctx.targetUser && ( ctx.type === 'contribs'
		|| ( ( ctx.ns === 2 || ctx.ns === 3 ) && ctx.type !== 'diff' && ctx.type !== 'rollback' && !ctx.isRevision ) );
};

ronda.can = function ( right ) {
	return !!ronda.ctx && ronda.ctx.rights.indexOf( right ) !== -1;
};

/* ------------------------------------------------------------------ *
 * Registro de módulos
 * ------------------------------------------------------------------ */

/**
 * @param {Object} mod
 * @param {string} mod.id
 * @param {string} mod.label Texto do botão
 * @param {string} [mod.title] Dica (tooltip)
 * @param {number} [mod.order]
 * @param {boolean} [mod.admin] Ação administrativa: vai para o grupo destacado da barra
 * @param {Function} mod.isAvailable function ( ctx ) → boolean
 * @param {Function} mod.open function ( ctx, [options] )
 */
ronda.registerModule = function ( mod ) {
	ronda.modules.push( mod );
};

ronda.getModule = function ( id ) {
	return ronda.modules.filter( function ( m ) {
		return m.id === id;
	} )[ 0 ] || null;
};

/* ------------------------------------------------------------------ *
 * API
 * ------------------------------------------------------------------ */

/** Acrescenta o sufixo do resumo uma vez só (ronda.params pode ser chamado de novo) */
ronda.withSuffix = function ( text ) {
	var suffix = ronda.config.summarySuffix;

	if ( !suffix || !text || text.slice( -suffix.length ) === suffix ) {
		return text;
	}
	return text + suffix;
};

/** Acrescenta a etiqueta e o sufixo configurados aos parâmetros de escrita */
ronda.params = function ( params ) {
	if ( ronda.config.tag ) {
		params.tags = ronda.config.tag;
	}
	// Resumo ou motivo vazio fica só com o sufixo (ex.: moção sem motivo)
	[ 'summary', 'reason' ].forEach( function ( key ) {
		if ( typeof params[ key ] === 'string' ) {
			params[ key ] = params[ key ].trim()
				? ronda.withSuffix( params[ key ] )
				: ( ronda.config.summarySuffix || '' ).trim();
		}
	} );
	return params;
};

/**
 * Vigilância de páginas criadas de propósito (discussão de PE, redirecionamentos
 * da proposta conjunta, #R numa página nova): vigiar por padrão, a menos que o
 * usuário tenha escolhido "Deixar de vigiar".
 */
ronda.creationWatchlist = function () {
	return ronda.config.watchlist === 'unwatch' ? 'unwatch' : 'watch';
};

/**
 * Predefinição citada num resumo de edição: {{[[Pre:Nome|Nome]]}}
 * (Pre: é um atalho válido para Predefinição: na pt.wiki).
 */
ronda.tpl = function ( name ) {
	name = String( name ).split( '|' )[ 0 ].replace( /^subst:/i, '' ).trim();
	return '{{[[Pre:' + name + '|' + name + ']]}}';
};

ronda.post = function ( params ) {
	return api.postWithToken( 'csrf', ronda.params( params ) );
};

ronda.loadMessages = function ( names ) {
	return api.loadMessagesIfMissing( names, { amlang: mw.config.get( 'wgContentLanguage' ) } );
};

/* ---------------- Menus de motivos (ipbreason-dropdown etc.) ---------------- */

var REASONS_TTL = 7 * 24 * 60 * 60 * 1000, // 1 semana, como no FastButtonsEliminar
	// Mensagens que dependem do domínio (#switch etc.) e por isso são expandidas
	EXPAND_REASONS = [ 'deletereason-dropdown' ];

function stripLinks( text ) {
	return text
		.replace( /\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1' )
		.replace( /\[\[([^\]]+)\]\]/g, '$1' );
}

/**
 * Converte "* grupo / ** opção" em [ { label, options: [ { label, value } ] } ].
 * label = texto sem wikiligações (exibição); value = wikitexto original (sumário).
 */
ronda.parseDropdown = function ( text ) {
	var groups = [],
		current = null;

	( text || '' ).split( '\n' ).forEach( function ( line ) {
		var m = line.match( /^(\*+)\s*(.+?)\s*$/ );

		if ( !m ) {
			return;
		}

		if ( m[ 1 ].length === 1 ) {
			current = { label: stripLinks( m[ 2 ] ), options: [] };
			groups.push( current );
		} else {
			if ( !current ) {
				current = { label: '', options: [] };
				groups.push( current );
			}
			current.options.push( { label: stripLinks( m[ 2 ] ), value: m[ 2 ] } );
		}
	} );

	return groups.filter( function ( g ) {
		return g.options.length;
	} );
};

/**
 * Motivos de um menu nativo (MediaWiki:<mensagem>).
 * Por padrão vem o texto cru da mensagem: expandir tudo (amenableparser)
 * também expande as predefinições usadas nos motivos, como as de
 * MediaWiki:Ipbreason-dropdown, e o menu passa a mostrar o HTML delas.
 * Só as mensagens de EXPAND_REASONS são expandidas, no contexto da página
 * (amtitle): na pt.wiki o MediaWiki:Deletereason-dropdown muda conforme o
 * domínio. Cache (mw.storage, 1 semana) por mensagem + domínio.
 * Com uma lista de mensagens, junta os grupos de todas, na ordem dada;
 * uma mensagem que falhar só fica de fora.
 * @param {string|string[]} msgName
 * @param {Object|null} ctx Contexto da página; null para menus que não dependem dela
 * @param {boolean} [refresh] Ignora o cache
 * @return {jQuery.Promise} resolve com os grupos
 */
ronda.reasons = function ( msgName, ctx, refresh ) {
	var params, key, cached, expand;

	if ( Array.isArray( msgName ) ) {
		return $.when.apply( $, msgName.map( function ( name ) {
			return ronda.reasons( name, ctx, refresh ).then( null, function () {
				return $.Deferred().resolve( [] ).promise();
			} );
		} ) ).then( function () {
			return [].concat.apply( [], [].slice.call( arguments ) );
		} );
	}

	expand = EXPAND_REASONS.indexOf( msgName ) !== -1;
	key = 'ronda-reasons-v2-' + msgName + '-' + ( expand && ctx ? ctx.ns : 'x' );
	cached = !refresh && mw.storage.getObject( key );

	if ( cached && cached.groups && Date.now() - cached.t < REASONS_TTL ) {
		return $.Deferred().resolve( cached.groups ).promise();
	}

	params = {
		action: 'query',
		meta: 'allmessages',
		ammessages: msgName,
		amlang: mw.config.get( 'wgContentLanguage' )
	};
	if ( expand ) {
		params.amenableparser = true;
		if ( ctx ) {
			params.amtitle = ctx.page;
		}
	}

	return api.get( params ).then( function ( data ) {
		var msg = data.query.allmessages[ 0 ],
			groups = ( msg && !msg.missing ) ? ronda.parseDropdown( msg.content ) : [];

		if ( groups.length ) {
			mw.storage.setObject( key, { t: Date.now(), groups: groups } );
		}
		return groups;
	} );
};

/** Procura nos grupos a primeira opção cujo valor ou rótulo casa com a expressão */
ronda.findReason = function ( groups, re ) {
	var found = null;

	groups.forEach( function ( g ) {
		g.options.forEach( function ( o ) {
			if ( !found && ( re.test( o.value ) || re.test( o.label ) ) ) {
				found = o;
			}
		} );
	} );

	return found;
};

/** Nova seção na discussão de um usuário */
ronda.notifyUser = function ( user, header, text, summary ) {
	return api.newSection(
		mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + user,
		header,
		text,
		// sectiontitle explícito: sem ele, o MediaWiki usa o resumo (com o sufixo
		// do Ronda) como título da seção
		ronda.params( { sectiontitle: header, summary: summary, watchlist: ronda.config.watchlist } )
	);
};

ronda.fail = function ( code, data ) {
	var msg = ( data && typeof data === 'object' && api.getErrorMessage )
		? api.getErrorMessage( data )
		: ronda.msg( 'core-erro', code || 'desconhecido' );

	mw.notify( msg, { type: 'error', title: ronda.msg( 'core-nome' ), autoHide: false } );
};

/**
 * Executa fn( item ) para cada item, um de cada vez, sem parar nos erros.
 * @return {jQuery.Promise} resolve com [ { item, ok, code } ]
 */
ronda.sequence = function ( items, fn, onStep ) {
	var i = 0,
		results = [],
		d = $.Deferred();

	( function next() {
		var item;

		if ( i >= items.length ) {
			d.resolve( results );
			return;
		}

		item = items[ i++ ];
		$.when( fn( item ) ).then( function () {
			results.push( { item: item, ok: true } );
		}, function ( code ) {
			results.push( { item: item, ok: false, code: code } );
		} ).always( function () {
			if ( onStep ) {
				onStep( i, items.length, results[ results.length - 1 ] );
			}
			next();
		} );
	}() );

	return d.promise();
};

/** Junta motivo do menu + texto livre, como os formulários nativos */
ronda.joinReason = function ( selected, extra ) {
	selected = ( selected || '' ).trim();
	extra = ( extra || '' ).trim();

	if ( selected && extra ) {
		return selected + ': ' + extra;
	}
	return selected || extra;
};

/**
 * Substituto para String#replace que insere o texto como está: sem função, padrões
 * como $&, $1 ou $$ no texto do usuário seriam interpretados pelo replace.
 */
ronda.literal = function ( value ) {
	var text = value === null || value === undefined ? '' : String( value );

	return function () {
		return text;
	};
};

/**
 * Parâmetros da primeira chamada de uma predefinição no texto, respeitando
 * predefinições e ligações aninhadas (a barra de [[A|b]] não separa parâmetros).
 * @param {string} text
 * @param {string} name Nome da predefinição (sem distinção de maiúscula na primeira letra)
 * @return {Object|null} { '1': …, '2': …, 'nome': … } com os valores sem espaços nas pontas
 */
ronda.templateParams = function ( text, name ) {
	var re = new RegExp( '\\{\\{\\s*(?:subst:)?[' + name.charAt( 0 ).toUpperCase() + name.charAt( 0 ).toLowerCase() + ']' +
			name.slice( 1 ).replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ).replace( / /g, '[ _]' ) + '\\s*(?=[|}])' ),
		m = re.exec( String( text || '' ) ),
		out = {},
		parts = [],
		cur = '',
		depth = 0,
		i, two, pos = 1;

	if ( !m ) {
		return null;
	}
	text = String( text );
	for ( i = m.index + m[ 0 ].length; i < text.length; i++ ) {
		two = text.substr( i, 2 );
		if ( two === '{{' || two === '[[' ) {
			depth++;
			cur += two;
			i++;
		} else if ( two === '}}' && depth === 0 ) {
			parts.push( cur );
			break;
		} else if ( two === '}}' || two === ']]' ) {
			depth = Math.max( 0, depth - 1 );
			cur += two;
			i++;
		} else if ( text[ i ] === '|' && depth === 0 ) {
			parts.push( cur );
			cur = '';
		} else {
			cur += text[ i ];
		}
	}
	// parts[ 0 ] é o que vem entre o nome e a primeira barra (vazio)
	parts.slice( 1 ).forEach( function ( p ) {
		var eq = p.match( /^\s*([^=\[\]{}|]+?)\s*=([\s\S]*)$/ );

		if ( eq ) {
			out[ eq[ 1 ] ] = eq[ 2 ].trim();
		} else {
			out[ String( pos++ ) ] = p.trim();
		}
	} );
	return out;
};

/**
 * Escapa barras verticais para uso em parâmetros de predefinição.
 * As que estão dentro de [[…]] e {{…}} ficam como estão: são do próprio link ou predefinição.
 * Um "}}" sem abertura correspondente vira &#125;&#125;, para não fechar a predefinição.
 */
ronda.templateSafe = function ( text ) {
	var depth = 0;

	return String( text == null ? '' : text ).replace( /\[\[|\]\]|\{\{|\}\}|\|/g, function ( m ) {
		if ( m === '[[' || m === '{{' ) {
			depth++;
		} else if ( m === ']]' || m === '}}' ) {
			// Fechamento solto (sem abertura antes) fecharia a predefinição: vira entidade
			if ( !depth ) {
				return m === '}}' ? '&#125;&#125;' : m;
			}
			depth--;
		} else if ( !depth ) {
			return '{{!}}';
		}
		return m;
	} );
};

ronda.ui = {};

/* ------------------------------------------------------------------ *
 * Ajudantes comuns aos módulos que marcam páginas e avisam criadores
 * ------------------------------------------------------------------ */

ronda.ELIMINATION_TAG = /\{\{\s*(?:subst:)?(?:ER|ESR(?:2|-[\w\-]+)?|apagar\d*|usuário(?:\(a\))?:salebot\/impróprio)\s*[|}]/i;

/** A página já tem marcação de eliminação (ER, ESR, Apagar)? */
ronda.hasEliminationTag = function ( text ) {
	return ronda.ELIMINATION_TAG.test( text || '' );
};

/** rcid do link "Marcar como patrulhada", se houver */
ronda.patrolRcid = function () {
	var href = $( '.patrollink a' ).first().attr( 'href' );

	return href ? mw.util.getParamValue( 'rcid', href ) : null;
};

/** Marcas em predefinições, userboxes e páginas transcluídas vão em <noinclude> */
ronda.useNoinclude = function ( page ) {
	return page.ns === 10 || page.title.indexOf( 'Wikipédia:Userbox/' ) === 0 || !!page.transcluded;
};

/**
 * Criador da página, se puder ser avisado (critérios do FastButtons): não é
 * você, a página não veio de uma moção e não é um IP que criou há mais de 24 h.
 * @return {jQuery.Promise} resolve com o nome ou null
 */
ronda.eligibleCreator = function ( title ) {
	return api.get( {
		action: 'query',
		titles: title,
		prop: 'revisions',
		rvprop: 'user|timestamp|comment',
		rvlimit: 2,
		rvdir: 'newer'
	} ).then( function ( data ) {
		var revs = data.query.pages[ 0 ].revisions || [],
			first = revs[ 0 ],
			creator = first && first.user;

		if ( !creator
			|| creator === mw.config.get( 'wgUserName' )
			|| ( revs.length === 1 && /moveu \[\[.+?\]\] para \[\[.+?\]\]/.test( first.comment || '' ) )
			|| ( mw.util.isIPAddress( creator ) && Date.parse( first.timestamp ) + 864e5 < Date.now() )
		) {
			return null;
		}
		return creator;
	} );
};

/**
 * Avisa o criador com {{subst:<code>}} ~~~~.
 * @return {jQuery.Promise} resolve com um texto para o registro
 */
/**
 * Avisa o criador da página (se for elegível) numa única edição da discussão.
 * @param {string} title Página
 * @param {string|null} code Predefinição do aviso de eliminação (sem subst:), ou null
 * @param {string} [summary]
 * @param {Function} [extra] function( criador ) → { text, summary } ou promessa disso:
 *  um aviso a mais (ex.: vandalismo), enviado na mesma edição
 */
ronda.warnCreator = function ( title, code, summary, extra ) {
	return ronda.eligibleCreator( title ).then( function ( creator ) {
		if ( !creator ) {
			return ronda.msg( 'core-sem-aviso-criador-nao-elegivel' );
		}

		return $.when( extra ? extra( creator ) : null ).then( function ( add ) {
			var parts = [],
				summaries = [];

			if ( code ) {
				parts.push( '{{subst:' + code + '}} ~~' + '~~' );
				summaries.push( summary || 'Aviso: proposta de eliminação de [[' + title + ']]' );
			}
			if ( add && add.text ) {
				parts.push( add.text );
				summaries.push( add.summary );
			}
			if ( !parts.length ) {
				return ronda.msg( 'core-sem-aviso-criador-nao-elegivel' );
			}

			return ronda.post( {
				action: 'edit',
				title: mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + creator,
				appendtext: '\n\n' + parts.join( '\n\n' ),
				summary: summaries.join( '; ' ),
				watchlist: ronda.config.watchlist
			} ).then( function () {
				return ronda.msg( 'core-aviso-enviado-a', creator );
			} );
		} );
	} );
};

/* ---------------- Edição da página atual (leitura ou formulário de edição) ---------------- */

function editForm() {
	var $box = $( '#wpTextbox1' );

	return ronda.ctx && ronda.ctx.type === 'edit' && $box.length ? $box : null;
}

/** Junta um resumo ao que já está no campo de resumo do formulário */
function appendSummary( summary ) {
	var $sum = $( '#wpSummary' ),
		cur = ( $sum.val() || '' ).trim();

	if ( !summary ) {
		return;
	}
	$sum.val( cur ? cur + '; ' + summary.replace( /^./, function ( c ) {
		return c.toLowerCase();
	} ) : summary );
}

/**
 * Edita uma página aplicando transform( { content } ) → parâmetros (como mw.Api#edit).
 * Na página atual em modo de edição, como no FastButtons, a alteração vai para a
 * caixa de texto e o resumo para o campo de resumo, sem salvar.
 * @return {jQuery.Promise} resolve com { form: boolean }
 */
ronda.editPage = function ( title, transform ) {
	var $box = editForm();

	if ( $box && title === ronda.ctx.page ) {
		return $.when( transform( { content: $box.val() } ) ).then( function ( params ) {
			$box.val( params.text ).trigger( 'input' );
			appendSummary( params.summary );
			return { form: true };
		} );
	}

	return api.edit( title, transform ).then( function () {
		return { form: false };
	} );
};

/** O formulário de edição da página atual está aberto? */
ronda.inEditForm = function () {
	return !!editForm();
};

/**
 * Executa fn() quando o usuário clicar em "Publicar alterações" e só então
 * envia o formulário (usado para avisos depois de marcar no modo de edição).
 */
ronda.ui.onSave = function ( fn ) {
	$( '#wpSave' ).one( 'click.ronda', function ( e ) {
		var form = $( '#editform' )[ 0 ];

		e.preventDefault();
		$.when( fn() ).always( function () {
			$( '<input type="hidden" name="wpSave">' ).val( '1' ).appendTo( form );
			form.submit();
		} );
	} );
};

/* ------------------------------------------------------------------ *
 * Interface — apenas jQuery UI e HTML com classes nativas
 * ------------------------------------------------------------------ */

ronda.ui = ronda.ui || {};

/* Menus de sugestão (autocomplete) abertos a partir do Ronda recebem uma classe
 * própria, para o estilo do modo escuro não afetar os de outros scripts */
$( document ).on( 'autocompleteopen', function ( e ) {
	var $input = $( e.target );

	if ( $input.closest( '.ronda-form, #ronda-toolbar' ).length ) {
		$input.autocomplete( 'widget' ).addClass( 'ronda-menu' );
	}
} );

ronda.ui.id = function ( prefix ) {
	return 'ronda-' + prefix + '-' + ( ++uid );
};

/**
 * Diálogo modal (jQuery UI dialog), com o tema nativo do skin. Os controles
 * dentro dele são HTML simples (caixas de seleção, <select>, campos de texto).
 * @param {Object} opts { title, content, buttons: [ { text, click, class } ], width }
 * @return {jQuery}
 */
ronda.ui.dialog = function ( opts ) {
	var $dlg = $( '<div class="ronda-form"></div>' ).append( opts.content );

	var narrow = $( window ).width() < ( opts.width || 540 ) + 32;

	$dlg.dialog( {
		title: opts.title,
		dialogClass: 'ronda-dialog' + ( narrow ? ' ronda-dialog-narrow' : '' ),
		modal: true,
		// Em telas estreitas (celular), o diálogo ocupa a largura da tela, no topo
		width: narrow ? $( window ).width() - 16 : ( opts.width || 540 ),
		position: narrow ? { my: 'center top', at: 'center top+8', of: window } : { my: 'center', at: 'center', of: window },
		maxHeight: Math.round( $( window ).height() * ( narrow ? 0.92 : 0.85 ) ),
		buttons: opts.buttons || [ {
			text: ronda.msg( 'core-fechar' ),
			click: function () {
				$( this ).dialog( 'close' );
			}
		} ],
		close: function () {
			$dlg.dialog( 'destroy' ).remove();
		}
	} );

	return $dlg;
};

/**
 * Prévia de uma edição: o diff entre a versão atual da página e o texto novo,
 * numa janela à parte (como a prévia dos avisos). Nada é gravado.
 * @param {string} title
 * @param {string} text Texto novo da página
 */
ronda.ui.previewEdit = function ( title, text ) {
	return $.when( mw.loader.using( 'mediawiki.diff.styles' ).then( null, function () {
		return null;
	} ), ronda.api.post( {
		action: 'compare',
		fromtitle: title,
		toslots: 'main',
		'totext-main': text,
		'tocontentmodel-main': 'wikitext',
		topst: true,
		prop: 'diff',
		formatversion: 2
	} ) ).then( function ( dummy, res ) {
		var data = res && res.compare ? res : res && res[ 0 ],
			body = data && data.compare && data.compare.body;

		ronda.ui.dialog( {
			title: ronda.msg( 'core-previa-titulo', title ),
			width: 860,
			content: body
				? $( '<table class="diff ronda-preview-diff"></table>' ).append(
					'<colgroup><col class="diff-marker"><col class="diff-content"><col class="diff-marker"><col class="diff-content"></colgroup>', body )
				: $( '<p></p>' ).text( ronda.msg( 'core-previa-sem-mudancas' ) )
		} );
	}, ronda.fail );
};

ronda.ui.close = function ( $dlg ) {
	$dlg.dialog( 'close' );
};

/** Desativa/ativa os botões do diálogo durante uma operação */
ronda.ui.setBusy = function ( $dlg, busy ) {
	$dlg.closest( '.ui-dialog' ).find( '.ui-dialog-buttonpane button' )
		.button( busy ? 'disable' : 'enable' );
};

/** Linha de formulário: rótulo + controle */
ronda.ui.row = function ( label, $control ) {
	var id = $control.attr( 'id' ) || ronda.ui.id( 'field' );

	$control.attr( 'id', id );
	return $( '<div class="ronda-row"></div>' ).append(
		$( '<label>' ).attr( 'for', id ).text( label ),
		$control
	);
};

ronda.ui.text = function ( value, placeholder ) {
	return $( '<input type="text" class="ui-widget ui-widget-content ui-corner-all ronda-input">' )
		.val( value || '' )
		.attr( 'placeholder', placeholder || '' );
};

ronda.ui.textarea = function ( value, placeholder ) {
	return $( '<textarea rows="3" class="ui-widget ui-widget-content ui-corner-all ronda-input"></textarea>' )
		.val( value || '' )
		.attr( 'placeholder', placeholder || '' );
};

/** Caixa de seleção nativa com <label for> */
/*
 * Disposição do painel: à esquerda, uma tabela com um tema por linha (Situação,
 * Conta, Bloqueios, Contribuições, Atividade, Avisos, Filtro e, para IPs, Faixa);
 * à direita, uma coluna com tudo o que se faz ou abre (Ações, Ver, CheckUser, IP).
 * Linhas e grupos vazios não aparecem.
 */
ronda.ui.panelLayout = function () {
	var rows = [],
		groups = [];

	return {
		/** Linha da tabela; retorna a célula de conteúdo */
		row: function ( label ) {
			var $td = $( '<td></td>' );

			rows.push( $( '<tr></tr>' ).append( $( '<th scope="row"></th>' ).text( label ), $td ) );
			return $td;
		},
		/** Grupo da coluna lateral; retorna o contêiner dos itens */
		group: function ( label ) {
			var $items = $( '<div class="ronda-up-items"></div>' );

			groups.push( $( '<div class="ronda-up-group"></div>' ).append( $( '<div class="ronda-up-heading"></div>' ).text( label ), $items ) );
			return $items;
		},
		build: function () {
			var $rows = rows.filter( function ( $tr ) {
					return $tr.children( 'td' ).contents().length;
				} ),
				$groups = groups.filter( function ( $g ) {
					return $g.find( '.ronda-up-items' ).contents().length;
				} );

			return $( '<div class="ronda-up-grid"></div>' ).append(
				$( '<table class="ronda-up-table"></table>' ).append( $( '<tbody></tbody>' ).append( $rows ) ),
				$groups.length ? $( '<div class="ronda-up-side"></div>' ).append( $groups ) : null
			);
		}
	};
};

/** Acrescenta itens separados por " · " */
ronda.ui.addTo = function ( $el, nodes ) {
	if ( $el.contents().length ) {
		$el.append( document.createTextNode( ' · ' ) );
	}
	$el.append( nodes );
};

ronda.ui.checkbox = function ( label, checked ) {
	var id = ronda.ui.id( 'cb' ),
		$input = $( '<input type="checkbox">' ).attr( 'id', id ).prop( 'checked', !!checked );

	return {
		$element: $( '<div class="ronda-check"></div>' ).append( $input, $( '<label>' ).attr( 'for', id ).text( label ) ),
		$input: $input,
		isChecked: function () {
			return $input.prop( 'checked' );
		},
		setChecked: function ( value ) {
			$input.prop( 'checked', !!value );
			if ( $input.is( ':ui-button' ) ) {
				$input.button( 'refresh' );
			}
		}
	};
};

/**
 * Caixa de mensagem com as classes de estado do jQuery UI
 * @param {string} type 'highlight' (informação) ou 'error'
 */
ronda.ui.message = function ( type, content ) {
	return $( '<div class="ui-state-' + type + ' ui-corner-all ronda-msg"></div>' ).append(
		$( '<span class="ui-icon"></span>' ).addClass( type === 'error' ? 'ui-icon-alert' : 'ui-icon-info' ),
		content
	);
};

/**
 * Executa tarefas em sequência num diálogo, com barra de progresso e registro.
 * Uma tarefa { label, fn, critical } que falha e é crítica interrompe as seguintes.
 * @param {jQuery} $dlg
 * @param {jQuery} $progress <div class="ronda-progress">
 * @param {jQuery} $log <ul class="ronda-log">
 * @param {Function} [errorText] code → texto
 * @return {Function} run( tasks, onFinish( ok ) )
 */
ronda.ui.runner = function ( $dlg, $progress, $log, errorText ) {
	function log( type, text ) {
		$( '<li></li>' ).addClass( type ? 'ui-state-' + type : '' ).text( text ).appendTo( $log );
	}

	return function ( tasks, onFinish ) {
		var done = 0;

		ronda.ui.setBusy( $dlg, true );
		$dlg.find( ':input' ).prop( 'disabled', true );
		$progress.show().progressbar( { value: 0 } );

		( function next( i ) {
			var task = tasks[ i ];

			if ( !task ) {
				onFinish( true, log );
				return;
			}

			$.when( task.fn() ).then( function ( info ) {
				log( '', task.label + ( typeof info === 'string' ? ': ' + info : ronda.msg( 'core-feito' ) ) );
				return true;
			}, function ( code ) {
				log( 'error', task.label + ': ' + ( errorText ? errorText( code ) : code ) );
				return !task.critical;
			} ).then( function ( goOn ) {
				done++;
				$progress.progressbar( 'value', Math.round( done / tasks.length * 100 ) );
				if ( goOn ) {
					next( i + 1 );
				} else {
					onFinish( false, log );
				}
			} );
		}( 0 ) );
	};
};

/** Botões de fechamento depois de um processo: Fechar (recarrega se ok) e extras */
ronda.ui.finishButtons = function ( $dlg, ok, extra ) {
	$dlg.dialog( 'option', 'buttons', ( extra || [] ).concat( [ {
		text: ronda.msg( 'core-fechar' ),
		'class': extra && extra.length ? '' : 'ui-priority-primary ui-button-blue',
		click: function () {
			ronda.ui.close( $dlg );
			if ( ok && !ronda.inEditForm() ) {
				location.reload();
			}
		}
	} ] ) );
};

/**
 * Faixa dentro da barra (Usuário, Busca, PetScan, Informações, Listar), como o
 * submenu do FastButtons: abre e fecha; abrir uma fecha as outras.
 * build( $panel ) é chamado só na primeira vez.
 */
var panels = {};

/**
 * Alinha a divisória da coluna de ações dos painéis (Informações, meta-painel…)
 * com a divisória do grupo administrativo da barra: a coluna passa a começar
 * exatamente onde começa o grupo. Só quando o grupo está na primeira linha da
 * barra e a coluna está ao lado da tabela; nos demais casos volta ao normal.
 */
ronda.ui.alignPanels = function () {
	var bar = document.getElementById( 'ronda-toolbar' ),
		admin = bar && bar.querySelector( '.ronda-toolbar-admin' ),
		first = bar && bar.querySelector( '.ronda-toolbar-group' );

	if ( !bar ) {
		return;
	}
	$( bar ).find( '.ronda-up-side' ).each( function () {
		var side = this,
			table = side.parentNode.querySelector( '.ronda-up-table' ),
			a, s, w;

		side.style.flexBasis = '';
		if ( !admin || !first || admin === first || !table || !side.offsetParent ) {
			return;
		}
		a = admin.getBoundingClientRect();
		s = side.getBoundingClientRect();
		// Grupo administrativo numa segunda linha, ou coluna embaixo da tabela: sem alinhar
		if ( Math.abs( a.top - first.getBoundingClientRect().top ) > 4 || s.top > table.getBoundingClientRect().top + 4 ) {
			return;
		}
		w = s.right - a.left;
		if ( w > 120 && w < bar.clientWidth * 0.6 ) {
			side.style.flexBasis = w.toFixed( 2 ) + 'px';
		}
	} );
};

( function () {
	var pending = false;

	function schedule() {
		if ( !pending ) {
			pending = true;
			( window.requestAnimationFrame || setTimeout )( function () {
				pending = false;
				ronda.ui.alignPanels();
			} );
		}
	}
	// Os painéis são preenchidos depois que os dados chegam: observa a barra
	mw.hook( 'ronda.ready' ).add( function () {
		var bar = document.getElementById( 'ronda-toolbar' );

		if ( bar && window.MutationObserver ) {
			new MutationObserver( schedule ).observe( bar, { childList: true, subtree: true } );
		}
		$( window ).on( 'resize.ronda-align', schedule );
	} );
}() );

ronda.ui.togglePanel = function ( id, build ) {
	var $panel = panels[ id ];

	$.each( panels, function ( k, $p ) {
		if ( k !== id ) {
			$p.hide();
		}
	} );

	if ( $panel ) {
		$panel.toggle();
	} else {
		$panel = panels[ id ] = $( '<div class="ronda-userpanel"></div>' ).appendTo( '#ronda-toolbar' );
		build( $panel );
	}
	// O botão do painel aberto fica marcado
	$( '#ronda-toolbar .ronda-btn' ).removeClass( 'ronda-btn-on' );
	if ( $panel.is( ':visible' ) ) {
		$( '#ronda-toolbar .ronda-btn-' + id ).addClass( 'ronda-btn-on' );
	}
	return $panel;
};

/** Marca/desmarca um campo obrigatório. Retorna true se válido. */
ronda.ui.require = function ( $field, valid ) {
	$field.toggleClass( 'ui-state-error', !valid );
	return valid;
};

/** Evento de mudança do <select> nativo */
ronda.ui.onChange = function ( $el, fn ) {
	$el.on( 'change', fn );
};

/** Avisa quem observa o <select> depois de uma mudança feita por código */
ronda.ui.refreshSelect = function ( $select ) {
	$select.trigger( 'change' );
};

/**
 * <select> de motivos a partir dos grupos de ronda.reasons().
 * @param {Array} groups [ { label, options: [ { label, value } ] } ]
 * @param {Object} [suggested] { label, value } — vai num grupo "Motivo sugerido" e fica selecionado
 */
ronda.ui.reasonSelect = function ( groups, suggested ) {
	var $select = $( '<select></select>' ).append( $( '<option value=""></option>' ).text( ronda.msg( 'core-outro-motivo' ) ) );

	ronda.ui.fillReasons( $select, groups, suggested );
	return $select;
};

ronda.ui.fillReasons = function ( $select, groups, suggested ) {
	function option( o ) {
		return $( '<option></option>' ).val( o.value ).text( o.label );
	}

	$select.children().not( ':first' ).remove();

	if ( suggested ) {
		$( '<optgroup label="Motivo sugerido"></optgroup>' ).append( option( suggested ) ).appendTo( $select );
	}

	groups.forEach( function ( g ) {
		var $target = g.label ? $( '<optgroup></optgroup>' ).attr( 'label', g.label ) : $select;

		g.options.forEach( function ( o ) {
			if ( !suggested || o.value !== suggested.value ) {
				$target.append( option( o ) );
			}
		} );

		if ( g.label && $target.children().length ) {
			$select.append( $target );
		}
	} );

	$select.val( suggested ? suggested.value : '' );
	ronda.ui.refreshSelect( $select );
};

/**
 * Busca de motivos (jQuery UI autocomplete) num campo de texto: ao escolher
 * uma sugestão, seleciona a opção correspondente no <select> e limpa o campo.
 */
ronda.ui.reasonSearch = function ( $input, $select, groups ) {
	var all = [];

	groups.forEach( function ( g ) {
		g.options.forEach( function ( o ) {
			all.push( { label: o.label, value: o.value } );
		} );
	} );

	if ( $input.is( ':ui-autocomplete' ) ) {
		$input.autocomplete( 'destroy' );
	}

	$input.autocomplete( {
		minLength: 2,
		source: function ( request, response ) {
			var term = request.term.toLowerCase();

			response( all.filter( function ( o ) {
				return o.label.toLowerCase().indexOf( term ) !== -1;
			} ).slice( 0, 15 ) );
		},
		focus: function () {
			return false;
		},
		// Sem motivo principal escolhido, o motivo encontrado vira o principal; com um motivo
		// principal já escolhido, ele não é trocado: o motivo encontrado entra nos detalhes
		select: function ( e, ui ) {
			if ( $select.val() ) {
				$input.val( ui.item.value ).trigger( 'input' );
			} else {
				$select.val( ui.item.value );
				ronda.ui.refreshSelect( $select );
				$input.val( '' );
			}
			return false;
		}
	} );
};

/**
 * Conjunto pronto de campos de motivo: menu + botão "atualizar lista" +
 * detalhes (com busca nos motivos).
 * @param {string|string[]|Function} msgName Ex.: 'deletereason-dropdown'; ou função ( refresh ) → promessa de grupos
 * @param {Object|null} ctx
 * @param {Array} groups Resultado de ronda.reasons()
 * @param {Object} [suggested]
 * @return {Object} { $element, $select, $extra, value() }
 */
ronda.ui.reasonFields = function ( msgName, ctx, groups, suggested ) {
	var $select = ronda.ui.reasonSelect( groups, suggested ),
		$extra = ronda.ui.text( '', ronda.msg( 'core-detalhes-opcional-digite-para-buscar-um' ) ),
		$refresh = $( '<button type="button"></button>' )
			.text( ronda.msg( 'core-atualizar-lista-de-motivos' ) )
			.button( { icons: { primary: 'ui-icon-refresh' }, text: false } )
			.on( 'click', function () {
				$refresh.button( 'disable' );
				( typeof msgName === 'function' ? msgName( true ) : ronda.reasons( msgName, ctx, true ) ).then( function ( fresh ) {
					groups = fresh;
					ronda.ui.fillReasons( $select, fresh, suggested );
					ronda.ui.reasonSearch( $extra, $select, fresh );
					mw.notify( ronda.msg( 'core-lista-de-motivos-atualizada' ), { title: ronda.msg( 'core-nome' ) } );
				}, ronda.fail ).always( function () {
					$refresh.button( 'enable' );
				} );
			} ),
		$selectRow = ronda.ui.row( ronda.msg( 'core-motivo' ), $select ),
		// Limpa os detalhes (às vezes já vêm preenchidos, ex.: a observação da marcação de ER)
		$clear = $( '<button type="button"></button>' )
			.text( ronda.msg( 'core-limpar' ) )
			.attr( 'title', ronda.msg( 'core-limpar-detalhes' ) )
			.button( { icons: { primary: 'ui-icon-close' }, text: false } )
			.on( 'click', function () {
				$extra.val( '' ).trigger( 'input' ).trigger( 'focus' );
			} ),
		$extraRow = ronda.ui.row( ronda.msg( 'core-detalhes' ), $extra );

	$selectRow.append( $( '<div class="ronda-refresh"></div>' ).append( $refresh ) );
	$extraRow.append( $( '<div class="ronda-refresh"></div>' ).append( $clear ) );
	ronda.ui.reasonSearch( $extra, $select, groups );

	return {
		$element: $( '<div></div>' ).append( $selectRow, $extraRow ),
		$select: $select,
		$extra: $extra,
		value: function () {
			return ronda.joinReason( $select.val(), $extra.val() );
		}
	};
};

/**
 * <select> de durações a partir de mensagens "rótulo:valor,rótulo:valor"
 * (ipboptions, protect-expiry-options). Inclui a opção "other".
 * @param {string} msgName
 * @param {Array} [prepend] [ { value, label } ] opções extras no topo
 */
ronda.ui.expirySelect = function ( msgName, prepend ) {
	var $select = $( '<select></select>' );

	( prepend || [] ).forEach( function ( o ) {
		$( '<option></option>' ).val( o.value ).text( o.label ).appendTo( $select );
	} );

	if ( mw.message( msgName ).exists() ) {
		mw.message( msgName ).plain().split( ',' ).forEach( function ( pair ) {
			var idx = pair.lastIndexOf( ':' ),
				label = ( idx === -1 ? pair : pair.slice( 0, idx ) ).trim(),
				value = ( idx === -1 ? pair : pair.slice( idx + 1 ) ).trim();

			if ( label && value ) {
				$( '<option></option>' ).val( value ).text( label ).appendTo( $select );
			}
		} );
	}

	$( '<option value="other"></option>' ).text( ronda.msg( 'core-outra-duracao' ) ).appendTo( $select );
	return $select;
};

/** Valor efetivo de um par select de duração + campo livre */
ronda.ui.expiryValue = function ( $select, $other ) {
	return $select.val() === 'other' ? $other.val().trim() : $select.val();
};

ronda.ui.expiryLabel = function ( $select, $other ) {
	return $select.val() === 'other' ? $other.val().trim() : $select.find( 'option:selected' ).text();
};

/* ------------------------------------------------------------------ *
 * Barra de ferramentas
 * ------------------------------------------------------------------ */

function placeToolbar( $bar ) {
	var $target;

	if ( mw.config.get( 'skin' ) === 'vector-2022' && ( $target = $( '.vector-body-before-content' ) ).length ) {
		$target.before( $bar );
	} else if ( mw.config.get( 'skin' ) === 'minerva' && ( $target = $( '#bodyContent' ) ).length ) {
		// Modo móvel (Minerva), como no DiffTools
		$target.prepend( $bar );
	} else if ( ( $target = $( '#contentSub' ) ).length ) {
		$target.before( $bar );
	} else {
		mw.util.$content.before( $bar );
	}
}

/** Nome "Ronda" na barra, com o ícone do Commons (via Especial:Caminho de ficheiro) */
function brand() {
	var $brand = $( '<span class="ronda-brand"></span>' ).attr( 'title', ronda.msg( 'core-nome-versao', ronda.version ) );

	if ( ronda.config.icon ) {
		$( '<img alt="" height="18">' )
			.attr( 'src', mw.util.getUrl( 'Special:FilePath/' + ronda.config.icon, { width: 36 } ) )
			.on( 'error', function () {
				$( this ).remove();
			} )
			.appendTo( $brand );
	}
	return $brand.append( document.createTextNode( ronda.msg( 'core-nome' ) ) );
}

/*
 * Modo de teste (só para o desenvolvedor, ativado pelo console):
 *   ronda.modoTeste( true )   // liga e recarrega a página
 *   ronda.modoTeste( false )  // desliga e recarrega
 *   ronda.modoTeste()         // diz se está ligado
 * Ligado, a barra mostra todos os módulos em todos os domínios, inclusive os que
 * só abrem por outros (ER, ESR, Consenso), ignorando a disponibilidade de cada um.
 * Os direitos continuam valendo: a API recusa o que a conta não pode fazer.
 * Fica salvo neste navegador (localStorage), não na conta.
 */
ronda.TEST_USER = 'Little Sunshine';

ronda.modoTeste = function ( on ) {
	var allowed = mw.config.get( 'wgUserName' ) === ronda.TEST_USER;

	if ( on === undefined ) {
		return allowed && mw.storage.get( 'ronda-modo-teste' ) === '1';
	}
	if ( !allowed ) {
		// eslint-disable-next-line no-console
		console.warn( '[Ronda] ' + ronda.msg( 'core-teste-restrito' ) );
		return false;
	}
	if ( on ) {
		mw.storage.set( 'ronda-modo-teste', '1' );
	} else {
		mw.storage.remove( 'ronda-modo-teste' );
	}
	location.reload();
	return !!on;
};

ronda.renderToolbar = function () {
	var $group, $adminGroup, $bar,
		ctx = ronda.ctx,
		testing = ronda.modoTeste(),
		available = ronda.modules.filter( function ( m ) {
			if ( testing ) {
				return true;
			}
			// Módulos "hidden" só são abertos por outros (ex.: ER pelo Propor eliminação)
			if ( m.hidden ) {
				return false;
			}
			// Um módulo com erro fica fora da barra, sem derrubar os demais
			try {
				return m.isAvailable( ctx );
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.error( '[Ronda] módulo "' + m.id + '" ignorado:', e );
				return false;
			}
		} ).sort( function ( a, b ) {
			return ( a.order || 0 ) - ( b.order || 0 );
		} );

	if ( !available.length ) {
		return null;
	}

	// Dois grupos: edição/patrulha e ações administrativas (mod.admin)
	$group = $( '<div class="ronda-toolbar-group"></div>' );
	$adminGroup = $( '<div class="ronda-toolbar-group ronda-toolbar-admin"></div>' );

	available.forEach( function ( mod ) {
		$( '<button type="button"></button>' )
			.addClass( 'ronda-btn ronda-btn-' + mod.id + ( mod.admin ? ' ronda-btn-admin' : '' ) )
			.text( mod.label )
			.attr( 'title', mod.title || '' )
			.on( 'click', function () {
				if ( !testing ) {
					mod.open( ctx );
					return;
				}
				// No modo de teste o módulo pode abrir fora do contexto previsto: erro vai ao console
				try {
					mod.open( ctx );
				} catch ( e ) {
					// eslint-disable-next-line no-console
					console.error( '[Ronda] modo de teste — "' + mod.id + '":', e );
					mw.notify( ronda.msg( 'core-teste-erro', mod.label, e.message ), { title: ronda.msg( 'core-nome' ), type: 'error' } );
				}
			} )
			.one( 'mouseenter focus', function () {
				if ( ronda.config.prefetch !== false ) {
					prefetchModule( mod, ctx );
				}
			} )
			.appendTo( mod.admin ? $adminGroup : $group );
	} );

	$bar = $( '<div id="ronda-toolbar" class="ui-widget noprint"></div>' ).append(
		brand()
	);
	[ $group, $adminGroup ].forEach( function ( $g ) {
		if ( $g.children().length ) {
			$bar.append( $g );
		}
	} );
	placeToolbar( $bar );
	$bar.children( '.ronda-toolbar-group' ).buttonset();
	// No celular as dicas ficariam presas ao toque
	if ( !ronda.isMobile() ) {
		$bar.tooltip( { tooltipClass: 'ronda-tooltip' } );
	}

	return $bar;
};


/* ------------------------------------------------------------------ *
 * Preferências (como as do Twinkle): diálogo que salva a opção de
 * usuário userjs-ronda (JSON). window.rondaConfig continua valendo por cima.
 * ------------------------------------------------------------------ */

/** Temas visuais: [ id, nome ]; cada um é um CSS próprio (temas/ no repositório) */
ronda.THEMES = [
	[ '', 'Padrão (cartão com título)' ],
	[ 'original', 'Ronda original (jQuery UI)' ],
	[ 'previsao', 'Previsão do tempo' ],
	[ 'prova', 'Prova (preto e branco)' ],
	[ 'passaporte', 'Passaporte' ],
	[ 'volante', 'Volante de aposta' ],
	[ 'bula', 'Bula' ],
	[ 'bauhaus', 'Bauhaus' ],
	[ 'planta', 'Planta baixa' ],
	[ 'synthwave', 's y n t h w a v e' ],
	[ 'brutalismo', 'Brutalismo' ],
	[ 'relevo', 'Clássico em relevo' ],
	[ 'listrado', 'Retrô listrado' ],
	[ 'terminal', 'Terminal' ],
	[ 'metro', 'Metrô' ],
	[ 'ocorrencia', 'Boletim de ocorrência' ],
	[ 'onibus', 'Ônibus' ],
	[ 'web1', 'Web 1.0' ],
	[ 'azulejo', 'Azulejo português' ],
	[ 'newton', 'Newton' ],
	[ 'pregao', 'Pregão' ]
];

/**
 * Aplica o tema escolhido: a classe ronda-tema-<id> em <html> e o CSS do tema.
 * Tema desconhecido ou vazio = padrão (nada é carregado).
 */
ronda.applyTheme = function ( id ) {
	var known = ronda.THEMES.some( function ( t ) {
			return t[ 0 ] === id;
		} ),
		root = document.documentElement;

	ronda.THEMES.forEach( function ( t ) {
		if ( t[ 0 ] ) {
			root.classList.remove( 'ronda-tema-' + t[ 0 ] );
		}
	} );
	if ( !id || !known ) {
		return null;
	}
	root.classList.add( 'ronda-tema-' + id );
	if ( !ronda.themesLoaded ) {
		ronda.themesLoaded = {};
	}
	if ( !ronda.themesLoaded[ id ] ) {
		ronda.themesLoaded[ id ] = true;
		mw.loader.load( mw.config.get( 'wgScript' ) + '?' + $.param( {
			title: ronda.config.themePath + 'Ronda-tema-' + id + '.css',
			action: 'raw',
			ctype: 'text/css'
		} ), 'text/css' );
	}
	return id;
};

/** Campos do diálogo: [ caminho, rótulo, tipo, opções ] */
ronda.PREFS = [
	{ section: 'Geral' },
	[ 'theme', ronda.msg( 'core-tema' ), 'select', ronda.THEMES ],
	[ 'watchlist', ronda.msg( 'core-paginas-editadas' ), 'select', [ [ 'preferences', ronda.msg( 'core-seguir-as-minhas-preferencias-do-mediawiki' ) ],
		[ 'watch', ronda.msg( 'core-sempre-vigiar' ) ], [ 'nochange', ronda.msg( 'core-nao-mudar-a-vigilancia' ) ], [ 'unwatch', ronda.msg( 'core-deixar-de-vigiar' ) ] ] ],
	[ 'icon', ronda.msg( 'core-mostrar-o-icone-na-barra' ), 'icon' ],
	[ 'dryRun', ronda.msg( 'core-modo-de-simulacao-nada-e-gravado' ), 'check' ],
	[ 'prefetch', ronda.msg( 'core-pre-carregar-paineis' ), 'check' ],
	{ section: 'Reversão' },
	[ 'revert.patrol', ronda.msg( 'core-marcar-como-patrulhada-ao-reverter' ), 'check' ],
	[ 'revert.confirm', ronda.msg( 'core-pedir-confirmacao-antes-de-reverter-pelos' ), 'check' ],
	[ 'revert.vandalWarn', ronda.msg( 'core-abrir-o-avisar-depois-de-reverter' ), 'check' ],
	[ 'revert.links.diff', ronda.msg( 'core-links-rapidos-em-diffs-e-versoes' ), 'check' ],
	[ 'revert.links.history', ronda.msg( 'core-links-rapidos-no-historico' ), 'check' ],
	[ 'revert.links.contribs', ronda.msg( 'core-links-rapidos-nas-contribuicoes' ), 'check' ],
	[ 'revert.links.recentchanges', ronda.msg( 'core-links-rapidos-nas-mudancas-recentes' ), 'check' ],
	[ 'revert.links.watchlist', ronda.msg( 'core-links-rapidos-nas-paginas-vigiadas' ), 'check' ],
	{ section: 'Avisos' },
	[ 'warnings.window', ronda.msg( 'core-dias-considerados-para-sugerir-o-nivel' ), 'number' ],
	[ 'warnings.marker', ronda.msg( 'core-deixar-marca-oculta-depois-de-cada' ), 'check' ],
	[ 'warnings.confirm', ronda.msg( 'core-confirmar-aviso-repetido-em-24-h' ), 'check' ],
	{ section: 'Outros' },
	[ 'unlink.namespaces', ronda.msg( 'core-dominios-onde-o-desligar-remove-ligacoes' ), 'text' ],
	[ 'unlink.currentNamespace', ronda.msg( 'core-desligar-tambem-no-dominio-da-propria' ), 'check' ],
	[ 'maintenance.namespaces', ronda.msg( 'core-dominios-do-botao-manutencao-ex-0' ), 'list' ]
];

function getPath( obj, path ) {
	return path.split( '.' ).reduce( function ( o, k ) {
		return o === undefined || o === null ? undefined : o[ k ];
	}, obj );
}

function setPath( obj, path, value ) {
	var keys = path.split( '.' ),
		last = keys.pop();

	keys.reduce( function ( o, k ) {
		return ( o[ k ] = o[ k ] && typeof o[ k ] === 'object' ? o[ k ] : {} );
	}, obj )[ last ] = value;
}

ronda.prefs = { getPath: getPath, setPath: setPath };

ronda.openPreferences = function () {
	// Valores do diálogo: padrões + preferências salvas (sem o window.rondaConfig do common.js)
	var base = $.extend( true, {}, ronda.defaults, ronda.savedPrefs ),
		fields = [],
		$content = $( '<div></div>' ),
		$fs = null,
		saved = false,
		startTheme = ronda.config.theme || '',
		initial, $dlg;

	ronda.PREFS.forEach( function ( f ) {
		var path, label, type, cur, $input, cb;

		if ( f.section ) {
			$fs = $( '<fieldset class="ui-widget-content ui-corner-all"></fieldset>' )
				.append( $( '<legend></legend>' ).text( f.section ) )
				.appendTo( $content );
			return;
		}
		path = f[ 0 ];
		label = f[ 1 ];
		type = f[ 2 ];
		cur = getPath( base, path );

		if ( type === 'check' || type === 'icon' ) {
			cb = ronda.ui.checkbox( label, type === 'icon' ? !!cur : !!cur );
			$fs.append( cb.$element );
			fields.push( { path: path, type: type, read: cb.isChecked } );
			return;
		}
		if ( type === 'select' ) {
			$input = $( '<select></select>' );
			f[ 3 ].forEach( function ( o ) {
				$( '<option></option>' ).val( o[ 0 ] ).text( o[ 1 ] ).appendTo( $input );
			} );
			$input.val( cur );
			// Tema: prévia ao vivo; volta ao anterior se o diálogo for fechado sem salvar
			if ( path === 'theme' ) {
				$input.val( cur || '' ).on( 'change', function () {
					ronda.applyTheme( $( this ).val() );
				} );
			}
		} else {
			$input = type === 'number'
				? $( '<input type="number" min="1" class="ui-widget ui-widget-content ui-corner-all ronda-input">' ).val( cur )
				: ronda.ui.text( type === 'list' ? ( cur || [] ).join( ', ' ) : ( cur === undefined ? '' : String( cur ) ), '' );
		}
		$fs.append( ronda.ui.row( label, $input ) );
		fields.push( { path: path, type: type, read: function () {
			return $input.val();
		} } );
	} );

	function collect() {
		var prefs = { _v: ronda.PREFS_VERSION };

		fields.forEach( function ( f ) {
			var v = f.read();

			if ( f.type === 'number' ) {
				v = Math.max( 1, parseInt( v, 10 ) || 1 );
			} else if ( f.type === 'list' ) {
				v = String( v ).split( /[,\s|]+/ ).filter( Boolean ).map( Number ).filter( function ( n ) {
					return !isNaN( n );
				} );
			} else if ( f.type === 'icon' ) {
				v = v ? 'UserScript Ronda Icon.svg' : null;
			}
			setPath( prefs, f.path, v );
		} );
		return prefs;
	}

	function save() {
		var prefs = collect(),
			onlyTheme = JSON.stringify( $.extend( {}, prefs, { theme: '' } ) ) === JSON.stringify( $.extend( {}, initial, { theme: '' } ) );

		ronda.ui.setBusy( $dlg, true );
		// Sem o modo de simulação: preferências são sempre salvas de verdade
		$.Deferred( function ( d ) {
			mw.loader.using( 'mediawiki.api' ).then( function () {
				new mw.Api().postWithToken( 'csrf', {
					action: 'options',
					optionname: ronda.PREFS_OPTION,
					optionvalue: JSON.stringify( prefs )
				} ).then( d.resolve, d.reject );
			} );
		} ).then( function () {
			saved = true;
			// Só o tema mudou: aplica na hora, sem recarregar
			if ( onlyTheme ) {
				ronda.savedPrefs = prefs;
				ronda.config.theme = prefs.theme || '';
				ronda.applyTheme( ronda.config.theme );
				mw.notify( ronda.msg( 'core-tema-aplicado' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
				ronda.ui.close( $dlg );
				return;
			}
			mw.notify( ronda.msg( 'core-preferencias-salvas-a-pagina-sera-recarregada' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
			ronda.ui.close( $dlg );
			location.reload();
		}, function ( code, data ) {
			ronda.ui.setBusy( $dlg, false );
			ronda.fail( code, data );
		} );
	}

	function reset() {
		ronda.ui.setBusy( $dlg, true );
		new mw.Api().postWithToken( 'csrf', { action: 'options', change: ronda.PREFS_OPTION } ).then( function () {
			mw.notify( ronda.msg( 'core-preferencias-restauradas-para-o-padrao' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
			location.reload();
		}, function ( code, data ) {
			ronda.ui.setBusy( $dlg, false );
			ronda.fail( code, data );
		} );
	}

	if ( window.rondaConfig && Object.keys( window.rondaConfig ).length ) {
		$content.prepend( ronda.ui.message( 'highlight', $( '<span></span>' ).text(
			ronda.msg( 'core-o-seu-common-js-ou-o' )
		) ) );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'core-preferencias-do-ronda' ),
		width: 620,
		content: $content,
		buttons: [ { text: ronda.msg( 'core-salvar' ), 'class': 'ui-priority-primary ui-button-blue', click: save },
			{ text: ronda.msg( 'core-restaurar-padroes' ), click: reset },
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
	initial = collect();
	// Fechou sem salvar: volta o tema que estava antes da prévia
	$dlg.on( 'dialogclose', function () {
		if ( !saved ) {
			ronda.applyTheme( startTheme );
		}
	} );
};

/* ------------------------------------------------------------------ *
 * Inicialização
 *
 * Configuração pessoal opcional, no common.js, antes do carregamento:
 *   window.rondaConfig = { unlink: { namespaces: '0|14' } };
 * Para testar sem gravar nada na wiki:
 *   window.rondaConfig = { dryRun: true };
 * ------------------------------------------------------------------ */

/* Preferências salvas pelo diálogo (opção userjs-ronda) e, por cima, window.rondaConfig */
ronda.PREFS_OPTION = 'userjs-ronda';
/* Opções fixas da ferramenta: não vêm das preferências salvas, nem das gravadas
 * por versões antigas do diálogo (ex.: o sumário, usado para rastrear as edições) */
ronda.LOCKED_PREFS = [ 'summarySuffix', 'tag' ];
ronda.PREFS_VERSION = 2;
ronda.savedPrefs = ( function () {
	var prefs;

	try {
		prefs = JSON.parse( mw.user.options.get( ronda.PREFS_OPTION ) || '{}' ) || {};
	} catch ( e ) {
		prefs = {};
	}
	// Até a versão 1 das preferências, o diálogo gravava watchlist: 'nochange' (o padrão
	// de então) mesmo sem escolha; esse valor é descartado para valer o padrão novo
	if ( !prefs._v && prefs.watchlist === 'nochange' ) {
		delete prefs.watchlist;
	}
	delete prefs._v;
	ronda.LOCKED_PREFS.forEach( function ( key ) {
		delete prefs[ key ];
	} );
	return prefs;
}() );
/*
 * Avisos favoritos (Avisar e Reverter): lista de ids de ronda.catalog.warnings,
 * numa opção de usuário própria, para não se misturar com o diálogo de preferências.
 * Como as preferências, é gravada de verdade mesmo no modo de simulação.
 */
ronda.FAVORITES_OPTION = 'userjs-ronda-favoritos';
ronda.favorites = ( function () {
	var list;

	try {
		list = JSON.parse( mw.user.options.get( ronda.FAVORITES_OPTION ) || '[]' );
	} catch ( e ) {
		list = [];
	}
	if ( !Array.isArray( list ) ) {
		list = [];
	}

	return {
		has: function ( id ) {
			return list.indexOf( id ) !== -1;
		},
		list: function () {
			return list.slice();
		},
		/** Liga ou desliga um favorito e grava; retorna a promessa da gravação */
		toggle: function ( id ) {
			var i = list.indexOf( id ),
				value;

			if ( i === -1 ) {
				list.push( id );
			} else {
				list.splice( i, 1 );
			}
			value = JSON.stringify( list );
			if ( mw.user.options && mw.user.options.set ) {
				mw.user.options.set( ronda.FAVORITES_OPTION, value );
			}
			return new mw.Api().postWithToken( 'csrf', {
				action: 'options',
				optionname: ronda.FAVORITES_OPTION,
				optionvalue: value
			} );
		}
	};
}() );

/*
 * Marcações usadas recentemente (Manutenção): ids de ronda.catalog.maintenance,
 * da mais recente para a mais antiga, numa opção de usuário própria.
 */
ronda.RECENT_TAGS_OPTION = 'userjs-ronda-recentes';
ronda.recentTags = ( function () {
	var MAX = 8,
		list;

	try {
		list = JSON.parse( mw.user.options.get( ronda.RECENT_TAGS_OPTION ) || '[]' );
	} catch ( e ) {
		list = [];
	}
	if ( !Array.isArray( list ) ) {
		list = [];
	}

	return {
		list: function () {
			return list.slice();
		},
		/** Põe os ids no topo e grava (uma requisição) */
		push: function ( ids ) {
			var value;

			if ( !ids || !ids.length ) {
				return $.Deferred().resolve().promise();
			}
			list = ids.concat( list.filter( function ( id ) {
				return ids.indexOf( id ) === -1;
			} ) ).slice( 0, MAX );
			value = JSON.stringify( list );
			if ( mw.user.options && mw.user.options.set ) {
				mw.user.options.set( ronda.RECENT_TAGS_OPTION, value );
			}
			return new mw.Api().postWithToken( 'csrf', {
				action: 'options',
				optionname: ronda.RECENT_TAGS_OPTION,
				optionvalue: value
			} );
		}
	};
}() );

ronda.defaults = $.extend( true, {}, ronda.config );
$.extend( true, ronda.config, ronda.savedPrefs, window.rondaConfig || {} );

/*
 * Modo de simulação (window.rondaConfig = { dryRun: true }):
 * leituras vão normalmente para a API; nenhuma escrita (edição, eliminação,
 * bloqueio, proteção, moção) é enviada. Os parâmetros aparecem no console.
 */
if ( ronda.config.dryRun ) {
	ronda.api.postWithToken = function ( tokenType, params ) {
		var p = $.extend( {}, params );

		// eslint-disable-next-line no-console
		console.log( '[Ronda] SIMULAÇÃO — ' + p.action + ( p.title ? ' em "' + p.title + '"' : '' ), p );
		mw.notify(
			ronda.msg( 'core-simulacao-nada-foi-salvo', p.action, p.title || p.user ? ' — ' + ( p.title || p.user ) : '' ),
			{ title: ronda.msg( 'core-nome' ), type: 'warn' }
		);

		return $.Deferred().resolve( {
			edit: { result: 'Success', newrevid: 0 },
			'delete': {},
			block: {},
			protect: {},
			move: {},
			rollback: {},
			patrol: {}
		} ).promise();
	};
}

/* ------------------------------------------------------------------ *
 * Desfazer: toda edição gravada pelo Ronda entra num grupo (edições com
 * menos de 30 s entre si). Uma notificação oferece "Desfazer" para o grupo,
 * também depois de a página recarregar (o grupo fica na sessão do navegador).
 * Edições viram "desfazer" (undo/undoafter); páginas criadas são eliminadas
 * por quem pode eliminar e, para os demais, ficam listadas para pedir a
 * eliminação.
 * ------------------------------------------------------------------ */
var UNDO_KEY = 'ronda-desfazer',
	UNDO_GAP = 30 * 1000,
	UNDO_TTL = 10 * 60 * 1000,
	undoPaused = false,
	undoTimer = null;

function undoStore() {
	return mw.storage && mw.storage.session ? mw.storage.session : null;
}

function undoGroup() {
	var st = undoStore(),
		g = st && st.getObject( UNDO_KEY );

	return g && g.edits && !g.done && Date.now() - g.last < UNDO_TTL ? g : null;
}

function undoSave( g ) {
	var st = undoStore();

	if ( st ) {
		if ( g ) {
			st.setObject( UNDO_KEY, g );
		} else {
			st.remove( UNDO_KEY );
		}
	}
}

/** Resumo do grupo para a notificação: "3 edições: Fulano, Usuário(a) Discussão:X" */
function undoLabel( g ) {
	var titles = [];

	g.edits.forEach( function ( e ) {
		if ( titles.indexOf( e.title ) === -1 ) {
			titles.push( e.title );
		}
	} );
	return ronda.msg( g.edits.length === 1 ? 'core-desfazer-uma' : 'core-desfazer-varias', g.edits.length,
		titles.slice( 0, 3 ).join( ', ' ) + ( titles.length > 3 ? '…' : '' ) );
}

function undoRecord( e ) {
	var g = undoGroup(),
		now = Date.now();

	if ( !g || now - g.last > UNDO_GAP ) {
		g = { first: now, last: now, edits: [] };
	}
	g.last = now;
	g.edits.push( e );
	undoSave( g );
	ronda.undo.current = g;

	clearTimeout( undoTimer );
	undoTimer = setTimeout( function () {
		ronda.undo.offer();
	}, 1500 );
}

ronda.undo = {
	current: null,

	/** Notificação com o botão Desfazer para o grupo atual */
	offer: function ( afterLoad ) {
		var g = undoGroup(),
			$msg;

		// Depois de carregar a página, só uma vez (a página que recarregou após a ação)
		if ( !g || ( afterLoad && g.offeredAfterLoad ) ) {
			return;
		}
		if ( afterLoad ) {
			g.offeredAfterLoad = true;
			undoSave( g );
		}
		$msg = $( '<div></div>' ).append(
			$( '<span></span>' ).text( undoLabel( g ) + ' ' ),
			$( '<a href="#" role="button" class="ronda-undo"></a>' ).text( ronda.msg( 'core-desfazer' ) ).on( 'click', function ( ev ) {
				ev.preventDefault();
				$( this ).replaceWith( document.createTextNode( ronda.msg( 'core-desfazendo' ) ) );
				ronda.undo.run( g );
			} )
		);
		mw.notify( $msg, { title: ronda.msg( 'core-nome' ), tag: 'ronda-undo', autoHideSeconds: 'long' } );
	},

	/** Desfaz o grupo, da última edição para a primeira */
	run: function ( g ) {
		var done = 0,
			manual = [],
			failed = [];

		undoPaused = true;
		g.done = true;
		undoSave( null );

		return ronda.sequence( g.edits.slice().reverse(), function ( e ) {
			var req;

			if ( e.created ) {
				if ( !ronda.can( 'delete' ) ) {
					manual.push( e.title );
					return $.Deferred().resolve().promise();
				}
				req = ronda.post( { action: 'delete', title: e.title, reason: ronda.msg( 'core-desfazer-motivo-criacao' ) } );
			} else {
				req = ronda.post( { action: 'edit', title: e.title, undo: e.newrevid, undoafter: e.oldrevid,
					nocreate: true, summary: ronda.msg( 'core-desfazer-resumo' ) } );
			}
			return req.then( function () {
				done++;
			}, function () {
				failed.push( e.title );
				return $.Deferred().resolve().promise();
			} );
		} ).always( function () {
			var cur = ronda.ctx && ronda.ctx.page,
				$m = $( '<div></div>' ).append( $( '<p></p>' ).text( ronda.msg( 'core-desfeitas', done ) ) );

			undoPaused = false;
			if ( failed.length ) {
				$m.append( $( '<p></p>' ).text( ronda.msg( 'core-desfazer-falhou', failed.join( ', ' ) ) ) );
			}
			if ( manual.length ) {
				$m.append( $( '<p></p>' ).text( ronda.msg( 'core-desfazer-criadas', manual.join( ', ' ) ) ) );
			}
			mw.notify( $m, { title: ronda.msg( 'core-nome' ), type: failed.length || manual.length ? 'warn' : 'success',
				autoHide: !( failed.length || manual.length ), tag: 'ronda-undo' } );
			if ( done && cur && g.edits.some( function ( e ) {
				return e.title === cur;
			} ) ) {
				setTimeout( function () {
					location.reload();
				}, 1200 );
			}
		} );
	}
};

/** Toda edição bem-sucedida pela API entra no grupo de Desfazer */
( function () {
	var post = api.postWithToken;

	api.postWithToken = function ( type, params ) {
		var req = post.apply( this, arguments );

		if ( !undoPaused && params && params.action === 'edit' ) {
			req.then( function ( res ) {
				var e = res && res.edit;

				if ( e && e.result === 'Success' && e.newrevid && !e.nochange ) {
					undoRecord( {
						title: e.title || params.title,
						oldrevid: e.oldrevid || 0,
						newrevid: e.newrevid,
						created: e[ 'new' ] === true || e[ 'new' ] === ''
					} );
				}
			} );
		}
		return req;
	};
}() );

/** Modo móvel (Minerva / MobileFrontend) */
ronda.isMobile = function () {
	return mw.config.get( 'skin' ) === 'minerva' || document.body.classList.contains( 'mw-mf' );
};

/**
 * Especial:MobileDiff/<revid> (diff do modo móvel): completa o contexto com a
 * página, a versão anterior e o autor, para que Reverter e Avisar funcionem.
 */
function resolveMobileDiff( ctx ) {
	var m = /^MobileDiff\/(?:(\d+)\.\.\.)?(\d+)/.exec( mw.config.get( 'wgTitle' ) || '' );

	if ( ctx.special !== 'MobileDiff' || !m ) {
		return $.Deferred().resolve( ctx ).promise();
	}

	return api.get( {
		action: 'query',
		revids: m[ 2 ],
		prop: 'revisions|info',
		rvprop: 'ids|user'
	} ).then( function ( data ) {
		var p = ( data.query.pages || [] )[ 0 ] || {},
			rev = ( p.revisions || [] )[ 0 ] || {};

		return $.extend( ctx, {
			type: 'diff',
			ns: p.ns,
			page: p.title,
			title: ( p.title || '' ).replace( /^[^:]+:/, p.ns ? '' : '$&' ),
			exists: !p.missing,
			newId: rev.revid,
			oldId: m[ 1 ] ? Number( m[ 1 ] ) : rev.parentid,
			targetUser: rev.user || null
		} );
	}, function () {
		return ctx;
	} );
}

/** Torna um elemento clicável por teclado também (Enter e Espaço) */
function pressable( $el, fn ) {
	return $el.attr( { role: 'button', tabindex: 0 } ).on( 'click', fn ).on( 'keydown', function ( e ) {
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			fn( e );
		}
	} );
}

/**
 * Controles da barra. O nome "Ronda" abre o meta-painel (versão, novidades, opções
 * rápidas, preferências, documentação, informar erro). No menu de ações fica só o
 * link para mostrar/ocultar a barra; sem barra nesta página, as preferências ficam lá.
 * No celular (sem menu de ações), a barra recolhida se expande pelo próprio nome.
 */
function addControls( $bar ) {
	var collapsed = mw.storage.get( 'ronda-hidden' ) === '1',
		toggleLink = $bar && mw.util.addPortletLink( 'p-cactions', '#', ronda.msg( 'core-nome' ), 'ca-ronda-toggle', ronda.msg( 'core-exibir-ocultar-a-barra-do-ronda' ) ),
		prefsLink = !$bar && mw.util.addPortletLink( 'p-cactions', '#', ronda.msg( 'core-preferencias-do-ronda' ), 'ca-ronda-prefs', ronda.msg( 'core-configurar-o-ronda' ) ),
		inBar = !toggleLink;

	function setCollapsed( value ) {
		collapsed = value;
		mw.storage.set( 'ronda-hidden', value ? '1' : '0' );
		if ( inBar ) {
			$bar.toggleClass( 'ronda-collapsed', value );
		} else {
			$bar.toggle( !value );
		}
	}

	if ( prefsLink ) {
		$( prefsLink ).on( 'click', function ( e ) {
			e.preventDefault();
			ronda.openPreferences();
		} );
	}
	if ( !$bar ) {
		return;
	}

	ronda.toggleBar = function () {
		setCollapsed( !collapsed );
	};
	ronda.barInMenu = !inBar;

	if ( toggleLink ) {
		$bar.toggle( !collapsed );
		$( toggleLink ).on( 'click', function ( e ) {
			e.preventDefault();
			setCollapsed( !collapsed );
		} );
	} else {
		$bar.toggleClass( 'ronda-collapsed', collapsed );
	}

	pressable( $bar.find( '.ronda-brand' ).addClass( 'ronda-brand-toggle' )
		.attr( 'title', ronda.msg( 'core-meta-dica', ronda.version ) )
		.append( $( '<span class="ronda-brand-caret" aria-hidden="true"></span>' ).text( ' ▾' ) ), function () {
		// Recolhida (celular): o nome expande a barra
		if ( inBar && collapsed ) {
			setCollapsed( false );
			return;
		}
		ronda.openMeta();
	} );
}

/* ------------------------------------------------------------------ *
 * Meta-painel: versão, novidades, opções rápidas e links do Ronda
 * ------------------------------------------------------------------ */

ronda.NEWS_OPTION = 'userjs-ronda-novidades';  // última versão cujas novidades foram vistas
ronda.STRIPS_OPTION = 'userjs-ronda-faixas';   // 'off' = nunca mais abrir faixas sozinho
ronda.REPORT_PAGE = 'Usuário Discussão:Little Sunshine/Ronda';
ronda.CHANGELOG_PAGE = 'Usuário:Little Sunshine/Ronda/Changelog';
ronda.REPO_URL = 'https://github.com/LittSun/Ronda';

/*
 * Novidades da versão atual, em frases curtas (aparecem no meta-painel e, uma vez
 * por versão, na faixa que se abre sozinha). Atualize junto com ronda.version.
 */
ronda.news = [
	'Avisar e Reverter: os avisos de nome impróprio ficam esmaecidos, com "já notificado", quando o usuário já foi notificado'
];

/** Grava uma opção de usuário (também na simulação, como as preferências) */
function saveOption( name, value ) {
	if ( mw.user.options && mw.user.options.set ) {
		mw.user.options.set( name, value );
	}
	return new mw.Api().postWithToken( 'csrf', { action: 'options', optionname: name, optionvalue: value } );
}

function stripsOff() {
	return mw.user.options.get( ronda.STRIPS_OPTION ) === 'off';
}

/** Link "Não mostrar mais": desliga todas as faixas que se abrem sozinhas */
function notAgain( after ) {
	return pressable( $( '<a href="#" class="ronda-not-again"></a>' ).text( ronda.msg( 'core-nao-mostrar-mais' ) )
		.attr( 'title', ronda.msg( 'core-nao-mostrar-mais-dica' ) ), function ( e ) {
		e.preventDefault();
		saveOption( ronda.STRIPS_OPTION, 'off' );
		saveOption( ronda.NEWS_OPTION, ronda.version );
		after();
	} );
}

/* Erros recentes (para o relato): exceções que passam pelo Ronda e falhas da API */
ronda.errors = [];

function noteError( text ) {
	ronda.errors.push( new Date().toISOString().slice( 11, 19 ) + ' ' + String( text ).slice( 0, 300 ) );
	if ( ronda.errors.length > 10 ) {
		ronda.errors.shift();
	}
}

window.addEventListener( 'error', function ( e ) {
	if ( /Ronda/i.test( ( e.filename || '' ) + ( ( e.error && e.error.stack ) || '' ) ) ) {
		noteError( e.message );
	}
} );

( function () {
	var fail = ronda.fail;

	ronda.fail = function ( code, data ) {
		noteError( 'API: ' + ( code || '?' ) + ( data && data.error && data.error.info ? ' — ' + data.error.info : '' ) );
		return fail.apply( this, arguments );
	};
}() );

/** Grava uma ou mais preferências do diálogo (caminho → valor) e recarrega */
function savePrefs( changes ) {
	var prefs = $.extend( true, { _v: ronda.PREFS_VERSION }, ronda.savedPrefs );

	Object.keys( changes ).forEach( function ( path ) {
		setPath( prefs, path, changes[ path ] );
	} );
	return saveOption( ronda.PREFS_OPTION, JSON.stringify( prefs ) ).then( function () {
		// O tema muda na hora; as demais opções precisam recarregar a página
		if ( Object.keys( changes ).join() === 'theme' ) {
			ronda.savedPrefs = prefs;
			ronda.config.theme = changes.theme;
			ronda.applyTheme( changes.theme );
			mw.notify( ronda.msg( 'core-tema-aplicado' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
			return;
		}
		mw.notify( ronda.msg( 'core-preferencias-salvas-a-pagina-sera-recarregada' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
		location.reload();
	}, ronda.fail );
}

/** Informações técnicas para o relato de erro */
function environment() {
	var ctx = ronda.ctx || {};

	return [
		[ 'Versão', ronda.version ],
		[ 'Página', mw.config.get( 'wgPageName' ) + ( mw.config.get( 'wgAction' ) !== 'view' ? ' (' + mw.config.get( 'wgAction' ) + ')' : '' ) ],
		[ 'Contexto', ctx.type || '?' ],
		[ 'Tema', mw.config.get( 'skin' ) || '?' ],
		[ 'Simulação', ronda.config.dryRun ? 'sim' : 'não' ],
		[ 'Navegador', navigator.userAgent ],
		[ 'Erros recentes', ronda.errors.length ? ronda.errors.join( ' / ' ) : 'nenhum' ]
	];
}

/** Diálogo "Informar erro": abre uma seção nova na página de relatos */
ronda.openReport = function () {
	var $title = ronda.ui.text( '', ronda.msg( 'core-relato-titulo-exemplo' ) ),
		$text = ronda.ui.textarea( '', ronda.msg( 'core-relato-texto-exemplo' ) ).attr( 'rows', 6 ),
		cbEnv = ronda.ui.checkbox( ronda.msg( 'core-relato-incluir-ambiente' ), true ),
		env = environment(),
		$env = $( '<ul class="ronda-report-env"></ul>' ).append( env.map( function ( e ) {
			return $( '<li></li>' ).append( $( '<b></b>' ).text( e[ 0 ] + ': ' ), document.createTextNode( e[ 1 ] ) );
		} ) ),
		$dlg;

	cbEnv.$input.on( 'change', function () {
		$env.toggle( cbEnv.isChecked() );
	} );

	function send() {
		var title = $title.val().trim(),
			text = $text.val().trim(),
			ok = ronda.ui.require( $title, !!title );

		ok = ronda.ui.require( $text, !!text ) && ok;
		if ( !ok ) {
			return;
		}
		ronda.ui.setBusy( $dlg, true );
		ronda.post( {
			action: 'edit',
			title: ronda.REPORT_PAGE,
			section: 'new',
			sectiontitle: title,
			// Os dados técnicos fazem parte da mensagem: a assinatura vem depois deles
			text: text + ( cbEnv.isChecked() ? '\n\n' + env.map( function ( e ) {
				return '* ' + e[ 0 ] + ': <nowiki>' + String( e[ 1 ] ).replace( /<\/?nowiki>/gi, '' ) + '</nowiki>';
			} ).join( '\n' ) + '\n\n~~' + '~~' : ' ~~' + '~~' ),
			summary: ronda.msg( 'core-relato-resumo', title )
		} ).then( function () {
			ronda.ui.close( $dlg );
			mw.notify( $( '<span></span>' ).append( document.createTextNode( ronda.msg( 'core-relato-enviado' ) ),
				$( '<a></a>' ).attr( 'href', mw.util.getUrl( ronda.REPORT_PAGE ) ).text( ronda.REPORT_PAGE ) ),
			{ type: 'success', title: ronda.msg( 'core-nome' ) } );
		}, function ( code, data ) {
			ronda.ui.setBusy( $dlg, false );
			ronda.fail( code, data );
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'core-relato-titulo' ),
		width: 600,
		content: $( '<div></div>' ).append(
			ronda.ui.message( 'highlight', $( '<span></span>' ).append(
				document.createTextNode( ronda.msg( 'core-relato-explicacao' ) ),
				$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( ronda.REPORT_PAGE ) ).text( ronda.REPORT_PAGE )
			) ),
			ronda.ui.row( ronda.msg( 'core-relato-assunto' ), $title ),
			ronda.ui.row( ronda.msg( 'core-relato-o-que-aconteceu' ), $text ),
			cbEnv.$element,
			$env
		),
		buttons: [ { text: ronda.msg( 'core-relato-enviar' ), 'class': 'ui-priority-primary ui-button-blue', click: send },
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
	$title.trigger( 'focus' );
};

/** Faixa do meta-painel: versão, novidades, opções rápidas e links */
ronda.openMeta = function () {
	markNewsRead();

	return ronda.ui.togglePanel( 'meta', function ( $panel ) {
		var L = ronda.ui.panelLayout(),
			$version = L.row( ronda.msg( 'core-meta-versao' ) ),
			$news = L.row( ronda.msg( 'core-meta-novidades' ) ),
			$quick = L.row( ronda.msg( 'core-meta-rapido' ) ),
			$links = L.group( ronda.msg( 'core-nome' ) ),
			LINK_KEYS = [ 'diff', 'history', 'contribs', 'recentchanges', 'watchlist' ],
			links = ronda.config.revert.links || {},
			quick = [
				[ 'dryRun', ronda.msg( 'core-modo-de-simulacao' ), !!ronda.config.dryRun ],
				[ 'prefetch', ronda.msg( 'core-meta-segundo-plano' ), ronda.config.prefetch !== false ],
				[ 'revert.links', ronda.msg( 'core-meta-links-rapidos' ), LINK_KEYS.every( function ( k ) {
					return links[ k ] !== false;
				} ) ]
			];

		function item( text, fn, main ) {
			$links.append( $( '<div></div>' ).append( pressable( $( '<a href="#"></a>' ).text( text ).toggleClass( 'ronda-up-main', !!main ), function ( e ) {
				e.preventDefault();
				fn();
			} ) ) );
		}

		function page( href, text, ext ) {
			$links.append( $( '<div></div>' ).append( $( ext ? '<a target="_blank" rel="noopener"></a>' : '<a></a>' ).attr( 'href', href ).text( text ) ) );
		}

		$version.append( $( '<b></b>' ).text( ronda.version ), document.createTextNode( ' · ' ),
			$( '<a></a>' ).attr( 'href', mw.util.getUrl( ronda.CHANGELOG_PAGE ) + '#' + ronda.version ).text( ronda.msg( 'core-meta-novidades-desta-versao' ) ) );
		$news.append( $( '<ul class="ronda-meta-news"></ul>' ).append( ronda.news.map( function ( n ) {
			return $( '<li></li>' ).text( n );
		} ) ) );

		quick.forEach( function ( q ) {
			var cb = ronda.ui.checkbox( q[ 1 ], q[ 2 ] );

			cb.$element.addClass( 'ronda-meta-quick' );
			cb.$input.on( 'change', function () {
				var changes = {},
					on = cb.isChecked();

				if ( q[ 0 ] === 'revert.links' ) {
					LINK_KEYS.forEach( function ( k ) {
						changes[ 'revert.links.' + k ] = on;
					} );
				} else {
					changes[ q[ 0 ] ] = on;
				}
				$quick.find( 'input' ).prop( 'disabled', true );
				savePrefs( changes );
			} );
			$quick.append( cb.$element );
		} );
		// Tema: troca na hora, sem recarregar
		( function () {
			var $sel = $( '<select class="ronda-meta-theme"></select>' );

			ronda.THEMES.forEach( function ( t ) {
				$( '<option></option>' ).val( t[ 0 ] ).text( t[ 1 ] ).appendTo( $sel );
			} );
			$sel.val( ronda.config.theme || '' ).on( 'change', function () {
				ronda.applyTheme( $sel.val() );
				savePrefs( { theme: $sel.val() } );
			} );
			$quick.append( $( '<label class="ronda-meta-quick"></label>' ).append(
				document.createTextNode( ronda.msg( 'core-meta-tema' ) + ' ' ), $sel ) );
		}() );

		item( ronda.msg( 'core-meta-preferencias' ), ronda.openPreferences, true );
		page( mw.util.getUrl( ronda.DOC_PAGE ), ronda.msg( 'core-meta-documentacao' ) );
		page( mw.util.getUrl( ronda.CHANGELOG_PAGE ), ronda.msg( 'core-meta-historico' ) );
		item( ronda.msg( 'core-meta-informar-erro' ), ronda.openReport, true );
		page( ronda.REPO_URL, ronda.msg( 'core-meta-github' ), true );
		if ( ronda.toggleBar && !ronda.barInMenu ) {
			item( ronda.msg( 'core-recolher-a-barra' ), ronda.toggleBar );
		}

		$panel.addClass( 'ronda-meta' ).append( L.build() );
	} );
};

/*
 * Novidades depois de uma atualização:
 * - uma faixa só com as novidades se abre sozinha uma vez por versão (NEWS_OPTION);
 * - o selo "novo" fica no nome "Ronda" até a pessoa abrir o meta-painel ou o histórico
 *   (NEWS_READ_OPTION), mesmo que a faixa tenha sido fechada sem ler.
 * "Não mostrar mais" desliga as faixas; o selo continua avisando das versões novas.
 */
ronda.NEWS_READ_OPTION = 'userjs-ronda-novidades-lidas';

/** Quem ainda não conhece o Ronda vê primeiro as boas-vindas, não as novidades */
function knowsRonda() {
	return !!( mw.user.options.get( ronda.NEWS_OPTION ) || mw.user.options.get( ronda.NEWS_READ_OPTION ) ||
		mw.user.options.get( ronda.WELCOME_OPTION ) || mw.user.options.get( ronda.PREFS_OPTION ) );
}

function markNewsRead() {
	var $badge = $( '#ronda-toolbar .ronda-news-badge' );

	if ( $badge.length ) {
		$badge.remove();
		saveOption( ronda.NEWS_READ_OPTION, ronda.version );
	}
}

function showNews( $bar ) {
	var $strip;

	if ( !$bar || mw.user.isAnon() || !knowsRonda() ) {
		return;
	}
	if ( mw.user.options.get( ronda.NEWS_READ_OPTION ) !== ronda.version ) {
		$bar.find( '.ronda-brand-caret' ).before( $( '<span class="ronda-news-badge"></span>' )
			.text( ronda.msg( 'core-novidades-selo' ) ).attr( 'title', ronda.msg( 'core-novidades-selo-dica', ronda.version ) ) );
	}
	if ( stripsOff() || mw.user.options.get( ronda.NEWS_OPTION ) === ronda.version ||
		$bar.hasClass( 'ronda-collapsed' ) || $bar.css( 'display' ) === 'none' ) {
		return;
	}
	saveOption( ronda.NEWS_OPTION, ronda.version );

	$strip = ronda.ui.togglePanel( 'news', function ( $panel ) {
		$panel.addClass( 'ronda-news ui-state-highlight ui-corner-all' ).append(
			$( '<b></b>' ).text( ronda.msg( 'core-novidades-da-versao', ronda.version ) ),
			$( '<ul class="ronda-meta-news"></ul>' ).append( ronda.news.map( function ( n ) {
				return $( '<li></li>' ).text( n );
			} ) ),
			$( '<div class="ronda-news-actions"></div>' ).append(
				$( '<a></a>' ).attr( 'href', mw.util.getUrl( ronda.CHANGELOG_PAGE ) + '#' + ronda.version )
					.text( ronda.msg( 'core-novidades-historico' ) )
					.on( 'click', markNewsRead ),
				document.createTextNode( ' · ' ),
				pressable( $( '<a href="#"></a>' ).text( ronda.msg( 'core-fechar' ) ), function ( e ) {
					e.preventDefault();
					$strip.remove();
				} ),
				document.createTextNode( ' · ' ),
				notAgain( function () {
					$strip.remove();
				} )
			)
		);
	} );
}

ronda.meta = { environment: environment, showNews: showNews };

/*
 * Boas-vindas: uma faixa na barra, uma vez por conta, que mostra onde ficam as
 * preferências. Some ao clicar em qualquer ação e não volta (opção de usuário
 * própria, gravada mesmo no modo de simulação). Quem já salvou preferências não a vê.
 */
ronda.WELCOME_OPTION = 'userjs-ronda-boasvindas';
ronda.DOC_PAGE = 'Usuário:Little Sunshine/Ronda';

function addWelcome( $bar ) {
	var $strip;

	if ( !$bar || mw.user.isAnon() || mw.user.options.get( ronda.WELCOME_OPTION ) ||
		mw.user.options.get( ronda.PREFS_OPTION ) || stripsOff() ) {
		return;
	}
	// Barra recolhida: fica para a próxima vez em que ela estiver aberta
	if ( $bar.hasClass( 'ronda-collapsed' ) || $bar.css( 'display' ) === 'none' ) {
		return;
	}
	function dismiss() {
		$strip.remove();
		saveOption( ronda.WELCOME_OPTION, '1' );
		// Quem acabou de conhecer o Ronda não precisa das novidades desta versão
		saveOption( ronda.NEWS_OPTION, ronda.version );
		saveOption( ronda.NEWS_READ_OPTION, ronda.version );
	}

	$strip = $( '<div class="ronda-welcome ui-state-highlight ui-corner-all"></div>' ).append(
		$( '<p></p>' ).text( ronda.msg( 'core-boasvindas-texto' ) + ' ' + ronda.msg( 'core-boasvindas-onde-meta' ) ),
		$( '<div class="ronda-welcome-actions"></div>' ).append(
			$( '<button type="button" class="ui-priority-primary ui-button-blue"></button>' )
				.text( ronda.msg( 'core-boasvindas-abrir' ) )
				.button()
				.on( 'click', function () {
					dismiss();
					ronda.openPreferences();
				} ),
			$( '<a target="_blank"></a>' )
				.attr( 'href', mw.util.getUrl( ronda.DOC_PAGE ) )
				.text( ronda.msg( 'core-boasvindas-documentacao' ) ),
			$( '<button type="button"></button>' )
				.text( ronda.msg( 'core-boasvindas-entendi' ) )
				.button()
				.on( 'click', dismiss ),
			notAgain( function () {
				$strip.remove();
			} )
		)
	).appendTo( $bar );

}

ronda.welcome = { show: addWelcome };

/*
 * Cache de promessas por chave: a primeira chamada busca, as seguintes reaproveitam.
 * Uma busca que falha sai do cache, para ser tentada de novo.
 */
var memoCache = {};

ronda.memo = function ( key, fn ) {
	if ( !memoCache[ key ] ) {
		memoCache[ key ] = fn();
		memoCache[ key ].then( null, function () {
			delete memoCache[ key ];
		} );
	}
	return memoCache[ key ];
};

ronda.forget = function ( key ) {
	delete memoCache[ key ];
};

/*
 * Pré-carregamento: módulos com prefetch( ctx ) (os painéis Usuário e Informações)
 * buscam os dados em segundo plano, quando o navegador fica ocioso, para o painel
 * abrir pronto. Também ao passar o mouse (ou o foco) sobre o botão.
 * Desligável com window.rondaConfig = { prefetch: false } ou nas preferências.
 */
function prefetchModule( mod, ctx ) {
	try {
		if ( mod.prefetch && mod.isAvailable( ctx ) ) {
			mod.prefetch( ctx );
		}
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.warn( '[Ronda] pré-carregamento de ' + mod.id, e );
	}
}

function schedulePrefetch( ctx ) {
	if ( ronda.config.prefetch === false ) {
		return;
	}
	setTimeout( function () {
		var idle = window.requestIdleCallback || function ( fn ) {
			return setTimeout( fn, 0 );
		};

		idle( function () {
			ronda.modules.forEach( function ( mod ) {
				prefetchModule( mod, ctx );
			} );
		}, { timeout: 4000 } );
	}, 1500 );
}

ronda.prefetchModule = prefetchModule;

/** Monta a barra; chamado quando o documento está pronto (depois de todos os módulos) */
ronda.start = function () {
	if ( ronda.started ) {
		return;
	}
	ronda.started = true;

	mw.user.getRights().then( function ( rights ) {
		return resolveMobileDiff( ronda.buildContext( rights ) );
	} ).then( function ( ctx ) {
		var $bar;

		ronda.ctx = ctx;

		if ( mw.util.getParamValue( 'printable' ) === 'yes' ) {
			return;
		}

		ronda.applyTheme( ronda.config.theme );

		$bar = ronda.renderToolbar();

		if ( $bar && ronda.config.dryRun ) {
			$bar.find( '.ronda-brand' ).after(
				$( '<span class="ui-state-highlight ui-corner-all ronda-dry"></span>' )
					.text( ronda.msg( 'core-simulacao' ) )
					.attr( 'title', ronda.msg( 'core-nada-e-gravado-na-wiki-as' ) )
			);
		}
		if ( $bar && ronda.modoTeste() ) {
			$bar.find( '.ronda-brand' ).after(
				$( '<span class="ui-state-error ui-corner-all ronda-dry ronda-teste"></span>' )
					.text( ronda.msg( 'core-teste' ) )
					.attr( 'title', ronda.msg( 'core-teste-dica' ) )
			);
		}
		if ( $bar && ronda.isMobile() ) {
			$bar.addClass( 'ronda-mobile' );
		}

		addControls( $bar );
		addWelcome( $bar );
		showNews( $bar );
		// Depois de uma ação que recarregou a página, o Desfazer continua disponível
		ronda.undo.offer( true );
		if ( $bar ) {
			schedulePrefetch( ctx );
		}

		mw.hook( 'ronda.ready' ).fire( ronda );
	} );
};

// jQuery 3 executa isto depois do código síncrono: todos os arquivos já se registraram
$( function () {
	ronda.start();
} );

}() );

/* ===== Ronda-catalogo.js ===== */
/**
 * Ronda — catálogo de marcações de manutenção
 *
 * Portado de MediaWiki:Gadget-fastbuttons.js/buttonsList.js (fastb.buttons.maintenance).
 * Campos:
 *   id          identificador interno
 *   group       grupo (quadro) no diálogo de Manutenção
 *   label       texto da opção
 *   title       dica
 *   template    nome real da predefinição depois de salva (usado para detectar;
 *               os redirecionamentos para ela são resolvidos pela API)
 *   action      código inserido (pode ter subst:)
 *   extra       texto fixo acrescentado antes de }} (ex.: data)
 *   params      [ { name, label, required, external } ] — campos exibidos ao marcar;
 *               external = não vai para a predefinição (uso em etapa seguinte)
 *   groupable   false = nunca entra em {{Múltiplos problemas}}
 *   placement   'fim' = antes das categorias, em vez do topo
 *   warn        predefinição Aviso-<warn> enviada ao criador após marcar
 *   sameEditor  só avisa se o criador for o único editor
 *   listing     após marcar, abre seção em WP:Páginas precisando de manutenção
 */
( function ( ronda ) {
'use strict';

ronda.catalog = ronda.catalog || {};

ronda.catalog.multipleIssues = 'Múltiplos problemas';

ronda.catalog.maintenance = [
	{ id: 's-fontes', group: 'Fontes e referências', label: 'Sem fontes', template: 'Sem-fontes', action: 'subst:s-fontes',
		title: 'Página não cita nenhuma fonte ou referência', warn: 'cite fonte', sameEditor: true },
	{ id: 's-fontes-bpv', group: 'Fontes e referências', label: 'Sem fontes BPV', template: 'Sem-fontes-bpv', action: 'subst:s-fontes-bpv',
		title: 'Biografia de pessoa viva que não cita nenhuma fonte', warn: 'cite fonte', sameEditor: true },
	{ id: 's-notas', group: 'Fontes e referências', label: 'Sem notas', template: 'Sem notas', action: 'subst:s-notas',
		title: 'Existem fontes no final da página, mas não são citadas no corpo do artigo' },
	{ id: 's-notas-bpv', group: 'Fontes e referências', label: 'Sem notas BPV', template: 'Sem notas BPV', action: 'subst:s-notas-bpv',
		title: 'Biografia de pessoa viva com fontes no final, mas não citadas no corpo' },
	{ id: 'm-notas', group: 'Fontes e referências', label: 'Mais notas', template: 'Mais notas', action: 'subst:m-notas',
		title: 'Página cita fontes confiáveis, mas não cobre todo o texto' },
	{ id: 'm-fontes-bpv', group: 'Fontes e referências', label: 'Mais fontes BPV', template: 'Mais fontes-bpv', action: 'subst:m-fontes-bpv',
		title: 'Biografia de pessoa viva que cita fontes, porém que não cobrem todo o texto' },
	{ id: 'fpr', group: 'Fontes e referências', label: 'Fonte primária', template: 'Fontes primárias', action: 'subst:fpr',
		title: 'Artigo necessita de fontes secundárias confiáveis publicadas por terceiros' },
	{ id: '1f', group: 'Fontes e referências', label: 'Uma fonte', template: 'Uma-fonte', action: 'subst:1F',
		title: 'Página se baseia numa única fonte' },
	{ id: 'f-referencias', group: 'Fontes e referências', label: 'Formatar referências', template: 'Formatar referências', action: 'subst:f-referências',
		title: 'Artigo contém referências que necessitam de formatação' },
	{ id: 'wkf', group: 'Formatação e estilo', label: 'Wikificar', template: 'Wikificação', action: 'subst:wkf',
		title: 'Não está formatado de acordo com o livro de estilo' },
	{ id: 'rec', group: 'Formatação e estilo', label: 'Reciclagem', template: 'Reciclagem', action: 'subst:rec',
		title: 'Página precisa ser reciclada de acordo com o livro de estilo' },
	{ id: 's-cat', group: 'Categorias', label: 'Sem categoria', template: 'Sem cat', action: 'subst:s-cat',
		title: 'Página não está em nenhuma categoria', warn: 'categoria' },
	{ id: 'c-def', group: 'Categorias', label: 'Categorização deficiente', template: 'Cat def', action: 'subst:c-def',
		title: 'Página está com categorização deficiente' },
	{ id: 'sem-infocaixa', group: 'Formatação e estilo', label: 'Sem infocaixa', template: 'Sem infocaixa', action: 'Sem infocaixa',
		title: 'Página não possui nenhuma infocaixa', groupable: false,
		params: [ { name: '1', label: 'Infocaixa sugerida (só o NOME, sem "Predefinição:Info/")' } ] },
	{ id: 'sem-sinopse', group: 'Formatação e estilo', label: 'Sem sinopse', template: 'Sem sinopse', action: 'Sem sinopse',
		title: 'Página não possui nenhuma sinopse', groupable: false, placement: 'fim' },
	{ id: 'parcial', group: 'Conteúdo', label: 'Parcial', template: 'Parcial', action: 'Parcial', extra: '|{{subst:DATA}}',
		title: 'Artigo possui passagens que não respeitam o princípio da imparcialidade' },
	{ id: 'pub', group: 'Conteúdo', label: 'Publicidade', template: 'Publicidade', action: 'subst:pub',
		title: 'O conteúdo da página está possivelmente apresentado em formato publicitário' },
	{ id: 'ctx', group: 'Conteúdo', label: 'Contexto', template: 'Contextualizar', action: 'subst:ctx',
		title: 'Página carece de contexto' },
	{ id: 'nao-enc', group: 'Conteúdo', label: 'Não enciclopédico', template: 'Não enciclopédico', action: 'subst:não-enc',
		title: 'O conteúdo da página é possivelmente apresentado de maneira não enciclopédica' },
	{ id: 'global', group: 'Perspectiva global', label: 'Global', template: 'Global', action: 'Global', groupable: false,
		title: 'Conteúdo redigido sob uma perspectiva regionalizada (genérico)' },
	{ id: 'global-lusofonia', group: 'Perspectiva global', label: 'Global/Lusofonia', template: 'Global/Lusofonia', action: 'Global/Lusofonia', groupable: false,
		title: 'Conteúdo redigido sob uma perspectiva majoritariamente lusófona' },
	{ id: 'global-brasil', group: 'Perspectiva global', label: 'Global/Brasil', template: 'Global/Brasil', action: 'Global/Brasil', groupable: false,
		title: 'Conteúdo redigido sob uma perspectiva majoritariamente brasileira' },
	{ id: 'global-portugal', group: 'Perspectiva global', label: 'Global/Portugal', template: 'Global/Portugal', action: 'Global/Portugal', groupable: false,
		title: 'Conteúdo redigido sob uma perspectiva majoritariamente portuguesa' },
	{ id: 'm-traducao', group: 'Conteúdo', label: 'Má tradução', template: 'Má tradução', action: 'subst:m-tradução', groupable: false,
		title: 'O conteúdo da página está possivelmente mal traduzido',
		params: [ { name: '1', label: 'Página original, ex.: consulte [[:en:Título]] (inglês)' } ] },
	{ id: 'criado-ia', group: 'Conteúdo', label: 'Criado por IA', template: 'Criado por IA', action: 'subst:criado-ia',
		title: 'O conteúdo da página foi possivelmente criado por IA' },
	// No FastButtons, templatename estava como "publicidade" (erro): corrigido
	{ id: 'corrigir', group: 'Formatação e estilo', label: 'Corrigir', template: 'Corrigir', action: 'Corrigir',
		title: 'O conteúdo possivelmente precisa de correção ortográfico-gramatical' },
	{ id: 'revisao', group: 'Conteúdo', label: 'Revisão', template: 'Revisão', action: 'Revisão',
		title: 'O conteúdo da página está possivelmente inconsistente' },
	{ id: 'intro', group: 'Formatação e estilo', label: 'Má introdução', template: 'Má introdução', action: 'subst:Intro',
		title: 'A página não possui uma seção introdutória ou ela está malformatada' },
	{ id: 'sin', group: 'Formatação e estilo', label: 'Sinopse extensa', template: 'Sinopse', action: 'subst:sin',
		title: 'A sinopse do artigo é extensa demais ou muito detalhada' },
	{ id: 'em-manutencao', group: 'Estado da página', label: 'Em manutenção', template: 'Em manutenção', action: 'Em manutenção', groupable: false,
		title: 'Manutenção emergencial, a fim de evitar uma eliminação', listing: true,
		params: [ { name: 'situacao', label: 'Resumo da situação atual (vai para WP:Páginas precisando de manutenção)', required: true, external: true } ] },
	{ id: 'em-construcao', group: 'Estado da página', label: 'Em construção', template: 'Em construção', action: 'Em construção', groupable: false,
		title: 'Página em processo de construção' },
	{ id: 'e-traducao', group: 'Estado da página', label: 'Em tradução', template: 'Em tradução', action: 'subst:e-tradução', groupable: false,
		title: 'Página em processo de tradução' },
	{ id: 'desatualizado', group: 'Conteúdo', label: 'Desatualizado', template: 'Desatualizado', action: 'Desatualizado', extra: '|{{subst:DATA}}',
		title: 'A página contém conteúdo que pode estar desatualizado' },
	{ id: 'ev-atual', group: 'Estado da página', label: 'Evento atual', template: 'Evento atual', action: 'subst:ev-atual', groupable: false,
		title: 'Artigo sobre um evento atual',
		params: [ { name: '1', label: 'Tema do evento (ver Predefinição:Evento atual#Uso)' } ] },
	{ id: 'ev-futuro', group: 'Estado da página', label: 'Evento futuro', template: 'Evento futuro', action: 'subst:ev-futuro', groupable: false,
		title: 'Artigo sobre um evento futuro',
		params: [ { name: '1', label: 'Tema do evento (ver Predefinição:Evento futuro#Uso)' } ] },
	// O FastButtons acrescentava "|{{subst:DATA}}" sem nome depois de 1= e 2=, o que
	// sobrescreve o parâmetro 1. Data omitida até confirmar a assinatura da predefinição.
	{ id: 'renomear', group: 'Estado da página', label: 'Renomear página', template: 'Renomear página', action: 'Renomear página', groupable: false,
		title: 'Proposta de renomeação da página',
		params: [ { name: '1', label: 'Novo nome', required: true }, { name: '2', label: 'Motivo' } ] },
	{ id: 'lig-ambiguas', group: 'Formatação e estilo', label: 'Ligações ambíguas', template: 'Ligações ambíguas', action: 'subst:Ligações ambíguas',
		title: 'Artigo com múltiplas ligações para páginas de desambiguação' }
];

/* ================================================================== *
 * Avisos a usuários (módulos Reverter e Avisar)
 *
 * Catálogo único: junta MediaWiki:Gadget-diffTools.js/buttonsList.js e
 * fastb.buttons.warn do FastButtons. Quando os dois usavam predefinições
 * diferentes para o mesmo aviso, vale a do DiffTools (a lista mais recente).
 * Campos:
 *   id        identificador interno (também vai na marca oculta do aviso)
 *   group     grupo exibido no diálogo
 *   label     texto da ficha
 *   title     dica
 *   code      conteúdo do {{subst:…}}. Variáveis: $pagina, $nivel e $<campo>
 *   levels    { 1: código, 2: código, 3: código } para avisos em série
 *   summary   resumo da edição (nível 1); nos níveis 2 e 3 vira "Segundo/Terceiro aviso…",
 *             como no DiffTools, para que o histórico continue legível pelas duas ferramentas
 *   match     outros textos que identificam o aviso em resumos antigos (ex.: nome da
 *             predefinição usado pelo FastButtons), para sugerir o próximo nível
 *   fields    [ { key, label, required, options: [ [ valor, rótulo ] ] } ]
 *             ou, para várias caixas de seleção, checks: [ [ valor, rótulo, dica ] ];
 *             o valor do campo é a lista dos marcados ("2.2, 3.1 e 3.5")
 *   ip        true = só para IPs; false = só para contas
 *   welcome   false = não oferece boas-vindas junto (ex.: avisos que já são de boas-vindas)
 *   subst     false = transclui em vez de substituir
 *   sign      false = não acrescenta ~~~~ (a predefinição já assina)
 *   report    'default' | 'optional' = oferece o pedido em WP:Pedidos/Revisão de nomes de usuário
 *   top       true = vai no topo da discussão (ex.: Vandalismo repetido)
 *   header    título de seção posto antes do aviso (ex.: Notificação de bloqueio)
 * ================================================================== */

/** Avisos em série no formato Predefinição|nível|página */
function serie( tpl ) {
	return {
		1: tpl + '|1|$pagina',
		2: tpl + '|2|$pagina',
		3: tpl + '|3|$pagina'
	};
}

ronda.catalog.welcome = {
	user: 'bem-vindo(a)',  // usado com "Incluir boas-vindas" para contas
	ip: 'bem-vindo IP'     // e para IPs
};

/** Observação opcional dos avisos de nome impróprio, como no FastButtons (parâmetro 1 da predefinição) */
var OBS_NOME = [ { key: 'obs', label: 'Observação (opcional)' } ];

ronda.catalog.warnings = [
	/* ---------------- Boas-vindas ---------------- */
	{ id: 'bv', group: 'Boas-vindas', label: 'Boas-vindas', code: 'bem-vindo(a)', ip: false, welcome: false,
		title: 'Boas-vindas à Wikipédia (conta registrada)', summary: 'Mensagem de boas-vindas a novo usuário' },
	{ id: 'bv-ip', group: 'Boas-vindas', label: 'Boas-vindas (IP)', code: 'bem-vindo IP', ip: true, welcome: false,
		title: 'Boas-vindas para usuário não registrado', summary: 'Mensagem de boas-vindas a novo usuário' },
	{ id: 'av-bv', group: 'Boas-vindas', label: 'Erro em artigo + boas-vindas', code: 'bv-av-registrado|$pagina', ip: false, welcome: false,
		title: 'Aviso sobre erro em artigo e boas-vindas (conta registrada)', summary: 'Aviso sobre erro em artigo e boas-vindas' },
	{ id: 'av-bv-ip', group: 'Boas-vindas', label: 'Erro em artigo + boas-vindas (IP)', code: 'bv-av|$pagina', ip: true, welcome: false,
		title: 'Aviso sobre erro em artigo e boas-vindas (IP)', summary: 'Aviso sobre erro em artigo e boas-vindas' },
	{ id: 'bv-propaganda', group: 'Boas-vindas', label: 'Propaganda + boas-vindas', code: 'bv-propaganda', welcome: false,
		title: 'Pede que não faça propaganda e dá as boas-vindas', summary: 'Aviso sobre propaganda e boas-vindas' },

	/* ---------------- Em série (níveis 1 a 3) ---------------- */
	{ id: 'generico', group: 'Avisos em série', label: 'Genérico (erro em artigo)',
		levels: { 1: 'aviso|$pagina', 2: 'aviso2|$pagina', 3: 'aviso3|$pagina' },
		title: 'Aviso genérico sobre erro em artigo', summary: 'Aviso', match: [ 'subst:aviso|', 'predefinição:aviso|' ] },
	{ id: 'vandalismo', group: 'Avisos em série', label: 'Vandalismo', levels: serie( 'Vandalismo' ),
		title: 'Não vandalize os artigos', summary: 'Aviso sobre vandalismo', match: [ 'aviso-vandalismo' ] },
	{ id: 'spam', group: 'Avisos em série', label: 'Spam', levels: serie( 'Av-Spam' ),
		title: 'Não insira ligações externas inadequadas', summary: 'Aviso sobre spam', match: [ 'av-spam' ] },
	{ id: 'publicidade', group: 'Avisos em série', label: 'Publicidade', levels: serie( 'Av-pub' ),
		title: 'Não inclua informações promocionais', summary: 'Aviso sobre divulgação publicitária', match: [ 'av-pub' ] },
	{ id: 'bpv', group: 'Avisos em série', label: 'Difamação (BPV)', levels: serie( 'Av-Bpv' ), welcome: false,
		title: 'Não adicione conteúdo difamatório em biografias de pessoas vivas', summary: 'Aviso sobre difamação',
		match: [ 'av-bpv', 'adição de difamação' ] },
	{ id: 'teste', group: 'Avisos em série', label: 'Testes', levels: serie( 'Av-teste' ),
		title: 'Não faça testes nos artigos', summary: 'Aviso sobre testes', match: [ 'av-teste' ] },
	{ id: 'fontes', group: 'Avisos em série', label: 'Cite fontes',
		levels: { 1: 'Aviso-cite fonte|$pagina', 2: 'Aviso-cite fonte|$pagina|2', 3: 'Aviso-cite fonte|$pagina|3' },
		title: 'Faltou citar fontes', summary: 'Aviso sobre falta de fontes', match: [ 'aviso-cite fonte' ] },
	{ id: 'ia', group: 'Avisos em série', label: 'Uso de IA', levels: serie( 'Aviso-IA' ),
		title: 'Não use IA para editar artigos', summary: 'Aviso sobre uso de IA', match: [ 'aviso-ia' ] },
	{ id: 'mocao', group: 'Avisos em série', label: 'Moção indevida', levels: serie( 'Aviso-moção' ),
		title: 'Não mova páginas indevidamente', summary: 'Aviso sobre moção indevida', match: [ 'aviso-moção' ] },
	{ id: 'remocao', group: 'Avisos em série', label: 'Remoção de conteúdo', levels: serie( 'Av-Remoção' ),
		title: 'Não remova conteúdo dos artigos', summary: 'Aviso sobre remoção de conteúdos', match: [ 'av-remoção' ] },
	{ id: 'tag', group: 'Avisos em série', label: 'Remoção de marcação', levels: serie( 'Aviso-tag' ),
		title: 'Não remova predefinições de manutenção', summary: 'Aviso sobre remoção de predefinições de manutenção' },
	{ id: 'ataques', group: 'Avisos em série', label: 'Ataques pessoais', levels: serie( 'Av-nfap' ),
		title: 'Não faça ataques pessoais', summary: 'Aviso sobre ataques pessoais', match: [ 'av-nfap' ] },
	{ id: 'forum', group: 'Avisos em série', label: 'Discussão como fórum', levels: serie( 'Aviso-não é um fórum' ), welcome: false,
		title: 'Não use páginas de discussão como fórum', summary: 'Aviso de uso de páginas de discussão como fórum' },

	/* ---------------- Fontes e conteúdo ---------------- */
	{ id: 'fnc', group: 'Fontes e conteúdo', label: 'Fontes não confiáveis', code: 'Aviso-fontes não confiáveis|$pagina',
		title: 'Não use fontes não confiáveis', summary: 'Aviso sobre uso de fontes não confiáveis' },
	{ id: 'imdb', group: 'Fontes e conteúdo', label: 'IMDb como fonte', code: 'Aviso-IMDb|$pagina',
		title: 'Não cite o IMDb como fonte', summary: 'Aviso sobre uso do IMDb como fonte' },
	{ id: 'wp-fonte', group: 'Fontes e conteúdo', label: 'Wikipédia como fonte', code: 'Aviso-Wikipédia|$pagina',
		title: 'Não cite a Wikipédia como fonte', summary: 'Aviso sobre uso da Wikipédia como fonte' },
	{ id: 'fonte-removida', group: 'Fontes e conteúdo', label: 'Fontes removidas', code: 'Av-fonte|$pagina',
		title: 'Não remova fontes', summary: 'Aviso sobre remoção de fontes' },
	{ id: 'npi', group: 'Fontes e conteúdo', label: 'Pesquisa inédita', code: 'Av-npi|$pagina',
		title: 'Material não verificável por fontes', summary: 'Aviso sobre pesquisa inédita' },
	{ id: 'vda', group: 'Fontes e conteúdo', label: 'Violação de direitos de autor', code: 'Aviso-cópia|$pagina',
		title: 'Conteúdo copiado (VDA)', summary: 'Aviso sobre violação de direitos de autor' },
	{ id: 'vda-url', group: 'Fontes e conteúdo', label: 'Cópia (com URL)', code: 'cópia|$pagina|$url',
		title: 'Artigo copiado de fonte externa, indicando a origem', summary: 'Aviso sobre violação de direitos de autor',
		fields: [ { key: 'url', label: 'URL da página copiada', required: true } ] },
	{ id: 'vda-suspeito', group: 'Fontes e conteúdo', label: 'Suspeita de VDA', code: 'Aviso-suspeito|$pagina|15 minutos',
		title: 'Suspeita de violação de direitos de autor', summary: 'Aviso sobre suspeita de violação de direitos de autor' },
	{ id: 'parcial', group: 'Fontes e conteúdo', label: 'Parcialidade', code: 'Aviso-pdi|$pagina',
		title: 'Não faça edições parciais', summary: 'Aviso sobre parcialidade' },
	{ id: 'conflito', group: 'Fontes e conteúdo', label: 'Conflito de interesses', code: 'Aviso-conflito de interesses|$pagina',
		title: 'Conflito de interesses', summary: 'Aviso sobre conflitos de interesses' },
	{ id: 'autobiografia', group: 'Fontes e conteúdo', label: 'Autobiografia', code: 'Aviso-autobiografia|$pagina',
		title: 'Não crie autobiografias', summary: 'Aviso sobre autobiografia' },
	{ id: 'bsre', group: 'Fontes e conteúdo', label: 'Biografia sem relevo', code: 'BSRE|$pagina',
		title: 'Biografia sem relevo enciclopédico', summary: 'Aviso sobre biografia sem relevo enciclopédico' },
	{ id: 'propaganda', group: 'Fontes e conteúdo', label: 'Propaganda', code: 'propaganda|$pagina',
		title: 'Não faça propaganda', summary: 'Aviso sobre propaganda' },
	{ id: 'blogue', group: 'Fontes e conteúdo', label: 'Não é um blogue', code: 'Aviso-blogue|$pagina',
		title: 'Não use a Wikipédia como blogue ou plataforma de divulgação', summary: 'Aviso sobre não ser um blogue' },

	/* ---------------- Estilo e edição ---------------- */
	{ id: 'vlp', group: 'Estilo e edição', label: 'Variante da língua (VLP)', code: 'Aviso-ortografia|$pagina',
		title: 'Não mude a variante da língua portuguesa', summary: 'Aviso sobre mudanças entre [[WP:VLP]]' },
	{ id: 'previsao', group: 'Estilo e edição', label: 'Mostrar previsão', code: 'Mostrar previsão|$pagina',
		title: 'Não faça salvamentos sucessivos; use "Mostrar previsão"', summary: 'Aviso sobre botão de previsão' },
	{ id: 'layout', group: 'Estilo e edição', label: 'Mudança drástica de layout', code: 'Av-layout|$pagina',
		title: 'Mudanças drásticas no layout de artigos', summary: 'Aviso sobre mudanças drásticas em layout de artigos' },
	{ id: 'icones', group: 'Estilo e edição', label: 'Ícones e bandeiras', code: 'Aviso-ícones|$pagina',
		title: 'Não use ícones ou bandeiras fora das recomendações', summary: 'Aviso sobre uso indevido de ícones ou bandeiras' },
	{ id: 'assinatura', group: 'Estilo e edição', label: 'Assinatura em artigo', code: 'Aviso-assinatura|$pagina',
		title: 'Não assine artigos', summary: 'Aviso sobre assinatura em artigos' },
	{ id: 'traducao', group: 'Estilo e edição', label: 'Tradução em andamento', code: 'Aviso-tradução|$pagina',
		title: 'Tradução em andamento de artigos', summary: 'Aviso sobre tradução em andamento de artigos' },
	{ id: 'informe', group: 'Estilo e edição', label: 'Marcou sem informar', code: 'informar|$pagina',
		title: 'Incluiu predefinição de aviso ou alerta em artigo sem informar o motivo',
		summary: 'Aviso sobre inclusão de predefinição de aviso ou alerta em artigo sem informar' },
	{ id: 'categoria', group: 'Estilo e edição', label: 'Faltou categoria', code: 'Aviso-categoria|$pagina',
		title: 'Faltou categorizar a página', summary: 'Aviso sobre artigo não categorizado', match: [ 'av-categoria' ] },
	{ id: 'interwiki', group: 'Estilo e edição', label: 'Faltou interwiki', code: 'Aviso-interwiki|$pagina',
		title: 'Faltou ligar a página aos outros idiomas', summary: 'Aviso sobre artigo sem hiperligações para outros idiomas',
		match: [ 'av-interwiki' ] },
	{ id: 'assinatura', group: 'Estilo e edição', label: 'Assinatura não permitida', code: 'Aviso-assinatura não permitida|1=$pontos',
		title: 'Assinatura em desacordo com as regras para assinaturas', summary: 'Aviso sobre [[Wikipédia:Regras para assinaturas|assinatura não permitida]]',
		fields: [ { key: 'pontos', label: 'Regras violadas', required: true, checks: [
			[ '1.1', '1.1 Não identifica o usuário', 'A assinatura destina-se a identificar clara e inequivocamente o usuário em questão.' ],
			[ '2.1', '2.1 Engana, traz mensagens ou sugere cargos', 'Não é permitido ter uma assinatura que induza o leitor em erro atribuindo-a a terceiro, que contenha mensagens de nenhum tipo, ou que leve o leitor a supor o desempenho de cargos ou funções de controlo ou vigilância do conteúdo ou qualidade dos artigos.' ],
			[ '2.2', '2.2 Sem ligação para a página ou a discussão do usuário', 'A assinatura deve obrigatoriamente conter um link para a página do usuário ou de discussão.' ],
			[ '2.3', '2.3 Anúncios', 'Não são permitidos quaisquer anúncios nas assinaturas, que devem conter apenas e tão somente o nome do utilizador.' ],
			[ '2.4', '2.4 Ligações externas', 'Não são permitidos links externos para outros sites fora do âmbito dos projetos da Wikimedia.' ],
			[ '3.1', '3.1 Imagens ou <math>', 'Não são permitidas imagens, nem fórmulas feitas com <math> em assinaturas.' ],
			[ '3.2', '3.2 Texto a piscar ou animações', 'Não é permitido texto a piscar ou quaisquer outras animações.' ],
			[ '3.3', '3.3 Maior que 16 caracteres "m"', 'O tamanho visível da assinatura não deve ultrapassar 16 caracteres "m" em tamanho e fonte normal.' ],
			[ '3.4', '3.4 Altera o espaçamento entre linhas', 'O tamanho das letras não deve alterar o espaçamento normal entre linhas.' ],
			[ '3.5', '3.5 Mais de 3 cores', 'Não é permitido usar mais de 3 cores na assinatura, incluindo o preto.' ],
			[ '4.1', '4.1 Predefinição sem subst:', 'O software só permite a inclusão de predefinições se for usado subst:.' ],
			[ '4.2', '4.2 Código com mais de 255 caracteres', 'O código wiki da assinatura (depois de substituída, e sem contar a data) deve ter no máximo 255 caracteres.' ],
			[ '4.3', '4.3 Código mal formatado ou não fechado', 'Qualquer código HTML ou wiki deve estar corretamente formatado e fechado.' ],
			[ '5.1', '5.1 Acessibilidade ou código obsoleto', 'A assinatura deve seguir as regras de acessibilidade e não deve conter códigos obsoletos.' ]
		] } ] },

	/* ---------------- Eliminação ---------------- */
	{ id: 'av-er', group: 'Eliminação', label: 'Eliminação rápida', code: 'aviso-ER|$pagina|$regra|$obs', welcome: false,
		title: 'Aviso sobre eliminação rápida', summary: 'Aviso sobre eliminação rápida',
		fields: [ { key: 'regra', label: 'Regra de eliminação (ex.: A4)', required: true }, { key: 'obs', label: 'Observação (opcional)' } ] },
	{ id: 'av-esr', group: 'Eliminação', label: 'Eliminação semirrápida', code: 'aviso-ESR|$pagina', welcome: false,
		title: 'Aviso sobre eliminação semirrápida', summary: 'Aviso sobre eliminação semirrápida' },
	{ id: 'av-pe', group: 'Eliminação', label: 'Eliminação por consenso', code: 'aviso-PE|$pagina', welcome: false,
		title: 'Aviso sobre eliminação por consenso', summary: 'Aviso sobre eliminação por consenso' },
	{ id: 'nao-remova', group: 'Eliminação', label: 'Removeu marca de eliminação', code: 'Aviso-não remova|$pagina|$tipo',
		title: 'Não remova marcações de eliminação', summary: 'Aviso sobre remoção da marcação de eliminação',
		match: [ 'não remova' ],
		fields: [ { key: 'tipo', label: 'Tipo de marcação', options: [ [ '', 'Não especificar' ],
			[ 'er', 'Eliminação rápida' ], [ 'esr', 'Eliminação semirrápida' ], [ 'ec', 'Eliminação por consenso' ] ] } ] },

	/* ---------------- Conduta ---------------- */
	{ id: 'ameaca', group: 'Conduta', label: 'Ameaça judicial', code: 'Av-ameaça', welcome: false,
		title: 'Não faça ameaças judiciais', summary: 'Aviso sobre ameaças judiciais' },
	{ id: 'linguagem', group: 'Conduta', label: 'Linguagem inadequada', code: 'linguagem incorreta',
		title: 'Não insulte nem use linguagem inadequada', summary: 'Aviso sobre linguagem inadequada' },
	{ id: 'morder', group: 'Conduta', label: 'Morder os novatos', code: 'morder|$usuario|$obs', welcome: false,
		title: 'Não seja agressivo com os novatos', summary: 'Aviso sobre agressividade com novatos',
		fields: [ { key: 'usuario', label: 'Usuário que foi "mordido"', required: true }, { key: 'obs', label: 'Observação (opcional)' } ] },
	{ id: 'assine', group: 'Conduta', label: 'Assine os comentários', code: 'assine|$local',
		title: 'Faltou assinar um comentário', summary: 'Aviso sobre assinatura de comentários',
		fields: [ { key: 'local', label: 'Local do comentário', required: true } ] },
	{ id: 'ge', group: 'Conduta', label: 'Guerra de edições', code: 'aviso-GE|$pagina', welcome: false,
		title: 'A página foi protegida por guerra de edições', summary: 'Aviso sobre guerra de edições' },
	{ id: 'pdu', group: 'Conduta', label: 'Uso da PDU', code: 'Av-pdu',
		title: 'Uso impróprio da página de discussão de usuário', summary: 'Aviso sobre uso impróprio de página de discussão de usuário' },
	{ id: 'pu', group: 'Conduta', label: 'Página de usuário', code: 'av-página de usuário',
		title: 'Considere refazer a página de usuário', summary: 'Aviso sobre a página de usuário' },
	{ id: 'branqueio', group: 'Conduta', label: 'Branqueio da PDU', code: 'Branqueio|1||~~' + '~~', sign: false, welcome: false,
		title: 'Mensagem sobre o branqueio da página de discussão do usuário', summary: 'Mensagem sobre branqueio da PDU' },
	{ id: 'branqueio-avisos', group: 'Conduta', label: 'Removeu avisos da PDU', code: 'Branqueio|2||~~' + '~~', sign: false, welcome: false,
		title: 'Mensagem sobre a remoção de avisos da página de discussão do usuário', summary: 'Mensagem sobre remoção de avisos da PDU' },
	{ id: 'vandalismo-repetido', group: 'Conduta', label: 'Vandalismo repetido (IP)', code: 'Vandalismo repetido',
		subst: false, sign: false, welcome: false, ip: true, top: true,
		title: 'Marca que informa que o IP tem sido bloqueado com frequência', summary: 'Marcando IP com vandalismo repetido' },

	/* ---------------- Notificação de bloqueio (como no FastButtons) ---------------- */
	{ id: 'bloqueado', group: 'Notificação de bloqueio', label: 'Bloqueado', code: 'bloqueado|$tempo|$motivo', welcome: false,
		header: 'Notificação de bloqueio',
		title: 'Bloqueio quando o usuário NÃO pode usar a própria discussão', summary: 'Notificação de bloqueio',
		fields: [ { key: 'tempo', label: 'Duração', required: true }, { key: 'motivo', label: 'Motivo', required: true } ] },
	{ id: 'bloqueado-disc', group: 'Notificação de bloqueio', label: 'Bloqueado (pode usar a discussão)',
		code: 'bloqueado-disc|$tempo|$motivo', welcome: false, header: 'Notificação de bloqueio',
		title: 'Bloqueio quando o usuário pode usar a própria discussão', summary: 'Notificação de bloqueio',
		fields: [ { key: 'tempo', label: 'Duração', required: true }, { key: 'motivo', label: 'Motivo', required: true } ] },
	{ id: 'bloqueado-cpv', group: 'Notificação de bloqueio', label: 'Conta para vandalismo', code: 'bloqueado-CPV', welcome: false,
		header: 'Notificação de bloqueio', ip: false,
		title: 'Bloqueio de conta usada só para vandalismo', summary: 'Notificação de bloqueio' },
	{ id: 'proxy', group: 'Notificação de bloqueio', label: 'Proxy', code: 'proxy', welcome: false, header: 'Notificação de bloqueio',
		title: 'Notificação de proxy bloqueado', summary: 'Notificação de bloqueio' },

	/* ---------------- Nome impróprio ---------------- */
	{ id: 'nome-ofensivo', group: 'Nome impróprio', label: 'Ofensivo/difamatório', code: 'Nome impróprio/ofensivo-difamatório|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'default',
		title: 'Nome ofensivo ou difamatório, passível de bloqueio imediato',
		summary: 'Aviso sobre nome impróprio ([[WP:NOMEATAQUE|ofensivo]]/[[WP:ABUSOBPV|difamatório]])' },
	{ id: 'nome-promocional', group: 'Nome impróprio', label: 'Promocional', code: 'Nome impróprio/promocional-compartilhado|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'optional',
		title: 'Nome de empresa, organização, site, produto, grupo ou evento',
		summary: 'Aviso sobre nome impróprio ([[WP:NOMEPROMO|promocional]])' },
	{ id: 'nome-confuso', group: 'Nome impróprio', label: 'Confuso/comprido', code: 'Nome impróprio/confuso-comprido|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'optional',
		title: 'Nome confuso, ininteligível ou excessivamente comprido',
		summary: 'Aviso sobre nome impróprio ([[WP:NOMECONF|confuso]]/[[WP:NOMECOMPRIDO|comprido]])' },
	{ id: 'nome-enganoso', group: 'Nome impróprio', label: 'Enganoso', code: 'Nome impróprio/enganoso|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'optional',
		title: 'Nome potencialmente enganoso', summary: 'Aviso sobre nome impróprio ([[WP:NOMEENGANOSO|enganoso]])' },
	{ id: 'nome-caracteres', group: 'Nome impróprio', label: 'Fora dos sistemas de escrita', code: 'Nome impróprio/caracteres|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'optional',
		title: 'Nome com caracteres fora dos sistemas de escrita', summary: 'Aviso sobre nome impróprio ([[WP:NOEMOJI|caracteres fora dos sistemas de escrita]])' }
];

/*
 * Categorias de quem já foi notificado (na discussão do usuário). Os avisos dos grupos
 * listados ficam esmaecidos, com a nota "já notificado", mas continuam selecionáveis.
 */
ronda.catalog.notifiedCategories = [
	{ category: 'Categoria:!Usuários com nomes impróprios notificados', groups: [ 'Nome impróprio' ] }
];

/* ================================================================== *
 * Motivos de eliminação de reserva (mesma base da ferramenta de
 * eliminação em massa adaptada de en:User:Animum/massdelete.js).
 * Prevalecem sobre os menus nativos (MediaWiki:Deletereason-dropdown):
 * uma regra de ER do catálogo (rótulo "X1 - …") substitui a do menu com o
 * mesmo código, ou entra se faltar (como a D2 em discussões).
 *   ns   domínios do grupo; 'talk' = discussões; sem ns = todos
 *   add  opção sem código de regra que entra sempre, logo depois das regras
 *        do grupo (ex.: um caso particular da D2)
 * ================================================================== */

ronda.catalog.deletionReasons = [
	{ label: 'Redirecionamentos', options: [
		{ label: 'R1 - Redirecionamento indevido, desnecessário, sem afluentes, para página inexistente ou eliminada', value: 'R1 - [[WP:ER#ERr1|Redirecionamento indevido, desnecessário, sem afluentes, para página inexistente ou eliminada]]' },
		{ label: 'R2 - Eliminação de redirecionamento para movimentar página de destino', value: 'R2 - [[WP:ER#ERr2|Eliminação de redirecionamento para movimentar página de destino]]' }
	] },
	{ label: 'Eliminação de páginas de usuário', ns: [ 2, 3 ], options: [
		{ label: 'U1 - Uso impróprio da página ou subpágina de usuário', value: 'U1 - [[WP:ER#ERU1|Uso impróprio da página ou subpágina de usuário]]' },
		{ label: 'U2 - Página de usuário criada por outro usuário', value: 'U2 - [[WP:ER#ERU2|Página de usuário criada por outro usuário]]' }
	] },
	{ label: 'Eliminação de ficheiros', ns: [ 6 ], options: [
		{ label: 'F1 - Ficheiro duplicado ou que não cumpre a política de conteúdo restrito', value: 'F1 - [[WP:ER#ERF1|Ficheiro duplicado ou que não cumpre a política de conteúdo restrito]]' }
	] },
	{ label: 'Eliminação de predefinições e módulos', ns: [ 10, 11, 828, 829 ], options: [
		{ label: 'P1 - Predefinição vazia, desnecessária ou substituída', value: 'P1 - [[WP:ER#ERP1|Predefinição vazia, desnecessária ou substituída]]' },
		{ label: 'P2 - Predefinição que seja deturpação inequívoca de regras estabelecidas', value: 'P2 - [[WP:ER#ERP2|Predefinição que seja deturpação inequívoca de regras estabelecidas]]' }
	] },
	{ label: 'Eliminação de categorias', ns: [ 14 ], options: [
		{ label: 'C1 - Categoria vazia, desnecessária ou substituída', value: 'C1 - [[WP:ER#ERC1|Categoria vazia, desnecessária ou substituída]]' }
	] },
	{ label: 'Eliminação de páginas de discussão', ns: 'talk', options: [
		{ label: 'D1 - Discussão de página inexistente', value: 'D1 - [[WP:ER#ERd1|Discussão de página inexistente]]' },
		{ label: 'D2 - Discussões de páginas para eliminação ou com histórico irrelevante', value: 'D2 - [[WP:ER#ERd2|Discussões de páginas para eliminação ou com histórico irrelevante]]' },
		{ label: 'Discussão de página de redirecionamento', value: 'Discussão de página de redirecionamento', add: true }
	] },
	{ label: 'Eliminação no domínio principal', ns: [ 0 ], options: [
		{ label: 'A2 - Sem contexto', value: 'A2 - [[WP:ER#ERa2|Sem contexto]]' },
		{ label: 'A3 - Sem conteúdo', value: 'A3 - [[WP:ER#ERa3|Sem conteúdo]]' },
		{ label: 'A4 - Sem indicação de importância (pessoa, animal, organização, evento ou conteúdo web)', value: 'A4 - [[WP:ER#ERa4|Sem indicação de importância (pessoa, animal, organização, evento ou conteúdo web)]]' },
		{ label: 'A5 - Sem indicação de importância (gravação musical ou livro)', value: 'A5 - [[WP:ER#ERa5|Sem indicação de importância (gravação musical ou livro)]]' },
		{ label: 'A6 - Artigo criado recentemente que duplica um tópico existente', value: 'A6 - [[WP:ER#ERa6|Artigo criado recentemente que duplica um tópico existente]]' },
		{ label: 'Autobiografia', value: '[[WP:AUTO|Autobiografia]]' },
		{ label: 'Biografia sem notoriedade', value: '[[WP:BSRE|Biografia sem notoriedade]]' },
		{ label: 'Currículo', value: '[[WP:CURRÍCULO|Currículo]]' },
		{ label: 'Difamação sem fontes comprobatórias', value: '[[WP:BPV|Difamação sem fontes comprobatórias]]' },
		{ label: 'Diretório de links', value: '[[WP:NOLINKS|Diretório de links]]' },
		{ label: 'Desambiguação desnecessária', value: '[[WP:DES|Desambiguação desnecessária]]' },
		{ label: 'Disparate / incompreensível', value: 'Disparate / incompreensível' },
		{ label: 'Entrada de dicionário', value: '[[WP:NODIC|Entrada de dicionário]]' },
		{ label: 'Falso e/ou especulativo', value: '[[WP:Verificabilidade|Falso e/ou especulativo]]' },
		{ label: 'Fórum de discussão / blog', value: '[[WP:FORUM|Fórum de discussão / blog]]' },
		{ label: 'Guia ou manual', value: '[[WP:GUIA|Guia ou manual]]' },
		{ label: 'Ofensivo / baixo calão', value: 'Ofensivo / baixo calão' },
		{ label: 'Repositório desordenado de informação', value: '[[WP:RDI|Repositório desordenado de informação]]' },
		{ label: 'Spam / propaganda / proselitismo religioso ou político', value: '[[WP:SPAM|Spam / propaganda / proselitismo religioso ou político]]' },
		{ label: 'Texto em língua estrangeira', value: '[[WP:EST|Texto em língua estrangeira]]' },
		{ label: 'Texto em maiúsculas', value: '[[WP:MAIÚSCULAS|Texto em maiúsculas]]' },
		{ label: 'Texto pronto', value: '[[WP:TEXTOPRONTO|Texto pronto]]' },
		{ label: 'Texto opinativo', value: '[[WP:OPI|Texto opinativo]]' }
	] },
	{ label: 'Motivos relacionados a ESR, EC ou redirecionamentos', ns: [ 0, 6 ], options: [
		{ label: 'ESR - Eliminação semirrápida', value: '[[WP:ESR|Eliminação semirrápida]]' },
		{ label: 'ESR-MATRAD - Eliminação por má tradução (automática ou incompreensível)', value: '[[WP:ESR-MATRAD|Eliminação por má tradução (automática ou incompreensível)]]' },
		{ label: 'ESR-SIW - Eliminação semirrápida de artigo sem fontes nem ligações interlínguas', value: '[[WP:ESR-SIW|Eliminação semirrápida de artigo sem fontes nem ligações interlínguas]]' }
	] },
	{ label: 'Regras gerais', options: [
		{ label: 'G1 - Eliminação técnica', value: 'G1 - [[WP:ER#ERg1|Eliminação técnica]]' },
		{ label: 'G2 - Impróprio', value: 'G2 - [[WP:ER#ERg2|Impróprio]]' },
		{ label: 'G3 - Violação de direitos autorais', value: 'G3 - [[WP:ER#ERg3|Violação de direitos autorais]]' },
		{ label: 'G4 - Página criada por editor bloqueado ou banido', value: 'G4 - [[WP:ER#ERg4|Página criada por editor bloqueado ou banido]]' },
		{ label: 'G5 - Aparecimento recorrente', value: 'G5 - [[WP:ER#ERg5|Aparecimento recorrente]]' },
		{ label: 'G6 - Spam', value: 'G6 - [[WP:ER#ERg6|Spam]]' },
		{ label: 'G7 - Eliminação a pedido do autor', value: 'G7 - [[WP:ER#ERg7|Eliminação a pedido do autor]]' }
	] }
];

/* ================================================================== *
 * Eliminação rápida (módulo Rápida)
 *
 * Portado de fastb.buttons.ER. Campos:
 *   rule      regra (vai em {{ER|<regra>}})
 *   title     descrição
 *   ns        domínios em que a regra vale (sem ns = todos)
 *   talk      só em páginas de discussão (domínios ímpares)
 *   redirect  só em redirecionamentos
 *   noWarn    regra técnica: o criador não é avisado (como no FastButtons)
 * ================================================================== */

ronda.catalog.speedy = [
	{ rule: 'A2', title: 'Sem contexto', ns: [ 0 ] },
	{ rule: 'A3', title: 'Sem conteúdo', ns: [ 0 ] },
	{ rule: 'A4', title: 'Sem indicação de importância (pessoas, animais, organizações, conteúdo web, eventos)', ns: [ 0 ] },
	{ rule: 'A5', title: 'Sem indicação de importância (gravações musicais e livros)', ns: [ 0 ] },
	{ rule: 'A6', title: 'Artigo criado recentemente que duplica um tópico existente', ns: [ 0 ] },
	{ rule: 'C1', title: 'Categoria vazia, desnecessária ou substituída', ns: [ 14 ], noWarn: true },
	{ rule: 'D1', title: 'Discussão de página inexistente', talk: true, noWarn: true },
	{ rule: 'D2', title: 'Discussão de página para eliminação ou com histórico irrelevante', talk: true, noWarn: true },
	{ rule: 'U1', title: 'Uso impróprio da página de usuário', ns: [ 2, 3 ] },
	{ rule: 'U2', title: 'Página de usuário criada por outro usuário', ns: [ 2 ] },
	{ rule: 'P1', title: 'Predefinição vazia, desnecessária ou substituída', ns: [ 10 ], noWarn: true },
	{ rule: 'P2', title: 'Predefinição que é uma deturpação das regras', ns: [ 10 ] },
	{ rule: 'F1', title: 'Ficheiro duplicado ou que não cumpre a política de conteúdo restrito', ns: [ 6 ] },
	{ rule: 'R1', title: 'Redirecionamento indevido, desnecessário, sem afluentes, para página inexistente ou eliminada', redirect: true, noWarn: true },
	{ rule: 'R2', title: 'Redirecionamento sem histórico relevante (mover para cá a página redirecionada)', redirect: true, noWarn: true },
	{ rule: 'G1', title: 'Eliminação técnica', noWarn: true },
	{ rule: 'G2', title: 'Impróprio' },
	{ rule: 'G3', title: 'Violação flagrante de direitos de autor, sem histórico relevante', ns: [ 0 ] },
	{ rule: 'G4', title: 'Página criada por editor bloqueado ou banido', ns: [ 0 ] },
	{ rule: 'G5', title: 'Aparecimento recorrente (conteúdo igual ao eliminado por consenso)' },
	{ rule: 'G6', title: 'Título é spam', ns: [ 0 ] },
	{ rule: 'G7', title: 'Eliminação a pedido do autor' }
];

/* ================================================================== *
 * Eliminação semirrápida (módulo Semirrápida)
 *
 * Justificativas-padrão por assunto, portadas de
 * fastb.defaultJustificationsESR. template = predefinição própria do assunto
 * (usada como {{subst:<template>|1=~~~~|2=<justificativa>}}).
 * ================================================================== */

( function () {
	var FONTES = ' Páginas pessoais, sites de fãs, sites colaborativos (como Discogs, IMDb, Wikipédia, etc.), fóruns de discussão,'
			+ ' blogues (como Blogspot, Blogger, WordPress, etc.) e redes sociais (como Facebook, Instagram, Twitter, etc.)'
			+ ' não são fontes confiáveis.',
		SEM_FONTES = 'sem [[WP:FC|fontes confiáveis]] e [[WP:FI|independentes]] que confirmem as afirmações do texto e atestem ',
		GENERICO = 'Artigo ' + SEM_FONTES + 'notoriedade.';

	/** Texto completo, com o critério específico de notoriedade quando houver */
	function esr( lead, criterio ) {
		return lead + ' Ver [[WP:V|princípio da verificabilidade]] e [[WP:CDN|critérios de notoriedade]]'
			+ ( criterio ? ' (e o [[Wikipédia:Critérios de notoriedade/' + criterio[ 0 ] + '|critério específico para '
				+ criterio[ 1 ] + ']])' : '' )
			+ '.' + FONTES;
	}

	ronda.catalog.esrSubjects = [
		{ label: 'Arte', text: esr( GENERICO ) },
		{ label: 'Banda', template: 'ESR-banda', text: esr( 'Artigo sobre banda/grupo musical ' + SEM_FONTES
			+ 'a notoriedade do artista ou de sua obra.', [ 'Música', 'música' ] ) },
		{ label: 'Cantores, álbuns e músicas', text: esr( 'Artigo relacionado à música ' + SEM_FONTES
			+ 'a notoriedade do artista ou de sua obra.', [ 'Música', 'música' ] ) },
		{ label: 'Ciência', text: esr( GENERICO ) },
		{ label: 'Ciências sociais', text: esr( GENERICO ) },
		{ label: 'Educação', text: esr( GENERICO, [ 'Educação', 'educação' ] ) },
		{ label: 'Entretenimento', text: esr( GENERICO ) },
		{ label: 'Esporte/desporto', text: esr( GENERICO, [ 'Desporto', 'desporto' ] ) },
		{ label: 'História e sociedade', text: esr( GENERICO ) },
		{ label: 'Medicina', text: esr( GENERICO ) },
		{ label: 'Organização', template: 'ESR-organização', text: esr( 'Artigo sobre organização '
			+ SEM_FONTES + 'a notoriedade da organização.' ) },
		{ label: 'Países', text: esr( GENERICO ) },
		{ label: 'Pessoas', template: 'ESR-bio', text: esr( 'Biografia ' + SEM_FONTES
			+ 'a notoriedade do biografado.', [ 'Biografias', 'biografias' ] ) },
		{ label: 'Política', text: esr( GENERICO, [ 'Política', 'política' ] ) }
	];
}() );

/* ================================================================== *
 * Pedidos (módulo Pedido), portado de fastb.buttons.requests
 *
 *   page     página de pedidos; o modelo vem de <page>/Padrão, onde
 *            "Nome ou IP"/"página"/"Exemplo" vira o alvo e "Razão", a argumentação
 *   target   'user' (pede usuário; pode ocultar o nome) | 'page' | 'free' (Outro)
 *   history  dois campos de página (Página 1 / Página 2)
 *   noText   sem argumentação (Nome impróprio)
 * ================================================================== */

ronda.catalog.requests = [
	{ id: 'vandalismo', label: 'Vandalismo', target: 'user', page: 'Wikipédia:Pedidos/Notificações de vandalismo',
		title: 'Notificar a ação de um vândalo',
		placeholder: 'Dê mais detalhes sobre o vandalismo.' },
	{ id: 'desprotecao', label: 'Desproteção', target: 'page', page: 'Wikipédia:Pedidos/Desproteção',
		title: 'Pedir a desproteção de uma página', placeholder: 'Justifique o pedido de desproteção.' },
	{ id: 'edicao', label: 'Edição', target: 'page', page: 'Wikipédia:Pedidos/Páginas protegidas',
		title: 'Pedir uma alteração numa página protegida', placeholder: 'Especifique a alteração e o motivo.' },
	{ id: 'historico', label: 'Histórico', target: 'page', history: true, page: 'Wikipédia:Pedidos/Histórico',
		title: 'Pedir a fusão do histórico de uma página com outra', placeholder: 'Justifique a fusão de históricos.' },
	{ id: 'protecao', label: 'Proteção', target: 'page', page: 'Wikipédia:Pedidos/Proteção',
		title: 'Pedir a proteção de uma página', placeholder: 'Justifique o pedido de proteção.' },
	{ id: 'restauro', label: 'Restauro', target: 'page', page: 'Wikipédia:Pedidos/Restauro',
		title: 'Pedir o restauro de uma página', placeholder: 'Justifique o pedido de restauro.' },
	{ id: 'ocultacao', label: 'Ocultação', target: 'page', page: 'Wikipédia:Pedidos/Ocultação',
		title: 'Pedir a ocultação de uma ou mais edições', placeholder: 'Especifique as edições e o motivo.' },
	{ id: 'nome', label: 'Nome impróprio', target: 'user', noText: true, page: 'Wikipédia:Pedidos/Revisão de nomes de usuário',
		title: 'Notificar um usuário com nome impróprio' },
	{ id: 'incidente', label: 'Incidente', target: 'user', page: 'Wikipédia:Pedidos/Notificação de incidentes',
		title: 'Notificar incidentes urgentes de conduta', placeholder: 'Esclareça o pedido.' },
	{ id: 'outro', label: 'Outro', target: 'free', page: 'Wikipédia:Pedidos/Outros',
		title: 'Fazer um pedido sobre outro assunto', placeholder: 'Esclareça o pedido.' }
];

/* ================================================================== *
 * Busca de fontes (artigos) e PetScan (categorias)
 * ================================================================== */

ronda.catalog.search = [
	{ label: 'Google', title: 'Pesquisar o título no Google', url: '//www.google.com/search?&as_eq=wikipedia&as_epq=' },
	{ label: 'Google Notícias', title: 'Pesquisar o título no Google Notícias', url: '//google.com/search?tbm=nws&q=' },
	{ label: 'Google Livros', title: 'Pesquisar o título no Google Livros', url: '//books.google.com/books?&as_brr=0&as_epq=' },
	{ label: 'Google Acadêmico', title: 'Pesquisar o título no Google Acadêmico', url: '//scholar.google.com/scholar?q=' },
	{ label: 'Google Brasil', title: 'Pesquisar o título no Google Brasil', url: '//www.google.com/search?cr=countryBR&q=' },
	{ label: 'Google Portugal', title: 'Pesquisar o título no Google Portugal', url: '//www.google.com/search?cr=countryPT&q=' },
	{ label: 'Bing', title: 'Pesquisar o título no Bing', url: '//www.bing.com/search?q=' }
];

ronda.catalog.petscan = [
	{ label: 'Sem fontes', title: 'Páginas desta categoria que precisam de fontes', params: { templates_yes: 'Sem-fontes' } },
	{ label: 'Revisão', title: 'Páginas desta categoria que precisam de revisão', params: { templates_yes: 'Revisão' } },
	{ label: 'Wikificação', title: 'Páginas desta categoria que precisam de wikificação', params: { templates_yes: 'Wikificação' } },
	{ label: 'Menos de 1 000 bytes ou 4 links', title: 'Páginas pequenas desta categoria', params: { smaller: 1000, minlinks: 4 } },
	{ label: 'Menos de 500 bytes ou 2 links', title: 'Páginas muito pequenas desta categoria', params: { smaller: 500, minlinks: 2 } }
];

}( window.ronda ) );

/* ===== Ronda-patrulha.js ===== */
/**
 * Ronda — patrulha
 *
 * Reúne, num só arquivo, os módulos ligados a edições e usuários:
 * - Reverter e Avisar (sucessores do DiffTools; Avisar sempre disponível em
 *   diffs, reversões e versões antigas);
 * - Usuário (painel do usuário-alvo, como no FastButtons);
 * - Listar (páginas vigiadas, mudanças recentes, páginas novas, edições a
 *   revisar e eliminação rápida);
 * - reversão rápida (BF / normal / vandalismo) e "restaurar esta versão" em
 *   diffs, histórico, contribuições, mudanças recentes e páginas vigiadas.
 * Cada módulo continua no seu próprio bloco (escopo isolado).
 */

/**
 * Ronda — módulos Reverter e Avisar (sucessores do DiffTools)
 *
 * Reverter (no diff):
 * - Desfaz as edições até a versão da esquerda com undo/undoafter, que sempre
 *   parte da versão atual: nada de reescrever o texto antigo por cima.
 * - Antes de reverter, confere quem editou depois da versão da esquerda. Se houver
 *   edições de outras pessoas, avisa e só prossegue com confirmação explícita.
 * - Quem tem o direito "rollback" pode usar a reversão rápida quando ela tem
 *   exatamente o mesmo efeito (todas as edições posteriores são do usuário revertido).
 * - Pode marcar a edição como patrulhada e enviar avisos na mesma operação.
 *
 * Avisar (no diff, após uma reversão, na página/discussão do usuário e nas contribuições):
 * - Avisos de múltipla escolha a partir de um catálogo único (ronda.catalog.warnings).
 * - Sugere o nível do aviso a partir da discussão do usuário: marcas ocultas
 *   deixadas pelo Ronda e resumos de edição do DiffTools/FastButtons, dentro de uma
 *   janela de dias configurável. Depois do terceiro aviso, sugere o bloqueio.
 * - Boas-vindas opcionais junto do aviso, como o "bv+1" do DiffTools.
 * - Nome impróprio: aviso + pedido em WP:Pedidos/Revisão de nomes de usuário.
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

var DAY = 864e5,
	LEVEL_WORDS = { 2: 'Segundo ', 3: 'Terceiro ' },
	LEVEL_ORDINAL = { 1: 'primeiro', 2: 'segundo', 3: 'terceiro' };

function cfg() {
	return ronda.config.warnings;
}

function talkTitle( user ) {
	return mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + user;
}

/* ================================================================== *
 * Funções puras
 * ================================================================== */

function lcfirst( s ) {
	return s.charAt( 0 ).toLowerCase() + s.slice( 1 );
}

function normalize( s ) {
	return String( s || '' ).replace( /\s+/g, ' ' ).trim().toLowerCase();
}

function escapeRe( s ) {
	return s.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

function today() {
	return new Date().toISOString().slice( 0, 10 );
}

/** Código do aviso no nível pedido */
function codeFor( item, level ) {
	return item.levels ? item.levels[ level ] : item.code;
}

/** Usa $pagina, $nivel e $<campo>; parâmetros vazios no fim são retirados */
function fill( code, values ) {
	return code.replace( /\$([a-z]+)/g, function ( all, key ) {
		return Object.prototype.hasOwnProperty.call( values, key ) ? String( values[ key ] ) : all;
	} ).replace( /(?:\|\s*(?:\w+\s*=\s*)?)+$/, '' ); // parâmetros vazios no fim (|, |1=) saem
}

function needsPage( item ) {
	var codes = item.levels
		? Object.keys( item.levels ).map( function ( k ) {
			return item.levels[ k ];
		} )
		: [ item.code ];

	return codes.some( function ( c ) {
		return c.indexOf( '$pagina' ) !== -1;
	} );
}

/** Resumo: nível 1 = summary; níveis 2 e 3 = "Segundo/Terceiro aviso…", como no DiffTools */
function summaryFor( item, level ) {
	return item.levels && LEVEL_WORDS[ level ]
		? LEVEL_WORDS[ level ] + lcfirst( item.summary )
		: item.summary;
}

/** Marca oculta que permite reconhecer o aviso depois, mesmo com a predefinição substituída */
function marker( item, level, date ) {
	return '<!-- ronda-aviso:' + item.id + ( item.levels ? ':' + level : '' ) + ':' + date + ' -->';
}

/**
 * Wikitexto de um aviso.
 * @param {Object} item Item de ronda.catalog.warnings
 * @param {number|null} level
 * @param {Object} values { pagina, <campos> }
 * @param {Object} [opts] { marker: boolean, date: 'AAAA-MM-DD' }
 * @return {string}
 */
function build( item, level, values, opts ) {
	var key, text,
		v = { nivel: level || '' };

	for ( key in values ) {
		if ( Object.prototype.hasOwnProperty.call( values, key ) ) {
			v[ key ] = values[ key ];
		}
	}

	text = '{{' + ( item.subst === false ? '' : 'subst:' ) + fill( codeFor( item, level ), v ) + '}}';

	if ( item.sign !== false ) {
		text += ' ~~' + '~~';
	}
	if ( opts && opts.marker ) {
		text += ' ' + marker( item, level, opts.date || today() );
	}

	return text;
}

/**
 * Aviso mais alto desta série já recebido dentro da janela.
 * Fontes: marcas do Ronda no texto atual e resumos de edição do histórico
 * ("Aviso sobre X", "Segundo aviso sobre X", "Bem vindo + Aviso sobre X"…).
 * @param {Object} item
 * @param {Array} revisions [ { timestamp, comment } ] da discussão do usuário
 * @param {string} text Conteúdo atual da discussão
 * @param {number} now Data atual (ms)
 * @param {number} days Janela, em dias
 * @return {Object|null} { level, time, source: 'ronda' | 'resumo' }
 */
function previous( item, revisions, text, now, days ) {
	var m, re,
		best = null,
		since = now - days * DAY,
		base = normalize( item.summary ),
		needles = ( item.match || [] ).map( normalize );

	if ( !item.levels ) {
		return null;
	}

	function consider( level, time, source ) {
		if ( isNaN( time ) || time < since || time > now + DAY ) {
			return;
		}
		if ( !best || level > best.level || ( level === best.level && time > best.time ) ) {
			best = { level: level, time: time, source: source };
		}
	}

	re = new RegExp( '<!-- ronda-aviso:' + escapeRe( item.id ) + '(?::(\\d))?:(\\d{4}-\\d{2}-\\d{2}) -->', 'g' );
	while ( ( m = re.exec( text || '' ) ) ) {
		consider( Number( m[ 1 ] || 1 ), Date.parse( m[ 2 ] + 'T12:00:00Z' ), 'ronda' );
	}

	( revisions || [] ).forEach( function ( r ) {
		var time = Date.parse( r.timestamp );

		String( r.comment || '' ).split( ';' ).forEach( function ( part ) {
			var p = normalize( part ).replace( /^bem[ -]?vindo\s*\+\s*/, '' ),
				level = /^segundo /.test( p ) ? 2 : /^terceiro /.test( p ) ? 3 : 1,
				core = level > 1 ? p.replace( /^(segundo|terceiro) /, '' ) : p;

			if ( core === base || needles.some( function ( n ) {
				return p.indexOf( n ) !== -1;
			} ) ) {
				consider( level, time, 'resumo' );
			}
		} );
	} );

	return best;
}

/** Próximo nível a partir do anterior; depois do 3º, sugere o bloqueio */
/**
 * Confirmações antes de avisar, como no Twinkle:
 * - o mesmo aviso nas últimas 24 h (marcas do Ronda ou resumos de edição);
 * - qualquer edição na discussão no último minuto (outra pessoa pode ter avisado).
 * @return {Array} textos dos alertas
 */
function confirmations( chosen, talk, now ) {
	var out = [],
		last = talk.revisions && talk.revisions[ 0 ];

	chosen.forEach( function ( c ) {
		var item = c.item,
			base = normalize( item.summary ),
			recent = item.levels
				? previous( item, talk.revisions, talk.text, now, 1 )
				: ( talk.revisions || [] ).some( function ( r ) {
					return Date.parse( r.timestamp ) > now - DAY && normalize( r.comment || '' ).indexOf( base ) !== -1;
				} );

		if ( recent ) {
			out.push( ronda.msg( 'patrulha-o-aviso-ja-foi-deixado-nas', item.label ) );
		}
	} );

	if ( last && Date.parse( last.timestamp ) > now - 60000 ) {
		out.push( ronda.msg( 'patrulha-a-discussao-do-usuario-foi-editada', last.comment ? ' ("' + last.comment + '")' : '' ) );
	}
	return out;
}

function suggest( prev ) {
	if ( !prev ) {
		return { level: 1, block: false };
	}
	if ( prev.level >= 3 ) {
		return { level: 3, block: true };
	}
	return { level: prev.level + 1, block: false };
}

/**
 * Plano de reversão.
 * @param {Array} revs Revisões da mais nova para a mais antiga (rvendid = oldId)
 * @param {number} oldId Versão da esquerda (a que será restaurada)
 * @param {string} target Usuário revertido
 * @return {Object} { latest, restored, newer: [], others: [], reached }
 */
function analyzeRevert( revs, oldId, target ) {
	var restored = null,
		newer = [],
		others = [];

	( revs || [] ).forEach( function ( r ) {
		var user = r.userhidden ? ronda.msg( 'patrulha-nome-oculto' ) : r.user;

		if ( restored ) {
			return;
		}
		if ( r.revid === oldId ) {
			restored = r;
			return;
		}
		newer.push( r );
		if ( user !== target && others.indexOf( user ) === -1 ) {
			others.push( user );
		}
	} );

	return {
		latest: ( revs && revs[ 0 ] ) || null,
		restored: restored,
		newer: newer,
		others: others,
		reached: !!restored
	};
}

/** Resumo da reversão: $1 = autor da versão restaurada, $2 = usuário revertido, $3 = versão */
function revertSummary( tpl, restoredUser, target, oldId, comment ) {
	var s = tpl.split( '$1' ).join( restoredUser || '?' )
		.split( '$2' ).join( target )
		.split( '$3' ).join( String( oldId ) );

	return comment ? s + ' (' + comment + ')' : s;
}

ronda.warnings = {
	fill: fill,
	build: build,
	marker: marker,
	needsPage: needsPage,
	summaryFor: summaryFor,
	previous: previous,
	suggest: suggest,
	confirmations: confirmations
};

ronda.revert = {
	analyze: analyzeRevert,
	summary: revertSummary
};

/* ================================================================== *
 * Leituras
 * ================================================================== */

/** O usuário já está numa categoria de notificado que vale para este aviso? Devolve a entrada ou null */
function notified( item, talk ) {
	var cats = ( talk && talk.categories ) || [];

	return ( ronda.catalog.notifiedCategories || [] ).filter( function ( c ) {
		return cats.indexOf( c.category ) !== -1 && ( c.groups || [] ).indexOf( item.group ) !== -1;
	} )[ 0 ] || null;
}

function loadTalk( user ) {
	var title = talkTitle( user );

	// .then( first ) deixa só os dados (mw.Api resolve com dados + jqXHR)
	function first( data ) {
		return data;
	}

	return $.when(
		ronda.api.get( {
			action: 'query',
			titles: title,
			prop: 'revisions',
			rvprop: 'timestamp|comment',
			rvlimit: 50
		} ).then( first ),
		ronda.api.get( {
			action: 'query',
			titles: title,
			rvprop: 'content',
			rvslots: 'main',
			// Categorias de usuário já notificado (ex.: nome impróprio)
			prop: 'revisions|categories',
			clcategories: ( ronda.catalog.notifiedCategories || [] ).map( function ( c ) {
				return c.category;
			} ).join( '|' ) || undefined
		} ).then( first )
	).then( function ( a, b ) {
		var hist = a.query.pages[ 0 ],
			cur = b.query.pages[ 0 ];

		return {
			exists: !hist.missing,
			revisions: hist.revisions || [],
			text: cur.revisions ? cur.revisions[ 0 ].slots.main.content : '',
			categories: ( cur.categories || [] ).map( function ( c ) {
				return c.title;
			} )
		};
	} );
}

function loadRevertPlan( ctx ) {
	return ronda.api.get( {
		action: 'query',
		titles: ctx.page,
		prop: 'revisions',
		rvprop: 'ids|user|timestamp',
		rvlimit: 50,
		rvendid: ctx.oldId
	} ).then( function ( data ) {
		var page = data.query.pages[ 0 ];

		return analyzeRevert( page.revisions || [], ctx.oldId, ctx.targetUser );
	} );
}

/** rcid do link "Marcar como patrulhada" do diff, se houver */
function patrolRcid() {
	var href = $( '.patrollink a' ).first().attr( 'href' );

	return href ? mw.util.getParamValue( 'rcid', href ) : null;
}

/* ================================================================== *
 * Interface
 * ================================================================== */

function formatDate( time ) {
	return new Date( time ).toLocaleDateString( 'pt-BR' );
}

function userLinks( user ) {
	return $( '<span></span>' ).append(
		$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( talkTitle( user ) ) ).text( user ),
		' (',
		$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( 'Special:Contributions/' + user ) ).text( ronda.msg( 'patrulha-contribuicoes' ) ),
		')'
	);
}

/**
 * @param {Object} ctx
 * @param {string} mode 'revert' | 'warn'
 * @param {Object} talk Resultado de loadTalk()
 * @param {Object|null} plan Resultado de loadRevertPlan()
 */
/** "a", "a e b", "a, b e c" */
function listText( values ) {
	return values.length < 2 ? values.join( '' ) : values.slice( 0, -1 ).join( ', ' ) + ' e ' + values[ values.length - 1 ];
}

/** Campo de várias caixas de seleção (fields[].checks) dentro dos parâmetros de um aviso */
function checksField( f, $params ) {
	var $box = $( '<div class="ronda-checks"></div>' ),
		boxes = f.checks.map( function ( c ) {
			var cb = ronda.ui.checkbox( c[ 1 ], false );

			cb.$element.attr( 'title', c[ 2 ] || '' );
			cb.$input.on( 'change', function () {
				$box.removeClass( 'ui-state-error' );
			} );
			$box.append( cb.$element );
			return { value: c[ 0 ], cb: cb };
		} );

	$params.append( $( '<div class="ronda-row"></div>' ).append( $( '<label></label>' ).text( f.label ), $box ) );
	return {
		def: f,
		$input: $box,
		get: function () {
			return listText( boxes.filter( function ( b ) {
				return b.cb.isChecked();
			} ).map( function ( b ) {
				return b.value;
			} ) );
		}
	};
}

function showForm( ctx, mode, talk, plan ) {
	var $dlg, $revertBox, $warnBox, cbForce, cbRollback, cbPatrol, $comment, rcid, $revertNow,
		revertedEarly = false,
		user = ctx.targetUser,
		isIP = mw.util.isIPAddress( user ),
		now = Date.now(),
		days = cfg().window,
		canRevert = mode === 'revert' && plan && plan.reached && plan.newer.length > 0,
		rollbackable = canRevert && !plan.others.length && ronda.can( 'rollback' )
			&& plan.restored.user !== user,
		items = [],
		// Página do aviso: a da edição (diff, reversão, versão antiga), mesmo que seja uma página de usuário;
		// nas contribuições e ao só visitar a página ou a discussão do usuário, fica vazia
		$page = ronda.ui.text( ctx.ns !== -1 && ( ctx.type === 'diff' || ctx.type === 'rollback' || ctx.isRevision || [ 2, 3 ].indexOf( ctx.ns ) === -1 )
			? ctx.page : '', ronda.msg( 'patrulha-pagina-relacionada-ao-aviso' ) ),
		$filter = ronda.ui.text( '', ronda.msg( 'patrulha-filtrar-avisos' ) ),
		cbWelcome = ronda.ui.checkbox( ronda.msg( 'patrulha-incluir-boas-vindas', isIP ? ronda.catalog.welcome.ip : ronda.catalog.welcome.user ), !talk.exists ),
		$progress = $( '<div class="ronda-progress"></div>' ).hide(),
		$log = $( '<ul class="ronda-log"></ul>' ),
		$content = $( '<div></div>' );

	$content.append( ronda.ui.message( 'highlight', $( '<span></span>' ).append(
		document.createTextNode( ( isIP ? ronda.msg( 'patrulha-ip' ) : ronda.msg( 'patrulha-usuario' ) ) ),
		userLinks( user ),
		document.createTextNode( talk.exists ? '' : ronda.msg( 'patrulha-discussao-ainda-nao-criada' ) )
	) ) );

	/* ---------------- Reversão ---------------- */

	if ( mode === 'revert' ) {
		$revertBox = $( '<fieldset class="ui-widget-content ui-corner-all"></fieldset>' )
			.append( $( '<legend></legend>' ).text( ronda.msg( 'patrulha-reversao' ) ) );

		if ( !plan || !plan.reached ) {
			$revertBox.append( ronda.ui.message( 'error',
				ronda.msg( 'patrulha-ha-mais-de-50-edicoes-depois' ) ) );
		} else if ( !plan.newer.length ) {
			$revertBox.append( ronda.ui.message( 'highlight', ronda.msg( 'patrulha-a-versao-da-esquerda-ja-e' ) ) );
		} else {
			$revertBox.append( $( '<p></p>' ).append(
				document.createTextNode( ronda.msg( 'patrulha-desfaz-edicao-oes-e-volta-a', plan.newer.length ) ),
				$( '<b></b>' ).text( plan.restored.user || ronda.msg( 'patrulha-nome-oculto' ) ),
				document.createTextNode( ' de ' + formatDate( Date.parse( plan.restored.timestamp ) ) + '.' )
			) );

			if ( plan.others.length ) {
				cbForce = ronda.ui.checkbox( ronda.msg( 'patrulha-reverter-mesmo-assim-desfaz-tambem-as', plan.others.join( ', ' ) ), false );
				$revertBox.append(
					ronda.ui.message( 'error', ronda.msg( 'patrulha-depois-da-versao-da-esquerda-tambem', plan.others.join( ', ' ) ) ),
					cbForce.$element
				);
			}

			$comment = ronda.ui.text( '', ronda.msg( 'patrulha-acrescentado-ao-resumo-da-edicao' ) );
			$revertBox.append( ronda.ui.row( ronda.msg( 'patrulha-comentario-opcional' ), $comment ) );

			if ( rollbackable ) {
				cbRollback = ronda.ui.checkbox( ronda.msg( 'patrulha-usar-a-reversao-rapida-rollback' ), true );
				$revertBox.append( cbRollback.$element );
			}

			rcid = patrolRcid();
			if ( rcid ) {
				cbPatrol = ronda.ui.checkbox( ronda.msg( 'patrulha-marcar-a-edicao-como-patrulhada' ), ronda.config.revert.patrol );
				$revertBox.append( cbPatrol.$element );
			}

			// Reverte já, enquanto os avisos são escolhidos; o botão principal passa a só enviar os avisos
			$revertNow = $( '<button type="button" class="ui-button-red"></button>' )
				.text( ronda.msg( 'patrulha-reverter-agora' ) )
				.attr( 'title', ronda.msg( 'patrulha-reverter-agora-dica' ) )
				.button()
				.on( 'click', function () {
					revertNow();
				} );
			$revertBox.append( $( '<div class="ronda-refresh"></div>' ).append( $revertNow ) );
		}

		$content.append( $revertBox );
	}

	/* ---------------- Avisos ---------------- */

	$warnBox = $( '<fieldset class="ui-widget-content ui-corner-all"></fieldset>' )
		.append( $( '<legend></legend>' ).text( mode === 'revert' ? ronda.msg( 'patrulha-avisos-opcional' ) : ronda.msg( 'patrulha-avisos' ) ) );

	$warnBox.append( ronda.ui.row( ronda.msg( 'patrulha-pagina' ), $page ), ronda.ui.row( ronda.msg( 'patrulha-filtrar' ), $filter ) );

	( function () {
		var lastGroup = null,
			$group = null,
			// Favoritos: no topo; cada aviso marcado com a estrela sai do seu grupo e vem para cá
			$fav = $( '<fieldset class="ui-widget-content ui-corner-all ronda-warn-group ronda-warn-fav"></fieldset>' )
				.append( $( '<legend></legend>' ).text( ronda.msg( 'patrulha-favoritos' ) ) )
				.appendTo( $warnBox );

		/** Põe o aviso no fieldset certo, na ordem do catálogo */
		function place( $el ) {
			var $target = ronda.favorites.has( $el.data( 'id' ) ) ? $fav : $el.data( 'home' ),
				$next = $target.children( '.ronda-warn' ).filter( function () {
					return $( this ).data( 'order' ) > $el.data( 'order' );
				} ).first();

			if ( $next.length ) {
				$el.insertBefore( $next );
			} else {
				$el.appendTo( $target );
			}
		}

		ronda.catalog.warnings.forEach( function ( item, order ) {
			var cb, prev, sug, $params, $level, fields, report, vreport, k, $note, $star, done;

			if ( ( item.ip === true && !isIP ) || ( item.ip === false && isIP ) ) {
				return;
			}

			// Um fieldset por grupo do catálogo
			if ( item.group !== lastGroup ) {
				lastGroup = item.group;
				$group = $( '<fieldset class="ui-widget-content ui-corner-all ronda-warn-group"></fieldset>' )
					.append( $( '<legend></legend>' ).text( item.group ) )
					.appendTo( $warnBox );
			}

			prev = previous( item, talk.revisions, talk.text, now, days );
			sug = suggest( prev );
			done = notified( item, talk );

			cb = ronda.ui.checkbox( item.label + ( prev ? ' · ' + prev.level : '' ) + ( done ? ' · ' + ronda.msg( 'patrulha-ja-notificado' ) : '' ), false );
			$params = $( '<div class="ronda-tag-params"></div>' ).hide();

			if ( item.levels ) {
				$level = $( '<select class="ronda-level"></select>' );
				for ( k = 1; k <= 3; k++ ) {
					$( '<option></option>' ).val( k )
						.text( ronda.msg( 'patrulha-nivel', k, k === sug.level && prev ? ' (sugerido)' : '' ) )
						.appendTo( $level );
				}
				$level.val( sug.level );
				$params.append( $level );

				if ( prev ) {
					$note = $( '<div class="ronda-warn-note"></div>' ).text(
						ronda.msg( 'patrulha-ultimo-aviso-desta-serie-em', LEVEL_ORDINAL[ prev.level ], formatDate( prev.time ), prev.source === 'ronda' ? ronda.msg( 'patrulha-marca-do-ronda' ) : ronda.msg( 'patrulha-pelo-resumo-da-edicao' ) )
					);
					$params.append( $note );
				}
				if ( sug.block ) {
					$params.append( blockHint( ctx, item ) );
					// Notificação já preenchida em WP:Pedidos/Notificações de vandalismo
					vreport = ronda.ui.checkbox( ronda.msg( 'patrulha-notificar-em-pedido-preenchido', cfg().vandalismPage.replace( /^Wikipédia:/, 'WP:' ) ), !ronda.can( 'block' ) );
					$params.append( vreport.$element );
				}
			}

			fields = ( item.fields || [] ).map( function ( f ) {
				var $input;

				if ( f.checks ) {
					// Várias caixas: o valor é a lista dos marcados ("2.2, 3.1 e 3.5")
					return checksField( f, $params );
				}
				if ( f.options ) {
					$input = $( '<select></select>' );
					f.options.forEach( function ( o ) {
						$( '<option></option>' ).val( o[ 0 ] ).text( o[ 1 ] ).appendTo( $input );
					} );
					$params.append( ronda.ui.row( f.label, $input ) );
				} else {
					$input = ronda.ui.text( '', f.label );
					$params.append( $input );
				}
				return { def: f, $input: $input };
			} );

			if ( item.report ) {
				report = ronda.ui.checkbox( ronda.msg( 'patrulha-registrar-pedido-em-wp-pedidos-revisao' ), item.report === 'default' );
				$params.append( report.$element );
			}

			cb.$element
				.addClass( 'ronda-tag ronda-warn' + ( prev ? ' ronda-warn-prior' : '' ) + ( done ? ' ronda-warn-done' : '' ) )
				.attr( 'title', item.title + ( prev
					? ronda.msg( 'patrulha-ultimo-aviso-em', LEVEL_ORDINAL[ prev.level ], formatDate( prev.time ) )
					: '' ) + ( done ? ' — ' + ronda.msg( 'patrulha-ja-notificado-dica', done.category ) : '' ) )
				.data( 'search', normalize( item.label + ' ' + item.group + ' ' + item.title ) )
				.append( $params );

			if ( $params.children().length ) {
				cb.$input.on( 'change', function () {
					$params.toggle( cb.isChecked() );
					cb.$element.toggleClass( 'ronda-tag-open', cb.isChecked() );
				} );
			}

			$star = $( '<a href="#" role="button" class="ronda-fav"></a>' );
			function paintStar() {
				var on = ronda.favorites.has( item.id );

				$star.text( on ? '★' : '☆' ).attr( {
					title: on ? ronda.msg( 'patrulha-remover-dos-favoritos' ) : ronda.msg( 'patrulha-adicionar-aos-favoritos' ),
					'aria-pressed': String( on )
				} );
			}
			paintStar();
			$star.on( 'click', function ( e ) {
				e.preventDefault();
				ronda.favorites.toggle( item.id ).then( null, ronda.fail );
				paintStar();
				place( cb.$element );
				$filter.trigger( 'input' );
			} );
			cb.$element.children( 'label' ).after( $star );
			cb.$element.data( { id: item.id, order: order, home: $group } );

			place( cb.$element );
			items.push( { item: item, cb: cb, $level: $level, fields: fields, report: report, vreport: vreport } );
		} );
	}() );

	// Pré-seleção (ex.: reversão de vandalismo abre com "Vandalismo" marcado)
	items.forEach( function ( it ) {
		if ( ctx.preselect && it.item.id === ctx.preselect ) {
			it.cb.$input.prop( 'checked', true ).trigger( 'change' );
		}
	} );

	$warnBox.append( cbWelcome.$element );
	// Esconde os grupos vazios (os favoritos, se não houver nenhum)
	setTimeout( function () {
		$filter.trigger( 'input' );
	} );
	$content.append( $warnBox, $progress, $log );

	$filter.on( 'input', function () {
		var term = normalize( $filter.val() );

		$warnBox.find( '.ronda-warn' ).each( function () {
			$( this ).toggle( !term || $( this ).data( 'search' ).indexOf( term ) !== -1 );
		} );
		// Esconde os grupos que ficaram sem nenhum aviso visível
		$warnBox.children( '.ronda-warn-group' ).each( function () {
			$( this ).toggle( $( this ).children( '.ronda-warn' ).filter( function () {
				return this.style.display !== 'none';
			} ).length > 0 );
		} );
	} );

	/* ---------------- Execução ---------------- */

	function log( type, text ) {
		$( '<li></li>' ).addClass( type ? 'ui-state-' + type : '' ).text( text ).appendTo( $log );
	}

	function collect() {
		var ok = true,
			page = $page.val().trim(),
			chosen = [];

		items.forEach( function ( it ) {
			var values = { pagina: ronda.templateSafe( page ) },
				level = it.$level ? Number( it.$level.val() ) : null;

			if ( !it.cb.isChecked() ) {
				return;
			}

			if ( needsPage( it.item ) ) {
				ok = ronda.ui.require( $page, !!page ) && ok;
			}

			it.fields.forEach( function ( f ) {
				var v = String( ( f.get ? f.get() : f.$input.val() ) || '' ).trim();

				values[ f.def.key ] = ronda.templateSafe( v );
				if ( f.def.required ) {
					ok = ronda.ui.require( f.$input, !!v ) && ok;
				}
			} );

			chosen.push( {
				item: it.item,
				level: level,
				values: values,
				report: !!( it.report && it.report.isChecked() ),
				vreport: !!( it.vreport && it.vreport.isChecked() )
			} );
		} );

		return ok ? chosen : null;
	}

	/** Texto da edição na discussão: { top, parts, summary } */
	function warningEdit( chosen, welcome ) {
		var date = today(),
			built = function ( c ) {
				var t = build( c.item, c.level, c.values, { marker: cfg().marker, date: date } );

				return c.item.header ? '== ' + c.item.header + ' ==\n' + t : t;
			},
			// "top": no início da discussão (ex.: Vandalismo repetido), como no FastButtons
			top = chosen.filter( function ( c ) {
				return c.item.top;
			} ).map( built ),
			parts = chosen.filter( function ( c ) {
				return !c.item.top;
			} ).map( built ),
			summary = chosen.map( function ( c ) {
				return summaryFor( c.item, c.level );
			} ).join( '; ' );

		if ( welcome ) {
			parts.unshift( '{{subst:' + ( isIP ? ronda.catalog.welcome.ip : ronda.catalog.welcome.user ) + '}} ~~' + '~~' );
			summary = 'Bem vindo + ' + summary;
		}
		return { top: top, parts: parts, summary: summary };
	}

	/** Prévia dos avisos escolhidos, como ficarão na discussão */
	function preview() {
		var chosen = collect(),
			w;

		if ( !chosen || !chosen.length ) {
			mw.notify( ronda.msg( 'patrulha-escolha-ao-menos-um-aviso' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
			return;
		}
		w = warningEdit( chosen, cbWelcome.isChecked() );
		ronda.api.post( {
			action: 'parse',
			title: talkTitle( user ),
			text: w.top.concat( w.parts ).join( '\n\n' ),
			pst: true,
			prop: 'text',
			disablelimitreport: true,
			disableeditsection: true,
			formatversion: 2
		} ).then( function ( data ) {
			ronda.ui.dialog( {
				title: ronda.msg( 'patrulha-previa-titulo', talkTitle( user ) ),
				width: 760,
				content: $( '<div class="ronda-preview mw-parser-output"></div>' ).html( data.parse.text )
			} );
		}, ronda.fail );
	}

	/** Pede confirmação (aviso repetido em 24 h, discussão editada há menos de 1 min) */
	function confirmThen( chosen, go ) {
		var issues = chosen.length && cfg().confirm !== false ? confirmations( chosen, talk, Date.now() ) : [],
			$c;

		if ( !issues.length ) {
			go();
			return;
		}
		$c = ronda.ui.dialog( {
			title: ronda.msg( 'patrulha-confirmar' ),
			width: 480,
			content: ronda.ui.message( 'error', $( '<span></span>' ).append( issues.map( function ( t ) {
				return $( '<div></div>' ).text( t );
			} ), $( '<div></div>' ).text( ronda.msg( 'patrulha-enviar-mesmo-assim' ) ) ) ),
			buttons: [ { text: ronda.msg( 'patrulha-enviar-mesmo-assim-botao' ), 'class': 'ui-priority-primary ui-button-red', click: function () {
				ronda.ui.close( $c );
				go();
			} }, { text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $c );
			} } ]
		} );
	}

	function run() {
		var chosen = collect();

		if ( chosen ) {
			confirmThen( chosen, function () {
				execute( chosen );
			} );
		}
	}

	/** Tarefas da reversão (e da marcação como patrulhada) */
	function revertTasks() {
		var tasks = [];

		tasks.push( { critical: true, label: ronda.msg( 'patrulha-revertendo', ctx.page ), fn: function () {
			var useRollback = cbRollback && cbRollback.isChecked(),
				summary = revertSummary( useRollback ? ronda.config.revert.rollbackSummary : ronda.config.revert.summary,
					plan.restored.user, user, ctx.oldId, $comment.val().trim() );

			if ( useRollback ) {
				return ronda.api.postWithToken( 'rollback', ronda.params( {
					action: 'rollback',
					title: ctx.page,
					user: user,
					summary: summary,
					watchlist: ronda.config.watchlist
				} ) ).then( function () {
					return ronda.msg( 'patrulha-reversao-rapida' );
				} );
			}

			return ronda.post( {
				action: 'edit',
				title: ctx.page,
				undo: plan.latest.revid,
				undoafter: ctx.oldId,
				summary: summary,
				nocreate: true,
				watchlist: ronda.config.watchlist
			} ).then( function ( data ) {
				return data && data.edit && data.edit.nochange !== undefined ? ronda.msg( 'patrulha-nada-a-desfazer' ) : 'feito';
			} );
		} } );

		if ( cbPatrol && cbPatrol.isChecked() ) {
			tasks.push( { label: ronda.msg( 'patrulha-marcando-como-patrulhada' ), fn: function () {
				return ronda.api.postWithToken( 'patrol', { action: 'patrol', rcid: rcid } );
			} } );
		}

		return tasks;
	}

	/** "Reverter agora": só a reversão, antes dos avisos */
	function revertNow() {
		var tasks;

		if ( cbForce && !cbForce.isChecked() ) {
			ronda.ui.require( cbForce.$element, false );
			mw.notify( ronda.msg( 'patrulha-ha-edicoes-de-outras-pessoas-depois' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
			return;
		}
		tasks = revertTasks();
		$revertBox.find( 'input' ).prop( 'disabled', true );
		$revertNow.button( 'disable' );

		( function next( i ) {
			var task = tasks[ i ];

			if ( !task ) {
				revertedEarly = true;
				$revertNow.parent().replaceWith( ronda.ui.message( 'highlight', ronda.msg( 'patrulha-revertido-agora' ) ) );
				$dlg.dialog( 'widget' ).find( '.ui-dialog-buttonpane button' ).first().button( 'option', 'label', ronda.msg( 'patrulha-enviar-aviso' ) );
				return;
			}
			$.when( task.fn() ).then( function ( info ) {
				log( '', task.label + ': ' + ( typeof info === 'string' ? info : 'feito' ) );
				next( i + 1 );
			}, function ( code, data ) {
				log( 'error', task.label + ': ' + ( ( data && typeof data === 'object' && ronda.api.getErrorMessage )
					? ronda.api.getErrorMessage( data ).text() : code ) );
				if ( task.critical ) {
					$revertBox.find( 'input' ).prop( 'disabled', false );
					$revertNow.button( 'enable' );
				} else {
					next( i + 1 );
				}
			} );
		}( 0 ) );
	}

	function execute( chosen ) {
		var tasks = [],
			done = 0,
			doRevert = canRevert && !revertedEarly && ( !cbForce || cbForce.isChecked() ),
			welcome = chosen && chosen.length && cbWelcome.isChecked();

		if ( !chosen ) {
			return;
		}
		if ( canRevert && !revertedEarly && cbForce && !cbForce.isChecked() ) {
			ronda.ui.require( cbForce.$element, false );
			mw.notify( ronda.msg( 'patrulha-ha-edicoes-de-outras-pessoas-depois' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
			return;
		}
		if ( !doRevert && !chosen.length ) {
			mw.notify( ronda.msg( 'patrulha-escolha-ao-menos-um-aviso' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
			return;
		}

		if ( doRevert ) {
			tasks = tasks.concat( revertTasks() );
		}

		chosen.filter( function ( c ) {
			return c.report;
		} ).forEach( function () {
			tasks.push( { label: ronda.msg( 'patrulha-pedido-de-revisao-do-nome-de' ), fn: function () {
				return ronda.post( {
					action: 'edit',
					title: cfg().reportPage,
					appendtext: '\n\n{{subst:NUI|' + user + '}}',
					summary: 'Pedido: revisão do nome de usuário [[Special:Contributions/' + user + '|' + user + ']]',
					watchlist: ronda.config.watchlist
				} );
			} } );
		} );

		chosen.filter( function ( c ) {
			return c.vreport;
		} ).forEach( function ( c ) {
			tasks.push( { label: ronda.msg( 'patrulha-notificacao-de-vandalismo' ), fn: function () {
				return reportVandal( user, c, $page.val().trim() );
			} } );
		} );

		if ( chosen.length ) {
			tasks.push( { label: ronda.msg( 'patrulha-avisando', user ), fn: function () {
				var w = warningEdit( chosen, welcome );

				return ronda.post( $.extend( {
					action: 'edit',
					title: talkTitle( user ),
					summary: w.summary,
					watchlist: ronda.config.watchlist
				}, w.parts.length ? { appendtext: ( talk.exists ? '\n\n' : '' ) + w.parts.join( '\n\n' ) } : {},
				w.top.length ? { prependtext: w.top.join( '\n\n' ) + '\n\n' } : {} ) );
			} } );
		}

		ronda.ui.setBusy( $dlg, true );
		$dlg.find( 'input, select' ).prop( 'disabled', true );
		$progress.show().progressbar( { value: 0 } );

		( function next( i ) {
			var task = tasks[ i ];

			if ( !task ) {
				finish( true );
				return;
			}

			$.when( task.fn() ).then( function ( info ) {
				log( '', task.label + ': ' + ( typeof info === 'string' ? info : 'feito' ) );
				return true;
			}, function ( code, data ) {
				var msg = ( data && typeof data === 'object' && ronda.api.getErrorMessage )
					? ronda.api.getErrorMessage( data ).text()
					: code;

				log( 'error', task.label + ': ' + msg );
				return !task.critical;
			} ).then( function ( goOn ) {
				done++;
				$progress.progressbar( 'value', Math.round( done / tasks.length * 100 ) );
				if ( goOn ) {
					next( i + 1 );
				} else {
					log( 'error', ronda.msg( 'patrulha-processo-interrompido-a-reversao-falhou-entao' ) );
					finish( false );
				}
			} );
		}( 0 ) );
	}

	function finish( ok ) {
		mw.notify( ok ? ronda.msg( 'patrulha-concluido' ) : ronda.msg( 'patrulha-nao-concluido-veja-o-registro' ), {
			type: ok ? 'success' : 'error',
			title: ronda.msg( 'core-nome' )
		} );

		$dlg.dialog( 'option', 'buttons', [ {
			text: ronda.msg( 'patrulha-abrir-a-discussao-do-usuario' ),
			click: function () {
				location.href = mw.util.getUrl( talkTitle( user ) );
			}
		}, {
			text: mode === 'revert' ? ronda.msg( 'patrulha-abrir-a-pagina' ) : ronda.msg( 'core-fechar' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: function () {
				if ( mode === 'revert' ) {
					location.href = mw.util.getUrl( ctx.page );
				} else {
					ronda.ui.close( $dlg );
				}
			}
		} ] );
	}

	$dlg = ronda.ui.dialog( {
		title: ( mode === 'revert' ? ronda.msg( 'patrulha-reverter-titulo' ) : ronda.msg( 'patrulha-avisar-titulo' ) ) + user,
		width: 720,
		content: $content,
		buttons: [ {
			text: mode === 'revert' && canRevert ? ronda.msg( 'patrulha-reverter-botao' ) : ronda.msg( 'patrulha-enviar-aviso' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: run
		}, {
			text: ronda.msg( 'patrulha-previa-botao' ),
			click: preview
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );

	$dlg.tooltip( { tooltipClass: 'ronda-tooltip' } );
}

/**
 * Notificação em WP:Pedidos/Notificações de vandalismo a partir do modelo
 * <página>/Padrão (o mesmo do módulo Pedido).
 */
function reportVandal( user, c, page ) {
	var req = ( ronda.catalog.requests || [] ).filter( function ( r ) {
			return r.id === 'vandalismo';
		} )[ 0 ] || { target: 'user' },
		title = cfg().vandalismPage,
		text = 'Continua depois do terceiro aviso sobre ' + c.item.label.toLowerCase()
			+ ( page ? ' (em [[' + page + ']])' : '' ) + '.';

	return ronda.api.get( {
		action: 'query',
		titles: title + '/Padrão',
		prop: 'revisions',
		rvprop: 'content',
		rvslots: 'main'
	} ).then( function ( data ) {
		var p = data.query.pages[ 0 ],
			model = p.revisions ? p.revisions[ 0 ].slots.main.content : '',
			body = model && ronda.pageTools
				? ronda.pageTools.buildRequest( model, { request: req, target: user, text: text } )
				: '== [[Special:Contributions/' + user + '|' + user + ']] ==\n' + text + ' ~~' + '~~';

		return ronda.post( {
			action: 'edit',
			title: title,
			appendtext: '\n' + body,
			summary: 'Pedido: vandalismo — [[Special:Contributions/' + user + '|' + user + ']]',
			watchlist: ronda.config.watchlist
		} );
	} );
}

/** Sugestão de bloqueio depois do terceiro aviso */
function blockHint( ctx, item ) {
	var block = ronda.getModule( 'bloqueio' ),
		$msg = $( '<span></span>' ).text( ronda.msg( 'patrulha-ja-recebeu-o-terceiro-aviso-de', item.label, cfg().window ) );

	if ( block && block.isAvailable( ctx ) ) {
		$msg.append( $( '<button type="button"></button>' ).text( ronda.msg( 'patrulha-bloquear' ) ).button().on( 'click', function () {
			block.open( ctx );
		} ) );
	} else {
		$msg.append( $( '<a target="_blank"></a>' )
			.attr( 'href', mw.util.getUrl( cfg().vandalismPage ) )
			.text( ronda.msg( 'patrulha-notificar-vandalismo' ) ) );
	}

	return ronda.ui.message( 'error', $msg );
}

/** Pergunta o usuário quando o diff não o identifica (ex.: nome oculto) */
function askUser( ctx, done ) {
	var $user = ronda.ui.text( '', ronda.msg( 'patrulha-nome-de-usuario-ou-ip' ) ),
		$dlg;

	function ok() {
		var name = $user.val().trim().replace( /^(Usuário|User|Usuária)(\s+Discussão)?:/i, '' );

		if ( ronda.ui.require( $user, !!name ) ) {
			ronda.ui.close( $dlg );
			done( $.extend( {}, ctx, { targetUser: name.charAt( 0 ).toUpperCase() + name.slice( 1 ) } ) );
		}
	}

	$user.on( 'keydown', function ( e ) {
		if ( e.key === 'Enter' ) {
			ok();
		}
	} );
	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'patrulha-avisar-botao' ),
		width: 420,
		content: ronda.ui.row( ronda.msg( 'patrulha-usuario-a-avisar' ), $user ),
		buttons: [ { text: ronda.msg( 'patrulha-continuar' ), 'class': 'ui-priority-primary ui-button-blue', click: ok },
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
}

function open( ctx, mode ) {
	if ( !ctx.targetUser ) {
		askUser( ctx, function ( c ) {
			open( c, mode );
		} );
		return;
	}

	$.when(
		loadTalk( ctx.targetUser ),
		mode === 'revert' ? loadRevertPlan( ctx ) : null
	).then( function ( talk, plan ) {
		showForm( ctx, mode, talk, plan );
	}, ronda.fail );
}

function isOther( ctx ) {
	return !!ctx.targetUser && ctx.targetUser !== mw.config.get( 'wgUserName' );
}

ronda.registerModule( {
	id: 'reverter',
	label: ronda.msg( 'patrulha-reverter-botao' ),
	title: ronda.msg( 'patrulha-desfazer-as-edicoes-ate-a-versao' ),
	order: 4,
	isAvailable: function ( ctx ) {
		return ctx.type === 'diff'
			&& !!ctx.oldId
			&& isOther( ctx )
			&& ronda.can( 'edit' );
	},
	open: function ( ctx ) {
		open( ctx, 'revert' );
	}
} );

ronda.registerModule( {
	id: 'avisar',
	label: ronda.msg( 'patrulha-avisar-botao' ),
	title: ronda.msg( 'patrulha-enviar-avisos-ao-usuario-multipla-escolha' ),
	order: 6,
	isAvailable: function ( ctx ) {
		// Diff, reversão e versão antiga: sempre (o usuário é perguntado se não for identificado)
		if ( ctx.type === 'diff' || ctx.type === 'rollback' || ctx.isRevision ) {
			return ronda.can( 'edit' );
		}
		return isOther( ctx )
			&& ronda.can( 'edit' )
			&& ronda.isUserContext( ctx );
	},
	open: function ( ctx ) {
		open( ctx, 'warn' );
	}
} );

}( window.ronda ) );

/**
 * Ronda — painel do usuário
 *
 * Portado do botão "Usuário" do FastButtons. Em páginas e discussões de
 * usuário e em Especial:Contribuições, o botão Usuário abre (e fecha) uma
 * faixa dentro da barra do Ronda com:
 * - situação: não existe, bloqueado (até quando, por quem, motivo), travado globalmente;
 * - registro (ou primeira edição, para IPs e contas antigas sem data) e edições;
 * - grupos locais e globais, com o rótulo no gênero do usuário;
 * - avisos em série recebidos nos últimos dias (mesma detecção do Avisar);
 * - bloqueios anteriores, edições revertidas, páginas criadas (e quantas não
 *   existem mais), contribuições eliminadas;
 * - atividade: última edição, edições em 24 h e 7 dias, domínios mais editados;
 * - data em que cada grupo local atual foi atribuído (ligação para o registro);
 * - links para contribuições, registros e bloqueios; CheckUser (para quem pode);
 * - IPs: faixa /24 ou /64, bloqueio global, ferramentas externas e IPInfo;
 * - atalhos "enviar aviso", "bloquear", "reverter todas no topo" e
 *   "eliminar as criadas" (abre o Lote).
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

var DAY = 864e5,
	// [ masculino, feminino, desconhecido ] e, opcionalmente, página de pedidos
	GROUPS = {
		sysop: [ 'Administrador', 'Administradora', 'Administrador(a)', 'Administradores/Pedidos de aprovação' ],
		bureaucrat: [ 'Burocrata', 'Burocrata', 'Burocrata', 'Burocratas/Pedidos de aprovação' ],
		checkuser: [ 'Verificador de contas', 'Verificadora de contas', 'Verificador(a) de contas', 'Verificadores de contas/Candidaturas' ],
		suppress: [ 'Supressor', 'Supressora', 'Supressor(a)', 'Supressores/Candidaturas' ],
		'interface-admin': [ 'Administrador de interface', 'Administradora de interface', 'Administrador(a) de interface',
			'Administradores de interface/Pedidos de aprovação' ],
		eliminator: [ 'Eliminador', 'Eliminadora', 'Eliminador(a)', 'Eliminadores/Pedidos de aprovação' ],
		bot: [ 'Robô', 'Robô', 'Robô', 'Robôs/Pedidos de aprovação' ],
		rollbacker: [ 'Reversor', 'Reversora', 'Reversor(a)' ],
		autoreviewer: [ 'Autorrevisor', 'Autorrevisora', 'Autorrevisor(a)' ],
		reviewer: [ 'Revisor', 'Revisora', 'Revisor(a)' ],
		patroller: [ 'Patrulhador', 'Patrulhadora', 'Patrulhador(a)' ],
		accountcreator: [ 'Criador de conta', 'Criadora de conta', 'Criador(a) de conta' ],
		'ipblock-exempt': [ 'Isento de bloqueio de IP', 'Isenta de bloqueio de IP', 'Isento(a) de bloqueio de IP' ],
		'event-organizer': [ 'Organizador de eventos', 'Organizadora de eventos', 'Organizador(a) de eventos' ],
		extendedconfirmed: [ 'Confirmado estendido', 'Confirmada estendida', 'Confirmado(a) estendido(a)' ],
		autoextendedconfirmed: [ 'Autoconfirmado estendido', 'Autoconfirmada estendida', 'Autoconfirmado(a) estendido(a)' ],
		confirmed: [ 'Confirmado', 'Confirmada', 'Confirmado(a)' ],
		autoconfirmed: [ 'Autoconfirmado', 'Autoconfirmada', 'Autoconfirmado(a)' ],
		// Globais
		steward: [ 'Steward', 'Steward', 'Steward' ],
		'global-sysop': [ 'Administrador global', 'Administradora global', 'Administrador(a) global' ],
		'global-rollbacker': [ 'Reversor global', 'Reversora global', 'Reversor(a) global' ],
		'global-ipblock-exempt': [ 'Isento global de bloqueio de IP', 'Isenta global de bloqueio de IP', 'Isento(a) global de bloqueio de IP' ],
		'global-bot': [ 'Robô global', 'Robô global', 'Robô global' ],
		'global-deleter': [ 'Eliminador global', 'Eliminadora global', 'Eliminador(a) global' ],
		'global-flow-create': [ 'Criador global de discussões', 'Criadora global de discussões', 'Criador(a) global de discussões' ],
		'global-interface-editor': [ 'Editor global de interface', 'Editora global de interface', 'Editor(a) global de interface' ],
		'global-temporary-account-viewer': [ 'Visualizador global de IP de contas temporárias', 'Visualizadora global de IP de contas temporárias', 'Visualizador(a) global de IP de contas temporárias' ],
		'abusefilter-helper': [ 'Ajudante do filtro de edições', 'Ajudante do filtro de edições', 'Ajudante do filtro de edições' ],
		'abusefilter-maintainer': [ 'Mantenedor do filtro de edições', 'Mantenedora do filtro de edições', 'Mantenedor(a) do filtro de edições' ],
		apihighlimits: [ 'Solicitante de limite elevado da API', 'Solicitante de limite elevado da API', 'Solicitante de limite elevado da API' ],
		'captcha-exempt': [ 'Isento de CAPTCHA', 'Isenta de CAPTCHA', 'Isento(a) de CAPTCHA' ],
		founder: [ 'Fundador', 'Fundadora', 'Fundador(a)' ],
		'local-bot': [ 'Robô local', 'Robô local', 'Robô local' ],
		'new-wikis-importer': [ 'Importador de novas wikis', 'Importadora de novas wikis', 'Importador(a) de novas wikis' ],
		ombuds: [ 'Membro da Comissão de Ouvidoria', 'Membra da Comissão de Ouvidoria', 'Membro(a) da Comissão de Ouvidoria' ],
		'recursive-export': [ 'Exportador recursivo', 'Exportadora recursiva', 'Exportador(a) recursivo(a)' ],
		staff: [ 'Funcionário da Fundação Wikimedia', 'Funcionária da Fundação Wikimedia', 'Funcionário(a) da Fundação Wikimedia' ],
		sysadmin: [ 'Administrador de sistemas', 'Administradora de sistemas', 'Administrador(a) de sistemas' ],
		'vrt-permissions': [ 'Agente VRT', 'Agente VRT', 'Agente VRT' ],
		'u4c-member': [ 'Membro do Comitê de Coordenação do Código Universal de Conduta', 'Membra do Comitê de Coordenação do Código Universal de Conduta', 'Membro(a) do Comitê de Coordenação do Código Universal de Conduta' ],
		'wmf-researcher': [ 'Pesquisador da Fundação Wikimedia', 'Pesquisadora da Fundação Wikimedia', 'Pesquisador(a) da Fundação Wikimedia' ],
		'wmf-email-block-override': [ 'Isento de restrições de e-mail da Fundação Wikimedia', 'Isenta de restrições de e-mail da Fundação Wikimedia', 'Isento(a) de restrições de e-mail da Fundação Wikimedia' ],
		'wmf-antiabuse-restricted': [ 'Acesso restrito anti abuso da Fundação Wikimedia', 'Acesso restrito anti abuso da Fundação Wikimedia', 'Acesso restrito anti abuso da Fundação Wikimedia' ],
		'wmf-legal': [ 'Equipe jurídica da Fundação Wikimedia', 'Equipe jurídica da Fundação Wikimedia', 'Equipe jurídica da Fundação Wikimedia' ]	},
	HIDDEN = [ '*', 'user', 'temp' ];

/* ================================================================== *
 * Funções puras
 * ================================================================== */

function genderIndex( gender ) {
	return { male: 0, female: 1 }[ gender ] !== undefined ? { male: 0, female: 1 }[ gender ] : 2;
}

/**
 * Grupos para exibição, em ordem alfabética. "Autoconfirmado" só aparece
 * quando é o único grupo, como no FastButtons.
 * @return {Array} [ { name, label, page } ]
 */
function groupList( local, global, gender ) {
	var idx = genderIndex( gender ),
		seen = {},
		list = ( local || [] ).concat( global || [] ).filter( function ( g ) {
			if ( HIDDEN.indexOf( g ) !== -1 || seen[ g ] ) {
				return false;
			}
			seen[ g ] = true;
			return true;
		} ).map( function ( g ) {
			var e = GROUPS[ g ];

			return {
				name: g,
				label: e ? e[ idx ] : g,
				page: e && e[ 3 ] ? 'Wikipédia:' + e[ 3 ] : null,
				local: ( local || [] ).indexOf( g ) !== -1
			};
		} ).sort( function ( a, b ) {
			return a.label.localeCompare( b.label, 'pt' );
		} );

	if ( list.length > 1 ) {
		list = list.filter( function ( g ) {
			return g.name !== 'autoconfirmed';
		} );
	}
	return list;
}

/**
 * Avisos em série recebidos na janela de dias, do mais recente ao mais antigo.
 * Usa a mesma detecção do Avisar (marcas ocultas e resumos do DiffTools).
 * @return {Array} [ { item, level, time } ]
 */
function recentWarnings( talk, now, days ) {
	if ( !ronda.warnings || !ronda.catalog.warnings ) {
		return [];
	}

	return ronda.catalog.warnings.map( function ( item ) {
		var prev = ronda.warnings.previous( item, talk.revisions, talk.text, now, days );

		return prev ? { item: item, level: prev.level, time: prev.time } : null;
	} ).filter( Boolean ).sort( function ( a, b ) {
		return b.time - a.time;
	} );
}

/**
 * Junta as respostas da API num resumo único.
 * @param {Object} q data.query
 * @param {boolean} isIP
 * @return {Object} { missing, editcount, more, registration, firstEdit, gender, groups, block, locked }
 */
function summarize( q, isIP ) {
	var u, contribs = q.usercontribs || [],
		block = ( q.blocks || [] )[ 0 ],
		gui = q.globaluserinfo || {};

	if ( isIP ) {
		return {
			missing: false,
			editcount: contribs.length,
			more: !!q.more,
			registration: null,
			firstEdit: contribs[ 0 ] ? contribs[ 0 ].timestamp : null,
			gender: 'unknown',
			groups: [],
			block: block ? {
				expiry: block.expiry,
				by: block.by,
				reason: block.reason,
				partial: !!block.partial || !$.isEmptyObject( block.restrictions || {} ),
				range: block.user
			} : null,
			locked: false
		};
	}

	u = ( q.users || [] )[ 0 ] || { missing: true };
	if ( u.missing || u.invalid ) {
		return { missing: true };
	}

	return {
		missing: false,
		editcount: u.editcount,
		more: false,
		registration: u.registration || null,
		firstEdit: contribs[ 0 ] ? contribs[ 0 ].timestamp : null,
		gender: u.gender || 'unknown',
		groups: groupList( u.groups, gui.groups, u.gender ),
		block: u.blockid ? { expiry: u.blockexpiry, by: u.blockedby, reason: u.blockreason, partial: !!u.blockpartial } : null,
		locked: gui.locked !== undefined && gui.locked !== false
	};
}

/** Expande um IPv6 abreviado para 8 blocos */
function expandIPv6( ip ) {
	var parts = ip.split( '::' ),
		head = parts[ 0 ] ? parts[ 0 ].split( ':' ) : [],
		tail = parts.length > 1 && parts[ 1 ] ? parts[ 1 ].split( ':' ) : [],
		fill = [],
		i;

	for ( i = head.length + tail.length; i < 8; i++ ) {
		fill.push( '0' );
	}
	return ( parts.length > 1 ? head.concat( fill, tail ) : head ).map( function ( h ) {
		return h.toLowerCase().replace( /^0+(?=.)/, '' );
	} );
}

/** Faixa usual do IP: /24 (IPv4) ou /64 (IPv6); null para faixas e contas */
function ipRange( ip ) {
	if ( !ip || ip.indexOf( '/' ) !== -1 ) {
		return null;
	}
	if ( mw.util.isIPv4Address( ip ) ) {
		return ip.split( '.' ).slice( 0, 3 ).join( '.' ) + '.0/24';
	}
	if ( mw.util.isIPv6Address( ip ) ) {
		return expandIPv6( ip ).slice( 0, 4 ).join( ':' ) + '::/64';
	}
	return null;
}

/**
 * Atividade a partir das contribuições (mais recentes primeiro).
 * @return {Object} { last, day, week, full, namespaces: [ [ ns, n ] ], reverted, sample, top: [ títulos ] }
 */
function activity( contribs, now ) {
	var byNs = {},
		sample = contribs.slice( 0, 100 ),
		out = {
			last: contribs[ 0 ] ? contribs[ 0 ].timestamp : null,
			day: 0,
			week: 0,
			full: contribs.length >= 500,
			reverted: 0,
			sample: sample.length,
			top: []
		};

	contribs.forEach( function ( c ) {
		var age = now - Date.parse( c.timestamp );

		out.day += age <= 864e5 ? 1 : 0;
		out.week += age <= 7 * 864e5 ? 1 : 0;
		byNs[ c.ns ] = ( byNs[ c.ns ] || 0 ) + 1;
		if ( c.top && out.top.indexOf( c.title ) === -1 ) {
			out.top.push( c.title );
		}
	} );
	sample.forEach( function ( c ) {
		out.reverted += ( c.tags || [] ).indexOf( 'mw-reverted' ) !== -1 ? 1 : 0;
	} );
	out.namespaces = Object.keys( byNs ).map( function ( ns ) {
		return [ Number( ns ), byNs[ ns ] ];
	} ).sort( function ( a, b ) {
		return b[ 1 ] - a[ 1 ];
	} );
	return out;
}

/**
 * Bloqueios anteriores no registro (mais recentes primeiro).
 * @return {Object} { count, last: { timestamp, by, duration, reason, action } | null }
 */
function blockHistory( events ) {
	var blocks = ( events || [] ).filter( function ( e ) {
			return e.action === 'block' || e.action === 'reblock';
		} ),
		last = blocks[ 0 ];

	return {
		count: blocks.filter( function ( e ) {
			return e.action === 'block';
		} ).length,
		last: last ? {
			timestamp: last.timestamp,
			by: last.user,
			duration: ( last.params || {} ).duration || '',
			expiry: ( last.params || {} ).expiry || '',
			reason: last.comment || '',
			action: last.action
		} : null
	};
}

/**
 * Quando cada grupo atual foi atribuído: a entrada mais recente do registro de
 * permissões em que o grupo passou a constar.
 * @return {Object} { grupo: timestamp }
 */
function groupDates( events, groups ) {
	var out = {};

	function names( list ) {
		return ( list || [] ).map( function ( g ) {
			return g && g.group ? g.group : g;
		} );
	}

	( events || [] ).forEach( function ( e ) {
		var pr = e.params || {},
			before = names( pr.oldgroups ),
			after = names( pr.newgroups );

		groups.forEach( function ( g ) {
			if ( !out[ g ] && after.indexOf( g ) !== -1 && before.indexOf( g ) === -1 ) {
				out[ g ] = e.timestamp;
			}
		} );
	} );
	return out;
}

/**
 * Duração de bloqueio do registro ("3 weeks", "1 day 12 hours", "infinite") em português.
 * O registro guarda o texto digitado no formulário, em inglês; o que não for reconhecido
 * vira a data de expiração (se houver) ou fica como veio.
 */
function durationText( duration, expiry ) {
	var units = {
			second: 'patrulha-duracao-second', sec: 'patrulha-duracao-second',
			minute: 'patrulha-duracao-minute', min: 'patrulha-duracao-minute',
			hour: 'patrulha-duracao-hour', day: 'patrulha-duracao-day',
			week: 'patrulha-duracao-week', fortnight: 'patrulha-duracao-fortnight',
			month: 'patrulha-duracao-month', year: 'patrulha-duracao-year'
		},
		parts = [],
		ok = true,
		rest;

	duration = String( duration || '' ).trim();
	if ( !duration ) {
		return '';
	}
	if ( /^(infinit|indefinit|never)/i.test( duration ) ) {
		return ronda.msg( 'patrulha-duracao-indefinido' );
	}
	rest = duration.replace( /(\d+(?:[.,]\d+)?)\s*([a-z]+?)s?\b/gi, function ( m, n, u ) {
		u = u.toLowerCase();
		if ( !units[ u ] ) {
			ok = false;
			return m;
		}
		parts.push( ronda.msg( units[ u ], n.replace( '.', ',' ) ) );
		return '';
	} ).replace( /\s+|,|\band\b/gi, '' );

	if ( ok && parts.length && !rest ) {
		return parts.length > 1 ? parts.slice( 0, -1 ).join( ', ' ) + ' e ' + parts[ parts.length - 1 ] : parts[ 0 ];
	}
	if ( expiry && !/^infinit/.test( expiry ) && !isNaN( Date.parse( expiry ) ) ) {
		return ronda.msg( 'patrulha-ate', new Date( expiry ).toLocaleString( 'pt-BR' ) );
	}
	return duration;
}

/**
 * Resumo do registro do filtro de abusos na janela de dias.
 * @param {Array} entries list=abuselog, do mais recente ao mais antigo
 * @return {Object} { count, disallowed, warned, entries }
 */
function abuseSummary( entries, now, days ) {
	var since = now - days * 864e5,
		list = ( entries || [] ).filter( function ( e ) {
			return Date.parse( e.timestamp ) >= since;
		} );

	function has( e, re ) {
		return re.test( e.result || '' );
	}

	return {
		count: list.length,
		disallowed: list.filter( function ( e ) {
			return has( e, /\b(disallow|block|blockautopromote|degroup)\b/ );
		} ).length,
		warned: list.filter( function ( e ) {
			return has( e, /\bwarn\b/ ) && !has( e, /\b(disallow|block|degroup)\b/ );
		} ).length,
		entries: list
	};
}

/**
 * Bloqueios locais em outras wikis (meta=globaluserinfo, guiprop=merged).
 * @return {Array} [ { wiki, url, expiry, reason } ]
 */
function otherWikiBlocks( merged, currentWiki ) {
	return ( merged || [] ).filter( function ( w ) {
		return w.blocked && w.wiki !== currentWiki;
	} ).map( function ( w ) {
		return {
			wiki: w.wiki,
			url: w.url,
			host: String( w.url || w.wiki ).replace( /^https?:\/\//, '' ).replace( /\.org$/, '' ),
			expiry: w.blocked.expiry,
			reason: w.blocked.reason || ''
		};
	} );
}

/** Edições das contribuições carregadas com conteúdo ou resumo ocultado */
function hiddenEdits( contribs ) {
	var list = ( contribs || [] ).filter( function ( c ) {
		return c.texthidden || c.commenthidden;
	} );

	return {
		count: list.length,
		suppressed: list.filter( function ( c ) {
			return c.suppressed;
		} ).length
	};
}

ronda.userInfo = {
	durationText: durationText,
	abuseSummary: abuseSummary,
	otherWikiBlocks: otherWikiBlocks,
	hiddenEdits: hiddenEdits,
	groupList: groupList,
	recentWarnings: recentWarnings,
	summarize: summarize,
	ipRange: ipRange,
	activity: activity,
	blockHistory: blockHistory,
	groupDates: groupDates
};

/* ================================================================== *
 * Leituras
 * ================================================================== */

function first( data ) {
	return data;
}

function loadUser( user, isIP ) {
	var params = isIP ? {
		action: 'query',
		list: 'usercontribs|blocks',
		uclimit: 500,
		ucdir: 'newer',
		ucprop: 'timestamp',
		bkip: user,
		bkprop: 'user|by|expiry|reason|restrictions',
		bklimit: 1
	} : {
		action: 'query',
		list: 'users|usercontribs',
		ususers: user,
		usprop: 'editcount|registration|groups|blockinfo|gender',
		ucuser: user,
		uclimit: 1,
		ucdir: 'newer',
		ucprop: 'timestamp',
		meta: 'globaluserinfo',
		guiuser: user,
		guiprop: 'groups'
	};

	if ( isIP && user.indexOf( '/' ) !== -1 ) {
		params.uciprange = user;
	} else {
		params.ucuser = user;
	}

	return ronda.api.get( params ).then( function ( data ) {
		var q = data.query || {};

		q.more = !!( data[ 'continue' ] && data[ 'continue' ].uccontinue );
		return summarize( q, isIP );
	} );
}

/** Resolve com os dados ou null; nunca rejeita (cada informação extra é opcional) */
function soft( promise ) {
	return promise.then( function ( d ) {
		return d;
	}, function () {
		return $.Deferred().resolve( null ).promise();
	} );
}

/**
 * Informações extras do painel: contribuições recentes, bloqueios anteriores,
 * páginas criadas, contribuições eliminadas, permissões e bloqueio global.
 */
function loadExtra( user, isIP ) {
	var userPage = mw.config.get( 'wgFormattedNamespaces' )[ 2 ] + ':' + user,
		isRange = user.indexOf( '/' ) !== -1,
		contribs = {
			action: 'query',
			list: 'usercontribs',
			uclimit: 500,
			ucprop: 'ids|title|timestamp|tags|flags|comment'
		},
		abuseDays = 30,
		global = { action: 'query', list: 'globalblocks', bgprop: 'target|address|by|expiry|reason|range', bglimit: 1 };

	contribs[ isRange ? 'uciprange' : 'ucuser' ] = user;
	global[ isIP ? 'bgip' : 'bgtargets' ] = user;

	return $.when(
		soft( ronda.api.get( contribs ) ),
		isRange ? null : soft( ronda.api.get( { action: 'query', list: 'logevents', letype: 'block', letitle: userPage,
			lelimit: 50, leprop: 'type|timestamp|user|details|comment' } ) ),
		isRange ? null : soft( ronda.api.get( { action: 'query', list: 'logevents', letype: 'create', leuser: user,
			lelimit: 500, leprop: 'title' } ) ),
		isRange || !ronda.can( 'deletedhistory' ) ? null : soft( ronda.api.get( { action: 'query', list: 'alldeletedrevisions',
			adruser: user, adrlimit: 500, adrprop: 'ids' } ) ),
		isIP ? null : soft( ronda.api.get( { action: 'query', list: 'logevents', letype: 'rights', letitle: userPage,
			lelimit: 50, leprop: 'timestamp|details' } ) ),
		soft( ronda.api.get( global ) ),
		isRange ? null : soft( ronda.api.get( { action: 'query', list: 'abuselog', afluser: user, afllimit: 50,
			aflend: new Date( Date.now() - abuseDays * 864e5 ).toISOString(),
			aflprop: 'ids|filter|title|action|result|timestamp|hidden' } ) ),
		isIP ? null : soft( ronda.api.get( { action: 'query', meta: 'globaluserinfo', guiuser: user, guiprop: 'merged' } ) )
	).then( function ( uc, blk, created, deleted, rights, gb, afl, gui ) {
		var titles = ( created && created.query.logevents || [] ).map( function ( e ) {
				return e.title;
			} ).filter( function ( t, i, a ) {
				return t && a.indexOf( t ) === i;
			} ),
			adr = deleted && deleted.query.alldeletedrevisions || [],
			out = {
				contribs: uc ? uc.query.usercontribs || [] : null,
				blocks: blk ? blockHistory( blk.query.logevents ) : null,
				created: created ? { total: titles.length, missing: 0, existing: [] } : null,
				deleted: deleted ? adr.reduce( function ( n, p ) {
					return n + ( p.revisions || [] ).length;
				}, 0 ) : null,
				deletedMore: !!( deleted && deleted[ 'continue' ] ),
				rights: rights ? rights.query.logevents || [] : null,
				globalBlock: gb && gb.query && ( gb.query.globalblocks || [] )[ 0 ] || null,
				abuse: afl && afl.query ? $.extend( abuseSummary( afl.query.abuselog, Date.now(), abuseDays ), {
					days: abuseDays,
					more: !!afl[ 'continue' ]
				} ) : null,
				otherBlocks: gui && gui.query && gui.query.globaluserinfo ?
					otherWikiBlocks( gui.query.globaluserinfo.merged, mw.config.get( 'wgDBname' ) ) : null,
				hidden: uc ? hiddenEdits( uc.query.usercontribs ) : null
			};

		if ( !titles.length ) {
			return out;
		}

		// Quais ainda existem (até 200 títulos, em lotes de 50)
		return ronda.sequence( [ 0, 50, 100, 150 ].filter( function ( i ) {
			return i < titles.length;
		} ), function ( i ) {
			return ronda.api.get( { action: 'query', prop: 'info', titles: titles.slice( i, i + 50 ).join( '|' ) } ).then( function ( d ) {
				( d.query.pages || [] ).forEach( function ( p ) {
					if ( p.missing ) {
						out.created.missing++;
					} else if ( !p.invalid ) {
						out.created.existing.push( p.title );
					}
				} );
			} );
		} ).then( function () {
			return out;
		} );
	} );
}

function loadTalk( user ) {
	var title = mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + user;

	return $.when(
		ronda.api.get( { action: 'query', titles: title, prop: 'revisions', rvprop: 'timestamp|comment', rvlimit: 50 } ).then( first ),
		ronda.api.get( { action: 'query', titles: title, prop: 'revisions', rvprop: 'content', rvslots: 'main' } ).then( first )
	).then( function ( a, b ) {
		var hist = a.query.pages[ 0 ],
			cur = b.query.pages[ 0 ];

		return {
			exists: !hist.missing,
			revisions: hist.revisions || [],
			text: cur.revisions ? cur.revisions[ 0 ].slots.main.content : ''
		};
	} );
}

/* ================================================================== *
 * Interface
 * ================================================================== */

function formatDate( ts ) {
	return new Date( ts ).toLocaleDateString( 'pt-BR' );
}

function link( title, text, params ) {
	return $( '<a></a>' ).attr( 'href', mw.util.getUrl( title, params ) ).text( text );
}

function expiryText( expiry ) {
	return /^infinit/.test( expiry || '' ) ? ronda.msg( 'patrulha-sem-prazo' ) : ronda.msg( 'patrulha-ate', new Date( expiry ).toLocaleString( 'pt-BR' ) );
}

/** [[alvo|texto]] → texto, [[alvo]] → alvo (motivos de bloqueio vêm em wikitexto) */
function plain( text ) {
	return String( text || '' )
		.replace( /\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1' )
		.replace( /\[\[([^\]]+)\]\]/g, '$1' );
}

/** Link que abre um módulo do Ronda */
function action( mod, ctx, text ) {
	return $( '<a href="#" role="button"></a>' )
		.addClass( 'ronda-up-action' + ( mod.admin ? ' ronda-up-admin' : '' ) )
		.text( text )
		.attr( 'title', mod.title || '' )
		.on( 'click', function ( e ) {
			e.preventDefault();
			mod.open( ctx );
		} );
}

function sep() {
	return document.createTextNode( ' · ' );
}

/** Diálogo: reverter (rollback) as edições do usuário que ainda estão no topo */
function rollbackAll( user, titles ) {
	var items = titles.map( function ( t ) {
			return { title: t, cb: ronda.ui.checkbox( t, true ) };
		} ),
		$list = $( '<div class="ui-widget-content ui-corner-all ronda-list"></div>' ),
		$progress = $( '<div class="ronda-progress"></div>' ).hide(),
		$log = $( '<ul class="ronda-log"></ul>' ),
		summary = ( ronda.config.revert.rollbackSummary || '' ).split( '$2' ).join( user ),
		$dlg;

	items.forEach( function ( it ) {
		$list.append( it.cb.$element );
	} );

	function submit() {
		var chosen = items.filter( function ( it ) {
			return it.cb.isChecked();
		} );

		if ( !chosen.length ) {
			return;
		}
		ronda.ui.runner( $dlg, $progress, $log, function ( code ) {
			return { alreadyrolled: ronda.msg( 'patrulha-outra-pessoa-ja-editou-depois' ), onlyauthor: ronda.msg( 'patrulha-o-usuario-e-o-unico-autor' ) }[ code ] || code;
		} )( chosen.map( function ( it ) {
			return { label: ronda.msg( 'patrulha-revertendo', it.title ), fn: function () {
				return ronda.api.postWithToken( 'rollback', ronda.params( {
					action: 'rollback',
					title: it.title,
					user: user,
					summary: summary,
					watchlist: ronda.config.watchlist
				} ) );
			} };
		} ), function () {
			mw.notify( ronda.msg( 'patrulha-reversoes-concluidas-veja-o-registro' ), { title: ronda.msg( 'core-nome' ) } );
			ronda.ui.finishButtons( $dlg, false );
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'patrulha-reverter-todas-as-edicoes-de-no', user ),
		width: 620,
		content: $( '<div></div>' ).append(
			ronda.ui.message( 'highlight', $( '<span></span>' ).text( ronda.msg( 'patrulha-pagina-s-em-que-a-ultima', titles.length, user ) ) ),
			$list, $progress, $log
		),
		buttons: [ { text: ronda.msg( 'patrulha-reverter-botao' ), 'class': 'ui-priority-primary ui-button-red', click: submit },
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
}

/** Informações do IP pela extensão IPInfo (o acesso fica registrado; só ao clicar) */
function ipInfo( revid, $out ) {
	$out.text( ronda.msg( 'patrulha-consultando' ) );
	$.ajax( {
		url: mw.util.wikiScript( 'rest' ) + '/ipinfo/v0/revision/' + revid + '?dataContext=infobox&language=' + mw.config.get( 'wgUserLanguage' ),
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify( { token: mw.user.tokens.get( 'csrfToken' ) } )
	} ).then( function ( res ) {
		var parts = [];

		( res && res.info || [] ).forEach( function ( entry ) {
			$.each( entry.data || {}, function ( source, d ) {
				var loc = ( d.location || [] ).map( function ( l ) {
						return l.label;
					} ),
					proxies = $.map( d.proxyType || {}, function ( on, k ) {
						return on ? k : null;
					} );

				if ( loc.length ) {
					parts.push( ronda.msg( 'patrulha-local', loc.join( ', ' ) ) );
				}
				if ( d.country && d.country.length ) {
					parts.push( ronda.msg( 'patrulha-pais', d.country.map( function ( c ) {
						return c.label || c;
					} ).join( ', ' ) ) );
				}
				if ( d.isp ) {
					parts.push( ronda.msg( 'patrulha-provedor', d.isp ) );
				}
				if ( d.organization ) {
					parts.push( ronda.msg( 'patrulha-organizacao', d.organization ) );
				}
				if ( d.asn ) {
					parts.push( ronda.msg( 'patrulha-asn', d.asn ) );
				}
				if ( d.connectionType ) {
					parts.push( ronda.msg( 'patrulha-conexao', d.connectionType ) );
				}
				if ( d.userType ) {
					parts.push( ronda.msg( 'patrulha-tipo', d.userType ) );
				}
				if ( proxies.length ) {
					parts.push( ronda.msg( 'patrulha-proxy', proxies.join( ', ' ) ) );
				}
			} );
		} );
		$out.text( parts.length ? parts.join( ' · ' ) : ronda.msg( 'patrulha-sem-informacoes-para-este-ip' ) );
	}, function ( xhr ) {
		var r = xhr && xhr.responseJSON,
			msg = r && r.messageTranslations && ( r.messageTranslations.pt || r.messageTranslations.en );

		$out.text( ronda.msg( 'patrulha-nao-foi-possivel-consultar', msg || ( r && r.message ) || ( xhr && xhr.status ) || 'erro' ) );
	} );
}

var panelLayout = ronda.ui.panelLayout,
	addTo = ronda.ui.addTo;

function render( $panel, ctx, user, isIP, info, talk, extra ) {
	var days = ( ronda.config.warnings && ronda.config.warnings.window ) || 30,
		warns = recentWarnings( talk, Date.now(), days ),
		avisar = ronda.getModule( 'avisar' ),
		bloquear = ronda.getModule( 'bloqueio' ),
		L = panelLayout(),
		when, editcount, dates, $status, $facts, $warn, $actions, $view;

	$panel.empty();

	if ( info.missing ) {
		$panel.append( ronda.ui.message( 'error', $( '<span></span>' ).append(
			document.createTextNode( ronda.msg( 'patrulha-o-usuario' ) ), $( '<b></b>' ).text( user ), document.createTextNode( ronda.msg( 'patrulha-nao-existe' ) )
		) ) );
		return;
	}

	// Linhas na ordem em que aparecem; renderExtra preenche as dele
	L.$status = $status = L.row( ronda.msg( 'patrulha-up-situacao' ) );
	$facts = L.row( ronda.msg( 'patrulha-up-conta' ) );
	L.$blocks = L.row( ronda.msg( 'patrulha-up-bloqueios' ) );
	L.$otherWikis = L.row( ronda.msg( 'patrulha-up-outras-wikis' ) );
	L.$contribs = L.row( ronda.msg( 'patrulha-up-contribuicoes' ) );
	L.$act = L.row( ronda.msg( 'patrulha-up-atividade' ) );
	$warn = L.row( ronda.msg( 'patrulha-up-avisos', days ) );
	L.$abuse = L.row( ronda.msg( 'patrulha-up-filtro', 30 ) );
	L.$range = L.row( ronda.msg( 'patrulha-up-faixa' ) );
	L.$actions = $actions = L.group( ronda.msg( 'patrulha-up-acoes' ) );
	L.$view = $view = L.group( ronda.msg( 'patrulha-up-ver' ) );
	L.$cu = L.group( ronda.msg( 'patrulha-up-checkuser' ) );
	L.$ip = L.group( ronda.msg( 'patrulha-up-ip' ) );

	// Situação
	if ( info.block ) {
		$status.append( $( '<span class="ui-state-error ui-corner-all ronda-badge"></span>' ).append(
			$( '<b></b>' ).text( ( info.block.partial ? ronda.msg( 'patrulha-bloqueio-parcial' ) : ronda.msg( 'patrulha-bloqueado' ) )
				+ ( info.block.range && info.block.range !== user ? ' (intervalo ' + info.block.range + ')' : '' ) ),
			document.createTextNode( ronda.msg( 'patrulha-por', expiryText( info.block.expiry ), info.block.by, info.block.reason ? ' — ' + plain( info.block.reason ) : '' ) )
		) );
	}
	if ( info.locked ) {
		$status.append( $status.children().length ? ' ' : '', $( '<span class="ui-state-error ui-corner-all ronda-badge"></span>' ).append(
			$( '<b></b>' ).text( ronda.msg( 'patrulha-travado-globalmente' ) )
		) );
	}

	// Registro, edições e grupos
	when = info.registration || info.firstEdit;
	editcount = info.editcount === undefined ? '?' : ( info.more ? ronda.msg( 'patrulha-mais-de' ) : '' ) + info.editcount.toLocaleString( 'pt-BR' );
	$facts.append(
		document.createTextNode( ( info.registration ? ronda.msg( 'patrulha-registro' ) : ronda.msg( 'patrulha-primeira-edicao' ) ) ),
		$( '<b></b>' ).text( when ? formatDate( when ) : 'desconhecida' ),
		sep(),
		document.createTextNode( ronda.msg( 'patrulha-edicoes' ) ),
		$( '<b></b>' ).text( editcount )
	);
	if ( !isIP ) {
		$facts.append( sep(), document.createTextNode( ronda.msg( 'patrulha-grupos' ) ) );
		if ( info.groups.length ) {
			dates = extra && extra.rights ? groupDates( extra.rights, info.groups.map( function ( g ) {
				return g.name;
			} ) ) : {};
			info.groups.forEach( function ( g, i ) {
				$facts.append( i ? sep() : '', g.page ? link( g.page + '/' + user, g.label ) : document.createTextNode( g.label ) );
				if ( g.local && dates[ g.name ] ) {
					$facts.append( ' (', link( 'Special:Log/rights', 'desde ' + formatDate( dates[ g.name ] ), {
						page: mw.config.get( 'wgFormattedNamespaces' )[ 2 ] + ':' + user
					} ), ')' );
				}
			} );
		} else {
			$facts.append( $( '<i></i>' ).text( 'nenhum' ) );
		}
	}

	// Avisos recentes
	if ( warns.length ) {
		warns.forEach( function ( w, i ) {
			$warn.append( i ? sep() : '', $( '<span></span>' )
				.addClass( w.level >= 3 ? 'ronda-up-hot' : '' )
				.attr( 'title', formatDate( w.time ) )
				.text( w.item.label + ' (' + w.level + ')' ) );
		} );
	} else {
		$warn.append( $( '<i></i>' ).text( talk.exists ? ronda.msg( 'patrulha-nenhum-aviso-em-serie' ) : ronda.msg( 'patrulha-a-discussao-nao-existe' ) ) );
	}

	// Ações: avisar e bloquear primeiro; renderExtra acrescenta as em massa
	if ( avisar && avisar.isAvailable( ctx ) ) {
		$actions.append( $( '<div></div>' ).append( action( avisar, ctx, ronda.msg( 'patrulha-enviar-aviso-acao' ) ).addClass( 'ronda-up-main' ) ) );
	}
	if ( bloquear && bloquear.isAvailable( ctx ) ) {
		$actions.append( $( '<div></div>' ).append( action( bloquear, ctx, info.block ? ronda.msg( 'patrulha-alterar-bloqueio' ) : 'bloquear' ).addClass( 'ronda-up-main' ) ) );
	}

	// Ver
	addTo( $view, link( 'Special:Contributions/' + user, ronda.msg( 'patrulha-contribuicoes' ) ) );
	addTo( $view, link( 'Special:Log', 'registros', { user: user } ) );
	addTo( $view, link( 'Special:Log/block', 'bloqueios', { page: mw.config.get( 'wgFormattedNamespaces' )[ 2 ] + ':' + user } ) );
	if ( !isIP ) {
		addTo( $view, link( 'Special:CentralAuth/' + user, ronda.msg( 'patrulha-conta-global' ) ) );
	}

	renderExtra( ctx, user, isIP, extra || {}, L );

	$panel.append( L.build() );
}

function nsName( ns ) {
	return ns === 0 ? 'principal' : ( mw.config.get( 'wgFormattedNamespaces' )[ ns ] || String( ns ) );
}

function external( url, text, title ) {
	return $( '<a target="_blank" rel="noopener"></a>' ).attr( { href: url, title: title || '' } ).text( text );
}

/** Linhas extras: histórico, atividade, CheckUser, faixa e ferramentas de IP, ações em massa */
function renderExtra( ctx, user, isIP, extra, L ) {
	var userPage = mw.config.get( 'wgFormattedNamespaces' )[ 2 ] + ':' + user,
		act = extra.contribs ? activity( extra.contribs, Date.now() ) : null,
		range = isIP ? ipRange( user ) : null,
		lote = ronda.getModule( 'lote' ),
		gb = extra.globalBlock,
		enc = encodeURIComponent( user ),
		$status = L.$status,
		$ipOut, $ip;

	/** Ação em massa na coluna lateral */
	function massAction( text, title, onClick ) {
		L.$actions.append( $( '<div></div>' ).append( $( '<a href="#" role="button" class="ronda-up-action ronda-up-admin"></a>' )
			.text( text )
			.attr( 'title', title || '' )
			.on( 'click', function ( e ) {
				e.preventDefault();
				onClick();
			} ) ) );
	}

	// Bloqueio global
	if ( gb ) {
		$status.append( $status.children().length ? ' ' : '', $( '<span class="ui-state-error ui-corner-all ronda-badge"></span>' ).append(
			$( '<b></b>' ).text( ronda.msg( 'patrulha-bloqueio-global', gb.range || gb.target ? ' (' + ( gb.range || gb.target ) + ')' : '' ) ),
			document.createTextNode( ronda.msg( 'patrulha-por', expiryText( gb.expiry ), gb.by, gb.reason ? ' — ' + plain( gb.reason ) : '' ) )
		) );
	}

	// Bloqueios em outras wikis: linha própria, discreta; as primeiras e "mais N" ao clicar
	if ( extra.otherBlocks && extra.otherBlocks.length ) {
		( function ( list ) {
			var shown = 5,
				$rest = $( '<span></span>' ).hide();

			function item( b ) {
				return $( '<span></span>' ).append(
					external( b.url ? b.url + '/wiki/Special:Log/block?' + $.param( { page: 'User:' + user } ) : '#', b.host,
						b.reason ? plain( b.reason ) : '' ),
					document.createTextNode( ' (' + ( /^infinit/.test( b.expiry || '' ) ? ronda.msg( 'patrulha-duracao-indefinido' )
						: ronda.msg( 'patrulha-ate', formatDate( b.expiry ) ) ) + ')' )
				);
			}

			L.$otherWikis.append( $( '<span class="ronda-up-hot"></span>' ).text( ronda.msg( 'patrulha-bloqueado-em-n-wikis', list.length ) ), ' ' );
			list.forEach( function ( b, i ) {
				( i < shown ? L.$otherWikis : $rest ).append( i ? ', ' : '', item( b ) );
			} );
			if ( list.length > shown ) {
				L.$otherWikis.append( $rest, ' ', $( '<a href="#" role="button"></a>' )
					.text( ronda.msg( 'patrulha-e-mais-n', list.length - shown ) )
					.on( 'click', function ( e ) {
						e.preventDefault();
						$rest.show();
						$( this ).remove();
					} ) );
			}
		}( extra.otherBlocks ) );
	}

	// Bloqueios anteriores
	if ( extra.blocks ) {
		L.$blocks.append( link( 'Special:Log/block', String( extra.blocks.count ), { page: userPage } ) );
		if ( extra.blocks.last ) {
			L.$blocks.append( sep(), $( '<span></span>' )
				.addClass( extra.blocks.count >= 2 ? 'ronda-up-hot' : '' )
				.text( ronda.msg( 'patrulha-ultimo-bloqueio', formatDate( extra.blocks.last.timestamp ), extra.blocks.last.by,
					extra.blocks.last.duration ? ', ' + durationText( extra.blocks.last.duration, extra.blocks.last.expiry ) : '',
					extra.blocks.last.reason ? ' — ' + plain( extra.blocks.last.reason ) : '' ) ) );
		}
	}

	// Edições revertidas
	if ( act && act.sample ) {
		addTo( L.$contribs, [ document.createTextNode( ronda.msg( 'patrulha-revertidas' ) ), $( '<b></b>' )
			.addClass( act.reverted / act.sample >= 0.3 ? 'ronda-up-hot' : '' )
			.text( act.reverted + ' de ' + act.sample ) ] );
	}

	// Páginas criadas (e, nas ações, o atalho para eliminar as que restam)
	if ( extra.created && extra.created.total ) {
		addTo( L.$contribs, [ document.createTextNode( ronda.msg( 'patrulha-paginas-criadas' ) ),
			link( 'Special:Log/create', String( extra.created.total ) + ( extra.created.total >= 500 ? '+' : '' ), { user: user } ),
			document.createTextNode( extra.created.missing ? ' (' + extra.created.missing
				+ ( extra.created.missing === 1 ? ronda.msg( 'patrulha-nao-existe-mais' ) : ronda.msg( 'patrulha-nao-existem-mais' ) )
				+ ( extra.created.total > 200 ? ronda.msg( 'patrulha-entre-as-200-mais-recentes' ) : '' ) + ')' : '' ) ] );
	}

	// Contribuições eliminadas
	if ( extra.deleted !== null && extra.deleted !== undefined ) {
		addTo( L.$contribs, [ document.createTextNode( ronda.msg( 'patrulha-eliminadas' ) ),
			link( 'Special:DeletedContributions/' + user, extra.deleted + ( extra.deletedMore ? '+' : '' ) ) ] );
	}

	// Edições ocultadas (conteúdo ou resumo), entre as contribuições carregadas
	if ( extra.hidden && extra.hidden.count ) {
		addTo( L.$contribs, [ document.createTextNode( ronda.msg( 'patrulha-ocultadas' ) ), $( '<b class="ronda-up-hot"></b>' )
			.text( extra.hidden.count + ( extra.hidden.suppressed ? ronda.msg( 'patrulha-ocultadas-suprimidas', extra.hidden.suppressed ) : '' ) )
			.attr( 'title', ronda.msg( 'patrulha-ocultadas-dica' ) ) ] );
	}

	// Registro do filtro de abusos
	if ( extra.abuse ) {
		renderAbuse( L.$abuse, user, extra.abuse );
	}

	// Atividade
	if ( act && act.last ) {
		addTo( L.$act, [ document.createTextNode( ronda.msg( 'patrulha-ultima-edicao' ) ), $( '<b></b>' ).text( new Date( act.last ).toLocaleString( 'pt-BR' ) ) ] );
		addTo( L.$act, document.createTextNode( '24 h: ' + act.day + ( act.full && act.day === 500 ? '+' : '' ) ) );
		addTo( L.$act, document.createTextNode( ronda.msg( 'patrulha-7-dias', act.week, act.full && act.week === 500 ? '+' : '' ) ) );
		addTo( L.$act, document.createTextNode( ronda.msg( 'patrulha-dominios', act.namespaces.slice( 0, 3 ).map( function ( n ) {
			return nsName( n[ 0 ] ) + ' (' + n[ 1 ] + ')';
		} ).join( ', ' ) ) ) );
	}

	// Ações em massa
	if ( act && act.top.length && ronda.can( 'rollback' ) && user !== mw.config.get( 'wgUserName' ) ) {
		massAction( ronda.msg( 'patrulha-reverter-todas-no-topo', act.top.length ), '', function () {
			rollbackAll( user, act.top );
		} );
	}
	if ( lote && extra.created && extra.created.existing.length && ronda.can( 'delete' ) ) {
		massAction( ronda.msg( 'patrulha-eliminar-as-criadas-n', extra.created.existing.length ),
			ronda.msg( 'patrulha-abre-o-lote-com-as-paginas', user ), function () {
				lote.open( $.extend( {}, ctx, { targetUser: user } ), { source: 'created', action: 'delete' } );
			} );
	}

	// CheckUser
	if ( ronda.can( 'checkuser' ) ) {
		addTo( L.$cu, link( 'Special:CheckUser/' + user, 'verificar' ) );
		addTo( L.$cu, link( 'Special:Investigate', 'investigar' ) );
	}
	if ( ronda.can( 'checkuser-log' ) ) {
		addTo( L.$cu, link( 'Special:CheckUserLog/' + user, ronda.msg( 'patrulha-registro-de-verificacoes' ) ) );
	}

	if ( !isIP ) {
		return;
	}

	// Faixa
	if ( range ) {
		L.$range.append( $( '<b></b>' ).text( range ), document.createTextNode( ' — ' ),
			link( 'Special:Contributions/' + range, ronda.msg( 'patrulha-contribuicoes' ) ), sep(),
			link( 'Special:BlockList', 'bloqueios', { wpTarget: range } ), sep(),
			external( 'https://meta.wikimedia.org/wiki/Special:GlobalBlockList?' + $.param( { target: range } ), 'bloqueios globais' ) );
	}

	// Ferramentas externas
	$ip = L.$ip.append(
		external( 'https://whois-referral.toolforge.org/gateway.py?lookup=true&ip=' + enc, 'WHOIS' ), sep(),
		external( 'https://bullseye.toolforge.org/ip/' + enc, 'localização', 'Bullseye' ), sep(),
		external( 'https://ipcheck.toolforge.org/index.php?ip=' + enc, 'proxy', 'IPCheck' ), sep(),
		external( 'https://spur.us/context/' + enc, 'Spur' ), sep(),
		external( 'https://guc.toolforge.org/?by=date&user=' + enc, 'contribuições globais', 'GUC' ) );

	// Informações da própria wiki (IPInfo), só ao clicar: o acesso fica registrado
	if ( ronda.can( 'ipinfo' ) && extra.contribs && extra.contribs[ 0 ] ) {
		$ipOut = $( '<span></span>' );
		$ip.append( sep(), $( '<a href="#" role="button" class="ronda-up-action"></a>' )
			.text( ronda.msg( 'patrulha-informacoes-do-ip' ) )
			.attr( 'title', ronda.msg( 'patrulha-consulta-a-ferramenta-de-informacoes-de' ) )
			.on( 'click', function ( e ) {
				e.preventDefault();
				$( this ).replaceWith( $ipOut );
				ipInfo( extra.contribs[ 0 ].revid, $ipOut );
			} ) );
	}
}

/** Linha do filtro de abusos: resumo e, ao clicar, as ocorrências */
function renderAbuse( $line, user, abuse ) {
	var $list;

	$line.append( link( 'Special:AbuseLog', String( abuse.count ) + ( abuse.more ? '+' : '' ), { wpSearchUser: user } ) );
	if ( !abuse.count ) {
		return;
	}
	$line.append( document.createTextNode( ' (' ), $( '<span></span>' )
		.addClass( abuse.disallowed ? 'ronda-up-hot' : '' )
		.text( [ abuse.disallowed ? ronda.msg( 'patrulha-filtro-impedidas', abuse.disallowed ) : '',
			abuse.warned ? ronda.msg( 'patrulha-filtro-avisos', abuse.warned ) : '' ].filter( Boolean ).join( ', ' ) ||
			ronda.msg( 'patrulha-filtro-so-registro' ) ), document.createTextNode( ')' ) );

	$list = $( '<ul class="ronda-up-list"></ul>' ).hide();
	abuse.entries.slice( 0, 10 ).forEach( function ( e ) {
		$list.append( $( '<li></li>' ).append(
			link( 'Special:AbuseLog/' + e.id, new Date( e.timestamp ).toLocaleString( 'pt-BR' ) ),
			document.createTextNode( ' — ' ),
			e.filter_id ? link( 'Special:AbuseFilter/' + e.filter_id, e.filter || ( '#' + e.filter_id ) ) :
				document.createTextNode( e.filter || '?' ),
			document.createTextNode( ronda.msg( 'patrulha-filtro-em', e.title || '?',
				resultText( e.result ) ) )
		) );
	} );
	$line.append( sep(), $( '<a href="#" role="button" class="ronda-up-action"></a>' )
		.text( ronda.msg( 'patrulha-filtro-ver' ) )
		.on( 'click', function ( ev ) {
			ev.preventDefault();
			$list.toggle();
		} ), $list );
}

/** Ações do filtro em português */
function resultText( result ) {
	var names = {
		disallow: 'impedida',
		warn: 'aviso',
		tag: 'etiqueta',
		throttle: 'limite',
		block: 'bloqueio',
		blockautopromote: 'sem autopromoção',
		degroup: 'remoção de grupos'
	};

	return String( result || '' ).split( ',' ).map( function ( r ) {
		r = r.trim();
		return names[ r ] || r;
	} ).filter( Boolean ).join( ', ' ) || ronda.msg( 'patrulha-filtro-so-registro' );
}

function isAvailable( ctx ) {
	return ronda.isUserContext( ctx );
}

/** Mostra ou esconde a faixa; os dados são buscados só na primeira vez */
/** Todos os dados do painel, buscados uma vez por usuário (também em segundo plano, por prefetch) */
function loadAll( user ) {
	var isIP = mw.util.isIPAddress( user, true );

	return ronda.memo( 'usuario:' + user, function () {
		return $.when( loadUser( user, isIP ), loadTalk( user ), loadExtra( user, isIP ) ).then( function ( info, talk, extra ) {
			return { info: info, talk: talk, extra: extra };
		} );
	} );
}

function toggle( ctx ) {
	var user = ctx.targetUser,
		isIP = mw.util.isIPAddress( user, true );

	ronda.ui.togglePanel( 'usuario', function ( $panel ) {
		$panel.text( ronda.msg( 'patrulha-carregando-informacoes-de', user ) );
		loadAll( user ).then( function ( d ) {
			render( $panel, ctx, user, isIP, d.info, d.talk, d.extra );
		}, function () {
			$panel.text( ronda.msg( 'patrulha-nao-foi-possivel-obter-as-informacoes', user ) );
		} );
	} );
}

/*
 * O painel de usuário não tem mais botão próprio: aparece dentro de Informações
 * (Ronda-paginas.js), sozinho nas contribuições e junto do painel da página nas
 * páginas de usuário. Aqui ficam a carga e o desenho.
 */
ronda.userPanel = {
	isAvailable: isAvailable,
	load: function ( ctx ) {
		return loadAll( ctx.targetUser );
	},
	/** Preenche $el com o painel do usuário de ctx.targetUser */
	fill: function ( $el, ctx ) {
		var user = ctx.targetUser,
			isIP = mw.util.isIPAddress( user, true );

		$el.text( ronda.msg( 'patrulha-carregando-informacoes-de', user ) );
		return loadAll( user ).then( function ( d ) {
			render( $el, ctx, user, isIP, d.info, d.talk, d.extra );
		}, function () {
			$el.text( ronda.msg( 'patrulha-nao-foi-possivel-obter-as-informacoes', user ) );
		} );
	},
	toggle: toggle
};

}( window.ronda ) );

/* ================================================================== *
 * Listar — portado do "Listar" do FastButtons
 *
 * Páginas vigiadas, mudanças recentes, páginas novas, edições a revisar
 * (extensão ORES da wiki: provavelmente danosas, as de má-fé primeiro) e eliminação rápida.
 * Cada lista mostra até 10 páginas, uma por linha, com a diferença de
 * tamanho, o autor e o resumo.
 * ================================================================== */
( function ( ronda ) {
'use strict';

var MAX = 10,
	LISTS = [
		{ id: 'PV', label: ronda.msg( 'patrulha-paginas-vigiadas' ), title: ronda.msg( 'patrulha-paginas-vigiadas-alteradas-recentemente' ), params: function () {
			return { list: 'watchlist', wlprop: 'user|comment|title|sizes|ids', wlshow: '!bot', wltype: 'edit',
				wlexcludeuser: mw.config.get( 'wgUserName' ), wllimit: MAX };
		}, key: 'watchlist', link: 'diff', empty: ronda.msg( 'patrulha-nenhuma-alteracao-recente' ) },
		{ id: 'MR', label: ronda.msg( 'patrulha-mudancas-recentes' ), title: ronda.msg( 'patrulha-mudancas-recentes-nao-autopatrulhadas-no-dominio' ), params: function () {
			return { list: 'recentchanges', rctype: 'edit', rcnamespace: 0, rcshow: '!autopatrolled',
				rcprop: 'user|comment|title|sizes|ids', rclimit: MAX };
		}, key: 'recentchanges', link: 'diff', empty: ronda.msg( 'patrulha-nenhuma-alteracao-recente' ) },
		{ id: 'PN', label: ronda.msg( 'patrulha-paginas-novas' ), title: ronda.msg( 'patrulha-paginas-novas-ainda-nao-patrulhadas' ), right: 'patrol', params: function () {
			return { list: 'recentchanges', rctype: 'new', rcnamespace: 0, rcshow: '!patrolled|!redirect',
				rcprop: 'user|comment|title|sizes|ids', rclimit: MAX };
		}, key: 'recentchanges', link: 'rcid',
		empty: ronda.msg( 'patrulha-nenhuma-pagina-nova-nao-patrulhada-que' ) },
		{ id: 'SCORES', label: ronda.msg( 'patrulha-edicoes-a-revisar' ), title: ronda.msg( 'patrulha-edicoes-nao-patrulhadas-com-grande-chance' ),
			right: 'patrol', params: function () {
				return { list: 'recentchanges', rctype: 'edit', rcnamespace: 0, rcshow: '!patrolled|oresreview',
					rcprop: 'user|comment|title|sizes|ids|oresscores', rclimit: 50 };
			}, key: 'recentchanges', link: 'revid', scores: true, empty: ronda.msg( 'patrulha-nenhuma-edicao-para-patrulhar-ou-desfazer' ) },
		{ id: 'ER', label: ronda.msg( 'patrulha-eliminacao-rapida' ), title: ronda.msg( 'patrulha-paginas-marcadas-para-eliminacao-rapida' ), params: function () {
			return { list: 'categorymembers', cmtitle: 'Categoria:!Páginas para eliminação rápida', cmlimit: MAX };
		}, key: 'categorymembers', link: 'page', empty: ronda.msg( 'patrulha-nenhuma-pagina-marcada-para-eliminacao-rapida' ) }
	],
	runId = 0;

/* ---------------- Funções puras ---------------- */

/** Probabilidade "true" de um modelo nas pontuações da extensão ORES (oresscores) */
function prob( item, model ) {
	var m = item.oresscores && item.oresscores[ model ];

	return m && typeof m[ 'true' ] === 'number' ? m[ 'true' ] : null;
}

/**
 * Edições a revisar, já filtradas pela wiki (oresreview): as de provável má-fé
 * primeiro e, dentro de cada grupo, da mais danosa para a menos danosa.
 */
function pickSuspects( list ) {
	return list.filter( function ( rev ) {
		return prob( rev, 'damaging' ) !== null;
	} ).sort( function ( a, b ) {
		var fa = prob( a, 'goodfaith' ) < 0.5 ? 0 : 1,
			fb = prob( b, 'goodfaith' ) < 0.5 ? 0 : 1;

		return fa - fb || prob( b, 'damaging' ) - prob( a, 'damaging' );
	} ).slice( 0, MAX );
}

function sizeDiff( item ) {
	var d = ( item.newlen || 0 ) - ( item.oldlen || 0 );

	return d > 0 ? '+' + d : String( d );
}

ronda.lists = { pickSuspects: pickSuspects, sizeDiff: sizeDiff, prob: prob };

/* ---------------- Interface ---------------- */

function sep() {
	return document.createTextNode( ' · ' );
}

function pct( p ) {
	return Math.round( p * 100 ) + '%';
}

/* ---------------- Prévia ao passar o mouse ---------------- */

var hoverCache = {},
	$hoverBox = null,
	hoverTimer = null;

/** Conteúdo da prévia: o diff da edição ou, para páginas, o começo do texto */
function hoverContent( item, def ) {
	var key = def.link + ':' + ( item.revid || item.title );

	if ( !hoverCache[ key ] ) {
		hoverCache[ key ] = item.revid && def.link !== 'rcid' && def.link !== 'page'
			? $.when( mw.loader.using( 'mediawiki.diff.styles' ).then( null, function () {
				return null;
			} ), ronda.api.get( { action: 'compare', torev: item.revid, torelative: 'prev', prop: 'diff', formatversion: 2 } ) )
				.then( function ( dummy, res ) {
					var data = res && res.compare ? res : res && res[ 0 ],
						body = data && data.compare && data.compare.body;

					return body ? $( '<table class="diff"></table>' ).append(
						'<colgroup><col class="diff-marker"><col class="diff-content"><col class="diff-marker"><col class="diff-content"></colgroup>', body )
						: $( '<i></i>' ).text( ronda.msg( 'patrulha-previa-sem-diff' ) );
				} )
			: ronda.api.get( { action: 'query', titles: item.title, prop: 'extracts', exchars: 600, explaintext: 1, redirects: 1 } )
				.then( function ( data ) {
					var p = ( ( data.query || {} ).pages || [] )[ 0 ] || {};

					return $( '<p></p>' ).text( p.extract || ronda.msg( 'patrulha-previa-sem-texto' ) );
				} );
	}
	return hoverCache[ key ];
}

function hideHover() {
	clearTimeout( hoverTimer );
	if ( $hoverBox ) {
		$hoverBox.remove();
		$hoverBox = null;
	}
}

/** Mostra a prévia perto do link, depois de um instante com o mouse parado em cima */
function attachHover( $link, item, def ) {
	if ( ronda.isMobile() ) {
		return;
	}
	$link.on( 'mouseenter', function () {
		var el = this;

		hideHover();
		hoverTimer = setTimeout( function () {
			hoverContent( item, def ).then( function ( $c ) {
				var r = el.getBoundingClientRect();

				hideHover();
				$hoverBox = $( '<div class="ronda-hover-preview"></div>' ).append( $c.clone() ).appendTo( document.body ).css( {
					top: r.bottom + window.pageYOffset + 6,
					left: Math.max( 8, Math.min( r.left + window.pageXOffset, window.pageXOffset + document.documentElement.clientWidth - 680 ) )
				} );
			} );
		}, 450 );
	} ).on( 'mouseleave click', hideHover );
}

/** Um resultado por linha: título, diferença de tamanho, autor, resumo (e pontuações, se houver) */
function render( $out, def, list ) {
	var $ul = $( '<ul class="ronda-feed"></ul>' );

	$out.empty();

	if ( !list.length ) {
		$out.append( $( '<i></i>' ).text( def.empty ) );
		return;
	}

	list.slice( 0, MAX ).forEach( function ( item ) {
		var params = def.link === 'diff' ? { diff: 'cur', oldid: item.old_revid || 'prev' }
				: def.link === 'rcid' ? { redirect: 'no', rcid: item.rcid }
					: def.link === 'revid' ? { diff: item.revid } : null,
			$link = $( '<a></a>' ).attr( 'href', mw.util.getUrl( item.title, params ) ).text( item.title ),
			$li = $( '<li></li>' ).append( $link ),
			dano = def.scores ? prob( item, 'damaging' ) : null,
			fe = def.scores ? prob( item, 'goodfaith' ) : null,
			d, n, comment;

		attachHover( $link, item, def );

		if ( def.link !== 'page' ) {
			d = sizeDiff( item );
			n = Number( d );
			$li.append( ' ', $( '<span></span>' )
				.addClass( n > 0 ? 'ronda-ok' : n < 0 ? 'ronda-bad' : 'ronda-feed-muted' )
				.toggleClass( 'ronda-feed-big', Math.abs( n ) >= 500 )
				.text( '(' + d + ')' ) );
			if ( item.user ) {
				$li.append( sep(), $( '<a></a>' ).attr( 'href', mw.util.getUrl( 'Special:Contributions/' + item.user ) ).text( item.user ) );
			}
			if ( dano !== null ) {
				$li.append( sep(), $( '<span class="ronda-bad"></span>' ).text( 'dano ' + pct( dano ) ) );
				if ( fe !== null ) {
					$li.append( ' ', $( '<span class="ronda-feed-muted"></span>' ).text( ronda.msg( 'patrulha-boa-fe', pct( fe ) ) ) );
				}
			}
			comment = ( item.comment || '' ).replace( /<[^>]+>/g, '' ).trim();
			if ( comment ) {
				$li.append( sep(), $( '<span class="ronda-feed-comment"></span>' ).text( comment ).attr( 'title', comment ) );
			}
		}
		$ul.append( $li );
	} );
	$out.append( $ul );
}

function load( def, $out ) {
	var id = ++runId;

	$out.text( ronda.msg( 'patrulha-carregando' ) );

	ronda.api.get( $.extend( { action: 'query' }, def.params() ) ).then( function ( data ) {
		var list = ( data.query && data.query[ def.key ] ) || [];

		if ( id !== runId ) {
			return;
		}
		render( $out, def, def.scores ? pickSuspects( list ) : list );
	}, function () {
		if ( id === runId ) {
			$out.text( ronda.msg( 'patrulha-nao-foi-possivel-obter-a-lista', def.label ) );
		}
	} );
}

function open() {
	ronda.ui.togglePanel( 'listar', function ( $panel ) {
		var $out = $( '<div class="ronda-up-line"></div>' ),
			$bar = $( '<div class="ronda-up-line"></div>' );

		$bar.append( document.createTextNode( ronda.msg( 'patrulha-listar-rotulo' ) ) );
		LISTS.filter( function ( def ) {
			return !def.right || ronda.can( def.right );
		} ).forEach( function ( def, i ) {
			$bar.append( i ? document.createTextNode( ' · ' ) : '', $( '<a href="#" role="button"></a>' )
				.text( def.label )
				.attr( 'title', def.title )
				.on( 'click', function ( e ) {
					e.preventDefault();
					$bar.find( '.ronda-up-current' ).removeClass( 'ronda-up-current' ).removeAttr( 'aria-current' );
					$( this ).addClass( 'ronda-up-current' ).attr( 'aria-current', 'true' );
					load( def, $out );
				} ) );
		} );

		$panel.append( $bar, $out );
	} );
}

ronda.registerModule( {
	id: 'listar',
	label: ronda.msg( 'patrulha-listar-botao' ),
	title: ronda.msg( 'patrulha-paginas-vigiadas-mudancas-recentes-paginas-novas' ),
	order: 48,
	isAvailable: function ( ctx ) {
		return true;
	},
	open: open
} );

}( window.ronda ) );

/* ================================================================== *
 * Reversão rápida e "restaurar esta versão" (como no Twinkle)
 *
 * Links ao lado da edição atual em diffs, histórico, contribuições,
 * mudanças recentes e páginas vigiadas:
 *   reverter (BF)          pede um motivo; resumo de boa-fé
 *   reverter               direto
 *   reverter (vandalismo)  direto e, depois, abre o Avisar com "Vandalismo"
 *                          e a página preenchidos (nível sugerido)
 * Só "reverter (vandalismo)" usa a reversão rápida da API, e só para quem tem
 * o direito rollback; os demais (e quem não tem o direito) desfazem
 * (undo/undoafter) até a última versão de outra pessoa. Se outra pessoa
 * editou depois, não reverte.
 * "restaurar" aparece nas versões antigas: no diff (versão da esquerda), na
 * página de uma versão antiga e em cada linha do histórico.
 * ================================================================== */
( function ( ronda ) {
'use strict';

/* ---------------- Funções puras ---------------- */

/**
 * Plano da reversão rápida a partir das revisões (da mais nova para a mais antiga).
 * @return {Object} { ok, reason, count, good }
 */
function quickPlan( revs, user ) {
	var i = 0;

	if ( !revs.length ) {
		return { ok: false, reason: ronda.msg( 'patrulha-a-pagina-nao-tem-revisoes' ) };
	}
	if ( revs[ 0 ].user !== user ) {
		return { ok: false, reason: ronda.msg( 'patrulha-a-ultima-edicao-e-de-nao', revs[ 0 ].user || ronda.msg( 'patrulha-nome-oculto' ), user ) };
	}
	while ( i < revs.length && revs[ i ].user === user ) {
		i++;
	}
	if ( i >= revs.length ) {
		return { ok: false, reason: revs.length >= 50
			? ronda.msg( 'patrulha-ha-mais-de-50-edicoes-seguidas', user )
			: ronda.msg( 'patrulha-todas-as-edicoes-da-pagina-sao', user ) };
	}
	return { ok: true, count: i, good: revs[ i ], latest: revs[ 0 ] };
}

function fillSummary( tpl, restoredUser, user, revid, reason ) {
	return tpl.replace( /\$1/g, ronda.literal( restoredUser ) )
		.replace( /\$2/g, ronda.literal( user ) )
		.replace( /\$3/g, ronda.literal( revid ) )
		.replace( /\$4/g, ronda.literal( reason ) )
		.replace( /:\s*$/, '' );
}

/** Domínio de um título, pelos prefixos do wiki */
function nsOf( title ) {
	var names = mw.config.get( 'wgFormattedNamespaces' ) || {},
		prefix = title.indexOf( ':' ) > 0 ? title.slice( 0, title.indexOf( ':' ) ) : '',
		found = 0;

	Object.keys( names ).forEach( function ( n ) {
		if ( prefix && names[ n ] === prefix ) {
			found = Number( n );
		}
	} );
	return found;
}

ronda.quick = { plan: quickPlan, summary: fillSummary, nsOf: nsOf };

/* ---------------- Ações ---------------- */

function cfg() {
	return ronda.config.revert;
}

function revertNow( title, user, mode, reason ) {
	return ronda.api.get( {
		action: 'query',
		titles: title,
		prop: 'revisions',
		rvprop: 'ids|user|timestamp',
		rvlimit: 50
	} ).then( function ( data ) {
		var revs = ( data.query.pages[ 0 ] || {} ).revisions || [],
			plan = quickPlan( revs, user ),
			useRollback = mode === 'vandal' && ronda.can( 'rollback' ),
			tpl = mode === 'agf' ? cfg().agfSummary : mode === 'vandal' ? cfg().vandalSummary : cfg().summary,
			summary;

		if ( !plan.ok ) {
			return $.Deferred().reject( 'ronda-quick', plan.reason ).promise();
		}
		summary = fillSummary( tpl, plan.good.user, user, plan.good.revid, reason );

		if ( useRollback ) {
			return ronda.api.postWithToken( 'rollback', ronda.params( {
				action: 'rollback',
				title: title,
				user: user,
				summary: summary,
				watchlist: ronda.config.watchlist
			} ) ).then( function () {
				return plan;
			} );
		}

		return ronda.post( {
			action: 'edit',
			title: title,
			undo: plan.latest.revid,
			undoafter: plan.good.revid,
			summary: summary,
			nocreate: true,
			watchlist: ronda.config.watchlist
		} ).then( function () {
			return plan;
		} );
	} );
}

function ask( title, label, placeholder, required, done ) {
	var $reason = ronda.ui.text( '', placeholder ),
		$dlg;

	function ok() {
		var v = $reason.val().trim();

		if ( ronda.ui.require( $reason, !required || !!v ) ) {
			ronda.ui.close( $dlg );
			done( v );
		}
	}

	$reason.on( 'keydown', function ( e ) {
		if ( e.key === 'Enter' ) {
			ok();
		}
	} );
	$dlg = ronda.ui.dialog( {
		title: title,
		width: 480,
		content: ronda.ui.row( label, $reason ),
		buttons: [ { text: ronda.msg( 'patrulha-ok' ), 'class': 'ui-priority-primary ui-button-blue', click: ok },
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
	$reason.trigger( 'focus' );
}

function confirmFirst( text, go ) {
	var $dlg;

	if ( !cfg().confirm ) {
		go();
		return;
	}
	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'patrulha-confirmar' ),
		width: 420,
		content: $( '<p></p>' ).text( text ),
		buttons: [ { text: ronda.msg( 'patrulha-reverter-botao' ), 'class': 'ui-priority-primary ui-button-red', click: function () {
			ronda.ui.close( $dlg );
			go();
		} }, { text: ronda.msg( 'core-cancelar' ), click: function () {
			ronda.ui.close( $dlg );
		} } ]
	} );
}

function status( $box, type, text ) {
	$box.empty().append( $( '<span></span>' ).addClass( type ? 'ronda-quick-' + type : '' ).text( text ) );
}

/** Executa a reversão rápida a partir de um conjunto de links */
function quick( $box, title, user, mode ) {
	function go( reason ) {
		status( $box, '', 'revertendo…' );
		revertNow( title, user, mode, reason ).then( function ( plan ) {
			status( $box, 'ok', ronda.msg( 'patrulha-revertido-edicao-oes', plan.count ) );
			mw.notify( ronda.msg( 'patrulha-revertida-s-edicao-oes-de-em', plan.count, user, title ), { type: 'success', title: ronda.msg( 'core-nome' ) } );

			if ( mode === 'vandal' && cfg().vandalWarn && ronda.getModule( 'avisar' ) ) {
				ronda.getModule( 'avisar' ).open( $.extend( {}, ronda.ctx, {
					type: 'diff',
					ns: nsOf( title ),
					page: title,
					targetUser: user,
					preselect: 'vandalismo'
				} ) );
			}
		}, function ( code, info ) {
			var msg = code === 'ronda-quick' ? info
				: ( info && typeof info === 'object' && ronda.api.getErrorMessage ) ? ronda.api.getErrorMessage( info ).text() : code;

			status( $box, 'error', ronda.msg( 'patrulha-nao-revertido', msg ) );
			mw.notify( ronda.msg( 'patrulha-nao-foi-possivel-reverter', msg ), { type: 'error', title: ronda.msg( 'core-nome' ) } );
		} );
	}

	if ( mode === 'agf' ) {
		ask( 'Reverter edição de boa-fé', 'Motivo', 'Motivo (vai no resumo)', false, go );
	} else {
		confirmFirst( 'Reverter as edições de ' + user + ' em ' + title + '?', go );
	}
}

/** Restaura uma versão antiga (pede um motivo opcional) */
function restore( title, revid, $box ) {
	ask( 'Restaurar a versão ' + revid, 'Motivo (opcional)', 'Acrescentado ao resumo', false, function ( reason ) {
		status( $box, '', 'restaurando…' );
		ronda.api.get( {
			action: 'query',
			revids: revid,
			prop: 'revisions',
			rvprop: 'content|user|ids',
			rvslots: 'main'
		} ).then( function ( data ) {
			var page = data.query.pages[ 0 ],
				rev = page.revisions && page.revisions[ 0 ];

			if ( !rev || rev.slots.main.texthidden || rev.slots.main.content === undefined ) {
				return $.Deferred().reject( 'ronda-hidden' ).promise();
			}

			return ronda.api.edit( title, function () {
				return ronda.params( {
					text: rev.slots.main.content,
					// Autor oculto: sem ligação para as contribuições (ficaria [[Special:Contribs/|]])
					summary: ( rev.user ? fillSummary( cfg().restoreSummary, rev.user, '', rev.revid, '' )
						: ronda.msg( 'patrulha-restaurada-versao-autor-oculto', rev.revid ) ) + ( reason ? ' (' + reason + ')' : '' ),
					nocreate: true,
					watchlist: ronda.config.watchlist
				} );
			} );
		} ).then( function () {
			status( $box, 'ok', ronda.msg( 'patrulha-versao-restaurada-log' ) );
			mw.notify( ronda.msg( 'patrulha-versao-restaurada', revid ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
		}, function ( code, info ) {
			var msg = code === 'ronda-hidden' ? ronda.msg( 'patrulha-o-conteudo-da-versao-esta-oculto' )
				: ( info && typeof info === 'object' && ronda.api.getErrorMessage ) ? ronda.api.getErrorMessage( info ).text() : code;

			status( $box, 'error', ronda.msg( 'patrulha-nao-restaurada', msg ) );
		} );
	} );
}

/* ---------------- Links ---------------- */

function link( text, title, fn, cls ) {
	return $( '<a href="#" role="button"></a>' )
		.addClass( cls || '' )
		.text( text )
		.attr( 'title', title )
		.on( 'click', function ( e ) {
			e.preventDefault();
			fn();
		} );
}

/** [reverter (BF) | reverter | reverter (vandalismo)] */
function revertLinks( title, user ) {
	var $box = $( '<span class="ronda-quick"></span>' );

	if ( !user || user === mw.config.get( 'wgUserName' ) || !ronda.can( 'edit' ) ) {
		return $();
	}
	$box.append( '[',
		link( ronda.msg( 'patrulha-reverter-bf' ), ronda.msg( 'patrulha-reverter-edicoes-de-boa-fe-com' ), function () {
			quick( $box, title, user, 'agf' );
		}, 'ronda-quick-agf' ), ' | ',
		link( 'reverter', ronda.msg( 'patrulha-reverter-as-edicoes-de', user ), function () {
			quick( $box, title, user, 'normal' );
		} ), ' | ',
		link( ronda.msg( 'patrulha-reverter-vandalismo' ), ronda.msg( 'patrulha-reverter-como-vandalismo-e-abrir-o' ), function () {
			quick( $box, title, user, 'vandal' );
		}, 'ronda-quick-vandal' ), ']' );
	return $box;
}

function restoreLink( title, revid ) {
	var $box = $( '<span class="ronda-quick"></span>' );

	if ( !revid || !ronda.can( 'edit' ) ) {
		return $();
	}
	return $box.append( '[', link( 'restaurar', ronda.msg( 'patrulha-restaurar-esta-versao' ), function () {
		restore( title, revid, $box );
	} ), ']' );
}

function userOf( $row ) {
	var $u = $row.find( '.mw-userlink' ).first();

	return ( $u.find( 'bdi' ).text() || $u.text() || '' ).trim();
}

function decorate( $root ) {
	var ctx = ronda.ctx,
		links = cfg().links || {},
		special = ctx.special,
		cur = mw.config.get( 'wgCurRevisionId' );

	// Diff: links na versão nova (se for a atual) e "restaurar" na antiga
	if ( ctx.type === 'diff' && links.diff ) {
		if ( ctx.newId && ( !cur || Number( ctx.newId ) === Number( cur ) ) && !$( '#mw-diff-ntitle2 .ronda-quick' ).length ) {
			$( '#mw-diff-ntitle2' ).append( ' ', revertLinks( ctx.page, ctx.targetUser ) );
		}
		if ( ctx.oldId && !$( '#mw-diff-otitle1 .ronda-quick' ).length ) {
			$( '#mw-diff-otitle1' ).append( ' ', restoreLink( ctx.page, ctx.oldId ) );
		}
	}

	// Versão antiga (?oldid=)
	if ( ctx.isRevision && links.diff && !$( '#mw-revision-info .ronda-quick' ).length ) {
		if ( mw.config.get( 'wgRevisionId' ) && Number( mw.config.get( 'wgRevisionId' ) ) !== Number( cur ) ) {
			$( '#mw-revision-info' ).append( ' ', restoreLink( ctx.page, mw.config.get( 'wgRevisionId' ) ) );
		}
	}

	// Histórico: links na linha da versão atual e "restaurar" nas demais
	if ( ctx.action === 'history' && links.history ) {
		$root.find( '#pagehistory li' ).not( ':has(.ronda-quick)' ).each( function () {
			var $li = $( this ),
				revid = $li.attr( 'data-mw-revid' );

			$li.append( ' ', cur && Number( revid ) === Number( cur )
				? revertLinks( ctx.page, userOf( $li ) )
				: restoreLink( ctx.page, revid ) );
		} );
	}

	// Contribuições: edições que ainda são a versão atual
	if ( special === 'Contributions' && links.contribs ) {
		$root.find( 'li.mw-contributions-current' ).not( ':has(.ronda-quick)' ).each( function () {
			var $li = $( this ),
				title = $li.find( 'a.mw-contributions-title' ).first().text();

			if ( title && ctx.targetUser ) {
				$li.append( ' ', revertLinks( title, ctx.targetUser ) );
			}
		} );
	}

	// Mudanças recentes e páginas vigiadas: linhas da versão mais recente
	if ( ( special === 'Recentchanges' && links.recentchanges ) || ( special === 'Watchlist' && links.watchlist )
		|| ( special === 'Recentchangeslinked' && links.recentchanges ) ) {
		$root.find( '.mw-changeslist-last' ).filter( '.mw-changeslist-edit, .mw-changeslist-src-mw-edit' )
			.not( ':has(.ronda-quick)' ).each( function () {
				var $row = $( this ),
					title = $row.find( 'a.mw-changeslist-title' ).first().text(),
					user = userOf( $row ),
					$target = $row.is( 'tr' ) ? $row.children( 'td' ).last() : $row;

				if ( title && user ) {
					$target.append( ' ', revertLinks( title, user ) );
				}
			} );
	}
}

mw.hook( 'ronda.ready' ).add( function () {
	decorate( $( document ) );
	// As mudanças recentes e as páginas vigiadas recarregam a lista sem recarregar a página
	mw.hook( 'wikipage.content' ).add( function ( $content ) {
		if ( ronda.ctx ) {
			decorate( $content );
		}
	} );
} );

}( window.ronda ) );

/* ===== Ronda-paginas.js ===== */
/**
 * Ronda — páginas
 *
 * Reúne os módulos que marcam ou alteram páginas (para quem edita):
 * Manutenção, ER, ESR, Consenso, Mover, #R, Esboço, Fusão, Busca, PetScan,
 * Informações, Pedido e Não assinou.
 * Cada módulo continua no seu próprio bloco (escopo isolado).
 */

/**
 * Ronda — módulo Manutenção (múltipla escolha)
 *
 * Inspirado no FastButtonsMultiplasEscolhas:
 * - Lista todas as marcações do catálogo; as já presentes vêm marcadas e
 *   desmarcá-las remove a predefinição.
 * - Detecta marcações soltas e dentro de {{Múltiplos problemas}}.
 * - Agrupa (ou desagrupa) em {{Múltiplos problemas}}.
 * - Campos de parâmetro aparecem no próprio diálogo, sem prompts em sequência.
 * Diferenças:
 * - Os nomes alternativos (redirecionamentos) de cada predefinição são
 *   obtidos da API e guardados em cache, em vez de normalizar hífens.
 * - Só a introdução (antes do primeiro título de seção) é reorganizada;
 *   marcações dentro de seções não são tocadas. "Sem sinopse" fica antes das categorias.
 * - Uma marcação mantida nunca é duplicada nem perde os parâmetros (datas etc.).
 * - A edição usa mw.Api#edit: o texto é recalculado sobre a versão atual,
 *   com detecção de conflito.
 * - No formulário de edição, como no FastButtons, as marcações vão para a caixa
 *   de texto e os avisos são enviados quando o usuário publicar.
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

var ALIASES_TTL = 7 * 24 * 60 * 60 * 1000,
	HATNOTE = /^(dablink|distinguir|hatnote|(mini|ver )?desambig(?!-)|não confundir|nota:|outrosusos|redirect|rellink)/i;

/* ================================================================== *
 * Motor (funções puras)
 * ================================================================== */

function normName( s ) {
	return s
		.replace( /<!--[\s\S]*?-->/g, '' )
		.trim()
		.replace( /^subst\s*:\s*/i, '' )
		.replace( /^(predefinição|template)\s*:\s*/i, '' )
		.replace( /[_\s]+/g, ' ' )
		.toLowerCase();
}

/** Predefinição que começa em i ("{{"), com chaves aninhadas */
function templateAt( text, i ) {
	var inner, sep,
		depth = 1,
		j = i + 2;

	while ( j < text.length - 1 && depth ) {
		if ( text.substr( j, 2 ) === '{{' ) {
			depth++;
			j += 2;
		} else if ( text.substr( j, 2 ) === '}}' ) {
			depth--;
			j += 2;
		} else {
			j++;
		}
	}

	if ( depth ) {
		return null;
	}

	inner = text.slice( i + 2, j - 2 );
	sep = inner.search( /[|\n]/ );

	return {
		start: i,
		end: j,
		text: text.slice( i, j ),
		name: normName( sep === -1 ? inner : inner.slice( 0, sep ) ),
		body: sep === -1 ? '' : inner.slice( sep + 1 )
	};
}

/** Predefinições de nível superior entre from e to (ignora comentários) */
function scan( text, from, to ) {
	var t, close,
		out = [],
		i = from;

	while ( i < to - 1 ) {
		if ( text.substr( i, 4 ) === '<!--' ) {
			close = text.indexOf( '-->', i + 4 );
			i = close === -1 ? to : close + 3;
		} else if ( text.substr( i, 2 ) === '{{' ) {
			t = templateAt( text, i );
			if ( !t ) {
				break;
			}
			out.push( t );
			i = t.end;
		} else {
			i++;
		}
	}

	return out;
}

/** Fim da introdução: início do primeiro título de seção */
function leadEnd( text ) {
	var m = /(^|\n)=[^\n]*=[ \t]*(?=\n|$)/.exec( text );

	return m ? m.index + m[ 1 ].length : text.length;
}

/** Remove [s, e) e, se a linha ficar vazia, a quebra de linha seguinte */
function removeSpan( text, s, e ) {
	var after = e;

	while ( text.charAt( after ) === ' ' || text.charAt( after ) === '\t' ) {
		after++;
	}
	if ( text.charAt( after ) === '\n' ) {
		e = after + 1;
	} else if ( after >= text.length ) {
		e = after;
	}

	var left = text.slice( 0, s ),
		right = text.slice( e );

	// Não deixa três quebras de linha seguidas no ponto da remoção
	if ( /\n\n$/.test( left ) ) {
		right = right.replace( /^\n+/, '' );
	}

	return left + right;
}

/** Ponto de inserção no topo: depois das notas de topo (desambiguação etc.) */
function insertionPoint( text ) {
	var p, t,
		pos = 0;

	for ( ;; ) {
		p = pos;
		while ( /\s/.test( text.charAt( p ) ) ) {
			p++;
		}
		if ( text.substr( p, 2 ) !== '{{' ) {
			break;
		}
		t = templateAt( text, p );
		if ( !t || !HATNOTE.test( t.name ) ) {
			break;
		}
		pos = t.end;
		if ( text.charAt( pos ) === '\n' ) {
			pos++;
		}
	}

	return pos;
}

function insertBeforeCategories( text, tpl ) {
	var idx = text.search( /\n+\[\[\s*(?:Categoria|Category)\s*:/i );

	if ( idx === -1 ) {
		return text.replace( /\s*$/, '' ) + '\n\n' + tpl + '\n';
	}
	return text.slice( 0, idx ) + '\n\n' + tpl + text.slice( idx );
}

function buildTemplate( item, values ) {
	var s = '{{' + item.action;

	( item.params || [] ).forEach( function ( p ) {
		var v = ( ( values && values[ p.name ] ) || '' ).trim();

		if ( v && !p.external ) {
			s += '|' + p.name + '=' + v;
		}
	} );

	return s + ( item.extra || '' ) + '}}';
}

/**
 * @param {string} text
 * @param {Object} o { aliases: { nome → id | '#mp' }, byId }
 * @return {Object} { lead: [ { id, text } ], spans: [], fim: [], present: { id: true }, grouped: boolean }
 */
function analyze( text, o ) {
	var lead = [],
		spans = [],
		fim = [],
		present = {},
		grouped = false;

	scan( text, 0, leadEnd( text ) ).forEach( function ( t ) {
		var id = o.aliases[ t.name ];

		if ( id === '#mp' ) {
			grouped = true;
			spans.push( t );
			scan( t.body, 0, t.body.length ).forEach( function ( c ) {
				var cid = o.aliases[ c.name ];

				cid = ( cid && cid !== '#mp' ) ? cid : null;
				lead.push( { id: cid, text: c.text } );
				if ( cid ) {
					present[ cid ] = true;
				}
			} );
		} else if ( id && o.byId[ id ].placement !== 'fim' ) {
			spans.push( t );
			lead.push( { id: id, text: t.text } );
			present[ id ] = true;
		}
	} );

	scan( text, 0, text.length ).forEach( function ( t ) {
		var id = o.aliases[ t.name ];

		if ( id && id !== '#mp' && o.byId[ id ].placement === 'fim' ) {
			fim.push( { id: id, start: t.start, end: t.end } );
			present[ id ] = true;
		}
	} );

	return { lead: lead, spans: spans, fim: fim, present: present, grouped: grouped };
}

/**
 * Aplica a seleção ao texto.
 * @param {string} text
 * @param {Object} o { aliases, byId, catalog, mpName, checked: { id: true }, values: { id: { param: valor } }, useMP }
 * @return {Object} { text, added: [ids], removed: [ids] }
 */
function apply( text, o ) {
	var a = analyze( text, o ),
		group = [],
		solo = [],
		added = [],
		removed = [],
		out = text,
		block, at, head, tail, a2;

	function addOnce( list, id ) {
		if ( list.indexOf( id ) === -1 ) {
			list.push( id );
		}
	}

	// Marcações da introdução: mantidas (texto original) ou removidas
	a.lead.forEach( function ( occ ) {
		var item = occ.id ? o.byId[ occ.id ] : null;

		if ( item && !o.checked[ occ.id ] ) {
			addOnce( removed, occ.id );
			return;
		}
		( item && item.groupable === false ? solo : group ).push( occ.text );
	} );

	// Novas marcações do topo, na ordem do catálogo
	o.catalog.forEach( function ( item ) {
		var values, hasValues;

		if ( !o.checked[ item.id ] || a.present[ item.id ] || item.placement === 'fim' ) {
			return;
		}

		values = o.values[ item.id ] || {};
		hasValues = ( item.params || [] ).some( function ( p ) {
			return !p.external && ( values[ p.name ] || '' ).trim();
		} );

		( item.groupable === false || hasValues ? solo : group ).push( buildTemplate( item, values ) );
		added.push( item.id );
	} );

	block = ( group.length >= 2 && o.useMP )
		? '{{' + o.mpName + '|\n' + group.join( '\n' ) + '\n}}\n'
		: group.map( function ( t ) {
			return t + '\n';
		} ).join( '' );
	block += solo.map( function ( t ) {
		return t + '\n';
	} ).join( '' );

	if ( a.spans.length || block ) {
		a.spans.slice().sort( function ( x, y ) {
			return y.start - x.start;
		} ).forEach( function ( s ) {
			out = removeSpan( out, s.start, s.end );
		} );

		at = insertionPoint( out );
		head = out.slice( 0, at );
		tail = out.slice( at ).replace( /^\n+/, '' );
		out = head + ( head && !/\n$/.test( head ) ? '\n' : '' ) + block + tail;
	}

	// Marcações do fim (antes das categorias)
	a2 = analyze( out, o );
	a2.fim.slice().sort( function ( x, y ) {
		return y.start - x.start;
	} ).forEach( function ( occ ) {
		if ( !o.checked[ occ.id ] ) {
			out = removeSpan( out, occ.start, occ.end );
			addOnce( removed, occ.id );
		}
	} );

	o.catalog.forEach( function ( item ) {
		if ( item.placement === 'fim' && o.checked[ item.id ] && !a2.present[ item.id ] ) {
			out = insertBeforeCategories( out, buildTemplate( item, o.values[ item.id ] ) );
			added.push( item.id );
		}
	} );

	return { text: out, added: added, removed: removed };
}

ronda.tags = {
	normName: normName,
	scan: scan,
	analyze: analyze,
	apply: apply,
	buildTemplate: buildTemplate
};

/* ================================================================== *
 * Nomes alternativos via API (com cache)
 * ================================================================== */

/** Consulta com continuação, juntando os redirecionamentos de cada página */
function queryRedirects( titles ) {
	var pages = {},
		normalized = [],
		redirects = [],
		params = {
			action: 'query',
			titles: titles.join( '|' ),
			redirects: true,
			prop: 'redirects',
			rdprop: 'title',
			rdnamespace: 10,
			rdlimit: 'max'
		};

	function step( cont ) {
		return ronda.api.get( $.extend( {}, params, cont ) ).then( function ( data ) {
			var q = data.query || {};

			normalized = normalized.concat( q.normalized || [] );
			redirects = redirects.concat( q.redirects || [] );
			( q.pages || [] ).forEach( function ( p ) {
				var cur = pages[ p.title ] || ( pages[ p.title ] = { redirects: [] } );

				cur.redirects = cur.redirects.concat( p.redirects || [] );
			} );

			return data[ 'continue' ] ? step( data[ 'continue' ] ) : null;
		} );
	}

	return step( {} ).then( function () {
		return { pages: pages, normalized: normalized, redirects: redirects };
	} );
}

function loadAliases( refresh ) {
	var key = 'ronda-tag-aliases-v1',
		cached = !refresh && mw.storage.getObject( key ),
		tplNs = mw.config.get( 'wgFormattedNamespaces' )[ 10 ],
		list = ronda.catalog.maintenance.map( function ( item ) {
			return { id: item.id, title: tplNs + ':' + item.template };
		} ).concat( [ { id: '#mp', title: tplNs + ':' + ronda.catalog.multipleIssues } ] );

	if ( cached && cached.map && Date.now() - cached.t < ALIASES_TTL ) {
		return $.Deferred().resolve( cached.map ).promise();
	}

	return queryRedirects( list.map( function ( x ) {
		return x.title;
	} ) ).then( function ( r ) {
		var map = {},
			resolve = {};

		r.normalized.concat( r.redirects ).forEach( function ( n ) {
			resolve[ n.from ] = n.to;
		} );

		list.forEach( function ( x ) {
			var target = x.title,
				hops = 0,
				names;

			while ( resolve[ target ] && hops++ < 5 ) {
				target = resolve[ target ];
			}

			names = [ x.title, target ].concat( ( ( r.pages[ target ] || {} ).redirects || [] ).map( function ( p ) {
				return p.title;
			} ) );

			names.forEach( function ( n ) {
				var k = normName( n );

				if ( !map[ k ] ) {
					map[ k ] = x.id;
				}
			} );
		} );

		mw.storage.setObject( key, { t: Date.now(), map: map } );
		return map;
	} );
}

/* ================================================================== *
 * Ações posteriores
 * ================================================================== */

/** "a", "a e b", "a, b e c" */
function listText( values ) {
	return values.length < 2 ? values.join( '' ) : values.slice( 0, -1 ).join( ', ' ) + ' e ' + values[ values.length - 1 ];
}

function warnCreator( ctx, items ) {
	return ronda.api.get( {
		action: 'query',
		titles: ctx.page,
		prop: 'revisions',
		rvprop: 'user|timestamp|comment',
		rvlimit: 50,
		rvdir: 'newer'
	} ).then( function ( data ) {
		var seen = {},
			me = mw.config.get( 'wgUserName' ),
			revs = data.query.pages[ 0 ].revisions || [],
			creator = revs[ 0 ] && revs[ 0 ].user,
			onlyCreator;

		if ( !creator || creator === me ) {
			return;
		}
		// Mesmo critério do FastButtons: IP que criou há mais de 24 h não é avisado
		if ( mw.util.isIPAddress( creator ) && Date.parse( revs[ 0 ].timestamp ) + 864e5 < Date.now() ) {
			return;
		}

		onlyCreator = revs.every( function ( r ) {
			return r.user === creator || r.user === me || /moveu \[\[.+?\]\] para \[\[.+?\]\]/.test( r.comment || '' );
		} );

		items = items.filter( function ( item ) {
			if ( seen[ item.warn ] || ( item.sameEditor && !onlyCreator ) ) {
				return false;
			}
			seen[ item.warn ] = true;
			return true;
		} );
		if ( !items.length ) {
			return;
		}

		// Todos os avisos numa única edição da discussão do criador, cada um com a sua assinatura
		return ronda.post( {
			action: 'edit',
			title: mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + creator,
			appendtext: items.map( function ( item ) {
				return '\n\n{{subst:Aviso-' + item.warn + '|' + ctx.page + '}} ~~' + '~~';
			} ).join( '' ),
			summary: 'Aviso: [[' + ctx.page + ']] marcada com '
				+ listText( items.map( function ( item ) {
					return ronda.tpl( item.template );
				} ) ),
			watchlist: ronda.config.watchlist
		} );
	} );
}

function followUps( ctx, result, values, byId, warn ) {
	var tasks = [],
		warnItems = [];

	result.added.forEach( function ( id ) {
		var item = byId[ id ];

		if ( item.listing ) {
			tasks.push( function () {
				return ronda.post( {
					action: 'edit',
					title: 'Wikipédia:Páginas precisando de manutenção',
					section: 'new',
					sectiontitle: '[[' + ctx.page + ']]',
					text: values[ id ].situacao + ' ~~' + '~~',
					summary: 'Manutenção urgente: [[' + ctx.page + ']]',
					watchlist: ronda.config.watchlist
				} );
			} );
		}
		if ( warn && item.warn ) {
			warnItems.push( item );
		}
	} );

	if ( warnItems.length ) {
		tasks.push( function () {
			return warnCreator( ctx, warnItems );
		} );
	}

	return ronda.sequence( tasks, function ( fn ) {
		return fn();
	} ).then( function ( results ) {
		var failed = results.filter( function ( r ) {
			return !r.ok;
		} );

		if ( failed.length ) {
			mw.notify( ronda.msg( 'paginas-marcacoes-salvas-mas-acao-oes-posterior', failed.length ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
		}
	} );
}

function summarize( r, o ) {
	var parts = [];

	function names( ids ) {
		return ids.map( function ( id ) {
			return ronda.tpl( o.byId[ id ].template );
		} ).join( ', ' );
	}

	if ( r.added.length ) {
		parts.push( names( r.added ) );
	}
	if ( r.removed.length ) {
		parts.push( 'retirada(s): ' + names( r.removed ) );
	}
	if ( !parts.length ) {
		parts.push( ( o.useMP ? 'agrupadas em ' : 'desagrupadas de ' ) + ronda.tpl( o.mpName ) );
	}

	return 'Marcação: ' + parts.join( '; ' );
}

/**
 * Marcações sugeridas pelo próprio texto (e por dados da API), para o painel
 * "Sugeridas" do diálogo. Só sugere o que existe no catálogo e ainda não está
 * na página; nas famílias (fontes), sugere uma só.
 * @param {string} text Wikitexto
 * @param {Object} info { ns, categories: número de categorias visíveis ou null,
 *   living: biografia de pessoa viva, disambig: ligações para desambiguações,
 *   present: { id: true } }
 * @return {Array} [ { id, reason } ]
 */
function suggestTags( text, info ) {
	var out = [],
		q = ronda.quality,
		present = info.present || {},
		has = {},
		t, refs, refsUnicas, temSecaoFontes, links, semSecoes, lead;

	( ronda.catalog.maintenance || [] ).forEach( function ( m ) {
		has[ m.id ] = true;
	} );

	function add( id, reason ) {
		if ( has[ id ] && !present[ id ] && !out.some( function ( o ) {
			return o.id === id;
		} ) ) {
			out.push( { id: id, reason: reason } );
		}
	}

	if ( info.ns !== 0 || !q || /^\s*#(redirect|redirecionamento)/i.test( text ) ) {
		return out;
	}

	t = text.replace( /<!--[\s\S]*?-->/g, '' );
	refs = t.match( /<ref(?:\s[^>]*[^\/])?>|\{\{\s*(?:sfn|sfnp|harvnb|efn)\s*\|/gi ) || [];
	refsUnicas = ( t.match( /<ref(?:\s[^>]*[^\/])?>[\s\S]*?<\/ref>/gi ) || [] ).length;
	temSecaoFontes = /^==\s*(Referências|Bibliografia|Fontes|Notas e referências)\s*==\s*\n+\s*(\*|\{\{\s*(citar|cite|cita))/im.test( t );
	links = q.ligacoes( t );
	semSecoes = !/^==[^=]/m.test( t );
	lead = t.slice( 0, t.search( /^==/m ) === -1 ? t.length : t.search( /^==/m ) )
		.replace( /\{\{[\s\S]*?\}\}/g, '' ).replace( /\[\[(Ficheiro|File|Imagem|Image|Arquivo):[^\n]*\]\]/gi, '' ).trim();

	// Fontes: uma sugestão só, da mais grave para a mais leve
	if ( !present[ 's-fontes' ] && !present[ 's-fontes-bpv' ] && !present[ 's-notas' ] && !present[ 's-notas-bpv' ] &&
		!present[ 'm-notas' ] && !present[ 'm-fontes-bpv' ] && !present[ '1f' ] ) {
		if ( !refs.length && !temSecaoFontes ) {
			add( info.living ? 's-fontes-bpv' : 's-fontes', ronda.msg( 'paginas-sug-sem-fontes' ) );
		} else if ( !refs.length ) {
			add( info.living ? 's-notas-bpv' : 's-notas', ronda.msg( 'paginas-sug-sem-notas' ) );
		} else {
			t = q.texto( text );
			if ( t.semRef.length ) {
				add( info.living ? 'm-fontes-bpv' : 'm-notas', ronda.msg( 'paginas-sug-mais-notas', t.semRef.slice( 0, 3 ).join( '; ' ) + ( t.semRef.length > 3 ? '…' : '' ) ) );
			} else if ( refsUnicas === 1 && text.length >= 3000 ) {
				add( '1f', ronda.msg( 'paginas-sug-uma-fonte' ) );
			}
		}
	}
	if ( /<ref(?:\s[^>]*)?>\s*\[?\s*https?:\/\/[^\s<\]]+\s*\]?\s*<\/ref>/i.test( text ) ) {
		add( 'f-referencias', ronda.msg( 'paginas-sug-formatar-referencias' ) );
	}
	if ( info.categories === 0 ) {
		add( 's-cat', ronda.msg( 'paginas-sug-sem-categorias' ) );
	}
	if ( text.length >= 1500 && links < 3 ) {
		add( 'wkf', ronda.msg( 'paginas-sug-poucas-ligacoes', links ) );
	} else if ( text.length >= 6000 && semSecoes ) {
		add( 'wkf', ronda.msg( 'paginas-sug-sem-secoes' ) );
	}
	if ( !semSecoes && lead.length < 20 ) {
		add( 'intro', ronda.msg( 'paginas-sug-sem-introducao' ) );
	}
	if ( info.disambig > 0 ) {
		add( 'lig-ambiguas', ronda.msg( 'paginas-sug-desambiguacoes', info.disambig ) );
	}
	return out;
}

ronda.tags.suggest = suggestTags;

/* ================================================================== *
 * Interface
 * ================================================================== */

function showForm( ctx, text, aliases, info ) {
	var byId = {},
		base, a, groupablePresent, items = [],
		$filter = ronda.ui.text( '', ronda.msg( 'paginas-filtrar-marcacoes' ) ),
		$presentBox = $( '<fieldset class="ui-widget-content ui-corner-all"></fieldset>' )
			.append( $( '<legend></legend>' ).text( ronda.msg( 'paginas-presentes-na-pagina-desmarque-para-remover' ) ) ),
		$addBox = $( '<div class="ronda-tag-groups"></div>' ),
		addGroups = {},
		suggested = {},
		recent = {},
		cbMP, cbWarn, $dlg;

	ronda.catalog.maintenance.forEach( function ( item ) {
		byId[ item.id ] = item;
	} );

	/** Um fieldset por grupo do catálogo, na ordem em que aparecem */
	function addGroup( name ) {
		name = name || ronda.msg( 'paginas-outras' );
		if ( !addGroups[ name ] ) {
			addGroups[ name ] = $( '<fieldset class="ui-widget-content ui-corner-all"></fieldset>' )
				.append( $( '<legend></legend>' ).text( name ) )
				.appendTo( $addBox );
		}
		return addGroups[ name ];
	}

	base = {
		aliases: aliases,
		byId: byId,
		catalog: ronda.catalog.maintenance,
		mpName: ronda.catalog.multipleIssues
	};
	a = analyze( text, base );

	// Sugeridas e usadas recentemente: painéis no topo, como os Favoritos do Avisar
	suggestTags( text, $.extend( { ns: ctx.ns, present: a.present }, info || {} ) ).forEach( function ( sg ) {
		suggested[ sg.id ] = sg.reason;
	} );
	ronda.recentTags.list().forEach( function ( id, i ) {
		if ( byId[ id ] && !a.present[ id ] && !suggested[ id ] ) {
			recent[ id ] = i + 1;
		}
	} );
	if ( !$.isEmptyObject( suggested ) ) {
		addGroups[ ':sugeridas' ] = $( '<fieldset class="ui-widget-content ui-corner-all ronda-tag-sug"></fieldset>' )
			.append( $( '<legend></legend>' ).text( ronda.msg( 'paginas-sugeridas' ) ) )
			.appendTo( $addBox );
	}
	if ( !$.isEmptyObject( recent ) ) {
		addGroups[ ':recentes' ] = $( '<fieldset class="ui-widget-content ui-corner-all ronda-tag-recent"></fieldset>' )
			.append( $( '<legend></legend>' ).text( ronda.msg( 'paginas-usadas-recentemente' ) ) )
			.appendTo( $addBox );
	}

	// Respeita o estado atual quando já há duas ou mais marcações agrupáveis
	groupablePresent = a.lead.filter( function ( occ ) {
		return !occ.id || byId[ occ.id ].groupable !== false;
	} ).length;
	cbMP = ronda.ui.checkbox(
		'Agrupar em {{' + ronda.catalog.multipleIssues + '}} quando houver duas ou mais',
		groupablePresent >= 2 ? a.grouped : true
	);
	cbWarn = ronda.ui.checkbox( ronda.msg( 'paginas-avisar-o-criador-da-pagina-quando' ), true );

	ronda.catalog.maintenance.forEach( function ( item ) {
		var isPresent = !!a.present[ item.id ],
			cb = ronda.ui.checkbox( item.label, isPresent ),
			$params = $( '<div class="ronda-tag-params"></div>' ).hide(),
			inputs = ( item.params || [] ).map( function ( p ) {
				var $input = ronda.ui.text( '', p.label + ( p.required ? '' : ' (opcional)' ) );

				$params.append( $input );
				return { def: p, $input: $input };
			} );

		cb.$element
			.addClass( 'ronda-tag' + ( isPresent ? ' ronda-tag-present' : '' ) )
			.attr( 'title', item.title )
			.data( { search: ( item.label + ' ' + item.template ).toLowerCase(), id: item.id } )
			.append( $params );

		if ( inputs.length && !isPresent ) {
			cb.$input.on( 'change', function () {
				$params.toggle( cb.isChecked() );
				cb.$element.toggleClass( 'ronda-tag-open', cb.isChecked() );
			} );
		}

		if ( !isPresent && suggested[ item.id ] ) {
			cb.$element.children( 'label' ).after( $( '<span class="ronda-sug-reason"></span>' ).text( suggested[ item.id ] ) );
		}
		( isPresent ? $presentBox
			: suggested[ item.id ] ? addGroups[ ':sugeridas' ]
				: recent[ item.id ] ? addGroups[ ':recentes' ]
					: addGroup( item.group ) ).append( cb.$element );
		items.push( { item: item, cb: cb, inputs: inputs, present: isPresent } );
	} );

	if ( addGroups[ ':recentes' ] ) {
		addGroups[ ':recentes' ].children( '.ronda-tag' ).sort( function ( x, y ) {
			return recent[ $( x ).data( 'id' ) ] - recent[ $( y ).data( 'id' ) ];
		} ).appendTo( addGroups[ ':recentes' ] );
	}

	if ( $presentBox.children( '.ronda-tag' ).length === 0 ) {
		$presentBox.append( $( '<p></p>' ).text( ronda.msg( 'paginas-nenhuma-marcacao-do-catalogo-encontrada-na' ) ) );
	}

	$filter.on( 'input', function () {
		var term = $filter.val().trim().toLowerCase();

		$.each( addGroups, function ( name, $fs ) {
			var shown = 0;

			$fs.children( '.ronda-tag' ).each( function () {
				var match = !term || $( this ).data( 'search' ).indexOf( term ) !== -1;

				$( this ).toggle( match );
				shown += match ? 1 : 0;
			} );
			$fs.toggle( shown > 0 );
		} );
	} );

	/** Opções escolhidas no diálogo; null se falta um campo obrigatório */
	function gather() {
		var checked = {},
			values = {},
			ok = true;

		items.forEach( function ( it ) {
			var id = it.item.id;

			if ( !it.cb.isChecked() ) {
				return;
			}
			checked[ id ] = true;

			if ( !it.present ) {
				values[ id ] = {};
				it.inputs.forEach( function ( p ) {
					var v = p.$input.val().trim();

					values[ id ][ p.def.name ] = v;
					if ( p.def.required ) {
						ok = ronda.ui.require( p.$input, !!v ) && ok;
					}
				} );
			}
		} );

		return ok ? { opts: $.extend( {}, base, { checked: checked, values: values, useMP: cbMP.isChecked() } ), values: values } : null;
	}

	/** Prévia das marcações na página (opcional, como a dos avisos) */
	function previewTags() {
		var g = gather();

		if ( g ) {
			ronda.ui.previewEdit( ctx.page, apply( text, g.opts ).text );
		}
	}

	function submit() {
		var g = gather(),
			opts, values, preview, result;

		if ( !g ) {
			return;
		}
		opts = g.opts;
		values = g.values;
		preview = apply( text, opts );

		if ( preview.text === text ) {
			mw.notify( ronda.msg( 'paginas-nenhuma-alteracao-em-relacao-ao-estado' ), { title: ronda.msg( 'core-nome' ) } );
			return;
		}

		ronda.ui.setBusy( $dlg, true );

		ronda.editPage( ctx.page, function ( revision ) {
			result = apply( revision.content, opts );

			if ( result.text === revision.content ) {
				return $.Deferred().reject( 'ronda-nochange' ).promise();
			}

			return ronda.params( {
				text: result.text,
				summary: summarize( result, opts ),
				minor: true,
				watchlist: ronda.config.watchlist
			} );
		} ).then( function ( res ) {
			ronda.recentTags.push( result.added ).then( null, function () {} );
			// Formulário de edição: avisos e registros só quando o usuário publicar
			if ( res.form ) {
				ronda.ui.onSave( function () {
					return followUps( ctx, result, values, byId, cbWarn.isChecked() );
				} );
				mw.notify( ronda.msg( 'paginas-marcacoes-aplicadas-ao-texto-publique-a' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
				ronda.ui.close( $dlg );
				return $.Deferred().reject( 'ronda-form' ).promise();
			}
			return followUps( ctx, result, values, byId, cbWarn.isChecked() );
		} ).then( function () {
			mw.notify( ronda.msg( 'paginas-marcacoes-atualizadas' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
			ronda.ui.close( $dlg );
			location.reload();
		}, function ( code, data ) {
			if ( code === 'ronda-form' ) {
				return;
			}
			ronda.ui.setBusy( $dlg, false );
			if ( code === 'ronda-nochange' ) {
				mw.notify( ronda.msg( 'paginas-a-versao-atual-da-pagina-ja' ), { title: ronda.msg( 'core-nome' ) } );
			} else {
				ronda.fail( code, data );
			}
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'paginas-manutencao-titulo', ctx.page ),
		width: 680,
		content: $( '<div></div>' ).append(
			$presentBox,
			ronda.ui.row( ronda.msg( 'patrulha-filtrar' ), $filter ),
			$addBox,
			cbMP.$element,
			cbWarn.$element
		),
		buttons: [ {
			text: ronda.msg( 'paginas-aplicar' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: submit
		}, {
			text: ronda.msg( 'core-previa-botao' ),
			click: previewTags
		}, {
			text: ronda.msg( 'paginas-atualizar-nomes-alternativos' ),
			click: function () {
				ronda.ui.close( $dlg );
				open( ctx, { refresh: true } );
			}
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );

	$dlg.tooltip( { tooltipClass: 'ronda-tooltip' } );
}

/** Dados para as sugestões: categorias visíveis, biografia de pessoa viva, ligações para desambiguações */
function suggestInfo( ctx ) {
	if ( ctx.ns !== 0 || !ctx.exists ) {
		return $.Deferred().resolve( {} ).promise();
	}
	return $.when(
		ronda.api.get( { action: 'query', titles: ctx.page, prop: 'categories', clprop: 'hidden', cllimit: 'max' } ),
		ronda.api.get( { action: 'query', titles: ctx.page, generator: 'links', gplnamespace: 0, gpllimit: 'max',
			prop: 'pageprops', ppprop: 'disambiguation' } )
	).then( function ( c, l ) {
		var cats = ( ( ( c && c.query ? c : c[ 0 ] ).query.pages || [] )[ 0 ] || {} ).categories || [],
			pages = ( ( l && l.query ? l : l[ 0 ] ).query || {} ).pages || [];

		return {
			categories: cats.filter( function ( x ) {
				return !x.hidden;
			} ).length,
			living: cats.some( function ( x ) {
				return /^Categoria:Pessoas vivas$/.test( x.title );
			} ),
			disambig: pages.filter( function ( p ) {
				return p.pageprops && p.pageprops.disambiguation !== undefined;
			} ).length
		};
	}, function () {
		return $.Deferred().resolve( {} ).promise();
	} );
}

function open( ctx, options ) {
	$.when(
		loadAliases( options && options.refresh ),
		ronda.api.get( {
			action: 'query',
			titles: ctx.page,
			prop: 'revisions',
			rvprop: 'content',
			rvslots: 'main'
		} ),
		suggestInfo( ctx )
	).then( function ( aliases, res, info ) {
		var page = ( res && res.query ? res : res[ 0 ] ).query.pages[ 0 ],
			text = ronda.inEditForm() ? $( '#wpTextbox1' ).val()
				: ( page.revisions && page.revisions[ 0 ].slots.main.content ) || '';

		showForm( ctx, text, aliases, info );
	}, ronda.fail );
}

ronda.registerModule( {
	id: 'manutencao',
	label: ronda.msg( 'paginas-manutencao-botao' ),
	title: ronda.msg( 'paginas-adicionar-ou-remover-predefinicoes-de-manutencao' ),
	order: 10,
	isAvailable: function ( ctx ) {
		return ronda.isTaggable( ctx )
			&& ctx.exists
			&& !ctx.isRedirect
			&& ronda.config.maintenance.namespaces.indexOf( ctx.ns ) !== -1
			&& ronda.can( 'edit' );
	},
	open: open
} );

}( window.ronda ) );

/**
 * Ronda — propostas de eliminação rápida (ER) e semirrápida (ESR)
 *
 * Portado do FastButtons, para quem marca a página (não elimina):
 * - Rápida: regras de ronda.catalog.speedy filtradas pelo domínio da página
 *   (redirecionamentos só veem R1/R2; discussões, D1/D2), num menu, com observação.
 *   Gera {{ER|<regra>|3=<obs>|2=~~~~}} no topo.
 * - Semirrápida (artigos e ficheiros): assunto com justificativa-padrão
 *   (ronda.catalog.esrSubjects), predefinição própria do assunto quando
 *   houver (ESR-banda, ESR-bio), má tradução (ESR-matrad) e ESR-arquivo.
 * Em ambos:
 * - <noinclude> em predefinições, userboxes e páginas transcluídas.
 * - Bloqueia se já houver marcação de eliminação (mesma expressão do Consenso).
 * - Aviso ao criador com os critérios do FastButtons: não avisa a si mesmo,
 *   página vinda de moção, IP que criou há mais de 24 h; nas regras técnicas
 *   (noWarn) a ER não avisa.
 * - Marca a página como patrulhada se houver o link de patrulha.
 * - No formulário de edição (como no FastButtons), a marca vai para a caixa
 *   de texto e o aviso é enviado quando o usuário publicar.
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

var SIG = '~~' + '~~',
	HATNOTE = /^(dablink|distinguir|hatnote|(mini|ver )?desambig(?!-)|não confundir|nota:|outrosusos|redirect|rellink)/i,
	FORBIDDEN_NS = [ 8, 828 ];

/* ================================================================== *
 * Funções puras
 * ================================================================== */

/** Escapa só as barras verticais fora de [[…]] e {{…}} */
function paramSafe( text ) {
	return ronda.templateSafe( text );
}

/** Regras de ER que valem para a página */
function rulesFor( page ) {
	return ( ronda.catalog.speedy || [] ).filter( function ( r ) {
		if ( page.isRedirect ) {
			return !!r.redirect;
		}
		if ( r.redirect ) {
			return false;
		}
		if ( r.talk ) {
			return page.ns % 2 === 1;
		}
		return !r.ns || r.ns.indexOf( page.ns ) !== -1;
	} );
}

function buildER( rule, obs ) {
	obs = ( obs || '' ).trim();
	return '{{ER|' + rule + ( obs ? '|3=' + paramSafe( obs ) : '' ) + '|2=' + SIG + '}}';
}

/**
 * @param {Object} o { ns, subject: { label, template } | null, text, matrad: boolean, language }
 */
function buildESR( o ) {
	var just = paramSafe( ( o.text || '' ).trim() );

	if ( o.ns === 6 ) {
		return '{{subst:ESR-arquivo|1=' + just + ' ' + SIG + '}}';
	}
	if ( o.matrad ) {
		return '{{subst:ESR-matrad|1=' + just + ' ' + SIG + '|língua=' + ( o.language || '' ).trim().toLowerCase() + '}}';
	}
	if ( o.subject && o.subject.template ) {
		return '{{subst:' + o.subject.template + '|1=' + SIG + '|2=' + just + '}}';
	}
	return '{{subst:ESR|1=' + just + ' ' + SIG + ( o.subject ? '|assunto=' + o.subject.label : '' ) + '}}';
}

/** Fim das notas de topo (desambiguação etc.) no início do texto */
function afterHatnotes( text ) {
	var m, name,
		pos = 0,
		re = /^\s*\{\{([^{}|]+)(?:\{\{[^{}]*\}\}|[^{}])*\}\}[ \t]*\n?/;

	while ( ( m = re.exec( text.slice( pos ) ) ) ) {
		name = m[ 1 ].trim();
		if ( !HATNOTE.test( name ) ) {
			break;
		}
		pos += m[ 0 ].length;
	}

	return pos;
}

/**
 * Coloca a marcação no texto.
 * @param {Object} o { noinclude, hatnotes: inserir depois das notas de topo }
 */
function place( text, code, o ) {
	var at = o.hatnotes ? afterHatnotes( text ) : 0,
		tag = o.noinclude ? '<noinclude>' + code + '</noinclude>' : code + '\n';

	return text.slice( 0, at ) + tag + text.slice( at );
}

ronda.proposal = {
	paramSafe: paramSafe,
	rulesFor: rulesFor,
	buildER: buildER,
	buildESR: buildESR,
	afterHatnotes: afterHatnotes,
	place: place
};

/* ================================================================== *
 * Operações na wiki
 * ================================================================== */

function hasTag( text ) {
	return ronda.hasEliminationTag( text );
}

/** Conteúdo, transclusões, afluentes e as duas primeiras revisões */
function loadPage( ctx ) {
	return ronda.api.get( {
		action: 'query',
		titles: ctx.page,
		prop: 'revisions|info',
		rvprop: 'content',
		rvslots: 'main',
		list: 'embeddedin|backlinks',
		eititle: ctx.page,
		eilimit: 1,
		bltitle: ctx.page,
		bllimit: 50
	} ).then( function ( data ) {
		var p = data.query.pages[ 0 ];

		return {
			title: p.title,
			ns: p.ns,
			isRedirect: !!p.redirect,
			// No formulário de edição vale o texto da caixa, como no FastButtons
			content: ronda.inEditForm() ? $( '#wpTextbox1' ).val()
				: p.revisions ? p.revisions[ 0 ].slots.main.content : '',
			transcluded: !!( data.query.embeddedin || [] ).length,
			backlinks: data.query.backlinks || []
		};
	} );
}

function tagPage( page, code, summary, hatnotes ) {
	return ronda.editPage( page.title, function ( revision ) {
		if ( hasTag( revision.content ) ) {
			return $.Deferred().reject( 'ronda-already-tagged' ).promise();
		}

		return ronda.params( {
			text: place( revision.content, code, { noinclude: ronda.useNoinclude( page ), hatnotes: hatnotes } ),
			summary: summary,
			nocreate: true,
			watchlist: ronda.config.watchlist
		} );
	} );
}

function errorText( code ) {
	return {
		'ronda-already-tagged': ronda.msg( 'paginas-a-pagina-ja-tem-uma-marcacao' ),
		editconflict: ronda.msg( 'paginas-conflito-de-edicao' ),
		missingtitle: ronda.msg( 'paginas-a-pagina-nao-existe-mais' )
	}[ code ] || code;
}

/**
 * Tarefas comuns: marcar (crítica), patrulhar e avisar o criador.
 * No formulário de edição, a marca vai para a caixa de texto e o aviso só é
 * enviado quando o usuário publicar, como no FastButtons.
 */
function tasksFor( page, tagFn, warnCode, extraWarn ) {
	var inForm = ronda.inEditForm(),
		rcid = ronda.patrolRcid(),
		tasks = [ { critical: true, label: ronda.msg( 'paginas-marcando', page.title ), fn: tagFn } ];

	if ( rcid && ronda.can( 'patrol' ) && !inForm ) {
		tasks.push( { label: ronda.msg( 'patrulha-marcando-como-patrulhada' ), fn: function () {
			return ronda.api.postWithToken( 'patrol', { action: 'patrol', rcid: rcid } );
		} } );
	}

	if ( warnCode || extraWarn ) {
		tasks.push( { label: ronda.msg( 'paginas-aviso-ao-criador' ), fn: function () {
			if ( inForm ) {
				ronda.ui.onSave( function () {
					return ronda.warnCreator( page.title, warnCode, null, extraWarn );
				} );
				return ronda.msg( 'paginas-sera-enviado-ao-publicar-a-edicao' );
			}
			return ronda.warnCreator( page.title, warnCode, null, extraWarn );
		} } );
	}
	return tasks;
}

function runTasks( $dlg, $progress, $log, tasks, doneText ) {
	ronda.ui.runner( $dlg, $progress, $log, errorText )( tasks, function ( ok ) {
		var inForm = ronda.inEditForm();

		mw.notify( ok ? ( inForm ? ronda.msg( 'paginas-marca-inserida-no-texto-publique-a' ) : doneText )
			: ronda.msg( 'paginas-a-marcacao-nao-foi-feita-veja' ), { type: ok ? 'success' : 'error', title: ronda.msg( 'core-nome' ) } );
		ronda.ui.finishButtons( $dlg, ok );
	} );
}

/* ================================================================== *
 * Aviso a mais ao criador (junto da notificação de eliminação)
 * ================================================================== */

/** Avisos do catálogo que fazem sentido aqui: sem campos obrigatórios, fora dos grupos próprios */
function extraWarnings() {
	var skip = [ 'Boas-vindas', 'Eliminação', 'Notificação de bloqueio' ],
		fav = ronda.favorites;

	if ( !ronda.warnings || !ronda.catalog.warnings ) {
		return [];
	}
	return ronda.catalog.warnings.filter( function ( w ) {
		return skip.indexOf( w.group ) === -1 && !( w.fields || [] ).some( function ( f ) {
			return f.required;
		} );
	} ).sort( function ( a, b ) {
		return ( fav && fav.has( b.id ) ? 1 : 0 ) - ( fav && fav.has( a.id ) ? 1 : 0 );
	} );
}

/** Campos do aviso a mais: aviso e nível ("sugerido" = pelos avisos dos últimos dias) */
function extraWarnFields() {
	var items = extraWarnings(),
		fav = ronda.favorites,
		$item = $( '<select></select>' ).append( $( '<option value=""></option>' ).text( ronda.msg( 'paginas-nenhum' ) ) ),
		$level = $( '<select></select>' ).append(
			$( '<option value="auto"></option>' ).text( ronda.msg( 'paginas-nivel-sugerido' ) ),
			$( '<option value="1"></option>' ).text( ronda.msg( 'paginas-nivel-n', 1 ) ),
			$( '<option value="2"></option>' ).text( ronda.msg( 'paginas-nivel-n', 2 ) ),
			$( '<option value="3"></option>' ).text( ronda.msg( 'paginas-nivel-n', 3 ) )
		).hide(),
		groups = {};

	items.forEach( function ( w ) {
		var g = fav && fav.has( w.id ) ? ronda.msg( 'paginas-favoritos' ) : w.group;

		if ( !groups[ g ] ) {
			groups[ g ] = $( '<optgroup></optgroup>' ).attr( 'label', g ).appendTo( $item );
		}
		$( '<option></option>' ).val( w.id ).text( w.label ).attr( 'title', w.title || '' ).appendTo( groups[ g ] );
	} );

	function chosen() {
		var id = $item.val();

		return items.filter( function ( w ) {
			return w.id === id;
		} )[ 0 ] || null;
	}

	ronda.ui.onChange( $item, function () {
		var w = chosen();

		$level.toggle( !!( w && w.levels ) );
	} );

	return {
		$el: $( '<span></span>' ).append( $item, ' ', $level ),
		available: items.length > 0,
		/** function( criador ) para ronda.warnCreator, ou null */
		fn: function ( title ) {
			var w = chosen(),
				choice = $level.val();

			if ( !w ) {
				return null;
			}
			return function ( creator ) {
				var talk = mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + creator,
					days = ( ronda.config.warnings && ronda.config.warnings.window ) || 30,
					getLevel = !w.levels ? $.Deferred().resolve( null ).promise()
						: choice !== 'auto' ? $.Deferred().resolve( Number( choice ) ).promise()
							: ronda.api.get( { action: 'query', titles: talk, prop: 'revisions',
								rvprop: 'timestamp|comment|content', rvslots: 'main', rvlimit: 1 } ).then( function ( d1 ) {
								return ronda.api.get( { action: 'query', titles: talk, prop: 'revisions',
									rvprop: 'timestamp|comment', rvlimit: 50 } ).then( function ( d2 ) {
									var cur = ( d1.query.pages[ 0 ].revisions || [] )[ 0 ],
										prev = ronda.warnings.previous( w, d2.query.pages[ 0 ].revisions || [],
											cur ? cur.slots.main.content : '', Date.now(), days );

									return ronda.warnings.suggest( prev ).level;
								} );
							}, function () {
								return 1;
							} );

				return getLevel.then( function ( level ) {
					return {
						text: ronda.warnings.build( w, level, { pagina: title },
							{ marker: !ronda.config.warnings || ronda.config.warnings.marker !== false } ),
						summary: ronda.warnings.summaryFor( w, level )
					};
				} );
			};
		}
	};
}

/* ================================================================== *
 * Rápida
 * ================================================================== */

function showSpeedy( ctx, page ) {
	var rules = rulesFor( page ),
		$rule = $( '<select></select>' ).append( $( '<option value=""></option>' ).text( ronda.msg( 'paginas-escolha-a-regra' ) ) ),
		$obs = ronda.ui.text( '', ronda.msg( 'paginas-observacao-para-quem-for-eliminar-opcional' ) ),
		$warn = $( '<select></select>' ).append(
			$( '<option value="er"></option>' ).text( ronda.msg( 'paginas-aviso-de-eliminacao-rapida-aviso-er' ) ),
			$( '<option value="naoremova"></option>' ).text( ronda.msg( 'paginas-nao-remova-a-marcacao-aviso-nao' ) ),
			$( '<option value=""></option>' ).text( ronda.msg( 'paginas-nao-avisar' ) )
		),
		$warnRow = ronda.ui.row( ronda.msg( 'paginas-aviso-ao-criador' ), $warn ),
		extra = extraWarnFields(),
		$extraRow = ronda.ui.row( ronda.msg( 'paginas-aviso-a-mais' ), extra.$el ).toggle( extra.available ),
		$progress = $( '<div class="ronda-progress"></div>' ).hide(),
		$log = $( '<ul class="ronda-log"></ul>' ),
		$content = $( '<div></div>' ),
		$dlg;

	rules.forEach( function ( r ) {
		$( '<option></option>' ).val( r.rule ).text( r.rule + ' — ' + r.title ).appendTo( $rule );
	} );

	function selected() {
		var v = $rule.val();

		return rules.filter( function ( r ) {
			return r.rule === v;
		} )[ 0 ] || null;
	}

	ronda.ui.onChange( $rule, function () {
		var r = selected();

		ronda.ui.require( $rule, true );
		$warnRow.toggle( !!r && !r.noWarn );
	} );

	if ( page.isRedirect && page.backlinks.length ) {
		$content.append( ronda.ui.message( 'highlight', $( '<span></span>' ).append(
			document.createTextNode( ronda.msg( 'paginas-o-redirecionamento-tem-afluente-s-confira', page.backlinks.length >= 50 ? '50+' : page.backlinks.length ) ),
			$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( 'Special:WhatLinksHere/' + page.title ) ).text( ronda.msg( 'paginas-ver-lista' ) )
		) ) );
	}

	$content.append( ronda.ui.row( ronda.msg( 'paginas-regra' ), $rule ), ronda.ui.row( ronda.msg( 'paginas-observacao' ), $obs ), $warnRow, $extraRow, $progress, $log );

	function submit() {
		var r = selected(),
			obs = $obs.val(),
			warnType = $warn.val(),
			tasks = [];

		if ( !ronda.ui.require( $rule, !!r ) ) {
			return;
		}

		tasks = tasksFor( page, function () {
			return tagPage( page, buildER( r.rule, obs ),
				'Eliminação rápida: proposta pela regra [[WP:' + r.rule + '|' + r.rule + ']]', false );
		}, !r.noWarn && warnType ? ( warnType === 'er'
			? 'Aviso-ER|' + page.title + '|' + r.rule + ( obs.trim() ? '|3=' + paramSafe( obs.trim() ) : '' )
			: 'Aviso-não remova|' + page.title + '|er' ) : null, extra.fn( page.title ) );
		tasks[ 0 ].label += ' (' + r.rule + ')';

		runTasks( $dlg, $progress, $log, tasks, ronda.msg( 'paginas-pagina-proposta-para-eliminacao-rapida' ) );
	}

	/** Prévia da marcação na página (opcional, como a dos avisos) */
	function preview() {
		var r = selected();

		if ( !ronda.ui.require( $rule, !!r ) ) {
			return;
		}
		ronda.ui.previewEdit( page.title, place( page.content, buildER( r.rule, $obs.val() ),
			{ noinclude: ronda.useNoinclude( page ), hatnotes: false } ) );
	}

	$warnRow.hide();
	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'paginas-eliminacao-rapida', page.title ),
		width: 620,
		content: $content,
		buttons: [ {
			text: ronda.msg( 'paginas-propor' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: submit
		}, {
			text: ronda.msg( 'core-previa-botao' ),
			click: preview
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}

/* ================================================================== *
 * Semirrápida
 * ================================================================== */

function showSemi( ctx, page ) {
	var subjects = ronda.catalog.esrSubjects,
		isFile = page.ns === 6,
		$subject = $( '<select></select>' ).append( $( '<option value=""></option>' ).text( ronda.msg( 'paginas-outro-sem-assunto' ) ) ),
		$text = ronda.ui.textarea( '', ronda.msg( 'paginas-justificativa-a-assinatura-e-acrescentada-automa' ) ).attr( 'rows', 6 ),
		cbMatrad = ronda.ui.checkbox( ronda.msg( 'paginas-ma-traducao-esr-matrad' ), false ),
		$lang = ronda.ui.text( '', ronda.msg( 'paginas-codigo-da-lingua-de-origem-ex' ) ).attr( 'maxlength', 3 ),
		$subjectRow = ronda.ui.row( ronda.msg( 'paginas-assunto' ), $subject ),
		$langRow = ronda.ui.row( ronda.msg( 'paginas-lingua-de-origem' ), $lang ).hide(),
		$textRow = ronda.ui.row( isFile ? ronda.msg( 'paginas-justificativa-esr-arquivo' ) : ronda.msg( 'paginas-justificativa' ), $text ),
		cbWarn = ronda.ui.checkbox( ronda.msg( 'paginas-avisar-o-criador-aviso-esr' ), true ),
		$progress = $( '<div class="ronda-progress"></div>' ).hide(),
		$log = $( '<ul class="ronda-log"></ul>' ),
		$content = $( '<div></div>' ),
		lastDefault = '',
		$dlg;

	subjects.forEach( function ( s, i ) {
		$( '<option></option>' ).val( String( i ) )
			.text( s.label + ( s.template ? ' (' + s.template + ')' : '' ) )
			.appendTo( $subject );
	} );

	ronda.ui.onChange( $subject, function () {
		var s = subjects[ $subject.val() ],
			cur = $text.val().trim();

		// Só troca a justificativa se ela estiver vazia ou ainda for a padrão
		if ( !cur || cur === lastDefault ) {
			lastDefault = s ? s.text : '';
			$text.val( lastDefault );
		}
	} );

	cbMatrad.$input.on( 'change', function () {
		var on = cbMatrad.isChecked();

		$langRow.toggle( on );
		$subjectRow.toggle( !on );
		$textRow.children( 'label' ).text( on ? ronda.msg( 'paginas-comentario' ) : ronda.msg( 'paginas-justificativa' ) );
		if ( on && $text.val().trim() === lastDefault ) {
			$text.val( '' );
		}
	} );

	if ( isFile ) {
		$content.append( $textRow );
	} else {
		$content.append( cbMatrad.$element, $subjectRow, $langRow, $textRow );
	}
	$content.append( cbWarn.$element, $progress, $log );

	function submit() {
		var subject = subjects[ $subject.val() ] || null,
			matrad = !isFile && cbMatrad.isChecked(),
			text = $text.val().trim(),
			lang = $lang.val().trim(),
			ok = ronda.ui.require( $text, !!text || matrad ),
			tasks = [];

		if ( matrad ) {
			ok = ronda.ui.require( $lang, /^[a-z]{2,3}$/i.test( lang ) ) && ok;
		}
		if ( !ok ) {
			return;
		}

		tasks = tasksFor( page, function () {
			return tagPage( page, buildESR( {
				ns: page.ns,
				subject: matrad ? null : subject,
				text: text,
				matrad: matrad,
				language: lang
			} ), 'Eliminação semirrápida: página proposta', true );
		}, cbWarn.isChecked() ? 'Aviso-ESR|' + page.title : null );

		runTasks( $dlg, $progress, $log, tasks, ronda.msg( 'paginas-pagina-proposta-para-eliminacao-semirrapida' ) );
	}

	/** Prévia da marcação na página (opcional, como a dos avisos) */
	function preview() {
		var matrad = !isFile && cbMatrad.isChecked();

		ronda.ui.previewEdit( page.title, place( page.content, buildESR( {
			ns: page.ns,
			subject: matrad ? null : subjects[ $subject.val() ] || null,
			text: $text.val().trim(),
			matrad: matrad,
			language: $lang.val().trim()
		} ), { noinclude: ronda.useNoinclude( page ), hatnotes: true } ) );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'paginas-eliminacao-semirrapida', page.title ),
		width: 640,
		content: $content,
		buttons: [ {
			text: ronda.msg( 'paginas-propor' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: submit
		}, {
			text: ronda.msg( 'core-previa-botao' ),
			click: preview
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}

/* ================================================================== *
 * Registro
 * ================================================================== */

function opener( show ) {
	return function ( ctx ) {
		loadPage( ctx ).then( function ( page ) {
			if ( hasTag( page.content ) ) {
				mw.notify( ronda.msg( 'paginas-ja-tem-marcacao-aviso' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
				return;
			}
			show( ctx, page );
		}, ronda.fail );
	};
}

if ( !ronda.catalog.speedy || !ronda.catalog.esrSubjects ) {
	// eslint-disable-next-line no-console
	console.error( '[Ronda] Ronda-catalogo.js desatualizado: faltam as regras de ER/ESR. Os botões ER e ESR ficam ocultos.' );
}

ronda.registerModule( {
	id: 'rapida',
	hidden: true,
	label: ronda.msg( 'paginas-er' ),
	title: ronda.msg( 'paginas-propor-a-eliminacao-rapida-desta-pagina' ),
	order: 26,
	isAvailable: function ( ctx ) {
		return ronda.isTaggable( ctx )
			&& ctx.exists
			&& FORBIDDEN_NS.indexOf( ctx.ns ) === -1
			&& rulesFor( ctx ).length > 0
			&& ronda.can( 'edit' );
	},
	open: opener( showSpeedy )
} );

ronda.registerModule( {
	id: 'semirrapida',
	hidden: true,
	label: ronda.msg( 'paginas-esr' ),
	title: ronda.msg( 'paginas-propor-a-eliminacao-semirrapida-desta-pagina' ),
	order: 27,
	isAvailable: function ( ctx ) {
		return ronda.isTaggable( ctx )
			&& ctx.exists
			&& !ctx.isRedirect
			&& ( ctx.ns === 0 || ctx.ns === 6 )
			&& !!ronda.catalog.esrSubjects
			&& ronda.can( 'edit' );
	},
	open: opener( showSemi )
} );

}( window.ronda ) );

/**
 * Ronda — módulo Eliminação por consenso (PE), com propostas conjuntas
 *
 * Fluxo para uma página (como no FastButtons):
 *   1. arquiva a discussão anterior, se existir (move para /1, /2…);
 *   2. cria Wikipédia:Páginas para eliminar/<página> a partir de
 *      Predefinição:Página para eliminar, com a justificativa;
 *   3. marca a página com {{subst:apagar}} (gera {{Apagar4}});
 *   4. avisa o criador ({{subst:Aviso-PE|<página>}}), se pedido.
 *
 * Proposta conjunta (várias páginas numa só discussão):
 *   - a página atual é a mestra: a discussão dela é criada normalmente, com
 *     "+ N semelhantes" no cabeçalho de seção (o título da página não muda) e
 *     uma linha {{PE-ferramentas2|…}} para cada página;
 *   - para cada página adicional, Wikipédia:Páginas para eliminar/<página>
 *     vira um redirecionamento para a discussão mestra (arquivando antes a
 *     discussão anterior, se houver);
 *   - todas recebem {{subst:apagar}}: como a marca {{Apagar4}} aponta para a
 *     discussão de cada página, o redirecionamento leva todas à mestra;
 *   - os criadores de cada página são avisados, se pedido.
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

var FORBIDDEN_NS = [ -1, 8, 828 ];

function cfg() {
	return ronda.config.consensus;
}

function peTitle( title ) {
	return cfg().prefix + title;
}

/* ---------------- funções puras ---------------- */

function hasEliminationTag( text ) {
	return ronda.hasEliminationTag( text );
}

/** Fim (índice após "}}") da predefinição que começa em i, com chaves aninhadas */
function templateEnd( text, i ) {
	var depth = 0;

	while ( i < text.length - 1 ) {
		if ( text.substr( i, 2 ) === '{{' ) {
			depth++;
			i += 2;
		} else if ( text.substr( i, 2 ) === '}}' ) {
			depth--;
			i += 2;
			if ( !depth ) {
				return i;
			}
		} else {
			i++;
		}
	}

	return -1;
}

/**
 * Texto da discussão mestra a partir do modelo (mesma transformação do FastButtons).
 * Numa proposta conjunta, segue o formato usado na pt.wiki:
 *   === [[:Mestra]] + N semelhantes ===          ← só no conteúdo; o título da página não muda
 *   <div class="mw-notalk">
 *   {{PE-ferramentas2|Mestra}}                    ← linha que já vem do modelo
 *   {{PE-ferramentas2|Página 2}}                  ← uma linha por página adicional
 *   …
 * @param {string} template Wikitexto de Predefinição:Página para eliminar
 * @param {string} justification
 * @param {string[]} extras Páginas adicionais
 * @param {Object} opts { toolsTemplate, headerSuffix, headerSuffixSingular }
 * @return {string|null} null se o modelo não tiver o ponto de inserção da justificativa
 */
function buildMasterText( template, justification, extras, opts ) {
	var text, toolsRe, m, end,
		body = justification,
		toolLines = extras.map( function ( t ) {
			return '{{' + opts.toolsTemplate + '|' + t + '}}';
		} );

	if ( !/<!--[\s\S]+canceladas -->/.test( template ) ) {
		return null;
	}

	text = template
		.replace( /<\/?includeonly>/g, '' )
		.replace( /\n?<noinclude>[\s\S]*<\/noinclude>\n?/, '' );

	if ( extras.length ) {
		// Cabeçalho de seção: "=== … ===" → "=== … + N semelhantes ==="
		text = text.replace( /^(=+)([^\n]*?)\1[ \t]*$/m, function ( all, eq, inner ) {
			var suffix = extras.length === 1 && opts.headerSuffixSingular
				? opts.headerSuffixSingular
				: opts.headerSuffix.replace( '$1', function () {
					return String( extras.length );
				} );

			return eq + inner.replace( /\s+$/, '' ) + suffix + ' ' + eq;
		} );

		// Linhas de ferramentas: logo depois da linha da página mestra
		toolsRe = new RegExp( '\\{\\{\\s*' + opts.toolsTemplate.charAt( 0 ).replace( /[a-z]/i, function ( c ) {
			return '[' + c.toUpperCase() + c.toLowerCase() + ']';
		} ) + opts.toolsTemplate.slice( 1 ).replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ).replace( /[ _]/g, '[ _]' ) + '\\s*\\|' );
		m = toolsRe.exec( text );
		end = m ? templateEnd( text, m.index ) : -1;

		if ( end !== -1 ) {
			text = text.slice( 0, end ) + '\n' + toolLines.join( '\n' ) + text.slice( end );
		} else {
			// Modelo sem a linha de ferramentas: as linhas vão antes da justificativa
			body = toolLines.join( '\n' ) + '\n\n' + body;
		}
	}

	// Função como substituto: "$" na justificativa não é interpretado
	return text.replace( /<!--[\s\S]+canceladas -->/, function () {
		return body;
	} );
}

function buildTaggedText( content, code, useNoinclude ) {
	return useNoinclude
		? '<noinclude>{{' + code + '}}</noinclude>' + content
		: '{{' + code + '}}\n' + content;
}

ronda.consensus = {
	hasEliminationTag: hasEliminationTag,
	buildMasterText: buildMasterText,
	buildTaggedText: buildTaggedText
};

/* ---------------- operações na wiki ---------------- */

/**
 * Arquiva a discussão existente em <título>/N (primeiro N livre).
 * @return {jQuery.Promise} resolve com o título de destino, ou null se não havia discussão
 */
/**
 * Discussão de eliminação existente: null se não existe; senão { title, created, closed }.
 * Encerrada = na categoria "!Propostas de eliminação encerradas em <ano>" ou com
 * {{Nomeação concluída}}; sem nenhuma das duas, é tratada como aberta.
 */
var PE_CLOSED_CAT = /^Categoria:!Propostas de eliminação encerradas em \d{4}$/,
	PE_CLOSED_TEMPLATE = 'Predefinição:Nomeação concluída';

function peInfo( title ) {
	return ronda.api.get( {
		action: 'query',
		titles: title,
		prop: 'revisions|categories|templates',
		rvprop: 'timestamp',
		rvdir: 'newer',
		rvlimit: 1,
		cllimit: 'max',
		tltemplates: PE_CLOSED_TEMPLATE,
		tllimit: 'max'
	} ).then( function ( data ) {
		var p = data.query.pages[ 0 ] || {},
			first = ( p.revisions || [] )[ 0 ];

		if ( p.missing || !first ) {
			return null;
		}
		return {
			title: p.title,
			created: Date.parse( first.timestamp ),
			closed: ( p.categories || [] ).some( function ( c ) {
				return PE_CLOSED_CAT.test( c.title );
			} ) || ( p.templates || [] ).some( function ( t ) {
				return t.title === PE_CLOSED_TEMPLATE;
			} )
		};
	} );
}

/**
 * Arquiva a discussão anterior em /1, /2…, mas só se quem propõe confirmou
 * (allow); sem confirmação, uma discussão existente interrompe a proposta.
 */
function archiveIfExists( title, allow ) {
	var i,
		titles = [ title ];

	for ( i = 1; i <= 30; i++ ) {
		titles.push( title + '/' + i );
	}

	return ronda.api.get( {
		action: 'query',
		titles: titles.join( '|' ),
		prop: 'info'
	} ).then( function ( data ) {
		var target = null,
			exists = {};

		data.query.pages.forEach( function ( p ) {
			exists[ p.title ] = !p.missing;
		} );

		if ( !exists[ title ] ) {
			return null;
		}
		if ( !allow ) {
			return $.Deferred().reject( 'ronda-pe-exists' ).promise();
		}

		for ( i = 1; i <= 30 && !target; i++ ) {
			if ( !exists[ title + '/' + i ] ) {
				target = title + '/' + i;
			}
		}

		if ( !target ) {
			return $.Deferred().reject( 'ronda-archive-full' ).promise();
		}

		return ronda.post( {
			action: 'move',
			from: title,
			to: target,
			reason: ronda.msg( 'paginas-arquivando-pedido-de-eliminacao' ),
			noredirect: ronda.can( 'suppressredirect' )
		} ).then( function () {
			return target;
		} );
	} );
}

function createMaster( master, justification, extras, archived ) {
	return ronda.api.get( {
		action: 'query',
		titles: cfg().template,
		prop: 'revisions',
		rvprop: 'content',
		rvslots: 'main'
	} ).then( function ( data ) {
		var page = data.query.pages[ 0 ],
			template = page.revisions && page.revisions[ 0 ].slots.main.content,
			text = template && buildMasterText( template, justification, extras, cfg() );

		if ( !text ) {
			return $.Deferred().reject( 'ronda-pe-template' ).promise();
		}

		return ronda.post( {
			action: 'edit',
			title: peTitle( master ),
			text: text,
			summary: 'Eliminação por consenso: discussão aberta para [[' + master + ']]'
				+ ( extras.length ? ' e mais ' + extras.length + ' página(s)' : '' ),
			createonly: !archived,
			watchlist: ronda.creationWatchlist()
		} );
	} );
}

function createRedirect( title, master, archived ) {
	return ronda.post( {
		action: 'edit',
		title: peTitle( title ),
		text: '#REDIRECIONAMENTO [[' + peTitle( master ) + ']]',
		summary: 'Eliminação por consenso: proposta conjunta, discussão em [[' + peTitle( master ) + ']]',
		createonly: !archived,
		watchlist: ronda.creationWatchlist()
	} );
}

function tagPage( page, master, isBundle ) {
	return ronda.api.get( {
		action: 'query',
		list: 'embeddedin',
		eititle: page.title,
		eilimit: 1
	} ).then( function ( data ) {
		var transcluded = !!( data.query.embeddedin && data.query.embeddedin.length ),
			useNoinclude = page.ns === 10 || page.title.indexOf( 'Wikipédia:Userbox/' ) === 0 || transcluded;

		return ronda.api.edit( page.title, function ( revision ) {
			if ( hasEliminationTag( revision.content ) ) {
				return $.Deferred().reject( 'ronda-already-tagged' ).promise();
			}

			return ronda.params( {
				text: buildTaggedText( revision.content, cfg().tagCode, useNoinclude ),
				summary: 'Eliminação por consenso: proposta, discussão em [[' + peTitle( master ) + ']]'
					+ ( isBundle ? ' (conjunta)' : '' ),
				nocreate: true,
				watchlist: ronda.config.watchlist
			} );
		} );
	} );
}

/** Mesmos critérios do FastButtons para não avisar (ronda.warnCreator) */
function warnCreator( title ) {
	return ronda.warnCreator( title, cfg().warnTemplate + '|' + title );
}

/* ---------------- interface ---------------- */

function errorText( code ) {
	return {
		'ronda-pe-template': ronda.msg( 'paginas-o-modelo-da-discussao-nao-tem' ),
		'ronda-archive-full': ronda.msg( 'paginas-ha-mais-de-30-discussoes-arquivadas' ),
		'ronda-pe-exists': ronda.msg( 'paginas-pe-existe-interrompido' ),
		'ronda-already-tagged': ronda.msg( 'paginas-a-pagina-ja-tem-uma-marcacao' ),
		articleexists: ronda.msg( 'paginas-a-pagina-ja-existe' )
	}[ code ] || code;
}

function showForm( ctx, masterPage, oldPE ) {
	var extras = [],
		cbArchive = oldPE ? ronda.ui.checkbox( ronda.msg( 'paginas-pe-anterior-arquivar', oldPE.title ), false ) : null,
		$justification = ronda.ui.textarea( '', ronda.msg( 'paginas-justificativa-da-eliminacao-nao-precisa-assinar' ) ).attr( 'rows', 5 ),
		$add = ronda.ui.text( '', ronda.msg( 'paginas-titulo-de-outra-pagina-para-incluir' ) ),
		$addButton = $( '<button type="button"></button>' ).text( ronda.msg( 'paginas-incluir' ) ),
		$extras = $( '<ul class="ronda-bundle"></ul>' ),
		cbWarn = ronda.ui.checkbox( ronda.msg( 'paginas-avisar-os-criadores-das-paginas' ), true ),
		$progress = $( '<div class="ronda-progress"></div>' ).hide(),
		$log = $( '<ul class="ronda-log"></ul>' ),
		$content = $( '<div></div>' ),
		$dlg;

	function renderExtras() {
		$extras.empty();
		extras.forEach( function ( p, i ) {
			$( '<li></li>' ).append(
				$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( p.title ) ).text( p.title ),
				' ',
				$( '<button type="button"></button>' )
					.text( ronda.msg( 'paginas-retirar' ) )
					.button( { icons: { primary: 'ui-icon-close' }, text: false } )
					.on( 'click', function () {
						extras.splice( i, 1 );
						renderExtras();
					} )
			).appendTo( $extras );
		} );
	}

	function addPage() {
		var title = $add.val().trim();

		if ( !title ) {
			return;
		}

		$addButton.button( 'disable' );
		ronda.api.get( {
			action: 'query',
			titles: title,
			prop: 'info|revisions',
			rvprop: 'content',
			rvslots: 'main'
		} ).then( function ( data ) {
			var p = data.query.pages[ 0 ],
				content = p.revisions ? p.revisions[ 0 ].slots.main.content : '',
				problem = null;

			if ( p.invalid ) {
				problem = ronda.msg( 'paginas-titulo-invalido' );
			} else if ( p.missing ) {
				problem = ronda.msg( 'paginas-a-pagina-nao-existe' );
			} else if ( FORBIDDEN_NS.indexOf( p.ns ) !== -1 ) {
				problem = ronda.msg( 'paginas-dominio-nao-permitido' );
			} else if ( p.title === masterPage.title || extras.some( function ( e ) {
				return e.title === p.title;
			} ) ) {
				problem = ronda.msg( 'paginas-a-pagina-ja-esta-na-proposta' );
			} else if ( hasEliminationTag( content ) ) {
				problem = ronda.msg( 'paginas-a-pagina-ja-tem-uma-marcacao' );
			}

			if ( problem ) {
				ronda.ui.require( $add, false );
				mw.notify( p.title + ': ' + problem + '.', { type: 'warn', title: ronda.msg( 'core-nome' ) } );
				return;
			}

			// Página com discussão de eliminação anterior não entra na proposta conjunta
			return peInfo( peTitle( p.title ) ).then( function ( pe ) {
				if ( pe ) {
					ronda.ui.require( $add, false );
					mw.notify( ronda.msg( 'paginas-pe-existe-extra', p.title, pe.title ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
					return;
				}
				ronda.ui.require( $add, true );
				extras.push( { title: p.title, ns: p.ns } );
				$add.val( '' );
				renderExtras();
			} );
		}, ronda.fail ).always( function () {
			$addButton.button( 'enable' );
		} );
	}

	$add.autocomplete( {
		minLength: 2,
		source: function ( request, response ) {
			ronda.api.get( {
				action: 'query',
				list: 'prefixsearch',
				pssearch: request.term,
				pslimit: 10
			} ).then( function ( data ) {
				response( data.query.prefixsearch.map( function ( r ) {
					return r.title;
				} ) );
			}, function () {
				response( [] );
			} );
		}
	} ).on( 'keydown', function ( e ) {
		if ( e.key === 'Enter' && !$add.autocomplete( 'widget' ).is( ':visible' ) ) {
			e.preventDefault();
			addPage();
		}
	} );
	$addButton.button().on( 'click', addPage );

	$content.append(
		ronda.ui.message( 'highlight', $( '<span></span>' ).append(
			document.createTextNode( ronda.msg( 'paginas-sera-criada' ) ),
			$( '<b></b>' ).text( peTitle( masterPage.title ) ),
			document.createTextNode( '. Páginas incluídas abaixo terão a discussão redirecionada para ela e também receberão a marca de eliminação.' )
		) ),
		oldPE ? ronda.ui.message( 'error', $( '<span></span>' ).append(
			$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( oldPE.title ) ).text( oldPE.title ),
			document.createTextNode( ronda.msg( 'paginas-pe-anterior-existe', new Date( oldPE.created ).toLocaleDateString( 'pt-BR' ) ) )
		) ) : null,
		cbArchive ? cbArchive.$element : null,
		ronda.ui.row( ronda.msg( 'paginas-justificativa' ), $justification ),
		ronda.ui.row( ronda.msg( 'paginas-proposta-conjunta-opcional' ), $add ),
		$( '<div class="ronda-refresh"></div>' ).append( $addButton ),
		$extras,
		cbWarn.$element,
		$progress,
		$log
	);

	function log( type, text ) {
		$( '<li></li>' ).addClass( type ? 'ui-state-' + type : '' ).text( text ).appendTo( $log );
	}

	function run() {
		var tasks = [],
			done = 0,
			archived = {},
			justification = $justification.val().trim(),
			master = masterPage.title,
			pages = [ masterPage ].concat( extras ),
			isBundle = extras.length > 0;

		if ( !ronda.ui.require( $justification, !!justification ) ) {
			return;
		}
		if ( cbArchive && !cbArchive.isChecked() ) {
			ronda.ui.require( cbArchive.$element, false );
			mw.notify( ronda.msg( 'paginas-pe-anterior-confirme' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
			return;
		}

		// Discussão mestra (críticas: se falharem, nada mais é feito)
		tasks.push( { critical: true, label: ronda.msg( 'paginas-discussao-anterior-de', master ), fn: function () {
			return archiveIfExists( peTitle( master ), !!( cbArchive && cbArchive.isChecked() ) ).then( function ( target ) {
				archived[ master ] = !!target;
				return target ? ronda.msg( 'paginas-arquivada-em', target ) : 'nenhuma';
			} );
		} } );
		tasks.push( { critical: true, label: ronda.msg( 'paginas-criando', peTitle( master ) ), fn: function () {
			return createMaster( master, justification, extras.map( function ( e ) {
				return e.title;
			} ), archived[ master ] );
		} } );

		// Redirecionamentos das demais páginas
		extras.forEach( function ( e ) {
			tasks.push( { label: ronda.msg( 'paginas-discussao-anterior-de', e.title ), fn: function () {
				return archiveIfExists( peTitle( e.title ), false ).then( function ( target ) {
					archived[ e.title ] = !!target;
					return target ? ronda.msg( 'paginas-arquivada-em', target ) : 'nenhuma';
				} );
			} } );
			tasks.push( { label: ronda.msg( 'paginas-redirecionando', peTitle( e.title ) ), fn: function () {
				return createRedirect( e.title, master, archived[ e.title ] );
			} } );
		} );

		// Marcações e avisos
		pages.forEach( function ( p ) {
			tasks.push( { label: ronda.msg( 'paginas-marcando', p.title ), fn: function () {
				return tagPage( p, master, isBundle );
			} } );
		} );
		if ( cbWarn.isChecked() ) {
			pages.forEach( function ( p ) {
				tasks.push( { label: ronda.msg( 'paginas-criador-de', p.title ), fn: function () {
					return warnCreator( p.title );
				} } );
			} );
		}

		ronda.ui.setBusy( $dlg, true );
		$justification.prop( 'disabled', true );
		$add.prop( 'disabled', true );
		$progress.show().progressbar( { value: 0 } );

		( function next( i ) {
			var task = tasks[ i ];

			if ( !task ) {
				finish( true );
				return;
			}

			$.when( task.fn() ).then( function ( info ) {
				log( '', task.label + ( typeof info === 'string' ? ': ' + info : ronda.msg( 'core-feito' ) ) );
				return true;
			}, function ( code ) {
				log( 'error', task.label + ': ' + errorText( code ) );
				return !task.critical;
			} ).then( function ( goOn ) {
				done++;
				$progress.progressbar( 'value', Math.round( done / tasks.length * 100 ) );
				if ( goOn ) {
					next( i + 1 );
				} else {
					log( 'error', ronda.msg( 'paginas-processo-interrompido-a-discussao-mestra-nao' ) );
					finish( false );
				}
			} );
		}( 0 ) );
	}

	function finish( ok ) {
		mw.notify( ok ? ronda.msg( 'paginas-proposta-de-eliminacao-criada' ) : ronda.msg( 'paginas-a-proposta-nao-foi-concluida-veja' ), {
			type: ok ? 'success' : 'error',
			title: ronda.msg( 'core-nome' )
		} );

		$dlg.dialog( 'option', 'buttons', [ {
			text: ronda.msg( 'paginas-abrir-a-discussao' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: function () {
				location.href = mw.util.getUrl( peTitle( masterPage.title ) );
			}
		}, {
			text: ronda.msg( 'core-fechar' ),
			click: function () {
				ronda.ui.close( $dlg );
				location.reload();
			}
		} ] );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'paginas-eliminacao-por-consenso', masterPage.title ),
		width: 620,
		content: $content,
		buttons: [ {
			text: ronda.msg( 'paginas-propor-eliminacao' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: run
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}

function open( ctx ) {
	ronda.api.get( {
		action: 'query',
		titles: ctx.page,
		prop: 'revisions',
		rvprop: 'content',
		rvslots: 'main'
	} ).then( function ( data ) {
		var p = data.query.pages[ 0 ],
			content = p.revisions ? p.revisions[ 0 ].slots.main.content : '';

		if ( hasEliminationTag( content ) ) {
			mw.notify( ronda.msg( 'paginas-ja-tem-marcacao-aviso' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
			return;
		}

		// Discussão anterior não encerrada (ex.: marcação removida por vandalismo) → recusa
		return peInfo( peTitle( p.title ) ).then( function ( pe ) {
			if ( pe && !pe.closed ) {
				mw.notify( $( '<span></span>' ).append(
					document.createTextNode( ronda.msg( 'paginas-pe-aberta', new Date( pe.created ).toLocaleDateString( 'pt-BR' ) ) ),
					$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( pe.title ) ).text( pe.title )
				), { type: 'error', title: ronda.msg( 'core-nome' ), autoHide: false } );
				return;
			}
			showForm( ctx, { title: p.title, ns: p.ns }, pe );
		} );
	}, ronda.fail );
}

ronda.registerModule( {
	id: 'consenso',
	hidden: true,
	label: ronda.msg( 'paginas-consenso' ),
	title: ronda.msg( 'paginas-propor-a-eliminacao-por-consenso-desta' ),
	order: 28,
	isAvailable: function ( ctx ) {
		return ronda.isTaggable( ctx )
			&& ctx.exists
			&& FORBIDDEN_NS.indexOf( ctx.ns ) === -1
			&& ronda.can( 'edit' );
	},
	open: open
} );

}( window.ronda ) );

/**
 * Ronda — Propor eliminação
 *
 * Um botão só para as três propostas (rápida, semirrápida e por consenso):
 * o diálogo mostra as que valem para a página e abre o formulário de sempre
 * da escolhida. Tem também o atalho Detectar VDA.
 */
( function ( ronda ) {
'use strict';

var TYPES = [ 'rapida', 'semirrapida', 'consenso' ],
	NAMES = {
		rapida: [ ronda.msg( 'paginas-elim-rapida' ), ronda.msg( 'paginas-elim-rapida-desc' ) ],
		semirrapida: [ ronda.msg( 'paginas-elim-semirrapida' ), ronda.msg( 'paginas-elim-semirrapida-desc' ) ],
		consenso: [ ronda.msg( 'paginas-elim-consenso' ), ronda.msg( 'paginas-elim-consenso-desc' ) ]
	};

/** Detector de cópia (Earwig's Copyvio Detector), numa aba nova */
ronda.copyvioUrl = function ( title ) {
	return 'https://copyvios.toolforge.org/?' + $.param( {
		lang: mw.config.get( 'wgContentLanguage' ) || 'pt',
		project: 'wikipedia',
		title: title,
		use_engine: 1,
		use_links: 1,
		turnitin: 0,
		action: 'search'
	} );
};

function open( ctx ) {
	var available = TYPES.filter( function ( id ) {
			var m = ronda.getModule( id );

			return m && m.isAvailable( ctx );
		} ),
		name = 'ronda-elim-' + ( ++open.n ),
		$list = $( '<div class="ronda-elim-types"></div>' ),
		$content = $( '<div></div>' ),
		$dlg;

	available.forEach( function ( id ) {
		$list.append( $( '<label class="ronda-elim-type"></label>' ).attr( 'for', name + '-' + id ).append(
			$( '<input type="radio">' ).attr( { name: name, value: id, id: name + '-' + id } ),
			$( '<b></b>' ).text( ' ' + NAMES[ id ][ 0 ] ),
			$( '<span class="ronda-elim-desc"></span>' ).text( NAMES[ id ][ 1 ] )
		) );
	} );
	// Com um tipo só, ele já vem escolhido
	if ( available.length === 1 ) {
		$list.find( 'input' ).prop( 'checked', true );
	}
	$content.append( $list );
	if ( ctx.ns === 0 ) {
		$content.append( $( '<p class="ronda-elim-vda"></p>' ).append(
			$( '<a target="_blank" rel="noopener"></a>' ).attr( 'href', ronda.copyvioUrl( ctx.page ) ).text( ronda.msg( 'paginas-detectar-vda' ) ),
			document.createTextNode( ' — ' + ronda.msg( 'paginas-detectar-vda-dica' ) )
		) );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'paginas-elim-titulo', ctx.page ),
		width: 560,
		content: $content,
		buttons: [ {
			text: ronda.msg( 'paginas-elim-continuar' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: function () {
				var id = $list.find( 'input:checked' ).val();

				if ( !id ) {
					mw.notify( ronda.msg( 'paginas-elim-escolha' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
					return;
				}
				ronda.ui.close( $dlg );
				ronda.getModule( id ).open( ctx );
			}
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}
open.n = 0;

ronda.registerModule( {
	id: 'eliminacao',
	label: ronda.msg( 'paginas-elim-botao' ),
	title: ronda.msg( 'paginas-elim-dica' ),
	order: 26,
	isAvailable: function ( ctx ) {
		return TYPES.some( function ( id ) {
			var m = ronda.getModule( id );

			try {
				return m && m.isAvailable( ctx );
			} catch ( e ) {
				return false;
			}
		} );
	},
	open: open
} );

}( window.ronda ) );

/**
 * Ronda — módulo Mover
 *
 * Portado do "Mover" do FastButtons (domínio + novo título, motivo, mover a
 * discussão, criar redirecionamento). Além disso:
 * - Ao sair do campo de título (ou trocar o domínio) e de novo ao clicar em
 *   Mover, verifica se o destino já existe.
 * - Destino existente: quem pode eliminar elimina-o antes, com R2
 *   (config.move.deleteReason). A discussão do destino também, se a
 *   discussão for movida junto.
 * - "Suprimir redirecionamento da página de discussão" (suppressredirect):
 *   a página e a discussão são movidas em duas operações, cada uma com a sua
 *   escolha de redirecionamento, então todas as combinações funcionam.
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

/* ================================================================== *
 * Funções puras
 * ================================================================== */

/** Título completo a partir do domínio e do título sem prefixo */
function fullTitle( ns, title, names ) {
	title = ( title || '' ).trim().replace( /_/g, ' ' );
	return Number( ns ) === 0 || !names[ ns ] ? title : names[ ns ] + ':' + title;
}

/** Discussão correspondente (só para domínios de conteúdo, que são pares) */
function talkOf( ns, title, names ) {
	ns = Number( ns );
	return ns % 2 === 0 && names[ ns + 1 ] ? names[ ns + 1 ] + ':' + ( title || '' ).trim().replace( /_/g, ' ' ) : null;
}

/** Destino do redirecionamento em #REDIRECIONAMENTO [[X]] (ou null) */
function redirectTarget( text ) {
	var m = /^\s*#\s*(?:REDIRECIONAMENTO|REDIRECT)\s*:?\s*\[\[([^\]|#]+)/i.exec( text || '' );

	return m ? m[ 1 ].trim().replace( /_/g, ' ' ) : null;
}

/**
 * Operações de moção.
 * @param {Object} o { from, to, reason, moveTalk, hasTalk, redirect, talkRedirect, canSuppress }
 * @return {Array} parâmetros de action=move, na ordem
 */
function movePlan( o ) {
	var page = { action: 'move', from: o.from, to: o.to, reason: o.reason },
		separate = o.moveTalk && o.hasTalk && o.canSuppress && o.redirect !== o.talkRedirect;

	if ( o.canSuppress && !o.redirect ) {
		page.noredirect = true;
	}
	if ( o.moveTalk && o.hasTalk && !separate ) {
		page.movetalk = true;
	}

	if ( !separate ) {
		return [ page ];
	}

	return [ page, $.extend( {
		action: 'move',
		from: o.fromTalk,
		to: o.toTalk,
		reason: o.reason
	}, o.talkRedirect ? {} : { noredirect: true } ) ];
}

ronda.move = {
	fullTitle: fullTitle,
	talkOf: talkOf,
	redirectTarget: redirectTarget,
	plan: movePlan
};

/* ================================================================== *
 * Leituras
 * ================================================================== */

/**
 * Situação do destino e da discussão do destino.
 * @return {jQuery.Promise} { title, exists, redirectTo, revisions, talk: { title, exists } | null }
 */
function checkTarget( title, talk ) {
	return ronda.api.get( {
		action: 'query',
		titles: [ title ].concat( talk ? [ talk ] : [] ).join( '|' ),
		prop: 'info'
	} ).then( function ( data ) {
		var q = data.query,
			norm = {},
			byTitle = {},
			main, talkPage, result;

		( q.normalized || [] ).forEach( function ( n ) {
			norm[ n.from ] = n.to;
		} );
		( q.pages || [] ).forEach( function ( p ) {
			byTitle[ p.title ] = p;
		} );

		main = byTitle[ norm[ title ] || title ] || {};
		talkPage = talk ? byTitle[ norm[ talk ] || talk ] || {} : null;

		if ( main.invalid ) {
			return $.Deferred().reject( 'ronda-invalid-title' ).promise();
		}

		result = {
			title: main.title || title,
			exists: !main.missing && !!main.pageid,
			isRedirect: !!main.redirect,
			redirectTo: null,
			revisions: 0,
			talk: talkPage ? { title: talkPage.title || talk, exists: !talkPage.missing && !!talkPage.pageid } : null
		};

		if ( !result.exists ) {
			return result;
		}

		return ronda.api.get( {
			action: 'query',
			titles: result.title,
			prop: 'revisions',
			rvprop: 'content',
			rvslots: 'main',
			rvlimit: 2
		} ).then( function ( d ) {
			var revs = d.query.pages[ 0 ].revisions || [];

			result.revisions = revs.length;
			result.redirectTo = revs[ 0 ] ? redirectTarget( revs[ 0 ].slots.main.content ) : null;
			return result;
		} );
	} );
}

/* ================================================================== *
 * Interface
 * ================================================================== */

function errorText( code ) {
	return {
		'ronda-invalid-title': ronda.msg( 'paginas-titulo-invalido' ),
		'ronda-target-exists': ronda.msg( 'paginas-o-destino-ja-existe-e-voce' ),
		articleexists: ronda.msg( 'paginas-o-destino-ja-existe' ),
		selfmove: ronda.msg( 'paginas-o-destino-e-igual-a-origem' ),
		protectedtitle: ronda.msg( 'paginas-o-titulo-de-destino-esta-protegido' ),
		'cantmove-titleprotected': ronda.msg( 'paginas-o-titulo-de-destino-esta-protegido' )
	}[ code ] || code;
}

function showForm( ctx, page, groups ) {
	var names = mw.config.get( 'wgFormattedNamespaces' ),
		canDelete = ronda.can( 'delete' ),
		canSuppress = ronda.can( 'suppressredirect' ),
		isRootUser = ctx.ns === 2 && ctx.title.indexOf( '/' ) === -1,
		hasTalk = !!page.talkid && ctx.ns % 2 === 0 && !isRootUser,
		$ns = $( '<select class="ronda-level"></select>' ),
		$title = ronda.ui.text( ctx.title, ronda.msg( 'paginas-novo-titulo-sem-o-dominio' ) ).attr( 'id', ronda.ui.id( 'move' ) ),
		$target = $( '<div class="ronda-move-target"></div>' ),
		reasonFields = groups.length ? ronda.ui.reasonFields( 'movepage-reason-dropdown', null, groups ) : null,
		$reason = reasonFields ? reasonFields.$extra : ronda.ui.text( '', ronda.msg( 'core-motivo' ) ),
		cbTalk = hasTalk ? ronda.ui.checkbox( ronda.msg( 'paginas-mover-tambem-a-pagina-de-discussao' ), true ) : null,
		cbRedirect = canSuppress ? ronda.ui.checkbox( ronda.msg( 'paginas-criar-um-redirecionamento' ), true ) : null,
		cbTalkSuppress = canSuppress && hasTalk
			? ronda.ui.checkbox( ronda.msg( 'paginas-suprimir-redirecionamento-da-pagina-de-discussao' ), false ) : null,
		// Nunca marcadas por padrão: eliminar o destino é sempre uma escolha explícita
		cbDelete = ronda.ui.checkbox( ronda.msg( 'paginas-eliminar-o-destino-antes-de-mover' ), false ),
		cbDeleteTalk = ronda.ui.checkbox( ronda.msg( 'paginas-eliminar-tambem-a-discussao-do-destino' ), false ),
		// Destino com conteúdo (não um redirecionamento simples para cá): segunda caixa, com o título por extenso
		cbConfirm = ronda.ui.checkbox( '', false ),
		$confirmRow = cbConfirm.$element.addClass( 'ronda-move-confirm' ).hide(),
		$progress = $( '<div class="ronda-progress"></div>' ).hide(),
		$log = $( '<ul class="ronda-log"></ul>' ),
		$content = $( '<div></div>' ),
		state = null,
		checking = null,
		$dlg;

	Object.keys( names ).map( Number ).filter( function ( n ) {
		return n >= 0 && n !== 8;
	} ).sort( function ( a, b ) {
		return a - b;
	} ).forEach( function ( n ) {
		$( '<option></option>' ).val( n ).text( names[ n ] || ronda.msg( 'paginas-principal' ) ).appendTo( $ns );
	} );
	$ns.val( String( ctx.ns ) );

	cbDelete.$element.hide();
	cbDeleteTalk.$element.hide();

	function destination() {
		return {
			title: fullTitle( $ns.val(), $title.val(), names ),
			talk: talkOf( $ns.val(), $title.val(), names )
		};
	}

	/** Destino que pode ser eliminado sem confirmação extra: redirecionamento de uma edição para a origem */
	function trivial( s ) {
		return s.isRedirect && s.revisions === 1 && s.redirectTo === page.title;
	}

	function showState( s ) {
		var parts, moveTalk = cbTalk && cbTalk.isChecked();

		if ( !s || !state || s.title !== state.title ) {
			cbDelete.setChecked( false );
			cbDeleteTalk.setChecked( false );
			cbConfirm.setChecked( false );
		}
		state = s;
		$target.empty();
		cbDelete.$element.hide();
		cbDeleteTalk.$element.hide();
		$confirmRow.hide();

		if ( !s ) {
			return;
		}

		if ( !s.exists ) {
			$target.append( ronda.ui.message( 'highlight', $( '<span></span>' ).text( ronda.msg( 'paginas-esta-livre', s.title ) ) ) );
		} else {
			parts = s.isRedirect
				? ronda.msg( 'paginas-e-um-redirecionamento', s.redirectTo ? ' para ' + s.redirectTo : '' )
				: ronda.msg( 'paginas-e-uma-pagina-com-conteudo' );
			parts += s.revisions > 1 ? ronda.msg( 'paginas-com-mais-de-uma-edicao' ) : ronda.msg( 'paginas-com-uma-edicao' );

			$target.append( ronda.ui.message( canDelete ? 'highlight' : 'error', $( '<span></span>' ).append(
				$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( s.title, { redirect: 'no' } ) ).text( s.title ),
				document.createTextNode( ronda.msg( 'paginas-ja-existe', parts, canDelete ? '' : ronda.msg( 'paginas-so-quem-pode-eliminar-paginas-pode' ) ) )
			) ) );

			if ( canDelete ) {
				cbDelete.$element.show();
				if ( !trivial( s ) ) {
					$target.append( ronda.ui.message( 'error', $( '<span></span>' ).text(
						ronda.msg( 'paginas-o-destino-nao-e-um-redirecionamento' )
					) ) );
					cbConfirm.$element.find( 'label' ).text( ronda.msg( 'paginas-confirmo-eliminar-destino', s.title ) );
					$confirmRow.toggle( cbDelete.isChecked() );
				}
			}
		}

		if ( s.talk && s.talk.exists && moveTalk ) {
			$target.append( ronda.ui.message( canDelete ? 'highlight' : 'error', $( '<span></span>' ).append(
				$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( s.talk.title, { redirect: 'no' } ) ).text( s.talk.title ),
				document.createTextNode( ronda.msg( 'paginas-tambem-ja-existe', canDelete ? '' : ronda.msg( 'paginas-a-discussao-nao-sera-movida' ) ) )
			) ) );
			if ( canDelete ) {
				cbDeleteTalk.$element.show();
			}
		}
	}

	/** Verifica o destino; reaproveita a verificação em andamento para o mesmo título */
	function check() {
		var d = destination();

		if ( !$title.val().trim() ) {
			showState( null );
			return $.Deferred().reject( 'ronda-invalid-title' ).promise();
		}
		if ( checking && checking.key === d.title + '|' + d.talk ) {
			return checking.promise;
		}

		checking = { key: d.title + '|' + d.talk, promise: checkTarget( d.title, d.talk ) };
		checking.promise.then( showState, function ( code ) {
			showState( null );
			$target.append( ronda.ui.message( 'error', $( '<span></span>' ).text( ronda.msg( 'paginas-destino', errorText( code ) ) ) ) );
		} );
		return checking.promise;
	}

	$title.on( 'blur', check ).on( 'input', function () {
		checking = null;
		showState( null );
	} ).on( 'keydown', function ( e ) {
		// Enter só move direto se o destino estiver livre; se existir, mostra a situação e espera
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			check().then( function ( s ) {
				if ( !s.exists ) {
					submit();
				}
			} );
		}
	} );
	cbDelete.$input.on( 'change', function () {
		$confirmRow.toggle( !!state && state.exists && !trivial( state ) && cbDelete.isChecked() );
	} );
	ronda.ui.onChange( $ns, function () {
		checking = null;
		check();
	} );
	if ( cbTalk ) {
		cbTalk.$input.on( 'change', function () {
			if ( cbTalkSuppress ) {
				cbTalkSuppress.$element.toggle( cbTalk.isChecked() );
			}
			showState( state );
		} );
	}

	$content.append( [
		$( '<div class="ronda-row"></div>' ).append(
			$( '<label>' ).attr( 'for', $title.attr( 'id' ) ).text( ronda.msg( 'paginas-novo-titulo' ) ),
			$( '<div class="ronda-move-title"></div>' ).append( $ns, ' ', $title )
		),
		$target,
		reasonFields ? reasonFields.$element : ronda.ui.row( ronda.msg( 'core-motivo' ), $reason ),
		isRootUser && page.talkid ? ronda.ui.message( 'highlight',
			$( '<span></span>' ).text( ronda.msg( 'paginas-a-pagina-de-discussao-do-usuario' ) ) ) : null,
		cbTalk ? cbTalk.$element : null,
		cbRedirect ? cbRedirect.$element : null,
		cbTalkSuppress ? cbTalkSuppress.$element : null,
		cbDelete.$element,
		$confirmRow,
		cbDeleteTalk.$element,
		$progress,
		$log
	].filter( Boolean ) );

	function log( type, text ) {
		$( '<li></li>' ).addClass( type ? 'ui-state-' + type : '' ).text( text ).appendTo( $log );
	}

	function submit() {
		var d = destination(),
			seen = state;

		if ( !ronda.ui.require( $title, !!$title.val().trim() && d.title !== page.title ) ) {
			return;
		}

		ronda.ui.setBusy( $dlg, true );

		// Sempre verifica de novo antes de mover
		checking = null;
		check().then( function ( s ) {
			var tasks = [],
				moveTalk = !!( cbTalk && cbTalk.isChecked() ),
				reason = reasonFields ? reasonFields.value() : $reason.val().trim(),
				talkBlocked = moveTalk && s.talk && s.talk.exists && !( canDelete && cbDeleteTalk.isChecked() ),
				plan;

			// O destino existe, mas a situação mostrada era outra (ou nenhuma): mostra e espera nova confirmação
			if ( s.exists && ( !seen || seen.title !== s.title || !seen.exists || seen.isRedirect !== s.isRedirect ||
				seen.revisions !== s.revisions || seen.redirectTo !== s.redirectTo ) ) {
				ronda.ui.setBusy( $dlg, false );
				mw.notify( ronda.msg( 'paginas-confira-o-destino' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
				return;
			}
			if ( s.exists && canDelete && cbDelete.isChecked() && !trivial( s ) && !cbConfirm.isChecked() ) {
				ronda.ui.setBusy( $dlg, false );
				ronda.ui.require( cbConfirm.$element, false );
				mw.notify( ronda.msg( 'paginas-marque-a-confirmacao', s.title ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
				return;
			}
			if ( s.exists && !( canDelete && cbDelete.isChecked() ) ) {
				ronda.ui.setBusy( $dlg, false );
				mw.notify( canDelete
					? ronda.msg( 'paginas-o-destino-ja-existe-marque-eliminar' )
					: ronda.msg( 'paginas-o-destino-ja-existe-sem-direito' ),
				{ type: 'warn', title: ronda.msg( 'core-nome' ) } );
				return;
			}

			if ( s.exists ) {
				tasks.push( { critical: true, label: ronda.msg( 'paginas-eliminando-r2', s.title ), fn: function () {
					return ronda.post( {
						action: 'delete',
						title: s.title,
						reason: ronda.config.move.deleteReason.replace( /\$1/g, ronda.literal( page.title ) )
					} );
				} } );
			}
			if ( moveTalk && s.talk && s.talk.exists && canDelete && cbDeleteTalk.isChecked() ) {
				tasks.push( { critical: true, label: ronda.msg( 'paginas-eliminando-r2', s.talk.title ), fn: function () {
					return ronda.post( {
						action: 'delete',
						title: s.talk.title,
						reason: ronda.config.move.deleteReason.replace( /\$1/g, ronda.literal( page.talkTitle ) )
					} );
				} } );
			}

			plan = movePlan( {
				from: page.title,
				to: s.title,
				fromTalk: page.talkTitle,
				toTalk: s.talk && s.talk.title,
				reason: reason,
				moveTalk: moveTalk && !talkBlocked,
				hasTalk: hasTalk,
				redirect: !cbRedirect || cbRedirect.isChecked(),
				talkRedirect: !( cbTalkSuppress && cbTalkSuppress.isChecked() ),
				canSuppress: canSuppress
			} );

			plan.forEach( function ( params, i ) {
				tasks.push( { critical: i === 0, label: ronda.msg( 'paginas-movendo-para', params.from, params.to ), fn: function () {
					return ronda.post( $.extend( {}, params, { watchlist: ronda.config.watchlist } ) );
				} } );
			} );

			if ( talkBlocked ) {
				log( 'highlight', ronda.msg( 'paginas-a-discussao-nao-sera-movida-ja', s.talk.title ) );
			}

			run( tasks, s.title );
		}, function () {
			ronda.ui.setBusy( $dlg, false );
		} );
	}

	function run( tasks, newTitle ) {
		var done = 0;

		$dlg.find( ':input' ).prop( 'disabled', true );
		$progress.show().progressbar( { value: 0 } );

		( function next( i ) {
			var task = tasks[ i ];

			if ( !task ) {
				finish( true );
				return;
			}

			$.when( task.fn() ).then( function () {
				log( '', ronda.msg( 'paginas-feito', task.label ) );
				return true;
			}, function ( code ) {
				log( 'error', task.label + ': ' + errorText( code ) );
				return !task.critical;
			} ).then( function ( goOn ) {
				done++;
				$progress.progressbar( 'value', Math.round( done / tasks.length * 100 ) );
				if ( goOn ) {
					next( i + 1 );
				} else {
					finish( false );
				}
			} );
		}( 0 ) );

		function finish( ok ) {
			mw.notify( ok ? ronda.msg( 'paginas-pagina-movida' ) : ronda.msg( 'paginas-a-mocao-nao-foi-concluida-veja' ), {
				type: ok ? 'success' : 'error',
				title: ronda.msg( 'core-nome' )
			} );
			$dlg.dialog( 'option', 'buttons', ok ? [ {
				text: ronda.msg( 'paginas-abrir-a-pagina-movida' ),
				'class': 'ui-priority-primary ui-button-blue',
				click: function () {
					location.href = mw.util.getUrl( newTitle );
				}
			}, {
				text: ronda.msg( 'core-fechar' ),
				click: function () {
					ronda.ui.close( $dlg );
				}
			} ] : [ {
				text: ronda.msg( 'core-fechar' ),
				click: function () {
					ronda.ui.close( $dlg );
				}
			} ] );
		}
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'paginas-mover-titulo', page.title ),
		width: 620,
		content: $content,
		buttons: [ {
			text: ronda.msg( 'paginas-mover-botao' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: submit
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}

function open( ctx ) {
	$.when(
		ronda.api.get( {
			action: 'query',
			titles: ctx.page,
			prop: 'info',
			inprop: 'talkid'
		} ),
		ronda.reasons( 'movepage-reason-dropdown', null ).then( null, function () {
			return $.Deferred().resolve( [] ).promise();
		} )
	).then( function ( res, groups ) {
		// mw.Api resolve com ( dados, jqXHR ); $.when junta os dois num array
		var data = res && res.query ? res : res[ 0 ],
			p = data.query.pages[ 0 ],
			names = mw.config.get( 'wgFormattedNamespaces' );

		showForm( ctx, {
			title: p.title,
			talkid: p.talkid,
			talkTitle: talkOf( ctx.ns, ctx.title, names )
		}, groups || [] );
	}, ronda.fail );
}

ronda.registerModule( {
	id: 'mover',
	label: ronda.msg( 'paginas-mover-botao' ),
	title: ronda.msg( 'paginas-mover-esta-pagina-para-outro-titulo' ),
	order: 20,
	isAvailable: function ( ctx ) {
		return ronda.isPageContext( ctx )
			&& ctx.exists
			&& ronda.can( 'move' )
			&& !( ctx.ns === 2 && ctx.title.indexOf( '/' ) === -1 && !ronda.can( 'move-rootuserpages' ) );
	},
	open: open
} );

}( window.ronda ) );

/* ================================================================== *
 * Ferramentas de página portadas do FastButtons:
 * #R, Esboço, Fusão, Busca, PetScan, Informações, Pedido e Não assinou
 * ================================================================== */
( function ( ronda ) {
'use strict';

var SIG = '~~' + '~~';

/* ---------------- Funções puras ---------------- */

/** Texto de um redirecionamento (categorias usam {{Redirecionamento de categoria}}) */
function redirectText( ns, target, reason ) {
	if ( ns === 14 ) {
		return '{{Redirecionamento de categoria|' + target.replace( /^(Categoria|Category):/i, '' ) + '|2=' + ( reason || '' ) + '}}';
	}
	return '#REDIRECIONAMENTO [[' + target + ']]';
}

/** Esboço antes das categorias, como no FastButtons */
function addStub( text, template ) {
	var tag = '{{' + template + '}}',
		idx = text.search( /\n+\[\[\s*(?:Categoria|Category)\s*:/i );

	if ( idx === -1 ) {
		return text.replace( /\s*$/, '' ) + '\n\n' + tag;
	}
	return text.slice( 0, idx ) + '\n\n' + tag + text.slice( idx );
}

function hasStub( text ) {
	return /\{\{\s*esboço/i.test( text || '' );
}

/**
 * Pedido a partir do modelo <página de pedidos>/Padrão.
 * @param {string} model Conteúdo do modelo (vazio para "Outro")
 * @param {Object} o { request, target, target2, text, hide }
 */
function buildRequest( model, o ) {
	var value = ( model || '' ).replace( /<\/?includeonly>/g, '' );

	if ( o.request.target === 'free' ) {
		return '== ' + o.target + ' ==\n' + o.text + ' ' + SIG;
	}
	if ( o.hide ) {
		value = value.replace( /\}\}/, '|ocultar=sim}}' );
	}
	if ( o.request.history ) {
		return value
			.replace( /Página 1/i, ronda.literal( o.target ) )
			.replace( /Página 2/i, ronda.literal( o.target2 ) )
			.replace( /Razão/i, ronda.literal( o.text ) );
	}
	return value
		.replace( /(Nome( ou IP)?|página|Exemplo)/i, ronda.literal( o.target ) )
		.replace( /Razão/i, ronda.literal( o.text ) );
}

/** Classe de qualidade a partir das categorias da discussão ("!Artigos de qualidade N sobre …") */
function qualityFromCategories( cats ) {
	var q = null;

	( cats || [] ).some( function ( c ) {
		var m = /!Artigos de qualidade (\w)/.exec( c.title || c );

		if ( m ) {
			q = m[ 1 ] === 'd' ? null : m[ 1 ];
			return true;
		}
		return false;
	} );
	return q;
}

ronda.pageTools = {
	redirectText: redirectText,
	addStub: addStub,
	hasStub: hasStub,
	buildRequest: buildRequest,
	qualityFromCategories: qualityFromCategories
};

/* ---------------- Comuns ---------------- */

function prefixSearch( $input, ns ) {
	$input.autocomplete( {
		minLength: 2,
		source: function ( request, response ) {
			ronda.api.get( {
				action: 'query',
				list: 'prefixsearch',
				pssearch: request.term,
				psnamespace: ns === undefined ? 0 : ns,
				pslimit: 10
			} ).then( function ( data ) {
				response( data.query.prefixsearch.map( function ( r ) {
					return r.title;
				} ) );
			}, function () {
				response( [] );
			} );
		}
	} );
	return $input;
}

function currentText( ctx ) {
	if ( ronda.inEditForm() ) {
		return $.Deferred().resolve( $( '#wpTextbox1' ).val() ).promise();
	}
	return ronda.api.get( {
		action: 'query',
		titles: ctx.page,
		prop: 'revisions',
		rvprop: 'content',
		rvslots: 'main'
	} ).then( function ( data ) {
		var p = data.query.pages[ 0 ];

		return p.revisions ? p.revisions[ 0 ].slots.main.content : '';
	} );
}

function patrolCurrent() {
	var rcid = ronda.patrolRcid();

	return rcid && ronda.can( 'patrol' ) && !ronda.inEditForm()
		? ronda.api.postWithToken( 'patrol', { action: 'patrol', rcid: rcid } ).then( null, function () {
			return $.Deferred().resolve().promise();
		} )
		: $.Deferred().resolve().promise();
}

function sep() {
	return document.createTextNode( ' · ' );
}

function done( $dlg, message, url ) {
	mw.notify( message, { type: 'success', title: ronda.msg( 'core-nome' ) } );
	ronda.ui.close( $dlg );
	if ( !ronda.inEditForm() ) {
		if ( url ) {
			location.href = url;
		} else {
			location.reload();
		}
	}
}

/* ---------------- #R ---------------- */

function openRedirect( ctx ) {
	var isCat = ctx.ns === 14,
		$target = prefixSearch( ronda.ui.text( ctx.prefill || '', ronda.msg( 'paginas-pagina-de-destino' ) ), ctx.ns ),
		$reason = ronda.ui.text( '', isCat ? ronda.msg( 'paginas-motivo-obrigatorio-em-categorias' ) : ronda.msg( 'paginas-motivo-opcional' ) ),
		$dlg;

	function submit() {
		var target = $target.val().trim(),
			reason = $reason.val().trim(),
			ok = ronda.ui.require( $target, !!target && target !== ctx.page );

		ok = ronda.ui.require( $reason, !isCat || !!reason ) && ok;
		if ( !ok ) {
			return;
		}

		var params = {
				text: redirectText( ctx.ns, target, reason ),
				summary: 'Redirecionamento: para [[' + target + ']]' + ( reason ? ' — ' + reason : '' ),
				watchlist: ronda.config.watchlist
			},
			edit = ctx.exists || ronda.inEditForm()
				? ronda.editPage( ctx.page, function () {
					return ronda.params( params );
				} )
				: ronda.post( $.extend( {}, params, { action: 'edit', title: ctx.page, createonly: true,
					watchlist: ronda.creationWatchlist() } ) );

		ronda.ui.setBusy( $dlg, true );
		// Patrulha só depois que a edição deu certo
		edit.then( patrolCurrent ).then( function () {
			done( $dlg, ronda.msg( 'paginas-redirecionamento-feito' ), mw.util.getUrl( ctx.page, { redirect: 'no' } ) );
		}, function ( code, data ) {
			ronda.ui.setBusy( $dlg, false );
			ronda.fail( code, data );
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: '#R — ' + ctx.page,
		width: 520,
		content: $( '<div></div>' ).append(
			ctx.exists ? ronda.ui.message( 'highlight', ronda.msg( 'paginas-todo-o-conteudo-atual-da-pagina' ) ) : null,
			ronda.ui.row( ronda.msg( 'paginas-redirecionar-para' ), $target ),
			ronda.ui.row( ronda.msg( 'core-motivo' ), $reason )
		),
		buttons: [ { text: ronda.msg( 'paginas-redirecionar' ), 'class': 'ui-priority-primary ui-button-blue', click: submit },
			{ text: ronda.msg( 'core-previa-botao' ), click: function () {
				var target = $target.val().trim();

				if ( ronda.ui.require( $target, !!target && target !== ctx.page ) ) {
					ronda.ui.previewEdit( ctx.page, redirectText( ctx.ns, target, $reason.val().trim() ) );
				}
			} },
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
}

/* ---------------- Esboço ---------------- */

function openStub( ctx ) {
	currentText( ctx ).then( function ( text ) {
		var $theme = ronda.ui.text( '', ronda.msg( 'paginas-tema-ex-biografia-geografia-vazio-esboco' ) ),
			$dlg;

		if ( hasStub( text ) ) {
			mw.notify( ronda.msg( 'paginas-ja-existe-um-esboco-nesta-pagina' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
			return;
		}

		$theme.autocomplete( {
			minLength: 1,
			source: function ( request, response ) {
				ronda.api.get( {
					action: 'query',
					list: 'allpages',
					apnamespace: 10,
					apprefix: 'Esboço-' + request.term,
					aplimit: 15
				} ).then( function ( data ) {
					response( data.query.allpages.map( function ( p ) {
						return p.title.replace( /^[^:]+:Esboço-/, '' );
					} ) );
				}, function () {
					response( [] );
				} );
			}
		} );

		function submit() {
			var theme = $theme.val().trim(),
				template = theme ? 'Esboço-' + theme : 'Esboço';

			ronda.ui.setBusy( $dlg, true );
			ronda.editPage( ctx.page, function ( rev ) {
				if ( hasStub( rev.content ) ) {
					return $.Deferred().reject( 'ronda-stub-exists' ).promise();
				}
				return ronda.params( {
					text: addStub( rev.content, template ),
					summary: 'Marcação: ' + ronda.tpl( template ),
					minor: true,
					nocreate: true,
					watchlist: ronda.config.watchlist
				} );
			} ).then( patrolCurrent ).then( function () {
				done( $dlg, ronda.msg( 'paginas-esboco-adicionado' ) );
			}, function ( code, data ) {
				ronda.ui.setBusy( $dlg, false );
				if ( code === 'ronda-stub-exists' ) {
					mw.notify( ronda.msg( 'paginas-ja-existe-um-esboco-nesta-pagina' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
				} else {
					ronda.fail( code, data );
				}
			} );
		}

		$theme.on( 'keydown', function ( e ) {
			if ( e.key === 'Enter' && !$theme.autocomplete( 'widget' ).is( ':visible' ) ) {
				submit();
			}
		} );

		$dlg = ronda.ui.dialog( {
			title: ronda.msg( 'paginas-esboco-titulo', ctx.page ),
			width: 480,
			content: ronda.ui.row( 'Esboço-', $theme ),
			buttons: [ { text: ronda.msg( 'paginas-marcar' ), 'class': 'ui-priority-primary ui-button-blue', click: submit },
				{ text: ronda.msg( 'core-previa-botao' ), click: function () {
					var theme = $theme.val().trim();

					ronda.ui.previewEdit( ctx.page, addStub( text, theme ? 'Esboço-' + theme : 'Esboço' ) );
				} },
				{ text: ronda.msg( 'core-cancelar' ), click: function () {
					ronda.ui.close( $dlg );
				} } ]
		} );
	}, ronda.fail );
}

/* ---------------- Fusão ---------------- */

function openMerge( ctx ) {
	var $page1 = prefixSearch( ronda.ui.text( ctx.page, ronda.msg( 'paginas-pagina-que-permanecera' ) ), ctx.ns ),
		$page2 = prefixSearch( ronda.ui.text( ctx.prefill || '', ronda.msg( 'paginas-pagina-que-sera-fundida-com-a' ) ), ctx.ns ),
		$progress = $( '<div class="ronda-progress"></div>' ).hide(),
		$log = $( '<ul class="ronda-log"></ul>' ),
		$dlg, run;

	function tag( title, code ) {
		return ronda.api.get( { action: 'query', titles: title, prop: 'info', list: 'embeddedin', eititle: title, eilimit: 1 } )
			.then( function ( data ) {
				var p = data.query.pages[ 0 ],
					page = { ns: p.ns, title: p.title, transcluded: !!( data.query.embeddedin || [] ).length },
					tpl = '{{subst:' + code + '}}';

				if ( p.missing ) {
					return $.Deferred().reject( 'missingtitle' ).promise();
				}
				return ronda.editPage( p.title, function ( rev ) {
					return ronda.params( {
						text: ( ronda.useNoinclude( page ) ? '<noinclude>' + tpl + '</noinclude>' : tpl ) + '\n' + rev.content,
						summary: 'Fusão: proposta com [[' + code.split( '|' )[ 1 ] + ']]',
						nocreate: true,
						watchlist: ronda.config.watchlist
					} );
				} );
			} );
	}

	function submit() {
		var p1 = $page1.val().trim(),
			p2 = $page2.val().trim(),
			ok = ronda.ui.require( $page1, !!p1 );

		ok = ronda.ui.require( $page2, !!p2 && p2 !== p1 ) && ok;
		if ( !ok ) {
			return;
		}

		run( [
			{ critical: true, label: ronda.msg( 'paginas-marcando-f-de', p1 ), fn: function () {
				return tag( p1, 'f-de|' + p2 );
			} },
			{ label: ronda.msg( 'paginas-marcando-f-com', p2 ), fn: function () {
				return tag( p2, 'f-com|' + p1 );
			} }
		], function ( ok ) {
			mw.notify( ok ? ronda.msg( 'paginas-proposta-de-fusao-adicionada' ) : ronda.msg( 'paginas-a-proposta-nao-foi-concluida-veja' ),
				{ type: ok ? 'success' : 'error', title: ronda.msg( 'core-nome' ) } );
			ronda.ui.finishButtons( $dlg, ok );
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'paginas-fusao' ),
		width: 520,
		content: $( '<div></div>' ).append(
			ronda.ui.row( ronda.msg( 'paginas-pagina-que-permanecera' ), $page1 ),
			ronda.ui.row( ronda.msg( 'paginas-pagina-que-sera-fundida-com-a' ), $page2 ),
			$progress, $log
		),
		buttons: [ { text: ronda.msg( 'paginas-propor-fusao' ), 'class': 'ui-priority-primary ui-button-blue', click: submit },
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
	run = ronda.ui.runner( $dlg, $progress, $log );
}

/* ---------------- Busca e PetScan ---------------- */

function linkList( $panel, label, items ) {
	var $line = $( '<div class="ronda-up-line"></div>' ).append( document.createTextNode( label + ': ' ) );

	items.forEach( function ( it, i ) {
		$line.append( i ? sep() : '', $( '<a target="_blank" rel="noopener"></a>' ).attr( { href: it.href, title: it.title } ).text( it.label ) );
	} );
	$panel.append( $line );
}

function openSearch( ctx ) {
	var term = encodeURIComponent( ctx.title.indexOf( ' ' ) !== -1 ? '"' + ctx.title + '"' : ctx.title );

	ronda.ui.togglePanel( 'busca', function ( $panel ) {
		linkList( $panel, ronda.msg( 'paginas-buscar-fontes' ), ronda.catalog.search.map( function ( s ) {
			return { label: s.label, title: s.title, href: s.url + term };
		} ) );
	} );
}

function openPetScan( ctx ) {
	ronda.ui.togglePanel( 'petscan', function ( $panel ) {
		var base = {
			language: mw.config.get( 'wgContentLanguage' ),
			project: 'wikipedia',
			interface_language: mw.config.get( 'wgUserLanguage' ),
			categories: ctx.title,
			depth: 1,
			format: 'html',
			doit: 1
		};

		linkList( $panel, ronda.msg( 'paginas-procurar-nesta-categoria' ), ronda.catalog.petscan.map( function ( s ) {
			return { label: s.label, title: s.title, href: 'https://petscan.wmflabs.org/?' + $.param( $.extend( {}, base, s.params ) ) };
		} ) );
	} );
}

/* ---------------- Informações ---------------- */

function formatDateTime( ts ) {
	return new Date( ts ).toLocaleString( 'pt-BR', { dateStyle: 'short', timeStyle: 'short' } );
}

/* ---------------- Informações ---------------- */

var PROTECT_LEVELS = {
		autoconfirmed: 'autoconfirmados',
		extendedconfirmed: 'autoconfirmados estendidos',
		editautoreviewprotected: 'autorrevisores',
		sysop: 'administradores'
	},
	PROTECT_TYPES = { edit: 'edição', move: 'moção', create: 'criação', upload: 'carregamento' };

/** Proteções em texto: "edição: administradores (até 01/02/2027)" */
function protectionText( list ) {
	return ( list || [] ).map( function ( p ) {
		return ( PROTECT_TYPES[ p.type ] || p.type ) + ': ' + ( PROTECT_LEVELS[ p.level ] || p.level ) +
			( /^infinit/.test( p.expiry || '' ) ? ' (sem prazo)' : ' (até ' + new Date( p.expiry ).toLocaleDateString( 'pt-BR' ) + ')' ) +
			( p.source ? ' (cascata de ' + p.source + ')' : '' );
	} );
}

/** Visualizações dos últimos 30 dias (API REST de métricas); null se não der */
function pageviews( title ) {
	var end = new Date( Date.now() - 864e5 ),
		start = new Date( end.getTime() - 29 * 864e5 ),
		day = function ( d ) {
			return d.toISOString().slice( 0, 10 ).replace( /-/g, '' );
		};

	return $.ajax( {
		url: 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/pt.wikipedia.org/all-access/user/' +
			encodeURIComponent( title.replace( / /g, '_' ) ) + '/daily/' + day( start ) + '/' + day( end ),
		dataType: 'json'
	} ).then( function ( d ) {
		return ( d.items || [] ).reduce( function ( n, i ) {
			return n + ( i.views || 0 );
		}, 0 );
	}, function ( xhr ) {
		// 404 = nenhuma visualização registrada no período
		return $.Deferred().resolve( xhr && xhr.status === 404 ? 0 : null ).promise();
	} );
}

/* ---------------- Qualidade automática ----------------
 *
 * Incorporado do script Usuário:Little Sunshine/Scripts/AvalicaoAutomatica.js
 * (QualidadeFeedback): verifica os critérios do quadro "Parâmetros de qualidade"
 * (níveis 2 a 6) a partir do wikitexto, das predefinições transcluídas e, quando o
 * painel é aberto na própria página, das referências e imagens exibidas. As
 * contagens são estimativas; a avaliação oficial continua sendo dos editores.
 */
var QF = {
	categoriaAvisos: 'Categoria:!Avisos para artigos com problemas',
	profundidade: 3,
	cacheAvisos: 24 * 60 * 60,
	cacheResultado: 30 * 24 * 60 * 60,
	larguraMinImagem: 60,
	bytesMinParagrafo: 100,
	bytesMaxParagrafo: 2500,
	predQ2: [ 'Contexto', 'Reciclagem', 'Reciclar-sobre' ],
	predQ3Extra: [ 'Esboço', 'Wikificação', 'Revisão' ],
	predBom: [ 'Artigo bom' ],
	predDestacado: [ 'Artigo destacado' ],
	regexRef: /<ref[\s>\/]|\{\{\s*(?:sfn|sfnp|harvnb|harv|efn)\s*[|}]/i
};

function qfBytes( s ) {
	return unescape( encodeURIComponent( s ) ).length;
}

function qfFmt( n ) {
	return Number( n ).toLocaleString( 'pt-BR' );
}

function qfRemoverRepetido( texto, re ) {
	var anterior, i = 0;

	do {
		anterior = texto;
		texto = texto.replace( re, '' );
	} while ( texto !== anterior && ++i < 30 );
	return texto;
}

function qfProsa( texto ) {
	texto = qfRemoverRepetido( texto, /\{\{[^{}]*\}\}/g );
	texto = texto.replace( /^\{\|[\s\S]*?^\|\}/gm, '' );
	return texto.replace( /<ref[^>]*\/>/gi, '' ).replace( /<ref[^>]*>[\s\S]*?<\/ref>/gi, '' );
}

/** Seções, parágrafos (≥ 100 bytes), maior parágrafo e seções sem referência */
function qfTexto( wt ) {
	var limpo = wt.replace( /<!--[\s\S]*?-->/g, '' )
			.replace( /<(gallery|pre|syntaxhighlight|source|math|timeline|imagemap|score)\b[^>]*>[\s\S]*?<\/\1>/gi, '' ),
		secoes = [ { nivel: 0, titulo: 'introdução', linhas: [] } ],
		r = { n2: 0, n3: 0, paragrafos: 0, maxPar: 0, secaoMaiorPar: '', semRef: [] };

	limpo.split( '\n' ).forEach( function ( linha ) {
		var m = linha.match( /^(={1,6})\s*(.+?)\s*\1\s*$/ );

		if ( m ) {
			secoes.push( { nivel: m[ 1 ].length, titulo: m[ 2 ], linhas: [] } );
		} else {
			secoes[ secoes.length - 1 ].linhas.push( linha );
		}
	} );

	secoes.forEach( function ( sec ) {
		var bruto = sec.linhas.join( '\n' ),
			validos = 0;

		if ( sec.nivel === 2 ) {
			r.n2++;
		}
		if ( sec.nivel === 3 ) {
			r.n3++;
		}
		qfProsa( bruto ).split( /\n\s*\n/ ).map( function ( b ) {
			return b.trim();
		} ).filter( function ( b ) {
			return b && !/^[*#:;|!]/.test( b ) && !/^\{\|/.test( b ) &&
				!/^\[\[\s*(Categoria|Category|Ficheiro|File|Imagem|Image|Arquivo)\s*:[^\n]*\]\]$/i.test( b );
		} ).forEach( function ( b ) {
			var tam = qfBytes( b );

			if ( tam > r.maxPar ) {
				r.maxPar = tam;
				r.secaoMaiorPar = sec.titulo;
			}
			if ( tam >= QF.bytesMinParagrafo ) {
				validos++;
			}
		} );
		r.paragrafos += validos;
		if ( sec.nivel > 0 && validos > 1 && !QF.regexRef.test( bruto ) ) {
			r.semRef.push( sec.titulo );
		}
	} );
	r.secoes = r.n2 + Math.floor( r.n3 / 5 );
	return r;
}

/** Ligações internas do wikitexto, exceto ficheiros, categorias e interwikis */
function qfLigacoes( wt ) {
	var t = wt.replace( /<!--[\s\S]*?-->/g, '' ),
		re = /\[\[([^\[\]|\n]+)/g,
		ignorar = /^(Ficheiro|File|Imagem|Image|Arquivo|Categoria|Category)\s*:/i,
		interwiki = /^(?:[a-z]{2,3}|[a-z]{2,3}-[a-z]+|commons|wikt|wikisource|wikidata|d|w|c|s|b|q|v|n)\s*:/i,
		m, alvo, n = 0;

	while ( ( m = re.exec( t ) ) !== null ) {
		alvo = m[ 1 ].trim();
		if ( alvo && alvo.charAt( 0 ) !== '#' && !ignorar.test( alvo ) && !interwiki.test( alvo ) ) {
			n++;
		}
	}
	return n;
}

/** Referências e imagens no wikitexto, quando a página exibida não serve para contar */
function qfContagemTexto( wt ) {
	var t = wt.replace( /<!--[\s\S]*?-->/g, '' ),
		refs = ( t.match( /<ref(?:\s[^>]*[^\/])?>|\{\{\s*(?:sfn|sfnp|efn)\s*\|/gi ) || [] ).length,
		imgs = ( t.match( /\[\[\s*(?:Ficheiro|File|Imagem|Image|Arquivo)\s*:/gi ) || [] ).length +
			( t.match( /\|\s*(?:imagem|image|foto)\s*=\s*[^|\n{}]+\.(?:jpe?g|png|svg|gif|tiff?|webp)/gi ) || [] ).length;

	return { refs: refs, imagens: imgs };
}

/** Referências e imagens renderizadas no corpo do artigo (só na própria página, na versão atual) */
function qfContagemPagina() {
	var n = 0;

	$( '#mw-content-text .mw-parser-output img' ).each( function () {
		var $i = $( this );

		if ( !$i.closest( '.navbox,.navbar,.ambox,.metadata,.mbox-small,.noprint,.reference,.hatnote,.mw-editsection,.sistersitebox' ).length &&
			( parseInt( $i.attr( 'width' ), 10 ) || 0 ) >= QF.larguraMinImagem ) {
			n++;
		}
	} );
	return { refs: $( '#mw-content-text ol.references > li' ).length, imagens: n };
}

/**
 * Avalia os critérios.
 * @param {Object} art { content, size, templates: [ 'Predefinição:…' ] }
 * @param {Object} avisos Títulos das predefinições de aviso, como chaves
 * @param {Object} cont { refs, imagens, aproximado }
 * @return {Object} { estimado, alvo, niveis: [ { n, ok, itens: [ { nome, atual, meta, ok } ] } ], aproximado }
 */
function avaliarQualidade( art, avisos, cont ) {
	var P = ( mw.config.get( 'wgFormattedNamespaces' ) || {} )[ 10 ] + ':',
		tem = {},
		t = qfTexto( art.content ),
		links = qfLigacoes( art.content ),
		niveis, estimado, alvo, maior, secoes;

	art.templates.forEach( function ( x ) {
		tem[ x ] = true;
	} );

	function presentes( nomes ) {
		return nomes.filter( function ( n ) {
			return tem[ P + n ];
		} );
	}
	function item( nome, atual, meta, ok ) {
		return { nome: nome, atual: String( atual ), meta: meta, ok: !!ok };
	}
	function lista( l ) {
		return l.length ? 'presentes: ' + l.join( ', ' ) : 'nenhuma';
	}
	function todos( l ) {
		return l.every( function ( i ) {
			return i.ok;
		} );
	}

	var q2Tpl = presentes( QF.predQ2 ),
		q3Tpl = presentes( QF.predQ2.concat( QF.predQ3Extra ) ),
		avisoTpl = art.templates.filter( function ( x ) {
			return avisos[ x ];
		} ).map( function ( x ) {
			return x.slice( P.length );
		} ),
		bom = presentes( QF.predBom ).length > 0,
		dest = presentes( QF.predDestacado ).length > 0;

	maior = item( 'Parágrafo mais longo', qfFmt( t.maxPar ) + ' B' + ( t.maxPar > QF.bytesMaxParagrafo ? ' (em: ' + t.secaoMaiorPar + ')' : '' ),
		'≤ ' + qfFmt( QF.bytesMaxParagrafo ) + ' B', t.maxPar <= QF.bytesMaxParagrafo );
	secoes = t.secoes + ' (' + t.n2 + ' de nível 2, ' + t.n3 + ' de nível 3)';

	niveis = [
		{ n: 2, itens: [
			item( 'Tamanho e referências', qfFmt( art.size ) + ' B, ' + cont.refs + ' ref.', '≥ 2 000 B com ≥ 1 ref., ou ≥ 8 000 B',
				art.size >= 8000 || ( art.size >= 2000 && cont.refs >= 1 ) ),
			item( 'Ligações internas', qfFmt( links ), '≥ 10', links >= 10 ),
			item( 'Parágrafos (≥ 100 B)', t.paragrafos, '≥ 5', t.paragrafos >= 5 ),
			maior,
			item( 'Predefinições proibidas (contexto, reciclagem, reciclar-sobre)', lista( q2Tpl ), 'nenhuma', !q2Tpl.length )
		] },
		{ n: 3, itens: [
			item( 'Tamanho', qfFmt( art.size ) + ' B', '≥ 12 000 B', art.size >= 12000 ),
			item( 'Referências', cont.refs, '≥ 5', cont.refs >= 5 ),
			item( 'Ligações internas', qfFmt( links ), '≥ 30', links >= 30 ),
			item( 'Seções (nível 2 + 1 a cada 5 de nível 3)', secoes, '≥ 3', t.secoes >= 3 ),
			item( 'Imagens', cont.imagens, '≥ 1', cont.imagens >= 1 ),
			maior,
			item( 'Predefinições proibidas (nível 2 + esboço, wikificação, revisão)', lista( q3Tpl ), 'nenhuma', !q3Tpl.length )
		] },
		{ n: 4, itens: [
			item( 'Tamanho', qfFmt( art.size ) + ' B', '≥ 20 000 B', art.size >= 20000 ),
			item( 'Referências', cont.refs, '≥ 10', cont.refs >= 10 ),
			item( 'Ligações internas', qfFmt( links ), '≥ 50', links >= 50 ),
			item( 'Seções (nível 2 + 1 a cada 5 de nível 3)', secoes, '≥ 5', t.secoes >= 5 ),
			item( 'Imagens', cont.imagens, '≥ 2', cont.imagens >= 2 ),
			maior,
			item( 'Predefinições de aviso de "artigo com problemas"', lista( avisoTpl ), 'nenhuma', !avisoTpl.length ),
			item( 'Referências em todas as seções com mais de um parágrafo',
				t.semRef.length ? 'sem referência em: ' + t.semRef.join( '; ' ) : 'todas com referência', 'todas', !t.semRef.length )
		] },
		{ n: 5, itens: [ item( 'Predefinição "Artigo bom" (aprovado na EAD)', bom ? 'presente' : 'ausente', 'presente', bom ) ] },
		{ n: 6, itens: [ item( 'Predefinição "Artigo destacado" (aprovado na EAD)', dest ? 'presente' : 'ausente', 'presente', dest ) ] }
	];
	niveis.forEach( function ( nv ) {
		nv.ok = todos( nv.itens );
	} );

	estimado = 1;
	if ( dest ) {
		estimado = 6;
	} else if ( bom ) {
		estimado = 5;
	} else {
		[ 2, 3, 4 ].forEach( function ( n ) {
			if ( niveis[ n - 2 ].ok ) {
				estimado = n;
			}
		} );
	}
	alvo = estimado < 4 ? estimado + 1 : null;
	return { estimado: estimado, alvo: alvo, niveis: niveis, aproximado: !!cont.aproximado };
}

/** Itens que faltam para o próximo nível (vazio se já está no 4 ou acima) */
function qfFaltam( res ) {
	return res.alvo ? res.niveis[ res.alvo - 2 ].itens.filter( function ( i ) {
		return !i.ok;
	} ) : [];
}

ronda.quality = { avaliar: avaliarQualidade, texto: qfTexto, ligacoes: qfLigacoes, contagemTexto: qfContagemTexto, faltam: qfFaltam };

/** Predefinições de aviso (categoria e subcategorias), guardadas por um dia */
function qfAvisos() {
	var KEY = 'ronda-qualidade-avisos',
		cache = mw.storage.getObject( KEY ),
		titulos = {},
		visitadas = {};

	if ( cache && cache.length ) {
		cache.forEach( function ( x ) {
			titulos[ x ] = true;
		} );
		return $.Deferred().resolve( titulos ).promise();
	}

	function listar( cat, tipo, cont, out ) {
		return ronda.api.get( $.extend( { action: 'query', list: 'categorymembers', cmtitle: cat, cmtype: tipo, cmlimit: 'max' }, cont ) )
			.then( function ( r ) {
				( r.query.categorymembers || [] ).forEach( function ( x ) {
					out.push( x.title );
				} );
				return r[ 'continue' ] ? listar( cat, tipo, r[ 'continue' ], out ) : out;
			} );
	}
	function percorrer( cat, prof ) {
		if ( visitadas[ cat ] ) {
			return $.Deferred().resolve().promise();
		}
		visitadas[ cat ] = true;
		return listar( cat, 'page', {}, [] ).then( function ( pags ) {
			pags.forEach( function ( x ) {
				titulos[ x ] = true;
			} );
			return prof > 0 ? listar( cat, 'subcat', {}, [] ).then( function ( subs ) {
				return subs.reduce( function ( p, sub ) {
					return p.then( function () {
						return percorrer( sub, prof - 1 );
					} );
				}, $.Deferred().resolve().promise() );
			} ) : null;
		} );
	}

	return percorrer( QF.categoriaAvisos, QF.profundidade ).then( function () {
		mw.storage.setObject( KEY, Object.keys( titulos ), QF.cacheAvisos );
		return titulos;
	} );
}

/** Wikitexto, tamanho e todas as predefinições transcluídas da versão atual */
function qfArtigo( page, cont, out ) {
	out = out || { content: '', size: 0, templates: [] };
	return ronda.api.get( $.extend( { action: 'query', titles: page, prop: 'revisions|templates',
		rvprop: 'content|size', rvslots: 'main', tllimit: 'max' }, cont ) ).then( function ( r ) {
		var p = ( r.query.pages || [] )[ 0 ] || {};

		if ( p.revisions && p.revisions[ 0 ] ) {
			out.content = p.revisions[ 0 ].slots.main.content;
			out.size = p.revisions[ 0 ].size;
		}
		( p.templates || [] ).forEach( function ( t ) {
			out.templates.push( t.title );
		} );
		return r[ 'continue' ] ? qfArtigo( page, r[ 'continue' ], out ) : out;
	} );
}

/**
 * Qualidade automática de um artigo, por revisão (guardada por 30 dias).
 * Referências e imagens vêm da página exibida quando ela é a versão atual;
 * fora dela (diff, histórico, versão antiga), são estimadas pelo wikitexto.
 */
function autoQuality( ctx, revid ) {
	var key = 'ronda-qualidade:' + ctx.page,
		naPagina = ctx.type === 'view' && mw.config.get( 'wgRevisionId' ) === revid,
		cache = mw.storage.getObject( key );

	if ( cache && cache.rev === revid && cache.res && ( !cache.res.aproximado || !naPagina ) ) {
		return $.Deferred().resolve( cache.res ).promise();
	}
	return $.when( qfArtigo( ctx.page ), qfAvisos() ).then( function ( art, avisos ) {
		var cont = naPagina ? qfContagemPagina() : $.extend( { aproximado: true }, qfContagemTexto( art.content ) ),
			res = avaliarQualidade( art, avisos, cont );

		mw.storage.setObject( key, { rev: revid, res: res }, QF.cacheResultado );
		return res;
	} ).then( null, function () {
		return $.Deferred().resolve( null ).promise();
	} );
}

/** Janela com todos os critérios, nível a nível */
function showQuality( res ) {
	var $box = $( '<div class="ronda-qf"></div>' );

	$box.append( $( '<p></p>' ).append( ronda.msg( 'paginas-qualidade-estimada' ) + ': ', $( '<b class="ronda-qf-nivel"></b>' ).text( res.estimado ) ) );
	res.niveis.forEach( function ( nv ) {
		var $t = $( '<table></table>' ),
			$d = $( '<details></details>' ).append( $( '<summary></summary>' ).append(
				$( '<span></span>' ).addClass( nv.ok ? 'ronda-ok' : 'ronda-bad' ).text( nv.ok ? '✔ ' : '✖ ' ),
				ronda.msg( 'paginas-qualidade-nivel', nv.n ) ) );

		if ( nv.n === res.alvo ) {
			$d.attr( 'open', 'open' );
		}
		nv.itens.forEach( function ( i ) {
			$t.append( $( '<tr></tr>' ).append(
				$( '<td></td>' ).append( $( '<span></span>' ).addClass( i.ok ? 'ronda-ok' : 'ronda-bad' ).text( i.ok ? '✔' : '✖' ) ),
				$( '<td></td>' ).text( i.nome ),
				$( '<td></td>' ).text( i.atual ),
				$( '<td></td>' ).text( ronda.msg( 'paginas-qualidade-meta', i.meta ) )
			) );
		} );
		$box.append( $d.append( $t ) );
	} );
	$box.append( $( '<p class="ronda-qf-nota"></p>' ).append(
		document.createTextNode( ronda.msg( res.aproximado ? 'paginas-qualidade-nota-aproximada' : 'paginas-qualidade-nota' ) + ' ' ),
		$( '<a></a>' ).attr( 'href', mw.util.getUrl( 'Wikipédia:Avaliação automática' ) ).text( 'Wikipédia:Avaliação automática' ) ) );

	ronda.ui.dialog( { title: ronda.msg( 'paginas-qualidade-titulo' ), width: 760, content: $box } );
}

function soft( promise ) {
	return promise.then( function ( d ) {
		return d;
	}, function () {
		return $.Deferred().resolve( null ).promise();
	} );
}

/** Título sem o qualificador entre parênteses, em minúsculas e sem acentos */
function titleKey( t ) {
	return String( t ).replace( /\s*\([^)]*\)\s*$/, '' ).normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, '' )
		.toLowerCase().replace( /[^a-z0-9]+/g, ' ' ).trim();
}

/** Semelhança de Dice entre os pares de letras de dois títulos (0 a 1) */
function titleSimilarity( a, b ) {
	var pa = {}, n = 0, hits = 0, i, k;

	a = titleKey( a );
	b = titleKey( b );
	if ( !a || !b ) {
		return 0;
	}
	if ( a === b ) {
		return 1;
	}
	for ( i = 0; i < a.length - 1; i++ ) {
		k = a.substr( i, 2 );
		pa[ k ] = ( pa[ k ] || 0 ) + 1;
		n++;
	}
	for ( i = 0; i < b.length - 1; i++ ) {
		k = b.substr( i, 2 );
		if ( pa[ k ] ) {
			pa[ k ]--;
			hits++;
		}
	}
	return ( 2 * hits ) / ( n + b.length - 1 );
}

/** Até 3 resultados da busca com título parecido (sem a própria página) */
function similarTitles( title, results ) {
	return results.map( function ( r ) {
		return { title: r.title, score: titleSimilarity( title, r.title ) };
	} ).filter( function ( r ) {
		return r.title !== title && r.score >= 0.72;
	} ).sort( function ( x, y ) {
		return y.score - x.score;
	} ).slice( 0, 3 ).map( function ( r ) {
		return r.title;
	} );
}

/** A página existe e já foi eliminada antes da criação atual? Devolve o registro ou null */
function recreation( data, title ) {
	var q = data.main.query,
		log = ( q.logevents || [] ).filter( function ( e ) {
			return e.action === 'delete';
		} )[ 0 ],
		first = data.first && ( ( ( data.first.query.pages || [] )[ 0 ] || {} ).revisions || [] )[ 0 ],
		page = ( q.pages || [] ).filter( function ( p ) {
			return p.title === title && !p.missing;
		} )[ 0 ];

	if ( !log || !page || !first ) {
		return null;
	}
	return Date.parse( log.timestamp ) <= Date.parse( first.timestamp ) ? log : null;
}

/**
 * Recriação que merece o alerta (!) no botão: a criação ainda não foi patrulhada.
 * Para quem não pode patrulhar (e não vê a patrulha), vale a criação nos últimos 30 dias.
 */
function recreationAlert( data, title ) {
	var rec = recreation( data, title ),
		first = data.first && ( ( ( data.first.query.pages || [] )[ 0 ] || {} ).revisions || [] )[ 0 ];

	if ( !rec ) {
		return null;
	}
	if ( data.patrol ) {
		return ( data.patrol.query.recentchanges || [] ).some( function ( r ) {
			return r.type === 'new';
		} ) ? rec : null;
	}
	return Date.now() - Date.parse( first.timestamp ) < 30 * 86400000 ? rec : null;
}

ronda.infoTools = { titleSimilarity: titleSimilarity, similarTitles: similarTitles, recreation: recreation, recreationAlert: recreationAlert };

/**
 * Dados do painel Informações, buscados uma vez por página (também em segundo plano).
 * @return {jQuery.Promise} { main, first, revisions, deleted, patrol, views, autoQuality }
 */
function loadInfo( ctx ) {
	return ronda.memo( 'info:' + ctx.page, function () {
		var names = mw.config.get( 'wgFormattedNamespaces' ),
			talk = ctx.ns % 2 === 0 && names[ ctx.ns + 1 ] !== undefined ? names[ ctx.ns + 1 ] + ':' + ctx.title : null,
			pe = 'Wikipédia:Páginas para eliminar/' + ctx.page,
			templates = ( ronda.catalog.maintenance || [] ).map( function ( m ) {
				return names[ 10 ] + ':' + m.template;
			} ).slice( 0, 50 ),
			main = ronda.api.get( $.extend( {
				action: 'query',
				titles: [ ctx.page, pe ].concat( talk ? [ talk ] : [] ).join( '|' ),
				prop: 'info|revisions|categories|pageprops|langlinks|templates',
				inprop: 'watchers|protection',
				rvprop: 'timestamp|user|ids',
				cllimit: 'max',
				ppprop: 'wikibase_item',
				lllimit: 'max',
				tltemplates: templates.join( '|' ),
				tllimit: 'max',
				list: 'logevents',
				letype: 'delete',
				letitle: ctx.page,
				leprop: 'ids|title|type|user|timestamp|comment|parsedcomment|details',
				lelimit: 20
			}, ctx.ns === 0 ? {
				// Afluentes vindos do domínio principal (sem nenhum, a página é órfã)
				list: 'logevents|backlinks', bltitle: ctx.page, bllimit: 1, blnamespace: 0, blfilterredir: 'nonredirects'
			} : {} ) ).then( function ( d ) {
				return d;
			} );

		return $.when(
			main,
			// Criação e editores
			soft( ronda.api.get( { action: 'query', titles: ctx.page, prop: 'revisions|contributors',
				rvdir: 'newer', rvlimit: 1, rvprop: 'user|timestamp', pclimit: 'max' } ) ),
			// Total de edições (até 500)
			soft( ronda.api.get( { action: 'query', titles: ctx.page, prop: 'revisions', rvprop: 'ids', rvlimit: 'max' } ) ),
			ronda.can( 'deletedhistory' ) ? soft( ronda.api.get( { action: 'query', titles: ctx.page,
				prop: 'deletedrevisions', drvprop: 'ids|user|timestamp', drvlimit: 'max' } ) ) : null,
			// Patrulha: só quem pode patrulhar vê o que falta patrulhar
			ronda.can( 'patrol' ) ? soft( ronda.api.get( { action: 'query', list: 'recentchanges', rctitle: ctx.page,
				rcshow: '!patrolled', rcprop: 'ids|timestamp|user', rctype: 'new|edit', rclimit: 50 } ) ) : null,
			ctx.exists ? pageviews( ctx.page ) : null,
			main.then( function ( d ) {
				var p = ( d.query.pages || [] ).filter( function ( x ) {
					return x.title === ctx.page;
				} )[ 0 ];

				return ctx.ns === 0 && p && p.lastrevid && !ctx.isMainPage ? autoQuality( ctx, p.lastrevid ) : null;
			} ),
			// Títulos parecidos (artigos): uma busca pelo título
			ctx.ns === 0 && ctx.exists && !ctx.isMainPage ? soft( ronda.api.get( { action: 'query', list: 'search',
				srsearch: ctx.title, srnamespace: 0, srlimit: 10, srinfo: '', srprop: '' } ) ) : null,
			// Página eliminada: a criação mais recente, pelo registro
			!ctx.exists ? soft( ronda.api.get( { action: 'query', list: 'logevents', letype: 'create', letitle: ctx.page, lelimit: 1 } ) ) : null
		).then( function ( m, first, revs, deleted, patrol, views, lw, search, created ) {
			return { main: m, first: first, revisions: revs, deleted: deleted, patrol: patrol, views: views, autoQuality: lw, pe: pe, talk: talk,
				created: ( ( created && created.query ) || {} ).logevents || [],
				similar: similarTitles( ctx.title, ( ( search && search.query ) || {} ).search || [] ) };
		} );
	} );
}

function renderInfo( $panel, ctx, data ) {
	var q = data.main.query,
		byTitle = {},
		L = ronda.ui.panelLayout(),
		addTo = ronda.ui.addTo,
		page, peExists, talkPage, quality, firstRev, contributors, anon, total, unpatrolled, newRc,
		maintenance, wikidata, langs, refs, $catLinks = $( '#mw-normal-catlinks a' ).not( ':first' ),
		$status, $recreated, $similar, $protect, $creation, $edits, $content, $maint, $links, $patrol, $audience, $actions, $view, rec;

	function flag( ok, what, href ) {
		var $c = ok && href ? $( '<a></a>' ).attr( 'href', href ) : $( '<span></span>' );

		return $c.addClass( ok ? 'ronda-ok' : 'ronda-bad' ).text( ( ok ? 'com ' : 'sem ' ) + what );
	}

	function a( href, text, ext ) {
		return $( ext ? '<a target="_blank" rel="noopener"></a>' : '<a></a>' ).attr( 'href', href ).text( text );
	}

	( q.pages || [] ).forEach( function ( p ) {
		byTitle[ p.title ] = p;
	} );

	/** Página inexistente: quem eliminou, por quê, quantas vezes, o que havia nela e o que ainda aponta para cá */
	function renderMissing() {
		var events = q.logevents || [],
			deletions = events.filter( function ( e ) {
				return e.action === 'delete';
			} ),
			restores = events.filter( function ( e ) {
				return e.action === 'restore';
			} ).length,
			more = events.length >= 20 ? '+' : '',
			last = deletions[ 0 ],
			drevs, newest, created, editors = {};

		if ( !last ) {
			$status.append( $( '<span></span>' ).text( ronda.msg( 'paginas-info-nao-existe' ) ) );
			return;
		}
		$status.append( $( '<span></span>' ).append( ronda.msg( 'paginas-eliminada-em' ), $( '<b></b>' ).text( formatDateTime( last.timestamp ) ),
			last.user ? [ document.createTextNode( ronda.msg( 'paginas-info-por' ) ), a( mw.util.getUrl( 'Special:Contributions/' + last.user ), last.user ) ] : null ) );
		// Motivo com as ligações clicáveis (parsedcomment já vem saneado pelo MediaWiki)
		if ( last.parsedcomment || last.comment ) {
			addTo( $status, last.parsedcomment
				? $( '<span class="ronda-feed-muted"></span>' ).html( last.parsedcomment )
				: $( '<span class="ronda-feed-muted"></span>' ).text( last.comment ) );
		}
		addTo( $status, a( mw.util.getUrl( 'Special:Log/delete', { page: ctx.page } ),
			ronda.msg( deletions.length === 1 && !more ? 'paginas-info-eliminacao' : 'paginas-info-eliminacoes', deletions.length + more ) +
			( restores ? ronda.msg( restores === 1 ? 'paginas-info-restauro' : 'paginas-info-restauros', restores + more ) : '' ) ) );
		if ( peExists ) {
			addTo( $status, a( mw.util.getUrl( data.pe ), ronda.msg( 'paginas-info-discussao-pe' ) ) );
		}

		// Quem criou a última versão, pelo registro de criação (visível a todos)
		created = ( data.created || [] )[ 0 ];
		if ( created && created.user && created.timestamp <= last.timestamp ) {
			$creation.append( document.createTextNode( ronda.msg( 'paginas-info-criada-por' ) ),
				a( mw.util.getUrl( 'Special:Contributions/' + created.user ), created.user ),
				document.createTextNode( ronda.msg( 'paginas-info-em', formatDateTime( created.timestamp ) ) ),
				document.createTextNode( ' · ' ), a( mw.util.getUrl( 'Special:Log/create', { page: ctx.page } ), ronda.msg( 'paginas-info-registro' ) ) );
		}

		// O que havia (quem pode ver edições eliminadas): a última edição antes da eliminação, edições e editores
		drevs = data.deleted && ( ( ( data.deleted.query.pages || [] )[ 0 ] || {} ).deletedrevisions || [] );
		if ( drevs && drevs.length ) {
			newest = drevs[ 0 ];
			drevs.forEach( function ( r ) {
				editors[ r.user || '' ] = true;
			} );
			if ( newest.user ) {
				addTo( $edits, [ document.createTextNode( ronda.msg( 'paginas-ultima-edicao' ) + ': ' ),
					a( mw.util.getUrl( 'Special:Contributions/' + newest.user ), newest.user ),
					document.createTextNode( ronda.msg( 'paginas-info-em', formatDateTime( newest.timestamp ) ) ) ] );
			}
			addTo( $edits, [ document.createTextNode( ronda.msg( 'paginas-edicoes-eliminadas' ) + ': ' ),
				a( mw.util.getUrl( 'Special:Undelete/' + ctx.page ), drevs.length + ( data.deleted[ 'continue' ] ? '+' : '' ) ) ] );
			addTo( $edits, document.createTextNode( ronda.msg( 'paginas-info-editores', Object.keys( editors ).length + ( data.deleted[ 'continue' ] ? '+' : '' ), '' ) ) );
		}

		// Ligações que ficaram vermelhas
		if ( ctx.ns === 0 ) {
			addTo( $links, ( q.backlinks || [] ).length
				? a( mw.util.getUrl( 'Special:WhatLinksHere/' + ctx.page, { namespace: 0 } ), ronda.msg( 'paginas-info-ainda-ligada' ) ).addClass( 'ronda-bad' )
				: $( '<span></span>' ).text( ronda.msg( 'paginas-info-sem-ligacoes' ) ) );
		}

		// Restaurar (administradores)
		if ( ronda.getModule( 'restaurar' ) && ronda.can( 'undelete' ) ) {
			addTo( $actions, $( '<a href="#" role="button"></a>' ).text( ronda.msg( 'admin-restaurar-botao' ).toLowerCase() ).on( 'click', function ( e ) {
				e.preventDefault();
				ronda.getModule( 'restaurar' ).open( ctx );
			} ) );
		}
	}
	page = byTitle[ ctx.page ] || ( q.pages || [] )[ 0 ] || {};
	peExists = byTitle[ data.pe ] && !byTitle[ data.pe ].missing;
	talkPage = data.talk && byTitle[ data.talk ];

	$status = L.row( ronda.msg( 'paginas-info-situacao' ) );
	$recreated = L.row( ronda.msg( 'paginas-info-recriacao' ) );
	$similar = L.row( ronda.msg( 'paginas-info-parecidas' ) );
	$protect = L.row( ronda.msg( 'paginas-info-protecao' ) );
	$creation = L.row( ronda.msg( 'paginas-info-criacao' ) );
	$edits = L.row( ronda.msg( 'paginas-info-edicoes' ) );
	$content = L.row( ronda.msg( 'paginas-info-conteudo' ) );
	$maint = L.row( ronda.msg( 'paginas-info-manutencao' ) );
	$links = L.row( ronda.msg( 'paginas-info-ligacoes' ) );
	$patrol = L.row( ronda.msg( 'paginas-info-patrulha' ) );
	$audience = L.row( ronda.msg( 'paginas-info-publico' ) );
	$actions = L.group( ronda.msg( 'patrulha-up-acoes' ) );
	$view = L.group( ronda.msg( 'patrulha-up-ver' ) );

	$panel.empty();

	// Situação
	if ( page.missing ) {
		renderMissing();
	} else {
		addTo( $status, peExists
			? a( mw.util.getUrl( data.pe ), ronda.msg( 'paginas-ja-proposta-para-eliminacao' ) )
			: $( '<span></span>' ).text( ronda.msg( 'paginas-nunca-proposta-para-eliminacao' ) ) );
		if ( ( q.logevents || [] ).length ) {
			addTo( $status, $( '<span></span>' ).append( ronda.msg( 'paginas-ja-eliminada-em' ),
				a( mw.util.getUrl( 'Special:Log/delete', { page: ctx.page } ), formatDateTime( q.logevents[ 0 ].timestamp ) ) ) );
		}
	}

	// Recriação: já foi eliminada antes da criação atual
	rec = !page.missing && recreation( data, ctx.page );
	if ( rec && recreationAlert( data, ctx.page ) ) {
		// O mesmo selo do botão, para ligar um ao outro
		$recreated.append( $( '<span class="ronda-alert-badge" aria-hidden="true">!</span>' ),
			$( '<span class="ronda-bad"></span>' ).text( ronda.msg( 'paginas-info-recriada-alerta', formatDateTime( rec.timestamp ) ) ) );
	} else if ( rec ) {
		$recreated.append( $( '<span></span>' ).text( ronda.msg( 'paginas-info-recriada', formatDateTime( rec.timestamp ) ) ) );
	}
	if ( rec ) {
		if ( rec.comment ) {
			addTo( $recreated, $( '<span class="ronda-feed-muted"></span>' ).text( rec.comment.replace( /<[^>]+>/g, '' ) ) );
		}
		addTo( $recreated, a( mw.util.getUrl( 'Special:Log/delete', { page: ctx.page } ), ronda.msg( 'paginas-info-registro' ) ) );
		if ( ronda.can( 'protect' ) && recreationAlert( data, ctx.page ) ) {
			addTo( $recreated, $( '<span class="ronda-feed-muted"></span>' ).text( ronda.msg( 'paginas-info-recriada-proteger' ) ) );
		}
	}

	// Títulos parecidos: fusão ou redirecionamento
	( data.similar || [] ).forEach( function ( t ) {
		addTo( $similar, [ a( mw.util.getUrl( t ), t ), document.createTextNode( ' (' ),
			ronda.getModule( 'fusao' ) ? $( '<a href="#" role="button"></a>' ).text( ronda.msg( 'paginas-info-fundir' ) ).on( 'click', function ( e ) {
				e.preventDefault();
				ronda.getModule( 'fusao' ).open( $.extend( {}, ctx, { prefill: t } ) );
			} ) : null,
			ronda.getModule( 'fusao' ) && ronda.getModule( 'redirecionar' ) ? document.createTextNode( ' · ' ) : null,
			ronda.getModule( 'redirecionar' ) ? $( '<a href="#" role="button"></a>' ).text( ronda.msg( 'paginas-info-redirecionar-para' ) ).on( 'click', function ( e ) {
				e.preventDefault();
				ronda.getModule( 'redirecionar' ).open( $.extend( {}, ctx, { prefill: t } ) );
			} ) : null,
			document.createTextNode( ')' ) ] );
	} );

	// Proteção
	if ( !page.missing || ( page.protection || [] ).length ) {
		$protect.append( ( page.protection || [] ).length
			? $( '<span class="ronda-up-hot"></span>' ).text( protectionText( page.protection ).join( '; ' ) )
			: $( '<span></span>' ).text( ronda.msg( 'paginas-info-sem-protecao' ) ) );
		addTo( $protect, a( mw.util.getUrl( 'Special:Log/protect', { page: ctx.page } ), ronda.msg( 'paginas-info-registro' ) ) );
	}

	if ( !page.missing ) {
		// Criação
		firstRev = data.first && ( ( ( data.first.query.pages || [] )[ 0 ] || {} ).revisions || [] )[ 0 ];
		if ( firstRev ) {
			$creation.append( document.createTextNode( ronda.msg( 'paginas-info-criada-por' ) ),
				a( mw.util.getUrl( 'Special:Contributions/' + firstRev.user ), firstRev.user ),
				document.createTextNode( ronda.msg( 'paginas-info-em', formatDateTime( firstRev.timestamp ) ) ) );
		}

		// Edições e editores
		if ( data.revisions ) {
			total = ( ( ( data.revisions.query.pages || [] )[ 0 ] || {} ).revisions || [] ).length;
			addTo( $edits, [ document.createTextNode( ronda.msg( 'paginas-info-total' ) ),
				a( mw.util.getUrl( ctx.page, { action: 'history' } ), total + ( data.revisions[ 'continue' ] ? '+' : '' ) ) ] );
		}
		if ( data.first ) {
			contributors = ( ( data.first.query.pages || [] )[ 0 ] || {} ).contributors || [];
			anon = ( ( data.first.query.pages || [] )[ 0 ] || {} ).anoncontributors || 0;
			addTo( $edits, document.createTextNode( ronda.msg( 'paginas-info-editores', contributors.length + anon +
				( data.first[ 'continue' ] ? '+' : '' ), anon ? ronda.msg( 'paginas-info-ips', anon ) : '' ) ) );
		}
		if ( page.revisions ) {
			addTo( $edits, [ document.createTextNode( ronda.msg( 'paginas-ultima-edicao' ) + ': ' ),
				a( mw.util.getUrl( ctx.page, { diff: 'cur', oldid: 'prev' } ), formatDateTime( page.revisions[ 0 ].timestamp ) + ' (' + page.revisions[ 0 ].user + ')' ) ] );
		}
		if ( data.deleted ) {
			addTo( $edits, [ document.createTextNode( ronda.msg( 'paginas-edicoes-eliminadas' ) + ': ' ),
				a( mw.util.getUrl( 'Special:Undelete/' + ctx.page ), String( ( ( ( data.deleted.query.pages || [] )[ 0 ] || {} ).deletedrevisions || [] ).length || 'nenhuma' ) ) ] );
		}

		// Conteúdo e qualidade
		addTo( $content, [ document.createTextNode( ronda.msg( 'paginas-tamanho' ) + ': ' ),
			$( '<b></b>' ).text( ( page.length || 0 ).toLocaleString( 'pt-BR' ) + ' bytes' ) ] );
		if ( ctx.ns === 0 || ctx.ns === 100 ) {
			quality = $( '#mw-indicator-featured-star' ).length ? 'destacado'
				: $( '#mw-indicator-good-star' ).length ? 'bom'
					: qualityFromCategories( talkPage && talkPage.categories );
			addTo( $content, [ document.createTextNode( ronda.msg( 'paginas-qualidade' ) + ': ' ), $( '<b></b>' ).text( quality || 'desconhecida' ) ] );
		}
		if ( data.autoQuality ) {
			addTo( $content, [
				$( '<span></span>' ).attr( 'title', ronda.msg( 'paginas-info-qualidade-auto-dica' ) )
					.text( ronda.msg( 'paginas-info-qualidade-auto', data.autoQuality.estimado ) ),
				document.createTextNode( ' ' ),
				$( '<a href="#" role="button"></a>' ).text( ronda.msg( 'paginas-info-qualidade-criterios' ) ).on( 'click', function ( e ) {
					e.preventDefault();
					showQuality( data.autoQuality );
				} )
			] );
			if ( qfFaltam( data.autoQuality ).length ) {
				addTo( $content, $( '<span class="ronda-feed-muted"></span>' ).text( ronda.msg( 'paginas-info-qualidade-falta',
					data.autoQuality.alvo, qfFaltam( data.autoQuality ).map( function ( i ) {
						return i.nome.replace( / \(.*\)$/, '' ).toLowerCase() + ' (' + i.atual + '; ' + i.meta + ')';
					} ).join( ', ' ) ) ) );
			}
		}
		// Referências: contadas no texto exibido (só quando o painel é aberto na própria página)
		if ( ctx.ns === 0 && ( ctx.type === 'view' || ctx.type === 'diff' ) ) {
			refs = $( '#mw-content-text .references li' ).length;
			addTo( $content, refs ? $( '<span></span>' ).text( ronda.msg( 'paginas-info-referencias', refs ) ) : flag( false, ronda.msg( 'paginas-referencias' ) ) );
		}

		// Manutenção: marcações do catálogo presentes (redirecionamentos já resolvidos pela API)
		maintenance = ( page.templates || [] ).map( function ( t ) {
			var name = t.title.replace( /^[^:]+:/, '' );

			return ( ronda.catalog.maintenance || [] ).filter( function ( m ) {
				return m.template === name;
			} ).map( function ( m ) {
				return m.label;
			} )[ 0 ] || name;
		} );
		$maint.append( maintenance.length
			? $( '<span></span>' ).text( ronda.msg( 'paginas-info-marcacoes', maintenance.length, maintenance.join( ', ' ) ) )
			: $( '<span></span>' ).text( ronda.msg( 'paginas-info-nenhuma-marcacao' ) ) );

		// Ligações: categorias, afluentes do principal, interwikis, Wikidata
		if ( ctx.ns % 2 === 0 && !ctx.isMainPage ) {
			addTo( $links, flag( $catLinks.length > 0 || ( page.categories || [] ).some( function ( c ) {
				return !/^Categoria:!/.test( c.title );
			} ), 'categorias' ) );
			// Órfã só faz sentido para artigos
			if ( ctx.ns === 0 ) {
				addTo( $links, ( q.backlinks || [] ).length
					? flag( true, ronda.msg( 'paginas-info-afluentes-principal' ), mw.util.getUrl( 'Special:WhatLinksHere/' + ctx.page, { namespace: 0 } ) )
					: $( '<span class="ronda-bad"></span>' ).text( ronda.msg( 'paginas-info-orfa' ) ) );
			}
		}
		langs = ( page.langlinks || [] ).length;
		wikidata = ( page.pageprops || {} ).wikibase_item;
		if ( ctx.ns === 0 || ctx.ns === 14 || ctx.ns === 10 ) {
			addTo( $links, langs ? $( '<span></span>' ).text( ronda.msg( 'paginas-info-linguas', langs ) ) : flag( false, ronda.msg( 'paginas-info-interwikis' ) ) );
			addTo( $links, wikidata
				? a( 'https://www.wikidata.org/wiki/' + wikidata, wikidata, true )
				: $( '<span class="ronda-bad"></span>' ).text( ronda.msg( 'paginas-info-sem-wikidata' ) ) );
		}

		// Patrulha
		if ( data.patrol ) {
			unpatrolled = data.patrol.query.recentchanges || [];
			newRc = unpatrolled.filter( function ( r ) {
				return r.type === 'new';
			} )[ 0 ];
			if ( newRc ) {
				addTo( $patrol, $( '<span class="ronda-up-hot"></span>' ).text( ronda.msg( 'paginas-info-nova-nao-patrulhada' ) ) );
				$actions.append( $( '<div></div>' ).append( $( '<a href="#" role="button" class="ronda-up-action"></a>' )
					.text( ronda.msg( 'paginas-info-marcar-patrulhada' ) )
					.on( 'click', function ( e ) {
						var $link = $( this );

						e.preventDefault();
						ronda.api.postWithToken( 'patrol', { action: 'patrol', rcid: newRc.rcid } ).then( function () {
							ronda.forget( 'info:' + ctx.page );
							$link.replaceWith( $( '<span></span>' ).text( ronda.msg( 'paginas-info-patrulhada' ) ) );
						}, ronda.fail );
					} ) ) );
			}
			if ( unpatrolled.length - ( newRc ? 1 : 0 ) > 0 ) {
				addTo( $patrol, a( mw.util.getUrl( 'Special:RecentChanges', { hidepatrolled: 1, days: 30, limit: 50, target: ctx.page, enhanced: 0 } ),
					ronda.msg( 'paginas-info-edicoes-nao-patrulhadas', unpatrolled.length - ( newRc ? 1 : 0 ) ) ) );
			}
			if ( !unpatrolled.length ) {
				$patrol.append( $( '<span class="ronda-ok"></span>' ).text( ronda.msg( 'paginas-info-tudo-patrulhado' ) ) );
			}
		}

		// Público
		if ( typeof data.views === 'number' ) {
			addTo( $audience, document.createTextNode( ronda.msg( 'paginas-info-visualizacoes', data.views.toLocaleString( 'pt-BR' ) ) ) );
		}
		addTo( $audience, document.createTextNode( ronda.msg( 'paginas-vigilantes' ) + ': ' +
			( page.watchers ? String( page.watchers ) : ronda.msg( 'paginas-poucos-ou-nenhum' ) ) ) );
	}

	// Detector de cópia (VDA), para artigos
	if ( ctx.ns === 0 && !page.missing ) {
		addTo( $actions, a( ronda.copyvioUrl( ctx.page ), ronda.msg( 'paginas-detectar-vda' ), true ).attr( 'title', ronda.msg( 'paginas-detectar-vda-dica' ) ) );
	}

	// Ver
	addTo( $view, a( mw.util.getUrl( ctx.page, { action: 'history' } ), ronda.msg( 'paginas-info-historico' ) ) );
	addTo( $view, a( mw.util.getUrl( 'Special:Log', { page: ctx.page } ), ronda.msg( 'paginas-registros' ).toLowerCase() ) );
	addTo( $view, a( 'https://pageviews.wmcloud.org/?' + $.param( { project: 'pt.wikipedia.org', platform: 'all-access', agent: 'user',
		range: 'latest-30', pages: ctx.page.replace( / /g, '_' ) } ), ronda.msg( 'paginas-visualizacoes' ).toLowerCase(), true ) );
	addTo( $view, a( mw.util.getUrl( ctx.page, { action: 'info' } ), ronda.msg( 'paginas-mais-informacoes' ).toLowerCase() ) );

	$panel.append( L.build() );
}

/*
 * Informações reúne, inteiros, os painéis da página e do usuário:
 * - contribuições: só o do usuário;
 * - páginas e discussões de usuário: os dois, o da página primeiro;
 * - demais páginas: só o da página.
 */
function infoParts( ctx ) {
	return {
		page: ronda.isPageContext( ctx ),
		user: !!( ronda.userPanel && ctx.targetUser && ronda.userPanel.isAvailable( ctx ) )
	};
}

function fillPageInfo( $el, ctx ) {
	$el.text( ronda.msg( 'patrulha-carregando' ) );
	loadInfo( ctx ).then( function ( data ) {
		renderInfo( $el, ctx, data );
	}, function () {
		$el.text( ronda.msg( 'paginas-nao-foi-possivel-obter-as-informacoes' ) );
	} );
}

function openInfo( ctx ) {
	var parts = infoParts( ctx ),
		both = parts.page && parts.user;

	ronda.ui.togglePanel( 'info', function ( $panel ) {
		if ( parts.page ) {
			if ( both ) {
				$( '<div class="ronda-info-heading"></div>' ).text( ronda.msg( 'paginas-info-pagina', ctx.page ) ).appendTo( $panel );
			}
			fillPageInfo( $( '<div class="ronda-info-part"></div>' ).appendTo( $panel ), ctx );
		}
		if ( parts.user ) {
			if ( both ) {
				$( '<div class="ronda-info-heading"></div>' ).text( ronda.msg( 'paginas-info-usuario', ctx.targetUser ) ).appendTo( $panel );
			}
			ronda.userPanel.fill( $( '<div class="ronda-info-part"></div>' ).appendTo( $panel ), ctx );
		}
	} );
}

/** Selo de alerta no botão Informações quando a página é uma recriação */
function markRecreation( ctx ) {
	if ( !ronda.isPageContext( ctx ) || !ctx.exists ) {
		return;
	}
	loadInfo( ctx ).then( function ( data ) {
		var rec = recreationAlert( data, ctx.page ),
			$btn = $( '#ronda-toolbar .ronda-btn-info' ),
			mod = ronda.getModule( 'info' );

		// O motivo do selo também na dica do botão
		$btn.toggleClass( 'ronda-btn-alert', !!rec )
			.attr( 'data-alerta', rec ? ronda.msg( 'paginas-info-recriada-curto' ) : null )
			.attr( 'title', ( mod && mod.title || '' ) + ( rec ? ' — ! ' + ronda.msg( 'paginas-info-recriada-curto' ) : '' ) );
	} );
}

function prefetchInfo( ctx ) {
	var parts = infoParts( ctx );

	if ( parts.page ) {
		markRecreation( ctx );
	}
	if ( parts.user ) {
		ronda.userPanel.load( ctx );
	}
}

/* ---------------- Pedido ---------------- */

/**
 * @param {Object} [options] { type: id do pedido já escolhido, target: alvo já preenchido }
 */
function openRequest( ctx, options ) {
	var reqs = ronda.catalog.requests,
		me = mw.config.get( 'wgUserName' ),
		isUserCtx = ronda.isUserContext( ctx ) && ctx.targetUser !== me,
		$type = $( '<select></select>' ),
		$target = ronda.ui.text( '', '' ),
		$target2 = ronda.ui.text( '', ronda.msg( 'paginas-segunda-pagina' ) ),
		$text = ronda.ui.textarea( '', '' ).attr( 'rows', 4 ),
		cbHide = ronda.ui.checkbox( ronda.msg( 'paginas-ocultar-o-nome-no-pedido' ), false ),
		$targetRow = ronda.ui.row( ronda.msg( 'patrulha-pagina' ), $target ),
		$target2Row = ronda.ui.row( ronda.msg( 'paginas-segunda-pagina' ), $target2 ),
		$textRow = ronda.ui.row( ronda.msg( 'paginas-argumentacao' ), $text ),
		$dlg;

	reqs.forEach( function ( r ) {
		$( '<option></option>' ).val( r.id ).text( r.label ).attr( 'title', r.title ).appendTo( $type );
	} );

	function current() {
		return reqs.filter( function ( r ) {
			return r.id === $type.val();
		} )[ 0 ];
	}

	function refresh() {
		var r = current(),
			prefill = '';

		$targetRow.children( 'label' ).text( r.target === 'user' ? ronda.msg( 'patrulha-usuario-botao' ) : r.target === 'free' ? ronda.msg( 'paginas-assunto' ) : ronda.msg( 'patrulha-pagina' ) );
		$target2Row.toggle( !!r.history );
		$textRow.toggle( !r.noText );
		cbHide.$element.toggle( r.target === 'user' );
		$text.attr( 'placeholder', ronda.msg( 'paginas-nao-precisa-assinar', r.placeholder || '' ) );

		// Mesmo preenchimento do FastButtons
		if ( options && options.target && r.target === 'user' ) {
			prefill = options.target;
		} else if ( r.target === 'user' && isUserCtx ) {
			prefill = ctx.targetUser;
		} else if ( r.target === 'page' && ctx.ns !== -1 && ctx.type !== 'contribs' ) {
			prefill = ctx.page;
		}
		$target.val( prefill );
	}

	ronda.ui.onChange( $type, refresh );
	if ( options && options.type && $type.find( 'option[value="' + options.type + '"]' ).length ) {
		$type.val( options.type );
	}
	refresh();

	function submit() {
		var r = current(),
			target = $target.val().trim(),
			target2 = $target2.val().trim(),
			text = $text.val().trim(),
			hide = r.target === 'user' && cbHide.isChecked(),
			ok = ronda.ui.require( $target, !!target );

		ok = ronda.ui.require( $target2, !r.history || !!target2 ) && ok;
		ok = ronda.ui.require( $text, r.noText || !!text ) && ok;
		if ( !ok ) {
			return;
		}

		ronda.ui.setBusy( $dlg, true );
		( r.target === 'free' ? $.Deferred().resolve( '' ).promise() : ronda.api.get( {
			action: 'query',
			titles: r.page + '/Padrão',
			prop: 'revisions',
			rvprop: 'content',
			rvslots: 'main'
		} ).then( function ( data ) {
			var p = data.query.pages[ 0 ];

			return p.revisions ? p.revisions[ 0 ].slots.main.content : '';
		} ) ).then( function ( model ) {
			return ronda.post( {
				action: 'edit',
				title: r.page,
				appendtext: '\n' + buildRequest( model, { request: r, target: target, target2: target2, text: text, hide: hide } ),
				summary: 'Pedido: ' + r.label.toLowerCase() + ( target ? ' — [[' + ( r.target === 'user' ? 'Special:Contributions/' + target + '|' + target : ':' + target ) + ']]' : '' ),
				watchlist: ronda.config.watchlist
			} );
		} ).then( function () {
			mw.notify( ronda.msg( 'paginas-pedido-enviado' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
			location.href = mw.util.getUrl( r.page ) + ( hide ? '' : '#' + mw.util.escapeIdForLink(
				target + ( r.history ? ' e ' + target2 : '' ) ) );
		}, function ( code, data ) {
			ronda.ui.setBusy( $dlg, false );
			ronda.fail( code, data );
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'paginas-pedido' ),
		width: 560,
		content: $( '<div></div>' ).append( ronda.ui.row( ronda.msg( 'paginas-tipo-de-pedido' ), $type ), $targetRow, $target2Row, $textRow, cbHide.$element ),
		buttons: [ { text: ronda.msg( 'paginas-enviar-pedido' ), 'class': 'ui-priority-primary ui-button-blue', click: submit },
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
}

/* ---------------- Não assinou (formulário de edição) ---------------- */

function openUnsigned() {
	var $user = ronda.ui.text( '', ronda.msg( 'paginas-quem-deixou-de-assinar' ) ),
		$date = ronda.ui.text( '', ronda.msg( 'paginas-data-do-comentario-opcional' ) ),
		$dlg;

	function submit() {
		var user = $user.val().trim(),
			date = $date.val().trim(),
			code = '{{subst:Não assinou|' + user + ( date ? '|' + date : '' ) + '}}',
			$box = $( '#wpTextbox1' ),
			el = $box[ 0 ],
			start, end;

		if ( !ronda.ui.require( $user, !!user ) ) {
			return;
		}

		if ( $.fn.textSelection ) {
			$box.textSelection( 'encapsulateSelection', { peri: code } );
		} else {
			start = el.selectionStart;
			end = el.selectionEnd;
			el.value = el.value.slice( 0, start ) + code + el.value.slice( end );
		}
		$( '#wpSummary' ).val( function ( i, v ) {
			return ( v ? v + '; ' : '' ) + 'Marcação: ' + ronda.tpl( 'Não assinou' );
		} );
		ronda.ui.close( $dlg );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'paginas-nao-assinou' ),
		width: 440,
		content: $( '<div></div>' ).append( ronda.ui.row( ronda.msg( 'patrulha-usuario-botao' ), $user ), ronda.ui.row( ronda.msg( 'paginas-data' ), $date ) ),
		buttons: [ { text: ronda.msg( 'paginas-inserir' ), 'class': 'ui-priority-primary ui-button-blue', click: submit },
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
}

/* ---------------- Registro ---------------- */

function isPage( ctx ) {
	return ronda.isTaggable( ctx );
}

ronda.registerModule( {
	id: 'redirecionar',
	label: ronda.msg( 'paginas-redirecionar-botao' ),
	title: ronda.msg( 'paginas-redirecionar-para-outro-titulo' ),
	order: 14,
	isAvailable: function ( ctx ) {
		return isPage( ctx ) && ctx.ns % 2 === 0 && [ 6, 8, 828 ].indexOf( ctx.ns ) === -1
			&& ronda.can( 'edit' );
	},
	open: openRedirect
} );

ronda.registerModule( {
	id: 'esboco',
	label: 'Esboço',
	title: ronda.msg( 'paginas-marcar-o-artigo-como-esboco' ),
	order: 12,
	isAvailable: function ( ctx ) {
		return isPage( ctx ) && ctx.ns === 0 && ctx.exists && !ctx.isRedirect && ronda.can( 'edit' );
	},
	open: openStub
} );

ronda.registerModule( {
	id: 'fusao',
	label: ronda.msg( 'paginas-fusao' ),
	title: ronda.msg( 'paginas-propor-a-fusao-desta-pagina-com' ),
	order: 16,
	isAvailable: function ( ctx ) {
		return isPage( ctx ) && ctx.exists && !ctx.isRedirect && ( ctx.ns === 0 || ctx.ns === 10 ) && ronda.can( 'edit' );
	},
	open: openMerge
} );

ronda.registerModule( {
	id: 'busca',
	label: ronda.msg( 'paginas-busca' ),
	title: ronda.msg( 'paginas-opcoes-para-a-busca-de-fontes' ),
	order: 40,
	isAvailable: function ( ctx ) {
		return isPage( ctx ) && ctx.ns === 0;
	},
	open: openSearch
} );

ronda.registerModule( {
	id: 'petscan',
	label: ronda.msg( 'paginas-petscan' ),
	title: ronda.msg( 'paginas-procurar-paginas-nesta-categoria-com-o' ),
	order: 40,
	isAvailable: function ( ctx ) {
		return isPage( ctx ) && ctx.ns === 14 && ctx.exists;
	},
	open: openPetScan
} );

ronda.registerModule( {
	id: 'info',
	label: ronda.msg( 'paginas-informacoes' ),
	title: ronda.msg( 'paginas-informacoes-sobre-a-pagina-ou-usuario' ),
	order: 1,
	isAvailable: function ( ctx ) {
		var parts = infoParts( ctx );

		return parts.user || parts.page;
	},
	open: openInfo,
	prefetch: prefetchInfo
} );

ronda.registerModule( {
	id: 'pedido',
	label: ronda.msg( 'paginas-pedido' ),
	title: ronda.msg( 'paginas-fazer-um-pedido-sobre-uma-pagina' ),
	order: 44,
	isAvailable: function ( ctx ) {
		return ronda.can( 'edit' );
	},
	open: openRequest
} );

ronda.registerModule( {
	id: 'naoassinou',
	label: ronda.msg( 'paginas-nao-assinou' ),
	title: 'Inserir {{Não assinou}} no texto',
	order: 46,
	isAvailable: function ( ctx ) {
		return ctx.type === 'edit' && ( ctx.ns % 2 === 1 || ctx.ns === 4 ) && $( '#wpTextbox1' ).length > 0;
	},
	open: openUnsigned
} );

}( window.ronda ) );

/* ===== Ronda-admin.js ===== */
/**
 * Ronda — administração
 *
 * Reúne os módulos que exigem direitos administrativos:
 * Eliminar, Desligar, Proteger, Bloquear, Restaurar e Lote.
 * Cada módulo continua no seu próprio bloco (escopo isolado).
 */

/**
 * Ronda — módulo de eliminação
 *
 * Para quem tem o direito "delete" (administradores e eliminadores).
 * Inspirado no FastButtonsEliminar:
 * - Motivos de MediaWiki:Deletereason-dropdown expandidos para o domínio da
 *   página (o menu da pt.wiki varia por domínio), com cache de 1 semana e
 *   botão para atualizar a lista. Em ficheiros, os de
 *   MediaWiki:Filedelete-reason-dropdown vêm primeiro. O catálogo
 *   ronda.catalog.deletionReasons prevalece sobre o menu (withCatalogRules).
 * - Motivo sugerido no topo do menu: regra da marcação {{ER|…}}; em páginas
 *   de discussão, D1 (discussão sem página principal) ou D2 (discussão de
 *   página existente).
 * Além disso:
 * - Avisa sobre afluentes, transclusões e usos de ficheiro.
 * - Elimina a discussão e os redirecionamentos para a página (prop=redirects,
 *   não os afluentes), se pedido.
 * - Pode abrir o módulo Desligar logo depois.
 *
 * As propostas (ER/ESR) e a eliminação por consenso ficam em Ronda-paginas.js.
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

function countLabel( list ) {
	return list.length >= 500 ? '500+' : String( list.length );
}

function ruleRegExp( rule ) {
	// "A4" casa com "A4 - …" e com âncoras como "ERa4"
	return new RegExp( '(^|[^A-Za-z0-9])' + rule + '($|[^0-9])|ER' + rule.toLowerCase() + '(?![0-9])', 'i' );
}

/** Menus de motivos de eliminação: em ficheiros, o de ficheiros primeiro (como em Especial:Eliminar ficheiro) */
function deleteMessages( ctx ) {
	return ctx.ns === 6 ? [ 'filedelete-reason-dropdown', 'deletereason-dropdown' ] : 'deletereason-dropdown';
}

/** Código da regra no rótulo (ex.: "D2 - …" → "D2") */
function ruleCode( option ) {
	var m = /^([A-Z]\d+)\s*-/.exec( option.label || '' );

	return m ? m[ 1 ] : null;
}

/** Grupos de ronda.catalog.deletionReasons que valem para os domínios dados */
function catalogGroupsFor( nsList ) {
	return ( ronda.catalog.deletionReasons || [] ).filter( function ( g ) {
		return !g.ns || nsList.some( function ( ns ) {
			return g.ns === 'talk' ? ns % 2 === 1 : g.ns.indexOf( ns ) !== -1;
		} );
	} );
}

/**
 * Aplica o catálogo (ronda.catalog.deletionReasons) ao menu nativo; o catálogo
 * prevalece. Para os domínios dados:
 * - uma regra de ER do catálogo substitui a do menu com o mesmo código, no mesmo
 *   lugar, ou entra junto das regras irmãs se faltar (ex.: D2 depois da D1);
 * - opções sem código marcadas com add: true entram sempre, depois das regras
 *   do grupo.
 */
function withCatalogRules( nsList, groups ) {
	groups = groups.map( function ( g ) {
		return { label: g.label, options: g.options.slice() };
	} );

	function groupOf( option ) {
		return groups.filter( function ( g ) {
			return g.options.indexOf( option ) !== -1;
		} )[ 0 ];
	}

	function hasValue( value ) {
		return groups.some( function ( g ) {
			return g.options.some( function ( o ) {
				return o.value === value;
			} );
		} );
	}

	catalogGroupsFor( nsList ).forEach( function ( cg ) {
		var last = null;

		function insert( o ) {
			var target = last ? groupOf( last ) : null;

			if ( !target ) {
				target = groups.filter( function ( g ) {
					return g.label === cg.label;
				} )[ 0 ];
			}
			if ( !target ) {
				target = { label: cg.label, options: [] };
				groups.push( target );
			}
			target.options.splice( last && target.options.indexOf( last ) !== -1
				? target.options.indexOf( last ) + 1 : target.options.length, 0, o );
			last = o;
		}

		cg.options.forEach( function ( o ) {
			var code = ruleCode( o ),
				found, g;

			if ( !code ) {
				if ( o.add && !hasValue( o.value ) ) {
					insert( o );
				}
				return;
			}

			found = ronda.findReason( groups, ruleRegExp( code ) );
			if ( found ) {
				g = groupOf( found );
				g.options[ g.options.indexOf( found ) ] = o;
				last = o;
			} else {
				insert( o );
			}
		} );
	} );

	return groups;
}

ronda.withCatalogRules = withCatalogRules;

/** Motivos de eliminação da página (com as regras de discussão completas) */
function deleteReasons( ctx, refresh ) {
	return ronda.reasons( deleteMessages( ctx ), ctx, refresh ).then( function ( groups ) {
		return withCatalogRules( [ ctx.ns ], groups );
	} );
}

function suggestReason( ctx, page, text, groups ) {
	var er = text.match( /\{\{\s*ER\s*\|\s*([A-Za-z]\d+)/ ),
		isTalk = ctx.ns % 2 === 1;

	if ( er ) {
		return {
			rule: er[ 1 ].toUpperCase(),
			option: ronda.findReason( groups, ruleRegExp( er[ 1 ].toUpperCase() ) )
		};
	}

	if ( isTalk && !page.subjectid ) {
		return { rule: 'D1', option: ronda.findReason( groups, ruleRegExp( 'D1' ) ) };
	}

	if ( isTalk ) {
		return { rule: 'D2', option: ronda.findReason( groups, ruleRegExp( 'D2' ) ) };
	}

	return null;
}

function showForm( ctx, page, groups ) {
	var text = ( page.revisions && page.revisions[ 0 ] && page.revisions[ 0 ].slots.main.content ) || '',
		erParams = ronda.templateParams( text, 'ER' ),
		erNote = erParams && erParams[ '3' ] ? erParams[ '3' ] : '',
		otherProcess = /\{\{\s*(?:subst:)?(?:ESR[\w\-]*|apagar\d*|Página para eliminar)\s*[|}]/i.test( text ),
		// Redirecionamentos para a página vêm da tabela de redirecionamentos (prop=redirects):
		// um afluente marcado como redirecionamento pode apontar para outra página e só
		// ligar a esta (ex.: módulo que redireciona para outro e liga à própria /doc)
		redirects = page.redirects || [],
		redirectTitles = redirects.map( function ( r ) {
			return r.title;
		} ),
		links = ( page.backlinks || [] ).filter( function ( b ) {
			return redirectTitles.indexOf( b.title ) === -1;
		} ),
		embedded = page.embeddedin || [],
		fileUsage = page.imageusage || [],
		suggestion = suggestReason( ctx, page, text, groups ),
		reasonFields = ronda.ui.reasonFields(
			function ( refresh ) {
				return deleteReasons( ctx, refresh );
			}, ctx, groups, suggestion && suggestion.option
		),
		// Discussão: só em domínios de conteúdo e nunca a discussão de uma página raiz de usuário
		canDeleteTalk = !!page.talkid && ctx.ns % 2 === 0 && !( ctx.ns === 2 && ctx.title.indexOf( '/' ) === -1 ),
		$content = $( '<div></div>' ),
		cbTalk, cbRedirects, cbUnlink, $dlg;

	if ( suggestion && suggestion.rule.charAt( 0 ) !== 'D' ) {
		$content.append( ronda.ui.message( 'highlight', $( '<span></span>' ).text(
			ronda.msg( 'admin-marcada-para-eliminacao-rapida-pela-regra', suggestion.rule, suggestion.option ? '' : ronda.msg( 'admin-a-regra-nao-foi-encontrada-no' ) )
		) ) );
	}

	if ( suggestion && !suggestion.option ) {
		reasonFields.$extra.val( '[[WP:ER|ER]] ' + suggestion.rule );
	}

	if ( erNote ) {
		reasonFields.$extra.val(
			( reasonFields.$extra.val() ? reasonFields.$extra.val() + ' — ' : '' ) + erNote
		);
	}

	if ( otherProcess ) {
		$content.append( ronda.ui.message( 'error', $( '<span></span>' ).text(
			ronda.msg( 'admin-a-pagina-esta-em-eliminacao-semirrapida' )
		) ) );
	}

	if ( links.length || embedded.length || fileUsage.length ) {
		$content.append( ronda.ui.message( 'highlight', $( '<span></span>' ).append(
			document.createTextNode(
				ronda.msg( 'admin-afluentes-transclusoes', countLabel( links ), countLabel( embedded ), ctx.ns === 6 ? ronda.msg( 'admin-usos-do-ficheiro', countLabel( fileUsage ) ) : '' )
			),
			$( '<a target="_blank"></a>' )
				.attr( 'href', mw.util.getUrl( 'Special:WhatLinksHere/' + ctx.page ) )
				.text( ronda.msg( 'paginas-ver-lista' ) )
		) ) );
	}

	$content.append( reasonFields.$element );

	if ( canDeleteTalk ) {
		// A discussão de usuário (PDU) só sai junto da página de usuário se for pedido explicitamente
		cbTalk = ctx.ns === 2
			? ronda.ui.checkbox( ronda.msg( 'admin-eliminar-tambem-a-pdu' ), false )
			: ronda.ui.checkbox( ronda.msg( 'admin-eliminar-tambem-a-pagina-de-discussao' ), true );
		$content.append( cbTalk.$element );
	}

	if ( redirects.length ) {
		cbRedirects = ronda.ui.checkbox(
			ronda.msg( 'admin-eliminar-tambem-redirecionamento-s-para-esta', redirects.length, redirects.length <= 5 ? ': ' + redirectTitles.join( ', ' ) : '' ),
			true
		);
		$content.append( cbRedirects.$element );
	}

	if ( ( links.length || fileUsage.length ) && ronda.getModule( 'desligar' ) ) {
		cbUnlink = ronda.ui.checkbox( ronda.msg( 'admin-remover-as-ligacoes-afluentes-depois-abre' ), false );
		$content.append( cbUnlink.$element );
	}

	function submit() {
		var reason = reasonFields.value();

		if ( !ronda.ui.require( reasonFields.$extra, !!reason ) ) {
			return;
		}

		ronda.ui.setBusy( $dlg, true );

		// A página mudou desde que o diálogo abriu (ex.: marcação removida, texto reescrito)? Pergunta antes
		ronda.api.get( { action: 'query', titles: ctx.page, prop: 'info' } ).then( function ( d ) {
			var now = ( d.query.pages || [] )[ 0 ] || {};

			if ( page.lastrevid && now.lastrevid && now.lastrevid !== page.lastrevid &&
				!window.confirm( ronda.msg( 'admin-pagina-mudou-confirmar' ) ) ) {
				return $.Deferred().reject( 'ronda-cancelled' ).promise();
			}
			return ronda.post( {
				action: 'delete',
				title: ctx.page,
				reason: reason,
				deletetalk: !!( cbTalk && cbTalk.isChecked() )
			} );
		} ).then( function () {
			mw.notify( ronda.msg( 'admin-pagina-eliminada' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );

			if ( !cbRedirects || !cbRedirects.isChecked() ) {
				return;
			}

			return ronda.sequence( redirects, function ( r ) {
				return ronda.post( {
					action: 'delete',
					title: r.title,
					reason: ronda.config.deletion.redirectReason
				} );
			} ).then( function ( results ) {
				var failed = results.filter( function ( r ) {
					return !r.ok;
				} );

				mw.notify(
					ronda.msg( 'admin-redirecionamento-s-eliminado-s', results.length - failed.length, failed.length ? ronda.msg( 'admin-falharam', failed.map( function ( r ) {
							return r.item.title;
						} ).join( ', ' ) ) : '.' ),
					{ type: failed.length ? 'warn' : 'success', title: ronda.msg( 'core-nome' ) }
				);
			} );
		} ).then( function () {
			ronda.ui.close( $dlg );

			if ( cbUnlink && cbUnlink.isChecked() ) {
				ronda.getModule( 'desligar' ).open( ctx, { reason: reason } );
			} else {
				location.reload();
			}
		}, function ( code, data ) {
			ronda.ui.setBusy( $dlg, false );
			if ( code !== 'ronda-cancelled' ) {
				ronda.fail( code, data );
			}
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'admin-eliminar-titulo', ctx.page ),
		content: $content,
		buttons: [ {
			text: ronda.msg( 'admin-eliminar-botao' ),
			'class': 'ui-priority-primary ui-button-red',
			click: submit
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}

function open( ctx ) {
	var lists = [ 'backlinks', 'embeddedin' ],
		query = {
			action: 'query',
			titles: ctx.page,
			prop: 'revisions|info|redirects',
			rvprop: 'content',
			rvslots: 'main',
			inprop: 'talkid|subjectid',
			rdprop: 'title',
			rdlimit: 'max',
			bltitle: ctx.page,
			bllimit: 'max',
			eititle: ctx.page,
			eilimit: 'max'
		};

	if ( ctx.ns === 6 ) {
		lists.push( 'imageusage' );
		query.iutitle = ctx.page;
		query.iulimit = 'max';
	}
	query.list = lists.join( '|' );

	$.when(
		ronda.api.get( query ),
		deleteReasons( ctx )
	).then( function ( res, groups ) {
		var data = res[ 0 ],
			page = data.query.pages[ 0 ];

		if ( page.missing ) {
			mw.notify( ronda.msg( 'admin-a-pagina-nao-existe-talvez-ja' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
			return;
		}

		page.backlinks = data.query.backlinks;
		page.embeddedin = data.query.embeddedin;
		page.imageusage = data.query.imageusage;

		if ( !groups.length ) {
			mw.notify( ronda.msg( 'admin-nao-foi-possivel-carregar-os-motivos' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
		}

		showForm( ctx, page, groups );
	}, ronda.fail );
}

ronda.registerModule( {
	id: 'eliminacao',
	admin: true,
	label: ronda.msg( 'admin-eliminar-botao' ),
	title: ronda.msg( 'admin-eliminar-esta-pagina' ),
	order: 30,
	isAvailable: function ( ctx ) {
		return ctx.ns >= 0
			&& ctx.ns !== 3 // discussões de usuário ficam de fora, como no FastButtonsEliminar
			&& ctx.exists
			&& ronda.isPageContext( ctx )
			&& ronda.can( 'delete' );
	},
	open: open
} );

}( window.ronda ) );

/**
 * Ronda — módulo Desligar (remoção de ligações afluentes)
 *
 * - Páginas: [[Alvo]] → Alvo; [[Alvo|texto]] → texto; [[Alvo#seção|texto]] → texto.
 * - Ficheiros: remove [[Ficheiro:X|…]] (com colchetes aninhados), linhas de
 *   <gallery> e comenta parâmetros de infocaixa (| imagem = X.jpg).
 *   [[:Ficheiro:X|texto]] vira texto.
 * - Edições em sequência, com barra de progresso (jQuery UI progressbar),
 *   usando mw.Api#edit (detecção de conflito nativa).
 * - Domínios: unlink.namespaces e, com unlink.currentNamespace, o da própria página.
 * Ligações vindas de predefinições não aparecem no texto e são relatadas.
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

/* ---------------- texto (funções puras) ---------------- */

/** Padrão que ignora maiúsculas/minúsculas e trata espaço = sublinhado */
function caseInsensitive( s ) {
	return s.split( '' ).map( function ( c ) {
		var u = c.toUpperCase(),
			l = c.toLowerCase();

		if ( c === '_' || c === ' ' ) {
			return '[ _]+';
		}
		return ( u !== l && u.length === 1 && l.length === 1 )
			? '[' + u + l + ']'
			: mw.util.escapeRegExp( c );
	} ).join( '' );
}

/** Título sem domínio; só a primeira letra é insensível a maiúsculas */
function titlePattern( title ) {
	var first = title.charAt( 0 ),
		rest = title.slice( 1 );

	return caseInsensitive( first ) + mw.util.escapeRegExp( rest ).replace( /[ _]+/g, '[ _]+' );
}

/** Todos os nomes e aliases do domínio (ex.: Ficheiro|Arquivo|Imagem|File|Image) */
function nsPattern( ns ) {
	var ids = mw.config.get( 'wgNamespaceIds' ),
		names = Object.keys( ids ).filter( function ( k ) {
			return ids[ k ] === ns && k !== '';
		} ).sort( function ( a, b ) {
			return b.length - a.length;
		} );

	return names.length ? '(?:' + names.map( caseInsensitive ).join( '|' ) + ')' : '';
}

/** Índice logo após o "]]" que fecha o "[[" em i, contando aninhamento */
function findClose( text, i ) {
	var depth = 0;

	while ( i < text.length ) {
		if ( text.substr( i, 2 ) === '[[' ) {
			depth++;
			i += 2;
		} else if ( text.substr( i, 2 ) === ']]' ) {
			depth--;
			i += 2;
			if ( depth === 0 ) {
				return i;
			}
		} else {
			i++;
		}
	}

	return -1;
}

function unlinkPage( text, ns, title ) {
	var prefix = ns === 0 ? '' : nsPattern( ns ) + '\\s*:\\s*',
		re = new RegExp(
			'\\[\\[\\s*:?\\s*(' + prefix + titlePattern( title ) + ')\\s*(?:#[^\\]|]*)?(?:\\|([^\\]]*))?\\]\\]',
			'g'
		);

	return text.replace( re, function ( m, target, label ) {
		return label ? label : target;
	} );
}

function unlinkFile( text, title ) {
	var m, end, out = '', last = 0,
		prefix = nsPattern( 6 ),
		name = titlePattern( title ),
		colonLink = new RegExp( '\\[\\[\\s*:\\s*(' + prefix + '\\s*:\\s*' + name + ')\\s*(?:\\|([^\\]]*))?\\]\\]', 'g' ),
		embed = new RegExp( '\\[\\[\\s*' + prefix + '\\s*:\\s*' + name + '\\s*(?=[|\\]])', 'g' ),
		galleryLine = new RegExp( '^\\s*(?:' + prefix + '\\s*:\\s*)?' + name + '\\s*(?:\\|.*)?$' ),
		param = new RegExp( '(\\|\\s*[^=|{}\\n]+?=\\s*)((?:' + prefix + '\\s*:\\s*)?' + name + ')(?=\\s*(?:\\||\\}\\}|\\n))', 'g' );

	// [[:Ficheiro:X|texto]] → texto
	text = text.replace( colonLink, function ( all, target, label ) {
		return label ? label : target;
	} );

	// [[Ficheiro:X|miniaturadaimagem|legenda com [[ligação]]]] → removido
	while ( ( m = embed.exec( text ) ) ) {
		end = findClose( text, m.index );
		if ( end === -1 ) {
			continue;
		}
		// Se a imagem ocupava a linha inteira, remove a quebra de linha também
		if ( ( m.index === 0 || text.charAt( m.index - 1 ) === '\n' ) && text.charAt( end ) === '\n' ) {
			end++;
		}
		out += text.slice( last, m.index );
		last = end;
		embed.lastIndex = end;
	}
	text = out + text.slice( last );

	// Linhas de <gallery>
	text = text.replace( /(<gallery[^>]*>)([\s\S]*?)(<\/gallery>)/gi, function ( all, open, body, close ) {
		return open + body.split( '\n' ).filter( function ( line ) {
			return !galleryLine.test( line );
		} ).join( '\n' ) + close;
	} );

	// | imagem = X.jpg → | imagem = <!-- X.jpg -->
	text = text.replace( param, '$1<!-- $2 -->' );

	return text;
}

function unlinkText( text, ns, title ) {
	return ns === 6 ? unlinkFile( text, title ) : unlinkPage( text, ns, title );
}

ronda.unlinkText = unlinkText; // exposto para testes e outros scripts

/**
 * Domínios do Desligar: os da configuração (texto "0|14" ou lista) e, com
 * unlink.currentNamespace, o da página desligada (ex.: predefinição → predefinições).
 */
function unlinkNamespaces( ctx ) {
	var cfg = ronda.config.unlink,
		list = ( Array.isArray( cfg.namespaces ) ? cfg.namespaces : String( cfg.namespaces ).split( /[|,\s]+/ ) )
			.map( function ( n ) {
				return String( n ).trim();
			} ).filter( function ( n ) {
				return /^\d+$/.test( n );
			} );

	if ( cfg.currentNamespace && ctx.ns >= 0 ) {
		list.push( String( ctx.ns ) );
	}
	return list.filter( function ( n, i ) {
		return list.indexOf( n ) === i;
	} ).join( '|' );
}

ronda.unlinkNamespaces = unlinkNamespaces;

/* ---------------- interface ---------------- */

function showDialog( ctx, titles, truncated, options ) {
	var $reason = ronda.ui.text( ( options && options.reason ) || '', ronda.msg( 'admin-motivo-opcional-vai-no-sumario' ) ),
		$list = $( '<div class="ronda-list ui-widget-content ui-corner-all"></div>' ),
		$all = $( '<input type="checkbox" class="ronda-native" checked>' ),
		$progress = $( '<div class="ronda-progress"></div>' ).hide(),
		$log = $( '<ul class="ronda-log"></ul>' ),
		$content = $( '<div></div>' ),
		$dlg;

	titles.forEach( function ( t ) {
		$( '<label></label>' ).append(
			$( '<input type="checkbox" class="ronda-native ronda-item" checked>' ).val( t ),
			' ',
			$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( t ) ).text( t )
		).appendTo( $list );
	} );

	$all.on( 'change', function () {
		$list.find( '.ronda-item' ).prop( 'checked', $all.prop( 'checked' ) );
	} );

	$content.append(
		ronda.ui.message( 'highlight', $( '<span></span>' ).text(
			titles.length + ( truncated ? '+' : '' ) + ronda.msg( 'admin-pagina-s-ligam-a' ) + ctx.page + '"'
			+ ronda.msg( 'admin-dominios' ) + unlinkNamespaces( ctx ) + ronda.msg( 'admin-revise-antes-de-continuar' )
		) ),
		ronda.ui.row( ronda.msg( 'core-motivo' ), $reason ),
		$( '<label></label>' ).append( $all, ronda.msg( 'admin-selecionar-todas' ) ),
		$list,
		$progress,
		$log
	);

	function log( type, html ) {
		$( '<li></li>' ).addClass( type ? 'ui-state-' + type : '' ).append( html ).appendTo( $log );
	}

	function run() {
		var selected = $list.find( '.ronda-item:checked' ).map( function () {
				return this.value;
			} ).get(),
			reason = $reason.val().trim(),
			summary = 'Desligar: ' + ( ctx.ns === 6 ? 'usos de [[:' : 'ligações para [[:' )
				+ ctx.page + ']] retirados' + ( reason ? ' — ' + reason : '' );

		if ( !selected.length ) {
			return;
		}

		ronda.ui.setBusy( $dlg, true );
		$list.find( 'input' ).prop( 'disabled', true );
		$progress.show().progressbar( { value: 0 } );

		ronda.sequence( selected, function ( title ) {
			return ronda.api.edit( title, function ( revision ) {
				var newText = unlinkText( revision.content, ctx.ns, ctx.title );

				if ( newText === revision.content ) {
					return $.Deferred().reject( 'ronda-nochange' ).promise();
				}

				return ronda.params( {
					text: newText,
					summary: summary,
					minor: true,
					watchlist: ronda.config.watchlist
				} );
			} );
		}, function ( done, total, result ) {
			var $link = $( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( result.item ) ).text( result.item );

			$progress.progressbar( 'value', Math.round( done / total * 100 ) );

			if ( result.ok ) {
				log( '', $link );
			} else if ( result.code === 'ronda-nochange' ) {
				log( 'highlight', [ $link, ronda.msg( 'admin-ligacao-nao-encontrada-no-texto-provavelmente' ) ] );
			} else {
				log( 'error', [ $link, ronda.msg( 'admin-erro', result.code ) ] );
			}
		} ).then( function ( results ) {
			var ok = results.filter( function ( r ) {
				return r.ok;
			} ).length;

			mw.notify( ronda.msg( 'admin-de-pagina-s-editada-s', ok, results.length ), {
				type: ok === results.length ? 'success' : 'warn',
				title: ronda.msg( 'core-nome' )
			} );

			// Troca o botão principal por "Fechar"
			$dlg.dialog( 'option', 'buttons', [ {
				text: ronda.msg( 'core-fechar' ),
				click: function () {
					ronda.ui.close( $dlg );
				}
			} ] );
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'admin-desligar-titulo', ctx.page ),
		width: 620,
		content: $content,
		buttons: [ {
			text: ronda.msg( 'admin-remover-ligacoes' ),
			'class': 'ui-priority-primary ui-button-red',
			click: run
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}

function open( ctx, options ) {
	var query = {
		action: 'query',
		list: 'backlinks',
		bltitle: ctx.page,
		blnamespace: unlinkNamespaces( ctx ),
		blfilterredir: 'nonredirects',
		bllimit: 'max'
	};

	if ( ctx.ns === 6 ) {
		query.list += '|imageusage';
		query.iutitle = ctx.page;
		query.iunamespace = unlinkNamespaces( ctx );
		query.iufilterredir = 'nonredirects';
		query.iulimit = 'max';
	}

	ronda.api.get( query ).then( function ( data ) {
		var seen = {},
			titles = [];

		( data.query.backlinks || [] ).concat( data.query.imageusage || [] ).forEach( function ( p ) {
			if ( !seen[ p.title ] && p.title !== ctx.page ) {
				seen[ p.title ] = true;
				titles.push( p.title );
			}
		} );

		if ( !titles.length ) {
			mw.notify( ronda.msg( 'admin-nenhuma-pagina-liga-a-esta-nos' ), { title: ronda.msg( 'core-nome' ) } );
			return;
		}

		showDialog( ctx, titles, !!data[ 'continue' ], options );
	}, ronda.fail );
}

ronda.registerModule( {
	id: 'desligar',
	admin: true,
	label: ronda.msg( 'admin-desligar-botao' ),
	title: ronda.msg( 'admin-remover-as-ligacoes-de-outras-paginas' ),
	order: 35,
	isAvailable: function ( ctx ) {
		return ctx.ns >= 0
			&& ctx.ns !== 14 // categorias: categorização não é ligação
			&& ronda.isPageContext( ctx )
			&& ronda.can( ronda.config.unlink.right );
	},
	open: open
} );

}( window.ronda ) );

/**
 * Ronda — módulo de proteção
 *
 * Para quem tem o direito "protect". Tipos e níveis vêm do próprio wiki
 * (meta=siteinfo&siprop=restrictions e prop=info&inprop=protection), e os
 * rótulos das mensagens nativas (restriction-*, protect-level-*, protect-default).
 * Motivos e durações: MediaWiki:Protect-dropdown e MediaWiki:Protect-expiry-options.
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

function msgOr( key, fallback ) {
	return mw.message( key ).exists() ? mw.message( key ).text() : fallback;
}

function levelLabel( level ) {
	return level ? msgOr( 'protect-level-' + level, level ) : msgOr( 'protect-default', ronda.msg( 'admin-todos-os-usuarios' ) );
}

/* Ícones de corrente (fechada = ligadas, aberta = separadas), na cor do texto */
var CHAIN = {
	on: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
		+ '<path d="M6.5 9.5l3-3"/><path d="M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2"/>'
		+ '<path d="M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.8"/></svg>',
	off: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
		+ '<path d="M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2"/>'
		+ '<path d="M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.8"/>'
		+ '<path d="M3 3l1.4 1.4M13 13l-1.4-1.4M6 1.8v1.4M10 14.2v-1.4"/></svg>'
};

/**
 * Liga as linhas de edição e de moção da tabela de proteção: com a corrente
 * fechada (padrão), mudar o nível ou a duração de uma muda a outra.
 */
function linkRows( a, b ) {
	var linked = true,
		$btn = $( '<button type="button" class="ronda-chain"></button>' );

	function copy( from, to ) {
		var v = from.$expiry.val();

		to.$level.val( from.$level.val() );
		if ( to.$expiry.find( 'option' ).filter( function () {
			return this.value === v;
		} ).length ) {
			to.$expiry.val( v );
		}
		to.$other.val( from.$other.val() ).toggle( to.$expiry.val() === 'other' );
	}

	function refresh() {
		$btn.button( 'option', 'label', linked ? CHAIN.on : CHAIN.off )
			.attr( 'title', linked
				? ronda.msg( 'admin-edicao-e-mocao-ligadas-mudar-uma' )
				: ronda.msg( 'admin-edicao-e-mocao-separadas-clique-para' ) )
			.attr( 'aria-pressed', String( linked ) );
	}

	[ [ a, b ], [ b, a ] ].forEach( function ( pair ) {
		pair[ 0 ].$level.add( pair[ 0 ].$expiry ).on( 'change', function () {
			if ( linked ) {
				copy( pair[ 0 ], pair[ 1 ] );
			}
		} );
		pair[ 0 ].$other.on( 'input', function () {
			if ( linked ) {
				pair[ 1 ].$other.val( pair[ 0 ].$other.val() );
			}
		} );
	} );

	$btn.button().on( 'click', function () {
		linked = !linked;
		if ( linked ) {
			copy( a, b );
		}
		refresh();
	} );
	refresh();
	return $btn;
}

function showForm( ctx, page, restrictions, reasonGroups ) {
	var types = page.restrictiontypes || ( ctx.exists ? [ 'edit', 'move' ] : [ 'create' ] ),
		levels = [ '' ].concat( restrictions.levels.filter( function ( l ) {
			return l !== '';
		} ) ),
		current = {},
		rows = {},
		$table = $( '<table class="wikitable"></table>' ).append(
			$( '<tr></tr>' ).append(
				$( '<th></th>' ).text( ronda.msg( 'admin-acao' ) ),
				$( '<th></th>' ).text( ronda.msg( 'admin-nivel' ) ),
				$( '<th></th>' ).text( ronda.msg( 'admin-duracao' ) )
			)
		),
		reasonFields = ronda.ui.reasonFields( 'protect-dropdown', ctx, reasonGroups ),
		$content = $( '<div></div>' ),
		cbCascade, $dlg;

	( page.protection || [] ).forEach( function ( p ) {
		if ( !p.source ) { // ignora proteção herdada em cascata
			current[ p.type ] = p;
		}
	} );

	if ( Object.keys( current ).length ) {
		$content.append( ronda.ui.message( 'highlight', $( '<span></span>' ).text(
			ronda.msg( 'admin-protecao-atual', Object.keys( current ).map( function ( t ) {
				return msgOr( 'restriction-' + t, t ) + ' = ' + levelLabel( current[ t ].level )
					+ ' (expira: ' + current[ t ].expiry + ')';
			} ).join( '; ' ) )
		) ) );
	}

	types.forEach( function ( type ) {
		var cur = current[ type ],
			$level = $( '<select></select>' ),
			$expiry = ronda.ui.expirySelect(
				'protect-expiry-options',
				cur ? [ { value: 'existing', label: ronda.msg( 'admin-manter', cur.expiry ) } ] : []
			),
			$other = ronda.ui.text( '', ronda.msg( 'admin-ex-2-weeks' ) ).hide();

		levels.forEach( function ( l ) {
			$( '<option></option>' ).val( l ).text( levelLabel( l ) ).appendTo( $level );
		} );
		$level.val( cur ? cur.level : '' );

		ronda.ui.onChange( $expiry, function () {
			$other.toggle( $expiry.val() === 'other' );
		} );

		rows[ type ] = { $level: $level, $expiry: $expiry, $other: $other, current: cur };

		rows[ type ].$tr = $( '<tr></tr>' ).append(
			$( '<td></td>' ).text( msgOr( 'restriction-' + type, type ) ),
			$( '<td></td>' ).append( $level ),
			$( '<td></td>' ).append( $expiry, $other )
		).appendTo( $table );
	} );

	// Corrente entre edição e moção (linhas vizinhas), já ligada
	if ( rows.edit && rows.move && rows.edit.$tr.next()[ 0 ] === rows.move.$tr[ 0 ] ) {
		$table.find( 'tr' ).first().append( $( '<th></th>' ) );
		$.each( rows, function ( type, row ) {
			if ( type === 'edit' ) {
				row.$tr.append( $( '<td class="ronda-chain-cell" rowspan="2"></td>' ).append( linkRows( rows.edit, rows.move ) ) );
			} else if ( type !== 'move' ) {
				row.$tr.append( $( '<td></td>' ) );
			}
		} );
	}

	$content.append(
		$table,
		reasonFields.$element
	);

	if ( rows.edit ) {
		cbCascade = ronda.ui.checkbox(
			ronda.msg( 'admin-protecao-em-cascata-protege-as-paginas' ),
			!!( current.edit && page.protection.some( function ( p ) {
				return p.type === 'edit' && p.cascade;
			} ) )
		);
		$content.append( cbCascade.$element );
	}

	function submit() {
		var protections = [],
			expiries = [],
			ok = true,
			reason = reasonFields.value(),
			cascade = false;

		$.each( rows, function ( type, row ) {
			var level = row.$level.val(),
				expiry = row.$expiry.val() === 'existing'
					? row.current.expiry
					: ronda.ui.expiryValue( row.$expiry, row.$other );

			if ( level ) {
				ok = ronda.ui.require( row.$other, !!expiry ) && ok;
			}

			protections.push( type + '=' + ( level || 'all' ) );
			expiries.push( level ? expiry : 'infinite' );
		} );

		ok = ronda.ui.require( reasonFields.$extra, !!reason ) && ok;
		if ( !ok ) {
			return;
		}

		if ( cbCascade && cbCascade.isChecked() ) {
			cascade = restrictions.cascadinglevels.indexOf( rows.edit.$level.val() ) !== -1;
			if ( !cascade ) {
				mw.notify(
					ronda.msg( 'admin-a-cascata-exige-um-destes-niveis', restrictions.cascadinglevels.map( levelLabel ).join( ', ' ) ),
					{ type: 'warn', title: ronda.msg( 'core-nome' ) }
				);
				return;
			}
		}

		ronda.ui.setBusy( $dlg, true );
		ronda.post( {
			action: 'protect',
			title: ctx.page,
			protections: protections.join( '|' ),
			expiry: expiries.join( '|' ),
			reason: reason,
			cascade: cascade
		} ).then( function () {
			mw.notify( ronda.msg( 'admin-protecao-aplicada' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
			ronda.ui.close( $dlg );
			location.reload();
		}, function ( code, data ) {
			ronda.ui.setBusy( $dlg, false );
			ronda.fail( code, data );
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'admin-proteger-titulo', ctx.page ),
		width: 600,
		content: $content,
		buttons: [ {
			text: ronda.msg( 'admin-proteger-botao' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: submit
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}

function open( ctx ) {
	ronda.api.get( {
		action: 'query',
		meta: 'siteinfo',
		siprop: 'restrictions',
		titles: ctx.page,
		prop: 'info',
		inprop: 'protection'
	} ).then( function ( data ) {
		var restrictions = data.query.restrictions,
			page = data.query.pages[ 0 ],
			keys = [ 'protect-expiry-options', 'protect-default' ];

		restrictions.types.forEach( function ( t ) {
			keys.push( 'restriction-' + t );
		} );
		restrictions.levels.forEach( function ( l ) {
			if ( l ) {
				keys.push( 'protect-level-' + l );
			}
		} );

		return $.when(
			ronda.reasons( 'protect-dropdown', ctx ),
			ronda.loadMessages( keys )
		).then( function ( reasonGroups ) {
			showForm( ctx, page, restrictions, reasonGroups );
		} );
	} ).then( null, ronda.fail );
}

ronda.registerModule( {
	id: 'protecao',
	admin: true,
	label: ronda.msg( 'admin-proteger-botao' ),
	title: ronda.msg( 'admin-alterar-a-protecao-desta-pagina' ),
	order: 45,
	isAvailable: function ( ctx ) {
		return ctx.ns >= 0
			&& ronda.isPageContext( ctx )
			&& ronda.can( 'protect' );
	},
	open: open
} );

}( window.ronda ) );

/**
 * Ronda — módulo de bloqueio
 *
 * Disponível onde há um usuário-alvo (diff, reversão, página/discussão de
 * usuário, contribuições) para quem tem o direito "block".
 * Motivos e durações: MediaWiki:Ipbreason-dropdown e MediaWiki:Ipboptions.
 * Notificação: {{Bloqueado}}, {{Bloqueado-disc}} e {{Bloqueado parcial}} pelo módulo
 * mw.libs.blockNotificationButton (config.blockNotification); CPV e proxy pelo Ronda.
 */
/* jshint laxbreak: true */
/* global mw, $ */
( function ( ronda ) {
'use strict';

var TEMPLATES = [
	{ id: '', label: ronda.msg( 'admin-nao-notificar' ) },
	{ id: 'bloqueado', label: ronda.msg( 'admin-bloqueado-sem-acesso-a-discussao' ) },
	{ id: 'bloqueado-disc', label: ronda.msg( 'admin-bloqueado-disc-com-acesso-a-discussao' ) },
	{ id: 'bloqueado-CPV', label: ronda.msg( 'admin-bloqueado-cpv-conta-para-vandalismo' ), noParams: true },
	{ id: 'proxy', label: ronda.msg( 'admin-proxy' ), noParams: true }
];

function sameTarget( a, b ) {
	return String( a ).toUpperCase() === String( b ).toUpperCase();
}

/* ---------------- Reversores ---------------- */
/*
 * Na pt.wiki, reversores podem bloquear, com limites (os mesmos do gadget
 * validateBlockRollbackers): só contas não confirmadas e IPs, por no máximo
 * 24 horas, por vandalismo, sem bloqueio parcial e sem impedir a criação de contas.
 * Fora disso, o bloqueio é considerado abuso da ferramenta.
 */
var MAX_ROLLBACKER_SECONDS = 24 * 60 * 60,
	UNIT_SECONDS = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2592000, year: 31536000 };

/** O usuário atual bloqueia com os limites de reversor (pode bloquear, mas não é administrador) */
function isLimitedBlocker() {
	return ronda.can( 'block' ) && ( mw.config.get( 'wgUserGroups' ) || [] ).indexOf( 'sysop' ) === -1;
}

/** Duração em segundos de um valor de ipboptions ("2 hours", "1 day"); Infinity se não for uma duração fixa */
function expirySeconds( value ) {
	var m = /^(\d+(?:\.\d+)?)\s*(second|minute|hour|day|week|month|year)s?$/i.exec( String( value || '' ).trim() );

	return m ? Number( m[ 1 ] ) * UNIT_SECONDS[ m[ 2 ].toLowerCase() ] : Infinity;
}

/** Motivos permitidos a reversores: os de vandalismo (ou, se não houver, o primeiro grupo do menu) */
function rollbackerReasons( groups ) {
	var out = ( groups || [] ).map( function ( g ) {
		return $.extend( {}, g, { options: ( g.options || [] ).filter( function ( o ) {
			return /vandal/i.test( o.label + ' ' + o.value );
		} ) } );
	} ).filter( function ( g ) {
		return g.options.length;
	} );

	return out.length ? out : ( groups || [] ).slice( 0, 1 );
}

ronda.blockLimits = { isLimitedBlocker: isLimitedBlocker, expirySeconds: expirySeconds, rollbackerReasons: rollbackerReasons };

/**
 * API do módulo de notificação de bloqueio (mw.libs.blockNotificationButton),
 * carregada do gadget ou, se ele não existir, da página do módulo.
 * @return {jQuery.Promise} resolve com a API ou rejeita
 */
function blockNotificationApi() {
	var cfg = ronda.config.blockNotification || {};

	function current() {
		return mw.libs && mw.libs.blockNotificationButton && mw.libs.blockNotificationButton.api;
	}

	if ( current() ) {
		return $.Deferred().resolve( current() ).promise();
	}
	return ( cfg.gadget && mw.loader.getState( cfg.gadget ) ? mw.loader.using( cfg.gadget )
		: $.Deferred().reject().promise() ).then( null, function () {
		return cfg.page ? mw.loader.getScript( mw.util.getUrl( cfg.page, { action: 'raw', ctype: 'text/javascript' } ) )
			: $.Deferred().reject().promise();
	} ).then( function () {
		return current() || $.Deferred().reject( 'ronda-bnb' ).promise();
	} );
}

/**
 * Notificação de bloqueio na discussão do usuário. {{Bloqueado}}, {{Bloqueado-disc}} e
 * {{Bloqueado parcial}} vão pelo módulo da comunidade; os demais modelos (CPV, proxy),
 * ou se o módulo não carregar, numa seção nova feita pelo próprio Ronda.
 */
function notifyBlock( user, tpl, expiryLabel, reason, partial ) {
	var data = {
		user: user,
		reason: reason,
		duration: expiryLabel,
		partial: partial,
		allowusertalk: tpl.id === 'bloqueado-disc',
		watchlist: ronda.config.watchlist
	};

	function own() {
		return ronda.notifyUser(
			user,
			'Notificação de bloqueio',
			'{{subst:' + tpl.id + ( tpl.noParams
				? ''
				: '|1=' + ronda.templateSafe( expiryLabel ) + '|2=' + ronda.templateSafe( reason )
			) + '}} ~~' + '~~',
			'Notificação de bloqueio'
		);
	}

	if ( tpl.noParams ) {
		return own();
	}
	if ( ronda.config.dryRun ) {
		// eslint-disable-next-line no-console
		console.log( '[Ronda] SIMULAÇÃO — notificação de bloqueio pelo módulo blockNotificationButton', data );
		mw.notify( ronda.msg( 'admin-simulacao-notificacao-de-bloqueio-de-nada', user ), { title: ronda.msg( 'core-nome' ), type: 'warn' } );
		return $.Deferred().resolve().promise();
	}
	return blockNotificationApi().then( function ( bnb ) {
		return $.Deferred( function ( d ) {
			bnb.send( data ).then( d.resolve, function ( err ) {
				d.reject( err && err.message ? err.message : 'ronda-bnb' );
			} );
		} ).promise();
	}, function () {
		// eslint-disable-next-line no-console
		console.warn( '[Ronda] Módulo blockNotificationButton indisponível; notificação feita pelo Ronda.' );
		return own();
	} );
}

function showForm( ctx, user, isIP, blocks, reasonGroups ) {
	var limited = isLimitedBlocker(),
		// Bloqueios do próprio alvo (com multibloqueios, pode haver mais de um)
		own = blocks.filter( function ( b ) {
			return sameTarget( b.user, user );
		} ),
		me = mw.config.get( 'wgUserName' ),
		// Reversores só alteram os próprios bloqueios: sem um deles, o formulário começa como bloqueio novo
		current = limited ? own.filter( function ( b ) {
			return b.by === me;
		} )[ 0 ] || null : own[ 0 ],
		removing = null,
		$mode = $( '<select></select>' ),
		$editArea = $( '<div></div>' ),
		$unblockReason = ronda.ui.text( '', ronda.msg( 'admin-desbloqueio-motivo-exemplo' ) ),
		$unblockArea = $( '<div></div>' ).append( ronda.ui.row( ronda.msg( 'admin-desbloqueio-motivo' ), $unblockReason ) ).hide(),
		covering = blocks.filter( function ( b ) {
			return !sameTarget( b.user, user );
		} ),
		restr = restrictionsOf( current ),
		$expiry = ronda.ui.expirySelect( 'ipboptions' ),
		$expiryOther = ronda.ui.text( '', ronda.msg( 'admin-ex-3-days-2027-01-01' ) ),
		reasonFields = limited
			? ronda.ui.reasonFields( function ( refresh ) {
				return ronda.reasons( 'ipbreason-dropdown', null, refresh ).then( rollbackerReasons );
			}, null, rollbackerReasons( reasonGroups ) )
			: ronda.ui.reasonFields( 'ipbreason-dropdown', null, reasonGroups ),
		$pages = ronda.ui.text(
			( restr.pages || [] ).map( function ( p ) {
				return p.title;
			} ).join( '|' ),
			ronda.msg( 'admin-pagina-1-pagina-2-ate-10' )
		),
		$namespaces = ronda.ui.text( ( restr.namespaces || [] ).join( '|' ), ronda.msg( 'admin-numeros-dos-dominios-ex-0-10' ) ),
		$template = $( '<select></select>' ),
		flags = {},
		// Todas as opções são restrições ("Impedir…"); aqui, o parâmetro da API é o contrário
		INVERTED = { anononly: true, allowusertalk: true },
		$partialBox, $otherRow, $content, $dlg;

	function restrictionsOf( b ) {
		return ( b && b.restrictions && !Array.isArray( b.restrictions ) ) ? b.restrictions : {};
	}

	function val( flag, def ) {
		return current ? !!current[ flag ] : def;
	}

	/** Preenche as opções com as do bloqueio escolhido (ou os padrões, para um bloqueio novo) */
	function fill() {
		var r = restrictionsOf( current );

		if ( flags.nocreate ) {
			flags.nocreate.setChecked( val( 'nocreate', true ) );
		}
		if ( flags.anononly ) {
			flags.anononly.setChecked( !val( 'anononly', true ) );
		}
		if ( flags.autoblock ) {
			flags.autoblock.setChecked( val( 'autoblock', true ) );
		}
		flags.noemail.setChecked( val( 'noemail', false ) );
		flags.allowusertalk.setChecked( !val( 'allowusertalk', true ) );
		if ( flags.hidename ) {
			flags.hidename.setChecked( val( 'hidden', false ) );
		}
		flags.partial.setChecked( !limited && val( 'partial', false ) );
		$pages.val( ( r.pages || [] ).map( function ( p ) {
			return p.title;
		} ).join( '|' ) );
		$namespaces.val( ( r.namespaces || [] ).join( '|' ) );
		$partialBox.toggle( flags.partial.isChecked() );
		flags.allowusertalk.$input.trigger( 'change' );
	}

	/** Título e botão conforme a escolha: alterar um bloqueio ou criar outro */
	/** Escolha do menu "O que fazer": "edit:<id>", "unblock:<id>" ou "new" */
	function refreshMode() {
		var parts = String( $mode.val() || 'new' ).split( ':' ),
			block = parts[ 1 ] ? own.filter( function ( b ) {
				return String( b.id ) === parts[ 1 ];
			} )[ 0 ] : null,
			label;

		current = parts[ 0 ] === 'edit' ? block : null;
		removing = parts[ 0 ] === 'unblock' ? block : null;
		$editArea.toggle( !removing );
		$unblockArea.toggle( !!removing );
		if ( !removing ) {
			fill();
		}
		label = removing ? ronda.msg( 'admin-desbloquear' )
			: current ? ronda.msg( 'admin-alterar-bloqueio' )
				: own.length ? ronda.msg( 'admin-multibloqueio-adicionar' ) : ronda.msg( 'admin-bloquear-botao' );
		if ( $dlg ) {
			$dlg.dialog( 'option', 'title', ( removing ? ronda.msg( 'admin-desbloquear-titulo' )
				: current ? ronda.msg( 'admin-alterar-bloqueio-de' ) : ronda.msg( 'admin-bloquear-titulo' ) ) + user );
			$dlg.dialog( 'widget' ).find( '.ui-dialog-buttonpane button' ).first().button( 'option', 'label', label );
		}
	}

	function blockLine( b ) {
		return ronda.msg( 'admin-multibloqueio-descricao',
			'#' + b.id,
			b.partial ? ronda.msg( 'admin-multibloqueio-parcial' ) : ronda.msg( 'admin-multibloqueio-total' ),
			b.by, /^infinit/.test( b.expiry ) ? ronda.msg( 'admin-multibloqueio-sem-prazo' )
				: new Date( b.expiry ).toLocaleString( 'pt-BR', { dateStyle: 'short', timeStyle: 'short' } ),
			b.reason || '—' );
	}

	if ( !limited ) {
		flags.nocreate = ronda.ui.checkbox( ronda.msg( 'admin-impedir-a-criacao-de-contas' ), val( 'nocreate', true ) );
	}
	if ( isIP ) {
		flags.anononly = ronda.ui.checkbox( ronda.msg( 'admin-impedir-tambem-as-contas-registradas-que' ), !val( 'anononly', true ) );
	} else {
		flags.autoblock = ronda.ui.checkbox( ronda.msg( 'admin-impedir-a-edicao-pelos-ips-usados' ), val( 'autoblock', true ) );
	}
	flags.noemail = ronda.ui.checkbox( ronda.msg( 'admin-impedir-o-envio-de-e-mail' ), val( 'noemail', false ) );
	flags.allowusertalk = ronda.ui.checkbox( ronda.msg( 'admin-impedir-a-edicao-da-propria-pagina' ), !val( 'allowusertalk', true ) );
	if ( !isIP && ronda.can( 'hideuser' ) ) {
		flags.hidename = ronda.ui.checkbox( ronda.msg( 'admin-ocultar-o-nome-de-usuario' ), val( 'hidden', false ) );
	}
	flags.partial = ronda.ui.checkbox( ronda.msg( 'patrulha-bloqueio-parcial' ), !limited && val( 'partial', false ) );

	if ( limited ) {
		// Só durações de até 24 horas; sem "indefinido", sem duração livre, sem bloqueio parcial
		$expiry.children( 'option' ).filter( function () {
			return expirySeconds( this.value ) > MAX_ROLLBACKER_SECONDS;
		} ).remove();
		flags.partial.$element.hide();
		// Só os motivos do menu: sem "Outro motivo" nem texto livre
		reasonFields.$select.children( 'option[value=""]' ).remove();
		reasonFields.$extra.val( '' ).closest( '.ronda-row' ).hide();
	}

	TEMPLATES.forEach( function ( t ) {
		$( '<option></option>' ).val( t.id ).text( t.label ).appendTo( $template );
	} );
	$template.val( flags.allowusertalk.isChecked() ? 'bloqueado' : 'bloqueado-disc' );

	$otherRow = ronda.ui.row( ronda.msg( 'admin-outra-duracao' ), $expiryOther ).hide();
	$partialBox = $( '<div></div>' ).append(
		ronda.ui.row( ronda.msg( 'admin-paginas' ), $pages ),
		ronda.ui.row( ronda.msg( 'admin-dominios-rotulo' ), $namespaces )
	).toggle( flags.partial.isChecked() );

	$content = $( '<div></div>' );

	if ( limited ) {
		$content.append( ronda.ui.message( 'highlight', ronda.msg( 'admin-reversor-limites' ) ) );
	}

	// Já bloqueado: alterar ou remover um dos bloqueios atuais, ou acrescentar outro (multibloqueio).
	// Reversores só alteram e removem bloqueios feitos por eles mesmos; nos demais, só acrescentam.
	if ( own.length ) {
		$( '<optgroup></optgroup>' ).attr( 'label', ronda.msg( 'admin-multibloqueio-grupo-alterar' ) ).append( own.filter( function ( b ) {
			return !limited || b.by === me;
		} ).map( function ( b ) {
			return $( '<option></option>' ).val( 'edit:' + b.id ).text( ronda.msg( 'admin-multibloqueio-alterar', blockLine( b ) ) );
		} ) ).appendTo( $mode );
		$( '<option value="new"></option>' ).text( ronda.msg( 'admin-multibloqueio-novo', own.length ) ).appendTo( $mode );
		$( '<optgroup></optgroup>' ).attr( 'label', ronda.msg( 'admin-multibloqueio-grupo-remover' ) ).append( own.filter( function ( b ) {
			return !limited || b.by === me;
		} ).map( function ( b ) {
			return $( '<option></option>' ).val( 'unblock:' + b.id ).text( ronda.msg( 'admin-multibloqueio-remover', blockLine( b ) ) );
		} ) ).appendTo( $mode );
		$mode.children( 'optgroup:empty' ).remove();
		$content.append(
			ronda.ui.message( 'highlight', ronda.msg( 'admin-multibloqueio-info', own.length ) ),
			ronda.ui.row( ronda.msg( 'admin-multibloqueio-escolha' ), $mode )
		);
	}

	if ( covering.length ) {
		$content.append( ronda.ui.message( 'highlight', $( '<span></span>' ).text(
			ronda.msg( 'admin-ja-coberto-por-bloqueio-de-intervalo', covering.map( function ( b ) {
				return b.user + ' (expira: ' + b.expiry + ')';
			} ).join( ', ' ) )
		) ) );
	}

	$content.append(
		ronda.ui.row( ronda.msg( 'admin-alvo' ), $( '<span></span>' ).text( user ) ),
		$unblockArea,
		$editArea
	);
	$editArea.append(
		ronda.ui.row( ronda.msg( 'admin-duracao' ), $expiry ),
		$otherRow,
		reasonFields.$element,
		$( '<fieldset class="ui-widget-content ui-corner-all"></fieldset>' ).append(
			$( '<legend></legend>' ).text( ronda.msg( 'admin-opcoes' ) ),
			$.map( flags, function ( cb ) {
				return cb.$element;
			} ),
			$partialBox
		),
		ronda.ui.row( ronda.msg( 'admin-notificar-o-usuario' ), $template )
	);

	function unblock() {
		ronda.ui.setBusy( $dlg, true );
		ronda.post( { action: 'unblock', id: removing.id, reason: $unblockReason.val().trim() } ).then( function () {
			mw.notify( $( '<span></span>' ).append(
				document.createTextNode( ronda.msg( 'admin-desbloqueado', removing.id, user ) ),
				$( '<a></a>' ).attr( 'href', mw.util.getUrl( 'Special:Log/block', { page: 'User:' + user } ) ).text( ronda.msg( 'admin-ver-registro' ) )
			), { type: 'success', title: ronda.msg( 'core-nome' ) } );
			ronda.ui.close( $dlg );
		}, function ( code, data ) {
			ronda.ui.setBusy( $dlg, false );
			ronda.fail( code, data );
		} );
	}

	function submit() {
		var params, expiry, expiryLabel, reason, tpl, ok;

		if ( removing ) {
			unblock();
			return;
		}

		expiry = ronda.ui.expiryValue( $expiry, $expiryOther );
		expiryLabel = ronda.ui.expiryLabel( $expiry, $expiryOther );
		reason = reasonFields.value();

		ok = ronda.ui.require( $expiryOther, !!expiry );
		ok = ronda.ui.require( limited ? reasonFields.$select : reasonFields.$extra, !!reason ) && ok;
		if ( limited && expirySeconds( expiry ) > MAX_ROLLBACKER_SECONDS ) {
			ok = false;
		}
		if ( flags.partial.isChecked() ) {
			ok = ronda.ui.require( $pages, !!( $pages.val().trim() || $namespaces.val().trim() ) ) && ok;
		}
		if ( !ok ) {
			return;
		}

		params = {
			action: 'block',
			expiry: expiry,
			reason: reason
		};
		if ( current && limited && current.by !== me ) {
			// Salvaguarda: o menu já não oferece isso
			mw.notify( ronda.msg( 'admin-reversor-so-altera-os-proprios' ), { type: 'error', title: ronda.msg( 'core-nome' ) } );
			return;
		}
		if ( current ) {
			// Altera exatamente o bloqueio escolhido (id não combina com user, reblock nem newblock)
			params.id = current.id;
		} else {
			params.user = user;
			if ( own.length ) {
				params.newblock = true;
			}
		}

		$.each( flags, function ( name, cb ) {
			if ( name !== 'partial' ) {
				params[ name ] = INVERTED[ name ] ? !cb.isChecked() : cb.isChecked();
			}
		} );

		if ( flags.partial.isChecked() ) {
			params.partial = true;
			params.pagerestrictions = $pages.val().trim();
			params.namespacerestrictions = $namespaces.val().trim();
		}

		tpl = TEMPLATES.filter( function ( t ) {
			return t.id === $template.val();
		} )[ 0 ];

		ronda.ui.setBusy( $dlg, true );
		ronda.post( params ).then( function () {
			mw.notify( $( '<span></span>' ).append(
				document.createTextNode( ronda.msg( 'admin-foi-bloqueado', user ) ),
				$( '<a></a>' ).attr( 'href', mw.util.getUrl( 'Special:Log/block', { page: 'User:' + user } ) ).text( ronda.msg( 'admin-ver-registro' ) )
			), { type: 'success', title: ronda.msg( 'core-nome' ) } );

			if ( !tpl || !tpl.id ) {
				return;
			}

			return notifyBlock( user, tpl, expiryLabel, reason, !!params.partial ).then( function () {
				mw.notify( ronda.msg( 'admin-usuario-notificado' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
			} );
		} ).then( function () {
			ronda.ui.close( $dlg );
		}, function ( code, data ) {
			ronda.ui.setBusy( $dlg, false );
			ronda.fail( code, data );
		} );
	}

	$dlg = ronda.ui.dialog( {
		title: ( current ? ronda.msg( 'admin-alterar-bloqueio-de' ) : ronda.msg( 'admin-bloquear-titulo' ) ) + user,
		content: $content,
		buttons: [ {
			text: current ? ronda.msg( 'admin-alterar-bloqueio' ) : ronda.msg( 'admin-bloquear-botao' ),
			'class': 'ui-priority-primary ui-button-red',
			click: submit
		}, {
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );

	ronda.ui.onChange( $expiry, function () {
		$otherRow.toggle( $expiry.val() === 'other' );
	} );

	ronda.ui.onChange( $mode, refreshMode );

	flags.partial.$input.on( 'change', function () {
		$partialBox.toggle( flags.partial.isChecked() );
	} );

	flags.allowusertalk.$input.on( 'change', function () {
		if ( $template.val() === 'bloqueado' || $template.val() === 'bloqueado-disc' ) {
			$template.val( flags.allowusertalk.isChecked() ? 'bloqueado' : 'bloqueado-disc' );
			ronda.ui.refreshSelect( $template );
		}
	} );
}

/** Reversor diante de uma conta confirmada: explica e oferece notificar vandalismo ou incidente */
function refuseConfirmed( ctx, user ) {
	var pedido = ronda.getModule( 'pedido' ),
		$dlg;

	function request( type ) {
		ronda.ui.close( $dlg );
		pedido.open( ctx, { type: type, target: user } );
	}

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'admin-bloquear-titulo' ) + user,
		content: $( '<div></div>' ).append( ronda.ui.message( 'error', ronda.msg( 'admin-reversor-confirmado', user ) ) ),
		buttons: ( pedido && ronda.can( 'edit' ) ? [ {
			text: ronda.msg( 'admin-reversor-notificar-vandalismo' ),
			'class': 'ui-priority-primary ui-button-blue',
			click: function () {
				request( 'vandalismo' );
			}
		}, {
			text: ronda.msg( 'admin-reversor-notificar-incidente' ),
			click: function () {
				request( 'incidente' );
			}
		} ] : [] ).concat( [ {
			text: ronda.msg( 'core-fechar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ] )
	} );
}

function open( ctx ) {
	var user = ctx.targetUser,
		isIP = mw.util.isIPAddress( user, true ),
		query = {
			action: 'query',
			list: 'blocks',
			bkprop: 'id|user|by|expiry|reason|flags|restrictions'
		};

	query[ isIP ? 'bkip' : 'bkusers' ] = user;

	// Reversores não bloqueiam contas confirmadas (autoconfirmadas ou confirmadas manualmente)
	if ( isLimitedBlocker() && !isIP ) {
		query.list += '|users';
		query.ususers = user;
		query.usprop = 'groups';
	}

	$.when(
		ronda.api.get( query ),
		ronda.reasons( 'ipbreason-dropdown', null ),
		ronda.loadMessages( [ 'ipboptions' ] )
	).then( function ( res, reasonGroups ) {
		var q = res[ 0 ].query || {},
			groups = ( ( q.users || [] )[ 0 ] || {} ).groups || [];

		if ( groups.indexOf( 'autoconfirmed' ) !== -1 || groups.indexOf( 'confirmed' ) !== -1 ) {
			refuseConfirmed( ctx, user );
			return;
		}
		showForm( ctx, user, isIP, q.blocks || [], reasonGroups );
	}, ronda.fail );
}

ronda.registerModule( {
	id: 'bloqueio',
	admin: true,
	label: ronda.msg( 'admin-bloquear-botao' ),
	title: ronda.msg( 'admin-bloquear-este-usuario-ou-ip' ),
	order: 40,
	isAvailable: function ( ctx ) {
		return !!ctx.targetUser
			&& ronda.can( 'block' )
			&& ctx.targetUser !== mw.config.get( 'wgUserName' );
	},
	open: open
} );

}( window.ronda ) );

/* ================================================================== *
 * Restaurar (página eliminada) e Lote (eliminar, restaurar ou proteger
 * várias páginas de uma vez), como os módulos do Twinkle. No Lote, cada ação
 * usa o seu menu de motivos; o de eliminação junta os de todos os domínios.
 * ================================================================== */
( function ( ronda ) {
'use strict';

function msgOr( key, fallback ) {
	return mw.message( key ).exists() ? mw.message( key ).text() : fallback;
}

function apiError( code, info ) {
	return ( info && typeof info === 'object' && ronda.api.getErrorMessage ) ? ronda.api.getErrorMessage( info ).text() : code;
}

/* ---------------- Funções puras ---------------- */

/** Títulos de uma lista digitada: um por linha, sem [[ ]], sem repetições */
function parseTitles( text ) {
	var seen = {};

	return String( text || '' ).split( '\n' ).map( function ( l ) {
		return l.replace( /^\s*\*?\s*\[\[:?/, '' ).replace( /(\|[^\]]*)?\]\]\s*$/, '' ).replace( /_/g, ' ' ).trim();
	} ).filter( function ( t ) {
		if ( !t || seen[ t ] ) {
			return false;
		}
		seen[ t ] = true;
		return true;
	} );
}

ronda.batch = { parseTitles: parseTitles };

/* ---------------- Restaurar ---------------- */

function openUndelete( ctx ) {
	$.when(
		ronda.api.get( {
			action: 'query',
			titles: ctx.page,
			prop: 'deletedrevisions',
			drvprop: 'ids|timestamp|user',
			drvlimit: 'max',
			list: 'logevents',
			letype: 'delete',
			letitle: ctx.page,
			lelimit: 1
		} ).then( function ( d ) {
			return d;
		} ),
		ronda.reasons( 'undelete-comment-dropdown', null ).then( null, function () {
			return $.Deferred().resolve( [] ).promise();
		} )
	).then( function ( data, groups ) {
		var page = ( data.query.pages || [] )[ 0 ] || {},
			revs = page.deletedrevisions || [],
			log = ( data.query.logevents || [] )[ 0 ],
			names = mw.config.get( 'wgFormattedNamespaces' ),
			hasTalk = ctx.ns % 2 === 0 && names[ ctx.ns + 1 ] !== undefined,
			reasonFields = groups.length ? ronda.ui.reasonFields( 'undelete-comment-dropdown', null, groups ) : null,
			$reason = reasonFields ? reasonFields.$extra : ronda.ui.text( '', ronda.msg( 'core-motivo' ) ),
			cbTalk = hasTalk ? ronda.ui.checkbox( ronda.msg( 'admin-restaurar-tambem-a-pagina-de-discussao' ), ctx.ns !== 2 ) : null,
			$dlg;

		if ( !revs.length ) {
			mw.notify( ronda.msg( 'admin-nao-ha-edicoes-eliminadas-desta-pagina' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
			return;
		}

		function submit() {
			var reason = reasonFields ? reasonFields.value() : $reason.val().trim();

			ronda.ui.setBusy( $dlg, true );
			ronda.post( $.extend( {
				action: 'undelete',
				title: ctx.page,
				reason: reason,
				watchlist: ronda.config.watchlist
			}, cbTalk && cbTalk.isChecked() ? { undeletetalk: true } : {} ) ).then( function () {
				mw.notify( ronda.msg( 'admin-pagina-restaurada' ), { type: 'success', title: ronda.msg( 'core-nome' ) } );
				location.href = mw.util.getUrl( ctx.page );
			}, function ( code, info ) {
				ronda.ui.setBusy( $dlg, false );
				ronda.fail( code, info );
			} );
		}

		$dlg = ronda.ui.dialog( {
			title: ronda.msg( 'admin-restaurar-titulo', ctx.page ),
			width: 560,
			content: $( '<div></div>' ).append(
				ronda.ui.message( 'highlight', $( '<span></span>' ).append(
					document.createTextNode( revs.length + ( revs.length >= 500 ? '+' : '' ) + ronda.msg( 'admin-edicao-oes-eliminada-s' ) ),
					log ? document.createTextNode( ronda.msg( 'admin-eliminada-em-por', new Date( log.timestamp ).toLocaleString( 'pt-BR' ), log.user, log.comment ? ' — ' + log.comment : '' ) ) : '',
					document.createTextNode( '. ' ),
					$( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( 'Special:Undelete/' + ctx.page ) ).text( ronda.msg( 'admin-escolher-edicoes' ) )
				) ),
				reasonFields ? reasonFields.$element : ronda.ui.row( ronda.msg( 'core-motivo' ), $reason ),
				cbTalk ? cbTalk.$element : null
			),
			buttons: [ { text: ronda.msg( 'admin-restaurar-botao' ), 'class': 'ui-priority-primary ui-button-blue', click: submit },
				{ text: ronda.msg( 'core-cancelar' ), click: function () {
					ronda.ui.close( $dlg );
				} } ]
		} );
	}, ronda.fail );
}

/* ---------------- Lote ---------------- */

/** Menu de motivos nativo de cada ação do lote */
var REASON_MESSAGES = {
	'delete': 'deletereason-dropdown',
	undelete: 'undelete-comment-dropdown',
	protect: 'protect-dropdown'
};

/** Junta grupos de vários menus: grupos de mesmo nome se fundem e opções repetidas saem */
function mergeGroups( lists ) {
	var out = [],
		byLabel = {};

	lists.forEach( function ( groups ) {
		( groups || [] ).forEach( function ( g ) {
			var target = byLabel[ g.label ];

			if ( !target ) {
				target = byLabel[ g.label ] = { label: g.label, options: [], seen: {} };
				out.push( target );
			}
			g.options.forEach( function ( o ) {
				if ( !target.seen[ o.value ] ) {
					target.seen[ o.value ] = true;
					target.options.push( o );
				}
			} );
		} );
	} );

	return out.map( function ( g ) {
		return { label: g.label, options: g.options };
	} );
}

ronda.batch = ronda.batch || {};
ronda.batch.mergeGroups = mergeGroups;

/**
 * Motivos de eliminação para as páginas do lote: o menu da pt.wiki muda conforme
 * o domínio, então é expandido para cada domínio presente (com uma página dele)
 * e os resultados são juntados; com ficheiros, entra também o menu de ficheiros.
 */
function deleteReasons( ctx, pages, refresh ) {
	var byNs = {},
		calls = [];

	( pages.length ? pages : [ { ns: ctx.ns, title: ctx.page } ] ).forEach( function ( p ) {
		if ( p.ns !== undefined && p.ns >= 0 && !byNs[ p.ns ] ) {
			byNs[ p.ns ] = p.title;
		}
	} );

	if ( byNs[ 6 ] ) {
		calls.push( ronda.reasons( 'filedelete-reason-dropdown', null, refresh ) );
	}
	Object.keys( byNs ).forEach( function ( ns ) {
		calls.push( ronda.reasons( 'deletereason-dropdown', { ns: Number( ns ), page: byNs[ ns ] }, refresh ) );
	} );

	return $.when.apply( $, calls.map( function ( c ) {
		return c.then( null, function () {
			return $.Deferred().resolve( [] ).promise();
		} );
	} ) ).then( function () {
		var merged = mergeGroups( [].slice.call( arguments ) );

		return ronda.withCatalogRules ? ronda.withCatalogRules( Object.keys( byNs ).map( Number ), merged ) : merged;
	} );
}

/** Fontes de páginas disponíveis no contexto */
function sources( ctx ) {
	var list = [];

	if ( ronda.isPageContext( ctx ) && ctx.exists ) {
		list.push( { id: 'links', label: ronda.msg( 'admin-ligacoes-desta-pagina' ) } );
	}
	if ( ctx.ns === 14 && ctx.exists ) {
		list.push( { id: 'category', label: ronda.msg( 'admin-paginas-desta-categoria' ) } );
	}
	if ( ronda.isUserContext( ctx ) ) {
		list.push( { id: 'created', label: ronda.msg( 'admin-paginas-criadas-por', ctx.targetUser ) } );
	}
	list.push( { id: 'prefix', label: ronda.msg( 'admin-paginas-com-um-prefixo' ) }, { id: 'manual', label: ronda.msg( 'admin-lista-digitada' ) } );
	return list;
}

/** Carrega { title, exists } de uma fonte */
function loadPages( ctx, source, extra ) {
	var gen;

	function info( params ) {
		return ronda.api.get( $.extend( { action: 'query', prop: 'info' }, params ) ).then( function ( d ) {
			return ( d.query && d.query.pages || [] ).filter( function ( p ) {
				return !p.invalid;
			} ).map( function ( p ) {
				return { title: p.title, ns: p.ns, exists: !p.missing };
			} ).sort( function ( a, b ) {
				return a.title.localeCompare( b.title, 'pt' );
			} );
		} );
	}

	if ( source === 'manual' ) {
		gen = parseTitles( extra );
		return gen.length ? info( { titles: gen.slice( 0, 50 ).join( '|' ) } ) : $.Deferred().resolve( [] ).promise();
	}
	if ( source === 'links' ) {
		return info( { generator: 'links', titles: ctx.page, gpllimit: 'max' } );
	}
	if ( source === 'category' ) {
		return info( { generator: 'categorymembers', gcmtitle: ctx.page, gcmlimit: 'max' } );
	}
	if ( source === 'prefix' ) {
		gen = String( extra || '' ).trim();
		return gen ? info( {
			generator: 'allpages',
			gapprefix: gen.replace( /^[^:]+:/, '' ),
			gapnamespace: ronda.quick ? ronda.quick.nsOf( gen ) : 0,
			gaplimit: 'max'
		} ) : $.Deferred().resolve( [] ).promise();
	}
	// created: páginas criadas pelo usuário (contribuições que criaram a página)
	return ronda.api.get( { action: 'query', list: 'usercontribs', ucuser: ctx.targetUser, ucshow: 'new', uclimit: 'max', ucprop: 'title' } )
		.then( function ( d ) {
			var titles = ( d.query.usercontribs || [] ).map( function ( c ) {
				return c.title;
			} );

			return titles.length ? info( { titles: titles.slice( 0, 50 ).join( '|' ) } ) : [];
		} );
}

/** Chave de comparação de títulos: sem sublinhados e com a primeira letra maiúscula, como o MediaWiki */
function titleKey( t ) {
	t = String( t || '' ).replace( /_/g, ' ' ).trim();
	return t.charAt( 0 ).toUpperCase() + t.slice( 1 );
}

/**
 * Filtros do Lote (como o filtro de listas do AWB): domínios, títulos que contêm
 * ou não um texto (ou expressão regular) e comparação com outra lista.
 * @param {Array} pages [ { title, ns } ]
 * @param {Object} f { ns: { <ns>: false }, keep, remove, regex, other: [ títulos ], otherMode: 'and' | 'not' }
 * @return {Object} { pages: [], badKeep: boolean, badRemove: boolean }
 */
function filterPages( pages, f ) {
	var res = { pages: [], badKeep: false, badRemove: false },
		other = {},
		keep, remove;

	function matcher( text, bad ) {
		if ( !text ) {
			return null;
		}
		if ( f.regex ) {
			try {
				return new RegExp( text, 'i' );
			} catch ( e ) {
				res[ bad ] = true;
				return null;
			}
		}
		return { test: function ( t ) {
			return t.toLowerCase().indexOf( text.toLowerCase() ) !== -1;
		} };
	}

	keep = matcher( f.keep, 'badKeep' );
	remove = matcher( f.remove, 'badRemove' );
	( f.other || [] ).forEach( function ( t ) {
		other[ titleKey( t ) ] = true;
	} );

	res.pages = pages.filter( function ( p ) {
		var inOther = !!other[ titleKey( p.title ) ];

		if ( f.ns && f.ns[ p.ns ] === false ) {
			return false;
		}
		if ( keep && !keep.test( p.title ) ) {
			return false;
		}
		if ( remove && remove.test( p.title ) ) {
			return false;
		}
		if ( ( f.other || [] ).length ) {
			return f.otherMode === 'not' ? !inOther : inOther;
		}
		return true;
	} );
	return res;
}

ronda.batch.filterPages = filterPages;
ronda.batch.titleKey = titleKey;

/**
 * @param {Object} [options] { source: fonte já escolhida e carregada (ex.: 'created'), action }
 */
function openBatch( ctx, options ) {
	ronda.api.get( { action: 'query', meta: 'siteinfo', siprop: 'restrictions' } ).then( function ( si ) {
		var levels = si.query.restrictions.levels;

		return $.when( ronda.loadMessages( [ 'protect-expiry-options', 'protect-default' ].concat( levels.filter( Boolean ).map( function ( l ) {
			return 'protect-level-' + l;
		} ) ) ) ).then( function () {
			return si;
		}, function () {
			return si;
		} );
	} ).then( function ( si ) {
		var restr = si.query.restrictions,
			srcs = sources( ctx ),
			$source = $( '<select></select>' ),
			$extra = ronda.ui.textarea( '', '' ).attr( 'rows', 4 ),
			$extraRow = ronda.ui.row( ronda.msg( 'admin-paginas' ), $extra ),
			$load = $( '<button type="button"></button>' ).text( ronda.msg( 'admin-carregar-paginas' ) ),
			$list = $( '<div class="ui-widget-content ui-corner-all ronda-list"></div>' ).hide(),
			// Filtros: aparecem depois de carregar as páginas
			$filters = $( '<fieldset class="ui-widget-content ui-corner-all ronda-batch-filters"></fieldset>' )
				.append( $( '<legend></legend>' ).text( ronda.msg( 'admin-lote-filtros' ) ) ).hide(),
			$nsBox = $( '<div class="ronda-batch-ns"></div>' ),
			$keep = ronda.ui.text( '', ronda.msg( 'admin-lote-filtro-manter-exemplo' ) ),
			$remove = ronda.ui.text( '', ronda.msg( 'admin-lote-filtro-remover-exemplo' ) ),
			cbRegex = ronda.ui.checkbox( ronda.msg( 'admin-lote-filtro-regex' ), false ),
			$other = ronda.ui.textarea( '', ronda.msg( 'admin-lote-filtro-outra-lista-exemplo' ) ).attr( 'rows', 3 ),
			$otherMode = $( '<select></select>' )
				.append( $( '<option value="not"></option>' ).text( ronda.msg( 'admin-lote-filtro-outra-tirar' ) ) )
				.append( $( '<option value="and"></option>' ).text( ronda.msg( 'admin-lote-filtro-outra-manter' ) ) ),
			$count = $( '<div class="ronda-batch-count"></div>' ),
			nsOff = {},
			$action = $( '<select></select>' ),
			$reasonBox = $( '<div></div>' ),
			reasonFields = null,
			reasonToken = 0,
			cbTalk = ronda.ui.checkbox( ronda.msg( 'admin-eliminar-tambem-as-paginas-de-discussao' ), true ),
			// Discussões de usuário (PDU): opção separada, desmarcada; nunca saem junto por padrão
			cbUserTalk = ronda.ui.checkbox( ronda.msg( 'admin-eliminar-tambem-as-pdus' ), false ),
			$editLevel = $( '<select class="ronda-level"></select>' ),
			$moveLevel = $( '<select class="ronda-level"></select>' ),
			$expiry = ronda.ui.expirySelect( 'protect-expiry-options', [ { value: 'infinite', label: ronda.msg( 'admin-indefinida' ) } ] ),
			$protectBox = $( '<div></div>' ),
			$progress = $( '<div class="ronda-progress"></div>' ).hide(),
			$log = $( '<ul class="ronda-log"></ul>' ),
			pages = [],
			$dlg;

		srcs.forEach( function ( s ) {
			$( '<option></option>' ).val( s.id ).text( s.label ).appendTo( $source );
		} );
		[ [ 'delete', ronda.msg( 'admin-eliminar-botao' ), 'delete' ], [ 'undelete', ronda.msg( 'admin-restaurar-botao' ), 'undelete' ], [ 'protect', ronda.msg( 'admin-proteger-botao' ), 'protect' ] ]
			.forEach( function ( a ) {
				if ( ronda.can( a[ 2 ] ) ) {
					$( '<option></option>' ).val( a[ 0 ] ).text( a[ 1 ] ).appendTo( $action );
				}
			} );
		// Sem nível pré-escolhido: o primeiro item é só um aviso, e remover a proteção é uma opção explícita
		[ $editLevel, $moveLevel ].forEach( function ( $sel ) {
			$( '<option value=""></option>' ).text( ronda.msg( 'admin-lote-escolha-o-nivel' ) ).appendTo( $sel );
			restr.levels.filter( Boolean ).forEach( function ( l ) {
				$( '<option></option>' ).val( l ).text( msgOr( 'protect-level-' + l, l ) ).appendTo( $sel );
			} );
			$( '<option value="all"></option>' ).text( ronda.msg( 'admin-lote-remover-protecao' ) ).appendTo( $sel );
		} );
		$expiry.find( 'option[value="other"]' ).remove();
		$protectBox.append(
			ronda.ui.row( ronda.msg( 'admin-edicao-ou-criacao-se-nao-existir' ), $editLevel ),
			ronda.ui.row( ronda.msg( 'admin-mocao' ), $moveLevel ),
			ronda.ui.row( ronda.msg( 'admin-duracao' ), $expiry )
		);

		function refreshSource() {
			var id = $source.val();

			$extraRow.toggle( id === 'manual' || id === 'prefix' );
			$extraRow.children( 'label' ).text( id === 'prefix' ? ronda.msg( 'admin-prefixo-com-o-dominio-ex-predefinicao' ) : ronda.msg( 'admin-um-titulo-por-linha-ate-50' ) );
			$extra.attr( 'rows', id === 'prefix' ? 1 : 4 );
		}

		function refreshReasons() {
			var a = $action.val(),
				token = ++reasonToken,
				keep = reasonFields ? reasonFields.$extra.val() : '';

			function load( refresh ) {
				return a === 'delete'
					? deleteReasons( ctx, pages, refresh )
					: ronda.reasons( REASON_MESSAGES[ a ], null, refresh ).then( null, function () {
						return $.Deferred().resolve( [] ).promise();
					} );
			}

			load( false ).then( function ( groups ) {
				if ( token !== reasonToken ) {
					return;
				}
				reasonFields = ronda.ui.reasonFields( load, null, groups );
				reasonFields.$extra.val( keep );
				$reasonBox.empty().append( reasonFields.$element );
			} );
		}

		/** A opção das PDUs só aparece ao eliminar e quando há páginas de usuário na lista */
		function refreshUserTalk() {
			cbUserTalk.$element.toggle( $action.val() === 'delete' && pages.some( function ( p ) {
				return p.ns === 2;
			} ) );
		}

		function refreshAction() {
			var a = $action.val();

			cbTalk.$element.toggle( a === 'delete' );
			refreshUserTalk();
			$protectBox.toggle( a === 'protect' );
			refreshReasons();
			renderList();
		}

		/** Uma caixa por domínio presente nas páginas carregadas, com a contagem */
		function renderNamespaces() {
			var names = mw.config.get( 'wgFormattedNamespaces' ) || {},
				counts = {};

			pages.forEach( function ( p ) {
				counts[ p.ns ] = ( counts[ p.ns ] || 0 ) + 1;
			} );
			$nsBox.empty();
			Object.keys( counts ).map( Number ).sort( function ( a, b ) {
				return a - b;
			} ).forEach( function ( n ) {
				var cb = ronda.ui.checkbox( ( names[ n ] || ronda.msg( 'paginas-principal' ) ) + ' (' + counts[ n ] + ')', nsOff[ n ] !== true );

				cb.$element.addClass( 'ronda-tag' );
				cb.$input.on( 'change', function () {
					nsOff[ n ] = !cb.isChecked();
					renderList();
				} );
				$nsBox.append( cb.$element );
			} );
		}

		function renderList() {
			var a = $action.val(),
				f = filterPages( pages, {
					ns: Object.keys( nsOff ).reduce( function ( o, n ) {
						o[ n ] = !nsOff[ n ];
						return o;
					}, {} ),
					keep: $keep.val().trim(),
					remove: $remove.val().trim(),
					regex: cbRegex.isChecked(),
					other: parseTitles( $other.val() ),
					otherMode: $otherMode.val()
				} );

			$keep.toggleClass( 'ui-state-error', f.badKeep );
			$remove.toggleClass( 'ui-state-error', f.badRemove );
			$filters.toggle( pages.length > 0 );
			$count.text( pages.length ? ronda.msg( 'admin-lote-filtro-contagem', f.pages.length, pages.length ) : '' );

			// Só as páginas que passam pelos filtros podem ser executadas
			pages.forEach( function ( p ) {
				p.cb = null;
			} );
			$list.empty().show();
			if ( !f.pages.length ) {
				$list.append( $( '<i></i>' ).text( ronda.msg( 'admin-nenhuma-pagina-encontrada' ) ) );
				return;
			}
			f.pages.forEach( function ( p ) {
				// Eliminar só páginas existentes; restaurar só as eliminadas
				var usable = a === 'protect' || ( a === 'delete' ? p.exists : !p.exists ),
					cb = ronda.ui.checkbox( p.title + ( p.exists ? '' : ronda.msg( 'admin-nao-existe' ) ), usable && p.checked !== false );

				cb.$input.prop( 'disabled', !usable ).on( 'change', function () {
					p.checked = cb.isChecked();
				} );
				p.cb = cb;
				$list.append( cb.$element );
			} );
		}

		$filters.append(
			ronda.ui.row( ronda.msg( 'admin-lote-filtro-dominios' ), $nsBox ),
			ronda.ui.row( ronda.msg( 'admin-lote-filtro-manter' ), $keep ),
			ronda.ui.row( ronda.msg( 'admin-lote-filtro-remover' ), $remove ),
			cbRegex.$element,
			ronda.ui.row( ronda.msg( 'admin-lote-filtro-outra-lista' ), $otherMode ),
			$other,
			$count
		);
		$keep.add( $remove ).add( $other ).on( 'input', renderList );
		cbRegex.$input.on( 'change', renderList );
		ronda.ui.onChange( $otherMode, renderList );

		$load.button().on( 'click', function () {
			$load.button( 'disable' );
			loadPages( ctx, $source.val(), $extra.val() ).then( function ( list ) {
				pages = list;
				nsOff = {};
				renderNamespaces();
				refreshUserTalk();
				renderList();
				if ( $action.val() === 'delete' ) {
					refreshReasons();
				}
			}, ronda.fail ).always( function () {
				$load.button( 'enable' );
			} );
		} );
		ronda.ui.onChange( $source, refreshSource );
		ronda.ui.onChange( $action, refreshAction );

		function submit() {
			var a = $action.val(),
				reason = reasonFields ? reasonFields.value() : '',
				chosen = pages.filter( function ( p ) {
					return p.cb && p.cb.isChecked() && !p.cb.$input.prop( 'disabled' );
				} ),
				expiry = ronda.ui.expiryValue( $expiry, $() ),
				ok = !!reasonFields && ronda.ui.require( reasonFields.$extra, !!reason );

			if ( a === 'protect' ) {
				ok = ronda.ui.require( $editLevel, !!$editLevel.val() ) && ok;
				if ( chosen.some( function ( p ) {
					return p.exists;
				} ) ) {
					ok = ronda.ui.require( $moveLevel, !!$moveLevel.val() ) && ok;
				}
			}
			if ( !ok ) {
				return;
			}
			if ( !chosen.length ) {
				mw.notify( ronda.msg( 'admin-escolha-ao-menos-uma-pagina' ), { type: 'warn', title: ronda.msg( 'core-nome' ) } );
				return;
			}
			// Confirmação com a contagem, antes de qualquer escrita
			if ( !window.confirm( ronda.msg( a === 'delete' ? 'admin-lote-confirmar-eliminar'
				: a === 'undelete' ? 'admin-lote-confirmar-restaurar' : 'admin-lote-confirmar-proteger', chosen.length ) ) ) {
				return;
			}

			ronda.ui.runner( $dlg, $progress, $log, apiError )( chosen.map( function ( p ) {
				return { label: ( a === 'delete' ? ronda.msg( 'admin-eliminando' ) : a === 'undelete' ? ronda.msg( 'admin-restaurando' ) : ronda.msg( 'admin-protegendo' ) ) + p.title, fn: function () {
					var protections;

					if ( a === 'delete' ) {
						return ronda.post( { action: 'delete', title: p.title, reason: reason,
							deletetalk: p.ns === 2 ? cbUserTalk.isChecked() : cbTalk.isChecked() } );
					}
					if ( a === 'undelete' ) {
						return ronda.post( { action: 'undelete', title: p.title, reason: reason } );
					}
					protections = p.exists
						? 'edit=' + $editLevel.val() + '|move=' + $moveLevel.val()
						: 'create=' + $editLevel.val();
					return ronda.post( { action: 'protect', title: p.title, protections: protections, expiry: expiry, reason: reason } );
				} };
			} ), function ( done ) {
				mw.notify( done ? ronda.msg( 'admin-lote-concluido' ) : ronda.msg( 'admin-lote-interrompido-veja-o-registro' ), { type: done ? 'success' : 'error', title: ronda.msg( 'core-nome' ) } );
				ronda.ui.finishButtons( $dlg, false );
			} );
		}

		$dlg = ronda.ui.dialog( {
			title: ronda.msg( 'admin-lote' ),
			width: 640,
			content: $( '<div></div>' ).append(
				ronda.ui.row( ronda.msg( 'admin-origem' ), $source ), $extraRow,
				$( '<div class="ronda-refresh"></div>' ).append( $load ),
				$filters,
				$list,
				ronda.ui.row( ronda.msg( 'admin-acao' ), $action ), cbTalk.$element, cbUserTalk.$element, $protectBox,
				$reasonBox,
				$progress, $log
			),
			buttons: [ { text: ronda.msg( 'admin-executar' ), 'class': 'ui-priority-primary ui-button-red', click: submit },
				{ text: ronda.msg( 'core-cancelar' ), click: function () {
					ronda.ui.close( $dlg );
				} } ]
		} );
		refreshSource();
		if ( options && options.action && $action.find( 'option[value="' + options.action + '"]' ).length ) {
			$action.val( options.action );
		}
		refreshAction();
		$list.hide();
		if ( options && options.source && $source.find( 'option[value="' + options.source + '"]' ).length ) {
			$source.val( options.source );
			refreshSource();
			$load.trigger( 'click' );
		}
	}, ronda.fail );
}

ronda.registerModule( {
	id: 'restaurar',
	admin: true,
	label: ronda.msg( 'admin-restaurar-botao' ),
	title: ronda.msg( 'admin-restaurar-esta-pagina-eliminada' ),
	order: 31,
	isAvailable: function ( ctx ) {
		return ctx.type === 'view' && !ctx.exists && ctx.ns >= 0 && ronda.can( 'undelete' );
	},
	open: openUndelete
} );

ronda.registerModule( {
	id: 'lote',
	admin: true,
	label: ronda.msg( 'admin-lote' ),
	title: ronda.msg( 'admin-eliminar-restaurar-ou-proteger-varias-paginas' ),
	order: 60,
	isAvailable: function ( ctx ) {
		return ( ctx.type === 'view' || ctx.type === 'history' || ronda.isUserContext( ctx ) || ( ctx.type === 'special' && ctx.special === 'Prefixindex' ) )
			&& ( ronda.can( 'delete' ) || ronda.can( 'protect' ) || ronda.can( 'undelete' ) );
	},
	open: openBatch
} );

}( window.ronda ) );

console.log( '[Ronda] carregado', window.ronda );
} );

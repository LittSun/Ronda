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
					watchlist: ronda.config.watchlist,
					watchlistexpiry: ronda.watchExpiry( 'revert' )
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
				watchlist: ronda.config.watchlist,
				watchlistexpiry: ronda.watchExpiry( 'revert' )
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
					watchlist: ronda.config.watchlist,
					watchlistexpiry: ronda.watchExpiry( 'request' )
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
					watchlist: ronda.config.watchlist,
					watchlistexpiry: ronda.watchExpiry( 'warn' )
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
			watchlist: ronda.config.watchlist,
			watchlistexpiry: ronda.watchExpiry( 'request' )
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
					watchlist: ronda.config.watchlist,
					watchlistexpiry: ronda.watchExpiry( 'revert' )
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
		// Grandes remoções: o limite (removals.bytes) fica nas preferências
		{ id: 'REM', label: ronda.msg( 'patrulha-fila-remocoes' ), title: ronda.msg( 'patrulha-fila-remocoes-dica', removalBytes() ), params: function () {
			// Com o direito de patrulhar, só as edições de quem não é autopatrulhado
			return { list: 'recentchanges', rctype: 'edit', rcnamespace: 0, rcshow: ronda.can( 'patrol' ) ? '!bot|!autopatrolled' : '!bot',
				rcprop: 'user|comment|title|sizes|ids|tags', rclimit: 500 };
		}, pick: function ( list ) {
			return bigRemovals( list, removalBytes() );
		}, note: function ( item ) {
			return item.oldlen ? ronda.msg( 'patrulha-fila-remocoes-nota', Math.round( ( item.oldlen - item.newlen ) * 100 / item.oldlen ) ) : null;
		}, key: 'recentchanges', link: 'revid', empty: ronda.msg( 'patrulha-fila-remocoes-vazia', removalBytes() ) },
		// Filtro de abusos: os números dos filtros (abuseLog.filters) ficam nas preferências
		{ id: 'FA', label: ronda.msg( 'patrulha-fila-abusos' ), title: ronda.msg( 'patrulha-fila-abusos-dica' ), right: 'abusefilter-log', params: function () {
			var ids = abuseFilters();

			return $.extend( { list: 'abuselog', afllimit: 200, aflprop: 'ids|filter|user|title|action|result|timestamp|revid' },
				ids.length ? { aflfilter: ids.join( '|' ) } : {} );
		}, pick: savedAbuseHits, note: function ( item ) {
			var $note = $( '<span class="ronda-feed-muted"></span>' );

			item.filters.forEach( function ( f, i ) {
				$note.append( i ? '; ' : '', $( '<a></a>' ).attr( 'href', mw.util.getUrl( 'Special:AbuseLog/' + f.log ) )
					.text( ronda.abuse.label( f.id, f.name ) ).attr( 'title', ronda.msg( 'patrulha-fila-abusos-filtro', f.id ) ) );
			} );
			return $note;
		}, key: 'abuselog', link: 'revid', sizes: false, empty: ronda.msg( 'patrulha-fila-abusos-vazia' ) },
		// Páginas novas pequenas: o tamanho máximo (smallPages.bytes) fica nas preferências
		{ id: 'PNP', label: ronda.msg( 'patrulha-fila-pequenas' ), title: ronda.msg( 'patrulha-fila-pequenas-dica', smallPageBytes() ), params: function () {
			// Com o direito de patrulhar, só as ainda não patrulhadas
			return { list: 'recentchanges', rctype: 'new', rcnamespace: 0, rcshow: ronda.can( 'patrol' ) ? '!redirect|!patrolled' : '!redirect',
				rcprop: 'user|comment|title|sizes|ids', rclimit: 500 };
		}, pick: function ( list ) {
			return smallNewPages( list, smallPageBytes() );
		}, key: 'recentchanges', link: 'rcid', empty: ronda.msg( 'patrulha-fila-pequenas-vazia', smallPageBytes() ) },
		// Páginas novas de contas novas: idade e edições da conta (newAccounts) ficam nas preferências
		{ id: 'PNC', label: ronda.msg( 'patrulha-fila-contas' ), title: ronda.msg( 'patrulha-fila-contas-dica', newAccountLimits().days, newAccountLimits().edits ), params: function () {
			// Com o direito de patrulhar, só as ainda não patrulhadas
			return { list: 'recentchanges', rctype: 'new', rcnamespace: 0, rcshow: ronda.can( 'patrol' ) ? '!redirect|!patrolled' : '!redirect',
				rcprop: 'user|comment|title|sizes|ids', rclimit: 100 };
		}, pick: function ( list ) {
			// Data de registro e edições dos autores (até 50 contas numa consulta)
			var users = [];

			list.forEach( function ( item ) {
				if ( item.user && users.indexOf( item.user ) === -1 && !mw.util.isIPAddress( item.user ) ) {
					users.push( item.user );
				}
			} );
			if ( !users.length ) {
				return newAccountPages( list, {}, newAccountLimits(), Date.now() );
			}
			return ronda.api.get( { action: 'query', list: 'users', ususers: users.slice( 0, 50 ).join( '|' ), usprop: 'registration|editcount' } )
				.then( function ( data ) {
					var info = {};

					( ( data.query && data.query.users ) || [] ).forEach( function ( u ) {
						info[ u.name ] = u;
					} );
					return newAccountPages( list, info, newAccountLimits(), Date.now() );
				} );
		}, note: function ( item ) {
			var a = item.account;

			return !a ? null : a.ip ? ronda.msg( 'patrulha-fila-contas-ip' )
				: a.days === 0 ? ronda.msg( 'patrulha-fila-contas-hoje', a.edits )
					: ronda.msg( 'patrulha-fila-contas-nota', a.days, a.edits );
		}, key: 'recentchanges', link: 'rcid', empty: ronda.msg( 'patrulha-fila-contas-vazia' ) },
		// Páginas novas sem <ref>: lê o texto atual das páginas numa consulta só
		{ id: 'PSR', label: ronda.msg( 'patrulha-fila-semref' ), title: ronda.msg( 'patrulha-fila-semref-dica' ), params: function () {
			// Com o direito de patrulhar, só as ainda não patrulhadas
			return { list: 'recentchanges', rctype: 'new', rcnamespace: 0, rcshow: ronda.can( 'patrol' ) ? '!redirect|!patrolled' : '!redirect',
				rcprop: 'user|comment|title|sizes|ids', rclimit: 50 };
		}, pick: function ( list ) {
			var titles = [];

			list.forEach( function ( item ) {
				if ( titles.indexOf( item.title ) === -1 ) {
					titles.push( item.title );
				}
			} );
			if ( !titles.length ) {
				return [];
			}
			return ronda.api.get( { action: 'query', titles: titles.slice( 0, 50 ).join( '|' ), prop: 'revisions', rvprop: 'content', rvslots: 'main' } )
				.then( function ( data ) {
					var contents = {};

					( ( data.query && data.query.pages ) || [] ).forEach( function ( p ) {
						var rev = ( p.revisions || [] )[ 0 ];

						if ( !p.missing && rev && rev.slots && rev.slots.main ) {
							contents[ p.title ] = rev.slots.main.content || '';
						}
					} );
					return withoutRefs( list, contents );
				} );
		}, key: 'recentchanges', link: 'rcid', empty: ronda.msg( 'patrulha-fila-semref-vazia' ) },
		{ id: 'ER', label: ronda.msg( 'patrulha-eliminacao-rapida' ), title: ronda.msg( 'patrulha-paginas-marcadas-para-eliminacao-rapida' ), params: function () {
			return { list: 'categorymembers', cmtitle: 'Categoria:!Páginas para eliminação rápida', cmlimit: MAX };
		}, key: 'categorymembers', link: 'page', empty: ronda.msg( 'patrulha-nenhuma-pagina-marcada-para-eliminacao-rapida' ) }
	],
	runId = 0;

/** Limite das Grandes remoções, em bytes (preferências: removals.bytes) */
function removalBytes() {
	return Math.max( 1, Number( ( ronda.config.removals || {} ).bytes ) || 2000 );
}

/** Números dos filtros da fila Filtro de abusos (preferências: abuseLog.filters); vazio = todos */
function abuseFilters() {
	var ids = ( ronda.config.abuseLog || {} ).filters;

	return ( Array.isArray( ids ) ? ids : String( ids || '' ).split( /[,\s|]+/ ) ).map( Number ).filter( function ( n ) {
		return n > 0 && Math.floor( n ) === n;
	} );
}

/** Tamanho máximo das Páginas novas pequenas, em bytes (preferências: smallPages.bytes) */
function smallPageBytes() {
	return Math.max( 1, Number( ( ronda.config.smallPages || {} ).bytes ) || 1000 );
}

/** Limites de "conta nova" (preferências: newAccounts.days e newAccounts.edits) */
function newAccountLimits() {
	var c = ronda.config.newAccounts || {};

	return { days: Math.max( 1, Number( c.days ) || 30 ), edits: Math.max( 1, Number( c.edits ) || 100 ) };
}

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

/** O texto tem alguma tag <ref> (inclusive <ref name="…"/>)? Comentários não contam */
function hasRefTag( text ) {
	return /<ref[\s>\/]/i.test( String( text || '' ).replace( /<!--[\s\S]*?-->/g, '' ) );
}

/**
 * Páginas novas sem <ref>: as que ainda existem, sem nenhuma tag <ref> no texto atual.
 * Ficam de fora as já marcadas para eliminação e as que viraram redirecionamento.
 * @param {Object[]} list páginas novas (recentchanges), da mais recente para a mais antiga
 * @param {Object} contents texto atual por título (sem o título: página eliminada)
 */
function withoutRefs( list, contents ) {
	var seen = {};

	return list.filter( function ( item ) {
		var text = contents[ item.title ];

		if ( seen[ item.title ] || typeof text !== 'string' ) {
			return false;
		}
		seen[ item.title ] = true;
		return !hasRefTag( text ) && !ronda.hasEliminationTag( text ) && !/^\s*#(redirect|redirecionamento)/i.test( text );
	} ).slice( 0, MAX );
}

ronda.lists.hasRefTag = hasRefTag;
ronda.lists.withoutRefs = withoutRefs;

/**
 * Páginas novas de contas novas: criadas por conta registrada há até `limits.days`
 * dias e com até `limits.edits` edições (ou por IP, que não tem conta). Contas
 * desconhecidas ou sem data de registro (muito antigas) ficam de fora. Cada item
 * ganha `account` ({ days, edits } ou { ip: true }) para a linha.
 * @param {Object[]} list páginas novas (recentchanges)
 * @param {Object} info list=users por nome: { registration, editcount }
 */
function newAccountPages( list, info, limits, now ) {
	return list.filter( function ( item ) {
		var u = info[ item.user ],
			days;

		if ( item.user && mw.util.isIPAddress( item.user ) ) {
			item.account = { ip: true };
			return true;
		}
		if ( !u || !u.registration ) {
			return false;
		}
		days = Math.floor( ( now - Date.parse( u.registration ) ) / ( 24 * 60 * 60 * 1000 ) );
		item.account = { days: Math.max( 0, days ), edits: u.editcount || 0 };
		return days <= limits.days && item.account.edits <= limits.edits;
	} ).slice( 0, MAX );
}

ronda.lists.newAccountPages = newAccountPages;

/** Páginas novas pequenas: criações com menos de `bytes` bytes, das mais recentes para as mais antigas */
function smallNewPages( list, bytes ) {
	return list.filter( function ( item ) {
		return ( item.newlen || 0 ) < bytes;
	} ).slice( 0, MAX );
}

ronda.lists.smallNewPages = smallNewPages;

/**
 * Filtro de abusos: só as ocorrências cuja edição foi gravada (com revid); as
 * impedidas, as que só avisaram (e não foram salvas) e as que não são edições ficam
 * de fora. Uma linha por edição, com todos os filtros que ela disparou.
 * @param {Object[]} list list=abuselog, da mais recente para a mais antiga
 * @return {Object[]} { revid, title, user, timestamp, filters: [ { id, name, log } ] }
 */
function savedAbuseHits( list ) {
	var byRev = {},
		out = [];

	list.forEach( function ( e ) {
		var hit;

		if ( !e.revid ) {
			return;
		}
		hit = byRev[ e.revid ];
		if ( !hit ) {
			hit = byRev[ e.revid ] = { revid: e.revid, title: e.title, user: e.user, timestamp: e.timestamp, filters: [] };
			out.push( hit );
		}
		hit.filters.push( { id: e.filter_id, name: e.filter, log: e.id } );
	} );
	return out.slice( 0, MAX );
}

ronda.lists.savedAbuseHits = savedAbuseHits;
ronda.lists.abuseFilters = abuseFilters;

/**
 * Grandes remoções: edições que tiraram pelo menos `bytes` bytes, das mais recentes
 * para as mais antigas. Ficam de fora as reversões (que costumam tirar vandalismo) e
 * as edições que já foram desfeitas (etiqueta mw-reverted).
 */
function bigRemovals( list, bytes ) {
	var skip = [ 'mw-rollback', 'mw-undo', 'mw-manual-revert', 'mw-reverted' ];

	return list.filter( function ( item ) {
		return ( item.newlen || 0 ) - ( item.oldlen || 0 ) <= -bytes && !( item.tags || [] ).some( function ( t ) {
			return skip.indexOf( t ) !== -1;
		} );
	} ).slice( 0, MAX );
}

ronda.lists.bigRemovals = bigRemovals;

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
			d, n, comment, note;

		attachHover( $link, item, def );

		if ( def.link !== 'page' ) {
			// Listas sem tamanho (def.sizes === false) não mostram a diferença
			if ( def.sizes !== false ) {
				d = sizeDiff( item );
				n = Number( d );
				$li.append( ' ', $( '<span></span>' )
					.addClass( n > 0 ? 'ronda-ok' : n < 0 ? 'ronda-bad' : 'ronda-feed-muted' )
					.toggleClass( 'ronda-feed-big', Math.abs( n ) >= 500 )
					.text( '(' + d + ')' ) );
			}
			if ( item.user ) {
				$li.append( sep(), $( '<a></a>' ).attr( 'href', mw.util.getUrl( 'Special:Contributions/' + item.user ) ).text( item.user ) );
			}
			// Informação própria da fila (def.note: texto ou jQuery)
			note = def.note ? def.note( item ) : null;
			if ( note ) {
				$li.append( sep(), typeof note === 'string'
					? $( '<span class="ronda-feed-muted"></span>' ).text( note ) : note );
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

		// def.pick: filtro ou consulta extra da fila; devolve a lista ou uma promessa dela
		return def.pick ? def.pick( list ) : def.scores ? pickSuspects( list ) : list;
	} ).then( function ( list ) {
		if ( id !== runId ) {
			return;
		}
		render( $out, def, list );
	}, function () {
		if ( id === runId ) {
			$out.text( ronda.msg( 'patrulha-nao-foi-possivel-obter-a-lista', def.label ) );
		}
	} );
}

/** @param {string} [listId] fila a abrir já carregada (ex.: 'FA', pelo alerta do filtro) */
function open( ctx, listId ) {
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
				} ).attr( 'data-fila', def.id ) );
		} );

		$panel.append( $bar, $out );
		if ( listId ) {
			$bar.find( '[data-fila="' + listId + '"]' ).trigger( 'click' );
		}
		// Abrir as Filas dá os alertas do filtro por vistos
		ronda.abuse.clearBadge();
	} );
}

ronda.lists.open = function ( listId ) {
	if ( !$( '#ronda-toolbar .ronda-btn-listar' ).hasClass( 'ronda-btn-on' ) ) {
		open( ronda.ctx, listId );
	} else if ( listId ) {
		$( '[data-fila="' + listId + '"]' ).trigger( 'click' );
	}
};

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
 * Filtro de abusos: descrições, o que a conta pode ver e alertas
 *
 * - ronda.abuse.info(): todos os filtros (list=abusefilters), com descrição,
 *   situação e marcas (privado, protegido, suprimido) e se a conta vê o registro
 *   deles (a API omite o número de ocorrências, "hitsredacted", quando não vê).
 *   Guardado na sessão por uma hora.
 * - ronda.abuse.access(): o que a conta vê, pelos direitos.
 * - ronda.abuse.openPicker(): escolher os filtros da fila e os dos alertas.
 * - Alertas: com filtros em abuseLog.alert, consulta o registro a cada minuto
 *   (só com a aba visível) e avisa das ocorrências novas, com um selo no Filas.
 * ================================================================== */

( function ( ronda ) {
'use strict';

var CACHE_KEY = 'ronda-filtros',
	CACHE_TTL = 3600e3,
	SEEN_KEY = 'ronda-filtro-visto',
	BADGE_KEY = 'ronda-filtro-novos',
	POLL = 60e3,
	names = {},
	infoPromise = null;

function session() {
	return mw.storage && mw.storage.session ? mw.storage.session : null;
}

/** "12: Descrição" (ou só "filtro 12", sem descrição) */
function label( id, name ) {
	name = name || names[ id ];
	return name ? id + ': ' + name : ronda.msg( 'patrulha-fila-abusos-filtro', id );
}

function flagged( e, k ) {
	return k in e && e[ k ] !== false;
}

/** Todos os filtros não apagados: { list, byId } */
function info() {
	var cached = session() && session().getObject( CACHE_KEY );

	if ( cached && Date.now() - cached.time < CACHE_TTL ) {
		infoPromise = infoPromise || $.Deferred().resolve( cached.data ).promise();
	}
	if ( !infoPromise ) {
		infoPromise = ronda.api.get( { action: 'query', list: 'abusefilters', abflimit: 'max', abfshow: '!deleted',
			abfprop: 'id|description|status|private|protected|suppressed|hits' } ).then( function ( d ) {
			var list = ( ( d.query || {} ).abusefilters || [] ).map( function ( e ) {
				return {
					id: e.id,
					description: e.description || '',
					enabled: flagged( e, 'enabled' ),
					'private': flagged( e, 'private' ),
					'protected': flagged( e, 'protected' ),
					suppressed: flagged( e, 'suppressed' ),
					// Sem acesso ao registro do filtro, a API esconde o número de ocorrências
					visible: !( 'hitsredacted' in e )
				};
			} );

			if ( session() ) {
				session().setObject( CACHE_KEY, { time: Date.now(), data: list } );
			}
			return list;
		}, function () {
			infoPromise = null;
			return [];
		} );
	}
	return infoPromise.then( function ( list ) {
		var byId = {};

		list.forEach( function ( f ) {
			byId[ f.id ] = f;
			names[ f.id ] = f.description;
		} );
		return { list: list, byId: byId };
	} );
}

/** O que a conta vê no registro do filtro, pelos direitos */
function access() {
	return [
		{ id: 'public', label: ronda.msg( 'patrulha-af-publicos' ), ok: ronda.can( 'abusefilter-log' ) },
		{ id: 'private', label: ronda.msg( 'patrulha-af-privados' ), ok: ronda.can( 'abusefilter-log-private' ) || ronda.can( 'abusefilter-view-private' ) },
		{ id: 'protected', label: ronda.msg( 'patrulha-af-protegidos' ), ok: ronda.can( 'abusefilter-access-protected-vars' ) },
		{ id: 'suppressed', label: ronda.msg( 'patrulha-af-suprimidos' ), ok: ronda.can( 'viewsuppressed' ) },
		{ id: 'hidden', label: ronda.msg( 'patrulha-af-ocultos' ), ok: ronda.can( 'abusefilter-hidden-log' ) },
		{ id: 'details', label: ronda.msg( 'patrulha-af-detalhes' ), ok: ronda.can( 'abusefilter-privatedetails' ) }
	];
}

/** Por que a conta não vê o registro deste filtro */
function whyHidden( f ) {
	var a = {};

	access().forEach( function ( x ) {
		a[ x.id ] = x.ok;
	} );
	if ( f.suppressed && !a.suppressed ) {
		return ronda.msg( 'patrulha-af-sem-suprimidos' );
	}
	if ( f[ 'private' ] && !a[ 'private' ] ) {
		return ronda.msg( 'patrulha-af-sem-privados' );
	}
	if ( f[ 'protected' ] && !a[ 'protected' ] ) {
		return ronda.msg( 'patrulha-af-sem-protegidos' );
	}
	return ronda.msg( 'patrulha-af-sem-acesso' );
}

function marks( f ) {
	return [ f[ 'private' ] ? ronda.msg( 'patrulha-af-marca-privado' ) : '', f[ 'protected' ] ? ronda.msg( 'patrulha-af-marca-protegido' ) : '',
		f.suppressed ? ronda.msg( 'patrulha-af-marca-suprimido' ) : '', f.enabled ? '' : ronda.msg( 'patrulha-af-marca-desativado' ) ].filter( Boolean );
}

/**
 * Escolher filtros: coluna "Fila" (abuseLog.filters) e "Alerta" (abuseLog.alert).
 * @param {Object} cur { filters: [], alert: [] }
 * @param {Function} done function ( { filters, alert } )
 */
function openPicker( cur, done ) {
	var $dlg,
		$box = $( '<div class="ronda-af-picker"></div>' ).text( ronda.msg( 'patrulha-carregando' ) ),
		$search = ronda.ui.text( '', ronda.msg( 'patrulha-af-buscar' ) ),
		cbOff = ronda.ui.checkbox( ronda.msg( 'patrulha-af-mostrar-desativados' ), false ),
		$access = $( '<div class="ronda-af-access"></div>' ).append( document.createTextNode( ronda.msg( 'patrulha-af-voce-ve' ) ) );

	access().forEach( function ( x, i ) {
		$access.append( i ? ' · ' : '', $( '<span></span>' ).addClass( x.ok ? 'ronda-ok' : 'ronda-feed-muted' )
			.text( ( x.ok ? '✓ ' : '✗ ' ) + x.label ) );
	} );

	function filter() {
		var q = $search.val().toLowerCase().trim(),
			off = cbOff.isChecked();

		$box.find( 'tr[data-id]' ).each( function () {
			var $tr = $( this );

			$tr.toggle( ( off || $tr.data( 'enabled' ) || $tr.find( 'input:checked' ).length > 0 ) &&
				( !q || $tr.text().toLowerCase().indexOf( q ) !== -1 ) );
		} );
	}

	info().then( function ( data ) {
		var $table = $( '<table class="ronda-af-table"></table>' ).append( $( '<tr></tr>' ).append(
			$( '<th></th>' ).text( ronda.msg( 'patrulha-af-col-fila' ) ),
			$( '<th></th>' ).text( ronda.msg( 'patrulha-af-col-alerta' ) ),
			$( '<th></th>' ).text( '#' ),
			$( '<th></th>' ).text( ronda.msg( 'patrulha-af-col-descricao' ) ) ) );

		data.list.forEach( function ( f ) {
			var m = marks( f ),
				$tr = $( '<tr></tr>' ).attr( 'data-id', f.id ).data( 'enabled', f.enabled )
					.toggleClass( 'ronda-af-off', !f.visible );

			[ 'filters', 'alert' ].forEach( function ( k ) {
				$( '<td></td>' ).append( $( '<input type="checkbox">' ).attr( 'data-k', k )
					.prop( 'checked', ( cur[ k ] || [] ).indexOf( f.id ) !== -1 )
					.prop( 'disabled', !f.visible ) ).appendTo( $tr );
			} );
			$tr.append( $( '<td></td>' ).append( $( '<a target="_blank"></a>' ).attr( 'href', mw.util.getUrl( 'Special:AbuseFilter/' + f.id ) ).text( f.id ) ),
				$( '<td></td>' ).append( document.createTextNode( f.description ),
					m.length ? $( '<span class="ronda-feed-muted"></span>' ).text( ' (' + m.join( ', ' ) + ')' ) : null ) );
			if ( !f.visible ) {
				$tr.attr( 'title', whyHidden( f ) );
			}
			$table.append( $tr );
		} );
		$box.empty().append( data.list.length ? $table : document.createTextNode( ronda.msg( 'patrulha-af-nenhum' ) ) );
		filter();
	} );

	$search.on( 'input', filter );
	cbOff.$input.on( 'change', filter );

	$dlg = ronda.ui.dialog( {
		title: ronda.msg( 'patrulha-af-escolher-titulo' ),
		width: 620,
		content: [ $access, $( '<p class="ronda-feed-muted"></p>' ).text( ronda.msg( 'patrulha-af-escolher-ajuda' ) ),
			$search, cbOff.$element, $box ],
		buttons: [ { text: ronda.msg( 'patrulha-af-aplicar' ), 'class': 'ui-priority-primary ui-button-blue', click: function () {
			var out = { filters: [], alert: [] };

			$box.find( 'input:checked' ).each( function () {
				out[ $( this ).attr( 'data-k' ) ].push( Number( $( this ).closest( 'tr' ).attr( 'data-id' ) ) );
			} );
			ronda.ui.close( $dlg );
			done( out );
		} }, { text: ronda.msg( 'core-cancelar' ), click: function () {
			ronda.ui.close( $dlg );
		} } ]
	} );
}

/* ---------------- Alertas ---------------- */

function alertFilters() {
	var ids = ( ronda.config.abuseLog || {} ).alert;

	return ( Array.isArray( ids ) ? ids : [] ).map( Number ).filter( function ( n ) {
		return n > 0;
	} );
}

function badge( n ) {
	$( '#ronda-toolbar .ronda-btn-listar' ).toggleClass( 'ronda-btn-alert', n > 0 )
		.attr( 'data-alerta', n > 0 ? ronda.msg( 'patrulha-af-alerta-selo', n ) : null );
}

function clearBadge() {
	if ( window.localStorage ) {
		mw.storage.remove( BADGE_KEY );
	}
	badge( 0 );
}

/**
 * Ocorrências novas desde a última vista (o maior id do registro).
 * Na primeira vez só marca o ponto de partida, para não avisar do passado.
 * @return {Object[]} as novas, da mais recente para a mais antiga
 */
function fresh( entries, seen ) {
	if ( seen === null ) {
		return [];
	}
	return entries.filter( function ( e ) {
		return e.id > seen;
	} );
}

function notifyHits( hits ) {
	var $msg = $( '<div></div>' );

	hits.slice( 0, 3 ).forEach( function ( e ) {
		$msg.append( $( '<div></div>' ).append(
			$( '<a></a>' ).attr( 'href', mw.util.getUrl( 'Special:AbuseLog/' + e.id ) ).text( label( e.filter_id, e.filter ) ),
			document.createTextNode( ' — ' + ( e.user || '?' ) + ronda.msg( 'patrulha-af-alerta-em', e.title || '?' ) ) ) );
	} );
	if ( hits.length > 3 ) {
		$msg.append( $( '<div></div>' ).text( ronda.msg( 'patrulha-af-alerta-mais', hits.length - 3 ) ) );
	}
	$msg.append( $( '<a href="#" role="button"></a>' ).text( ronda.msg( 'patrulha-af-alerta-fila' ) ).on( 'click', function ( ev ) {
		ev.preventDefault();
		ronda.lists.open( 'FA' );
	} ) );
	mw.notify( $msg, { title: ronda.msg( 'patrulha-af-alerta-titulo' ), type: 'warn', autoHide: false, tag: 'ronda-filtro' } );
}

function poll() {
	var ids = alertFilters();

	if ( !ids.length || document.hidden ) {
		return $.Deferred().resolve( [] ).promise();
	}
	return ronda.api.get( { action: 'query', list: 'abuselog', aflfilter: ids.join( '|' ), afllimit: 20,
		aflprop: 'ids|filter|user|title|action|result|timestamp|revid' } ).then( function ( d ) {
		var entries = ( d.query || {} ).abuselog || [],
			raw = mw.storage.get( SEEN_KEY ),
			seen = raw === null || raw === false ? null : Number( raw ),
			hits = fresh( entries, seen ),
			top = entries.length ? entries[ 0 ].id : ( seen || 0 ),
			count;

		// Grava antes de avisar: outra aba aberta não repete o alerta
		mw.storage.set( SEEN_KEY, String( Math.max( top, seen || 0 ) ) );
		if ( hits.length ) {
			count = Number( mw.storage.get( BADGE_KEY ) || 0 ) + hits.length;
			mw.storage.set( BADGE_KEY, String( count ) );
			badge( count );
			notifyHits( hits );
		}
		return hits;
	}, function () {
		return [];
	} );
}

function start() {
	if ( !alertFilters().length || !ronda.can( 'abusefilter-log' ) ) {
		return;
	}
	badge( Number( mw.storage.get( BADGE_KEY ) || 0 ) );
	info();
	poll();
	setInterval( poll, POLL );
	// Selo em dia entre abas
	window.addEventListener( 'storage', function ( e ) {
		if ( e.key === BADGE_KEY ) {
			badge( Number( e.newValue || 0 ) );
		}
	} );
}

ronda.abuse = {
	info: info,
	access: access,
	label: label,
	openPicker: openPicker,
	fresh: fresh,
	poll: poll,
	clearBadge: clearBadge,
	alertFilters: alertFilters
};

mw.hook( 'ronda.ready' ).add( start );

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
				watchlist: ronda.config.watchlist,
				watchlistexpiry: ronda.watchExpiry( 'revert' )
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
			watchlist: ronda.config.watchlist,
			watchlistexpiry: ronda.watchExpiry( 'revert' )
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
					watchlist: ronda.config.watchlist,
					watchlistexpiry: ronda.watchExpiry( 'revert' )
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

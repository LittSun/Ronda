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
	// O Propor eliminação também tem o id 'eliminacao'; a chave separa os dois na barra
	key: 'eliminar',
	admin: true,
	rights: [ 'delete' ],
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
					watchlist: ronda.config.watchlist,
					watchlistexpiry: ronda.watchExpiry( 'move' )
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
	rights: [ ronda.config.unlink.right ],
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
	rights: [ 'protect' ],
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
	rights: [ 'block' ],
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
				watchlist: ronda.config.watchlist,
				watchlistexpiry: ronda.watchExpiry( 'move' )
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
	rights: [ 'undelete' ],
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
	rights: [ 'delete', 'protect', 'undelete' ],
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

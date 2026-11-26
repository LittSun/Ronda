// @target Usuário:Little Sunshine/Scripts/Ronda-loader.js
// Ronda — páginas (Manutenção, ER, ESR, Consenso, Mover, #R, Esboço, Fusão, Busca, PetScan, Informações, Pedido, Não assinou)
// Documentação: [[User:Little Sunshine/Ronda]]
// [[Usuário:Little Sunshine/Scripts/Ronda-loader.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-mensagens.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-core.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-catalogo.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-patrulha.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-paginas.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-admin.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda.css]]
//<nowiki>
( function ( ronda ) {
'use strict';

var ALIASES_TTL = 7 * 24 * 60 * 60 * 1000,
	HATNOTE = /^(dablink|distinguir|hatnote|(mini|ver )?desambig(?!-)|não confundir|nota:|outrosusos|redirect|rellink)/i;

function normName( s ) {
	return s
		.replace( /<!--[\s\S]*?-->/g, '' )
		.trim()
		.replace( /^subst\s*:\s*/i, '' )
		.replace( /^(predefinição|template)\s*:\s*/i, '' )
		.replace( /[_\s]+/g, ' ' )
		.toLowerCase();
}

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

function leadEnd( text ) {
	var m = /(^|\n)=[^\n]*=[ \t]*(?=\n|$)/.exec( text );

	return m ? m.index + m[ 1 ].length : text.length;
}

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

	if ( /\n\n$/.test( left ) ) {
		right = right.replace( /^\n+/, '' );
	}

	return left + right;
}

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

	a.lead.forEach( function ( occ ) {
		var item = occ.id ? o.byId[ occ.id ] : null;

		if ( item && !o.checked[ occ.id ] ) {
			addOnce( removed, occ.id );
			return;
		}
		( item && item.groupable === false ? solo : group ).push( occ.text );
	} );

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

		return ronda.post( {
			action: 'edit',
			title: mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + creator,
			appendtext: items.map( function ( item ) {
				return '\n\n{{subst:Aviso-' + item.warn + '|' + ctx.page + '}} ~~' + '~~';
			} ).join( '' ),
			summary: 'Aviso sobre a marcação da página "[[' + ctx.page + ']]" com '
				+ ( items.length === 1 ? 'a predefinição ' : 'as predefinições ' )
				+ listText( items.map( function ( item ) {
					return '"[[Predefinição:' + item.template + '|' + item.template + ']]"';
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
					summary: 'Adicionando a página "' + ctx.page + '"',
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
			var t = o.byId[ id ].template;
			return '[[Predefinição:' + t + '|' + t + ']]';
		} ).join( ', ' );
	}

	if ( r.added.length ) {
		parts.push( 'adicionando ' + names( r.added ) );
	}
	if ( r.removed.length ) {
		parts.push( 'removendo ' + names( r.removed ) );
	}
	if ( !parts.length ) {
		parts.push( ( o.useMP ? 'agrupando em ' : 'desagrupando ' ) + '{{' + o.mpName + '}}' );
	}

	return 'Manutenção: ' + parts.join( '; ' );
}

function showForm( ctx, text, aliases ) {
	var byId = {},
		base, a, groupablePresent, items = [],
		$filter = ronda.ui.text( '', ronda.msg( 'paginas-filtrar-marcacoes' ) ),
		$presentBox = $( '<fieldset class="ui-widget-content ui-corner-all"></fieldset>' )
			.append( $( '<legend></legend>' ).text( ronda.msg( 'paginas-presentes-na-pagina-desmarque-para-remover' ) ) ),
		$addBox = $( '<div class="ronda-tag-groups"></div>' ),
		addGroups = {},
		cbMP, cbWarn, $dlg;

	ronda.catalog.maintenance.forEach( function ( item ) {
		byId[ item.id ] = item;
	} );

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
			.data( 'search', ( item.label + ' ' + item.template ).toLowerCase() )
			.append( $params );

		if ( inputs.length && !isPresent ) {
			cb.$input.on( 'change', function () {
				$params.toggle( cb.isChecked() );
				cb.$element.toggleClass( 'ronda-tag-open', cb.isChecked() );
			} );
		}

		( isPresent ? $presentBox : addGroup( item.group ) ).append( cb.$element );
		items.push( { item: item, cb: cb, inputs: inputs, present: isPresent } );
	} );

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

	function submit() {
		var opts, preview, result,
			checked = {},
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

		if ( !ok ) {
			return;
		}

		opts = $.extend( {}, base, { checked: checked, values: values, useMP: cbMP.isChecked() } );
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

function open( ctx, options ) {
	$.when(
		loadAliases( options && options.refresh ),
		ronda.api.get( {
			action: 'query',
			titles: ctx.page,
			prop: 'revisions',
			rvprop: 'content',
			rvslots: 'main'
		} )
	).then( function ( aliases, res ) {
		var page = ( res && res.query ? res : res[ 0 ] ).query.pages[ 0 ],
			text = ronda.inEditForm() ? $( '#wpTextbox1' ).val()
				: ( page.revisions && page.revisions[ 0 ].slots.main.content ) || '';

		showForm( ctx, text, aliases );
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

( function ( ronda ) {
'use strict';

var SIG = '~~' + '~~',
	HATNOTE = /^(dablink|distinguir|hatnote|(mini|ver )?desambig(?!-)|não confundir|nota:|outrosusos|redirect|rellink)/i,
	FORBIDDEN_NS = [ 8, 828 ];

function paramSafe( text ) {
	return ronda.templateSafe( text );
}

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

function hasTag( text ) {
	return ronda.hasEliminationTag( text );
}

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
				'Página proposta para [[WP:ER|eliminação rápida]] (regra [[WP:' + r.rule + '|' + r.rule + ']])', false );
		}, !r.noWarn && warnType ? ( warnType === 'er'
			? 'Aviso-ER|' + page.title + '|' + r.rule + ( obs.trim() ? '|3=' + paramSafe( obs.trim() ) : '' )
			: 'Aviso-não remova|' + page.title + '|er' ) : null, extra.fn( page.title ) );
		tasks[ 0 ].label += ' (' + r.rule + ')';

		runTasks( $dlg, $progress, $log, tasks, ronda.msg( 'paginas-pagina-proposta-para-eliminacao-rapida' ) );
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
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}

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
			} ), 'Página proposta para [[WP:ESR|eliminação semirrápida]]', true );
		}, cbWarn.isChecked() ? 'Aviso-ESR|' + page.title : null );

		runTasks( $dlg, $progress, $log, tasks, ronda.msg( 'paginas-pagina-proposta-para-eliminacao-semirrapida' ) );
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
			text: ronda.msg( 'core-cancelar' ),
			click: function () {
				ronda.ui.close( $dlg );
			}
		} ]
	} );
}

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
	console.error( '[Ronda] Ronda-catalogo.js desatualizado: faltam as regras de ER/ESR. Os botões ER e ESR ficam ocultos.' );
}

ronda.registerModule( {
	id: 'rapida',
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

( function ( ronda ) {
'use strict';

var FORBIDDEN_NS = [ -1, 8, 828 ];

function cfg() {
	return ronda.config.consensus;
}

function peTitle( title ) {
	return cfg().prefix + title;
}

function hasEliminationTag( text ) {
	return ronda.hasEliminationTag( text );
}

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
		text = text.replace( /^(=+)([^\n]*?)\1[ \t]*$/m, function ( all, eq, inner ) {
			var suffix = extras.length === 1 && opts.headerSuffixSingular
				? opts.headerSuffixSingular
				: opts.headerSuffix.replace( '$1', function () {
					return String( extras.length );
				} );

			return eq + inner.replace( /\s+$/, '' ) + suffix + ' ' + eq;
		} );

		toolsRe = new RegExp( '\\{\\{\\s*' + opts.toolsTemplate.charAt( 0 ).replace( /[a-z]/i, function ( c ) {
			return '[' + c.toUpperCase() + c.toLowerCase() + ']';
		} ) + opts.toolsTemplate.slice( 1 ).replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ).replace( /[ _]/g, '[ _]' ) + '\\s*\\|' );
		m = toolsRe.exec( text );
		end = m ? templateEnd( text, m.index ) : -1;

		if ( end !== -1 ) {
			text = text.slice( 0, end ) + '\n' + toolLines.join( '\n' ) + text.slice( end );
		} else {
			body = toolLines.join( '\n' ) + '\n\n' + body;
		}
	}

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
			summary: extras.length
				? 'Criando página de eliminação (proposta conjunta com ' + extras.length + ' página(s))'
				: 'Criando página de eliminação',
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
		summary: 'Proposta conjunta: redirecionando para [[' + peTitle( master ) + ']]',
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
				summary: 'Página proposta para [[WP:Eliminação por consenso|eliminação por consenso]]'
					+ ( isBundle ? ' (proposta conjunta: [[' + peTitle( master ) + ']])' : '' ),
				nocreate: true,
				watchlist: ronda.config.watchlist
			} );
		} );
	} );
}

function warnCreator( title ) {
	return ronda.warnCreator( title, cfg().warnTemplate + '|' + title );
}

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

( function ( ronda ) {
'use strict';

function fullTitle( ns, title, names ) {
	title = ( title || '' ).trim().replace( /_/g, ' ' );
	return Number( ns ) === 0 || !names[ ns ] ? title : names[ ns ] + ':' + title;
}

function talkOf( ns, title, names ) {
	ns = Number( ns );
	return ns % 2 === 0 && names[ ns + 1 ] ? names[ ns + 1 ] + ':' + ( title || '' ).trim().replace( /_/g, ' ' ) : null;
}

function redirectTarget( text ) {
	var m = /^\s*#\s*(?:REDIRECIONAMENTO|REDIRECT)\s*:?\s*\[\[([^\]|#]+)/i.exec( text || '' );

	return m ? m[ 1 ].trim().replace( /_/g, ' ' ) : null;
}

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
		cbDelete = ronda.ui.checkbox( ronda.msg( 'paginas-eliminar-o-destino-antes-de-mover' ), false ),
		cbDeleteTalk = ronda.ui.checkbox( ronda.msg( 'paginas-eliminar-tambem-a-discussao-do-destino' ), false ),
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

		checking = null;
		check().then( function ( s ) {
			var tasks = [],
				moveTalk = !!( cbTalk && cbTalk.isChecked() ),
				reason = reasonFields ? reasonFields.value() : $reason.val().trim(),
				talkBlocked = moveTalk && s.talk && s.talk.exists && !( canDelete && cbDeleteTalk.isChecked() ),
				plan;

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

( function ( ronda ) {
'use strict';

var SIG = '~~' + '~~';

function redirectText( ns, target, reason ) {
	if ( ns === 14 ) {
		return '{{Redirecionamento de categoria|' + target.replace( /^(Categoria|Category):/i, '' ) + '|2=' + ( reason || '' ) + '}}';
	}
	return '#REDIRECIONAMENTO [[' + target + ']]';
}

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

function openRedirect( ctx ) {
	var isCat = ctx.ns === 14,
		$target = prefixSearch( ronda.ui.text( '', ronda.msg( 'paginas-pagina-de-destino' ) ), ctx.ns ),
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
				summary: 'Feito redirecionamento para [[' + target + ']]' + ( reason ? ' (' + reason + ')' : '' ),
				watchlist: ronda.config.watchlist
			},
			edit = ctx.exists || ronda.inEditForm()
				? ronda.editPage( ctx.page, function () {
					return ronda.params( params );
				} )
				: ronda.post( $.extend( {}, params, { action: 'edit', title: ctx.page, createonly: true,
					watchlist: ronda.creationWatchlist() } ) );

		ronda.ui.setBusy( $dlg, true );
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
			{ text: ronda.msg( 'core-cancelar' ), click: function () {
				ronda.ui.close( $dlg );
			} } ]
	} );
}

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
					summary: 'Página marcada como [[WP:EBC|esboço]]',
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
				{ text: ronda.msg( 'core-cancelar' ), click: function () {
					ronda.ui.close( $dlg );
				} } ]
		} );
	}, ronda.fail );
}

function openMerge( ctx ) {
	var $page1 = prefixSearch( ronda.ui.text( ctx.page, ronda.msg( 'paginas-pagina-que-permanecera' ) ), ctx.ns ),
		$page2 = prefixSearch( ronda.ui.text( '', ronda.msg( 'paginas-pagina-que-sera-fundida-com-a' ) ), ctx.ns ),
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
						summary: 'Adicionando proposta de fusão',
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

function formatDateTime( ts ) {
	return new Date( ts ).toLocaleString( 'pt-BR', { dateStyle: 'short', timeStyle: 'short' } );
}

var PROTECT_LEVELS = {
		autoconfirmed: 'autoconfirmados',
		extendedconfirmed: 'autoconfirmados estendidos',
		editautoreviewprotected: 'autorrevisores',
		sysop: 'administradores'
	},
	PROTECT_TYPES = { edit: 'edição', move: 'moção', create: 'criação', upload: 'carregamento' };

function protectionText( list ) {
	return ( list || [] ).map( function ( p ) {
		return ( PROTECT_TYPES[ p.type ] || p.type ) + ': ' + ( PROTECT_LEVELS[ p.level ] || p.level ) +
			( /^infinit/.test( p.expiry || '' ) ? ' (sem prazo)' : ' (até ' + new Date( p.expiry ).toLocaleDateString( 'pt-BR' ) + ')' ) +
			( p.source ? ' (cascata de ' + p.source + ')' : '' );
	} );
}

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
		return $.Deferred().resolve( xhr && xhr.status === 404 ? 0 : null ).promise();
	} );
}

function liftwingQuality( revid ) {
	return $.ajax( {
		url: 'https://api.wikimedia.org/service/lw/inference/v1/models/articlequality:predict',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify( { rev_id: revid, lang: 'pt' } ),
		dataType: 'json'
	} ).then( function ( r ) {
		var score = r && ( r.score !== undefined ? r.score : r.prediction !== undefined ? r.prediction : null );

		return typeof score === 'number' ? score : null;
	}, function () {
		return $.Deferred().resolve( null ).promise();
	} );
}

function soft( promise ) {
	return promise.then( function ( d ) {
		return d;
	}, function () {
		return $.Deferred().resolve( null ).promise();
	} );
}

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
				lelimit: 1
			}, ctx.ns % 2 === 0 ? {
				list: 'logevents|backlinks', bltitle: ctx.page, bllimit: 1, blnamespace: 0, blfilterredir: 'nonredirects'
			} : {} ) ).then( function ( d ) {
				return d;
			} );

		return $.when(
			main,
			soft( ronda.api.get( { action: 'query', titles: ctx.page, prop: 'revisions|contributors',
				rvdir: 'newer', rvlimit: 1, rvprop: 'user|timestamp', pclimit: 'max' } ) ),
			soft( ronda.api.get( { action: 'query', titles: ctx.page, prop: 'revisions', rvprop: 'ids', rvlimit: 'max' } ) ),
			ronda.can( 'deletedhistory' ) ? soft( ronda.api.get( { action: 'query', titles: ctx.page,
				prop: 'deletedrevisions', drvprop: 'ids', drvlimit: 'max' } ) ) : null,
			ronda.can( 'patrol' ) ? soft( ronda.api.get( { action: 'query', list: 'recentchanges', rctitle: ctx.page,
				rcshow: '!patrolled', rcprop: 'ids|timestamp|user', rctype: 'new|edit', rclimit: 50 } ) ) : null,
			ctx.exists ? pageviews( ctx.page ) : null,
			main.then( function ( d ) {
				var p = ( d.query.pages || [] ).filter( function ( x ) {
					return x.title === ctx.page;
				} )[ 0 ];

				return ctx.ns === 0 && p && p.lastrevid ? liftwingQuality( p.lastrevid ) : null;
			} )
		).then( function ( m, first, revs, deleted, patrol, views, lw ) {
			return { main: m, first: first, revisions: revs, deleted: deleted, patrol: patrol, views: views, lwQuality: lw, pe: pe, talk: talk };
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
		$status, $protect, $creation, $edits, $content, $maint, $links, $patrol, $audience, $actions, $view;

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
	page = byTitle[ ctx.page ] || ( q.pages || [] )[ 0 ] || {};
	peExists = byTitle[ data.pe ] && !byTitle[ data.pe ].missing;
	talkPage = data.talk && byTitle[ data.talk ];

	$status = L.row( ronda.msg( 'paginas-info-situacao' ) );
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

	if ( page.missing ) {
		$status.append( ( q.logevents || [] ).length
			? $( '<span></span>' ).append( ronda.msg( 'paginas-eliminada-em' ), $( '<b></b>' ).text( formatDateTime( q.logevents[ 0 ].timestamp ) ) )
			: $( '<span></span>' ).text( ronda.msg( 'paginas-info-nao-existe' ) ) );
	} else {
		addTo( $status, peExists
			? a( mw.util.getUrl( data.pe ), ronda.msg( 'paginas-ja-proposta-para-eliminacao' ) )
			: $( '<span></span>' ).text( ronda.msg( 'paginas-nunca-proposta-para-eliminacao' ) ) );
		if ( ( q.logevents || [] ).length ) {
			addTo( $status, $( '<span></span>' ).append( ronda.msg( 'paginas-ja-eliminada-em' ),
				a( mw.util.getUrl( 'Special:Log/delete', { page: ctx.page } ), formatDateTime( q.logevents[ 0 ].timestamp ) ) ) );
		}
	}

	if ( !page.missing || ( page.protection || [] ).length ) {
		$protect.append( ( page.protection || [] ).length
			? $( '<span class="ronda-up-hot"></span>' ).text( protectionText( page.protection ).join( '; ' ) )
			: $( '<span></span>' ).text( ronda.msg( 'paginas-info-sem-protecao' ) ) );
		addTo( $protect, a( mw.util.getUrl( 'Special:Log/protect', { page: ctx.page } ), ronda.msg( 'paginas-info-registro' ) ) );
	}

	if ( !page.missing ) {
		firstRev = data.first && ( ( ( data.first.query.pages || [] )[ 0 ] || {} ).revisions || [] )[ 0 ];
		if ( firstRev ) {
			$creation.append( document.createTextNode( ronda.msg( 'paginas-info-criada-por' ) ),
				a( mw.util.getUrl( 'Special:Contributions/' + firstRev.user ), firstRev.user ),
				document.createTextNode( ronda.msg( 'paginas-info-em', formatDateTime( firstRev.timestamp ) ) ) );
		}

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

		addTo( $content, [ document.createTextNode( ronda.msg( 'paginas-tamanho' ) + ': ' ),
			$( '<b></b>' ).text( ( page.length || 0 ).toLocaleString( 'pt-BR' ) + ' bytes' ) ] );
		if ( ctx.ns === 0 || ctx.ns === 100 ) {
			quality = $( '#mw-indicator-featured-star' ).length ? 'destacado'
				: $( '#mw-indicator-good-star' ).length ? 'bom'
					: qualityFromCategories( talkPage && talkPage.categories );
			addTo( $content, [ document.createTextNode( ronda.msg( 'paginas-qualidade' ) + ': ' ), $( '<b></b>' ).text( quality || 'desconhecida' ) ] );
		}
		if ( typeof data.lwQuality === 'number' ) {
			addTo( $content, $( '<span></span>' ).attr( 'title', ronda.msg( 'paginas-info-liftwing-dica' ) )
				.text( ronda.msg( 'paginas-info-liftwing', Math.round( data.lwQuality * 100 ) ) ) );
		}
		if ( ctx.ns === 0 && ( ctx.type === 'view' || ctx.type === 'diff' ) ) {
			refs = $( '#mw-content-text .references li' ).length;
			addTo( $content, refs ? $( '<span></span>' ).text( ronda.msg( 'paginas-info-referencias', refs ) ) : flag( false, ronda.msg( 'paginas-referencias' ) ) );
		}

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

		if ( ctx.ns % 2 === 0 && !ctx.isMainPage ) {
			addTo( $links, flag( $catLinks.length > 0 || ( page.categories || [] ).some( function ( c ) {
				return !/^Categoria:!/.test( c.title );
			} ), 'categorias' ) );
			addTo( $links, ( q.backlinks || [] ).length
				? flag( true, ronda.msg( 'paginas-info-afluentes-principal' ), mw.util.getUrl( 'Special:WhatLinksHere/' + ctx.page, { namespace: 0 } ) )
				: $( '<span class="ronda-bad"></span>' ).text( ronda.msg( 'paginas-info-orfa' ) ) );
		}
		langs = ( page.langlinks || [] ).length;
		wikidata = ( page.pageprops || {} ).wikibase_item;
		if ( ctx.ns === 0 || ctx.ns === 14 || ctx.ns === 10 ) {
			addTo( $links, langs ? $( '<span></span>' ).text( ronda.msg( 'paginas-info-linguas', langs ) ) : flag( false, ronda.msg( 'paginas-info-interwikis' ) ) );
			addTo( $links, wikidata
				? a( 'https://www.wikidata.org/wiki/' + wikidata, wikidata, true )
				: $( '<span class="ronda-bad"></span>' ).text( ronda.msg( 'paginas-info-sem-wikidata' ) ) );
		}

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

		if ( typeof data.views === 'number' ) {
			addTo( $audience, document.createTextNode( ronda.msg( 'paginas-info-visualizacoes', data.views.toLocaleString( 'pt-BR' ) ) ) );
		}
		addTo( $audience, document.createTextNode( ronda.msg( 'paginas-vigilantes' ) + ': ' +
			( page.watchers ? String( page.watchers ) : ronda.msg( 'paginas-poucos-ou-nenhum' ) ) ) );
	}

	addTo( $view, a( mw.util.getUrl( ctx.page, { action: 'history' } ), ronda.msg( 'paginas-info-historico' ) ) );
	addTo( $view, a( mw.util.getUrl( 'Special:Log', { page: ctx.page } ), ronda.msg( 'paginas-registros' ).toLowerCase() ) );
	addTo( $view, a( 'https://pageviews.wmcloud.org/?' + $.param( { project: 'pt.wikipedia.org', platform: 'all-access', agent: 'user',
		range: 'latest-30', pages: ctx.page.replace( / /g, '_' ) } ), ronda.msg( 'paginas-visualizacoes' ).toLowerCase(), true ) );
	addTo( $view, a( mw.util.getUrl( ctx.page, { action: 'info' } ), ronda.msg( 'paginas-mais-informacoes' ).toLowerCase() ) );

	$panel.append( L.build() );
}

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

function prefetchInfo( ctx ) {
	var parts = infoParts( ctx );

	if ( parts.page ) {
		loadInfo( ctx );
	}
	if ( parts.user ) {
		ronda.userPanel.load( ctx );
	}
}

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
				summary: 'Adicionando novo pedido',
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
			return ( v ? v + '; ' : '' ) + 'Adicionando a "[[Predefinição:Não assinou]]"';
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
//</nowiki>

// @target Usuário:Little Sunshine/Scripts/Ronda-loader.js
// Ronda — patrulha (Reverter, Avisar, Usuário, Listar, reversão rápida)
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

var DAY = 864e5,
	LEVEL_WORDS = { 2: 'Segundo ', 3: 'Terceiro ' },
	LEVEL_ORDINAL = { 1: 'primeiro', 2: 'segundo', 3: 'terceiro' };

function cfg() {
	return ronda.config.warnings;
}

function talkTitle( user ) {
	return mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + user;
}

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

function codeFor( item, level ) {
	return item.levels ? item.levels[ level ] : item.code;
}

function fill( code, values ) {
	return code.replace( /\$([a-z]+)/g, function ( all, key ) {
		return Object.prototype.hasOwnProperty.call( values, key ) ? String( values[ key ] ) : all;
	} ).replace( /(?:\|\s*(?:\w+\s*=\s*)?)+$/, '' );
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

function summaryFor( item, level ) {
	return item.levels && LEVEL_WORDS[ level ]
		? LEVEL_WORDS[ level ] + lcfirst( item.summary )
		: item.summary;
}

function marker( item, level, date ) {
	return '<!-- ronda-aviso:' + item.id + ( item.levels ? ':' + level : '' ) + ':' + date + ' -->';
}

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

function loadTalk( user ) {
	var title = talkTitle( user );

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
			prop: 'revisions',
			rvprop: 'content',
			rvslots: 'main'
		} ).then( first )
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

function patrolRcid() {
	var href = $( '.patrollink a' ).first().attr( 'href' );

	return href ? mw.util.getParamValue( 'rcid', href ) : null;
}

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

function listText( values ) {
	return values.length < 2 ? values.join( '' ) : values.slice( 0, -1 ).join( ', ' ) + ' e ' + values[ values.length - 1 ];
}

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

	$warnBox = $( '<fieldset class="ui-widget-content ui-corner-all"></fieldset>' )
		.append( $( '<legend></legend>' ).text( mode === 'revert' ? ronda.msg( 'patrulha-avisos-opcional' ) : ronda.msg( 'patrulha-avisos' ) ) );

	$warnBox.append( ronda.ui.row( ronda.msg( 'patrulha-pagina' ), $page ), ronda.ui.row( ronda.msg( 'patrulha-filtrar' ), $filter ) );

	( function () {
		var lastGroup = null,
			$group = null,
			$fav = $( '<fieldset class="ui-widget-content ui-corner-all ronda-warn-group ronda-warn-fav"></fieldset>' )
				.append( $( '<legend></legend>' ).text( ronda.msg( 'patrulha-favoritos' ) ) )
				.appendTo( $warnBox );

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
			var cb, prev, sug, $params, $level, fields, report, vreport, k, $note, $star;

			if ( ( item.ip === true && !isIP ) || ( item.ip === false && isIP ) ) {
				return;
			}

			if ( item.group !== lastGroup ) {
				lastGroup = item.group;
				$group = $( '<fieldset class="ui-widget-content ui-corner-all ronda-warn-group"></fieldset>' )
					.append( $( '<legend></legend>' ).text( item.group ) )
					.appendTo( $warnBox );
			}

			prev = previous( item, talk.revisions, talk.text, now, days );
			sug = suggest( prev );

			cb = ronda.ui.checkbox( item.label + ( prev ? ' · ' + prev.level : '' ), false );
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
					vreport = ronda.ui.checkbox( ronda.msg( 'patrulha-notificar-em-pedido-preenchido', cfg().vandalismPage.replace( /^Wikipédia:/, 'WP:' ) ), !ronda.can( 'block' ) );
					$params.append( vreport.$element );
				}
			}

			fields = ( item.fields || [] ).map( function ( f ) {
				var $input;

				if ( f.checks ) {
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
				.addClass( 'ronda-tag ronda-warn' + ( prev ? ' ronda-warn-prior' : '' ) )
				.attr( 'title', item.title + ( prev
					? ronda.msg( 'patrulha-ultimo-aviso-em', LEVEL_ORDINAL[ prev.level ], formatDate( prev.time ) )
					: '' ) )
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

	items.forEach( function ( it ) {
		if ( ctx.preselect && it.item.id === ctx.preselect ) {
			it.cb.$input.prop( 'checked', true ).trigger( 'change' );
		}
	} );

	$warnBox.append( cbWelcome.$element );
	setTimeout( function () {
		$filter.trigger( 'input' );
	} );
	$content.append( $warnBox, $progress, $log );

	$filter.on( 'input', function () {
		var term = normalize( $filter.val() );

		$warnBox.find( '.ronda-warn' ).each( function () {
			$( this ).toggle( !term || $( this ).data( 'search' ).indexOf( term ) !== -1 );
		} );
		$warnBox.children( '.ronda-warn-group' ).each( function () {
			$( this ).toggle( $( this ).children( '.ronda-warn' ).filter( function () {
				return this.style.display !== 'none';
			} ).length > 0 );
		} );
	} );

	function log( type, text ) {
		$( '<li></li>' ).addClass( type ? 'ui-state-' + type : '' ).text( text ).appendTo( $log );
	}

	function collect() {
		var ok = true,
			page = $page.val().trim(),
			chosen = [];

		items.forEach( function ( it ) {
			var values = { pagina: page },
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

	function warningEdit( chosen, welcome ) {
		var date = today(),
			built = function ( c ) {
				var t = build( c.item, c.level, c.values, { marker: cfg().marker, date: date } );

				return c.item.header ? '== ' + c.item.header + ' ==\n' + t : t;
			},
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
					summary: 'Adicionando pedido de revisão de nome de usuário',
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
			summary: 'Notificando vandalismo de [[Special:Contributions/' + user + '|' + user + ']]',
			watchlist: ronda.config.watchlist
		} );
	} );
}

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

( function ( ronda ) {
'use strict';

var DAY = 864e5,
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

function genderIndex( gender ) {
	return { male: 0, female: 1 }[ gender ] !== undefined ? { male: 0, female: 1 }[ gender ] : 2;
}

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
			reason: last.comment || '',
			action: last.action
		} : null
	};
}

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

ronda.userInfo = {
	groupList: groupList,
	recentWarnings: recentWarnings,
	summarize: summarize,
	ipRange: ipRange,
	activity: activity,
	blockHistory: blockHistory,
	groupDates: groupDates
};

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

function soft( promise ) {
	return promise.then( function ( d ) {
		return d;
	}, function () {
		return $.Deferred().resolve( null ).promise();
	} );
}

function loadExtra( user, isIP ) {
	var userPage = mw.config.get( 'wgFormattedNamespaces' )[ 2 ] + ':' + user,
		isRange = user.indexOf( '/' ) !== -1,
		contribs = {
			action: 'query',
			list: 'usercontribs',
			uclimit: 500,
			ucprop: 'ids|title|timestamp|tags|flags'
		},
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
		soft( ronda.api.get( global ) )
	).then( function ( uc, blk, created, deleted, rights, gb ) {
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
				globalBlock: gb && gb.query && ( gb.query.globalblocks || [] )[ 0 ] || null
			};

		if ( !titles.length ) {
			return out;
		}

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

function formatDate( ts ) {
	return new Date( ts ).toLocaleDateString( 'pt-BR' );
}

function link( title, text, params ) {
	return $( '<a></a>' ).attr( 'href', mw.util.getUrl( title, params ) ).text( text );
}

function expiryText( expiry ) {
	return /^infinit/.test( expiry || '' ) ? ronda.msg( 'patrulha-sem-prazo' ) : ronda.msg( 'patrulha-ate', new Date( expiry ).toLocaleString( 'pt-BR' ) );
}

function plain( text ) {
	return String( text || '' )
		.replace( /\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1' )
		.replace( /\[\[([^\]]+)\]\]/g, '$1' );
}

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

function render( $panel, ctx, user, isIP, info, talk, extra ) {
	var days = ( ronda.config.warnings && ronda.config.warnings.window ) || 30,
		warns = recentWarnings( talk, Date.now(), days ),
		$status = $( '<div class="ronda-up-line"></div>' ),
		$facts = $( '<div class="ronda-up-line"></div>' ),
		$warn = $( '<div class="ronda-up-line"></div>' ),
		$links = $( '<div class="ronda-up-line"></div>' ),
		avisar = ronda.getModule( 'avisar' ),
		bloquear = ronda.getModule( 'bloqueio' ),
		when, editcount, canWarn, canBlock, dates,
		$hist = $( '<div class="ronda-up-line"></div>' ),
		$act = $( '<div class="ronda-up-line"></div>' ),
		$extraLinks = $( '<div></div>' );

	$panel.empty();

	if ( info.missing ) {
		$panel.append( ronda.ui.message( 'error', $( '<span></span>' ).append(
			document.createTextNode( ronda.msg( 'patrulha-o-usuario' ) ), $( '<b></b>' ).text( user ), document.createTextNode( ronda.msg( 'patrulha-nao-existe' ) )
		) ) );
		return;
	}

	if ( info.block ) {
		$status.append( $( '<span class="ui-state-error ui-corner-all ronda-badge"></span>' ).append(
			$( '<b></b>' ).text( ( info.block.partial ? ronda.msg( 'patrulha-bloqueio-parcial' ) : ronda.msg( 'patrulha-bloqueado' ) )
				+ ( info.block.range && info.block.range !== user ? ' (intervalo ' + info.block.range + ')' : '' ) ),
			document.createTextNode( ronda.msg( 'patrulha-por', expiryText( info.block.expiry ), info.block.by, info.block.reason ? ' — ' + plain( info.block.reason ) : '' ) )
		) );
	}
	if ( info.locked ) {
		$status.append( ' ', $( '<span class="ui-state-error ui-corner-all ronda-badge"></span>' ).append(
			$( '<b></b>' ).text( ronda.msg( 'patrulha-travado-globalmente' ) )
		) );
	}

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

	$warn.append( document.createTextNode( ronda.msg( 'patrulha-avisos-dias', days ) ) );
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

	$links.append( link( 'Special:Contributions/' + user, ronda.msg( 'patrulha-contribuicoes' ) ) );
	$links.append(
		sep(), link( 'Special:Log', 'registros', { user: user } ),
		sep(), link( 'Special:Log/block', 'bloqueios', { page: mw.config.get( 'wgFormattedNamespaces' )[ 2 ] + ':' + user } )
	);
	if ( !isIP ) {
		$links.append( sep(), link( 'Special:CentralAuth/' + user, ronda.msg( 'patrulha-conta-global' ) ) );
	}

	canWarn = avisar && avisar.isAvailable( ctx );
	canBlock = bloquear && bloquear.isAvailable( ctx );
	if ( canWarn ) {
		$warn.append( document.createTextNode( ' — ' ), action( avisar, ctx, ronda.msg( 'patrulha-enviar-aviso-acao' ) ) );
	}
	if ( canBlock ) {
		$links.append( sep(), action( bloquear, ctx, info.block ? ronda.msg( 'patrulha-alterar-bloqueio' ) : 'bloquear' ) );
	}

	renderExtra( ctx, user, isIP, extra || {}, $status, $hist, $act, $links, $extraLinks );

	$panel.append( [ $status.children().length ? $status : null, $facts, $hist.contents().length ? $hist : null,
		$act.contents().length ? $act : null, $warn, $links, $extraLinks.children().length ? $extraLinks : null ].filter( Boolean ) );
}

function nsName( ns ) {
	return ns === 0 ? 'principal' : ( mw.config.get( 'wgFormattedNamespaces' )[ ns ] || String( ns ) );
}

function external( url, text, title ) {
	return $( '<a target="_blank" rel="noopener"></a>' ).attr( { href: url, title: title || '' } ).text( text );
}

function renderExtra( ctx, user, isIP, extra, $status, $hist, $act, $links, $extraLinks ) {
	var userPage = mw.config.get( 'wgFormattedNamespaces' )[ 2 ] + ':' + user,
		act = extra.contribs ? activity( extra.contribs, Date.now() ) : null,
		range = isIP ? ipRange( user ) : null,
		lote = ronda.getModule( 'lote' ),
		gb = extra.globalBlock,
		enc = encodeURIComponent( user ),
		$ipOut, $cu, $ip;

	function add( $line, nodes ) {
		if ( $line.contents().length ) {
			$line.append( sep() );
		}
		$line.append( nodes );
	}

	function line( nodes ) {
		return $( '<div class="ronda-up-line"></div>' ).append( nodes ).appendTo( $extraLinks );
	}

	if ( gb ) {
		$status.append( $status.children().length ? ' ' : '', $( '<span class="ui-state-error ui-corner-all ronda-badge"></span>' ).append(
			$( '<b></b>' ).text( ronda.msg( 'patrulha-bloqueio-global', gb.range || gb.target ? ' (' + ( gb.range || gb.target ) + ')' : '' ) ),
			document.createTextNode( ronda.msg( 'patrulha-por', expiryText( gb.expiry ), gb.by, gb.reason ? ' — ' + plain( gb.reason ) : '' ) )
		) );
	}

	if ( extra.blocks ) {
		add( $hist, [ document.createTextNode( ronda.msg( 'patrulha-bloqueios-anteriores' ) ),
			link( 'Special:Log/block', String( extra.blocks.count ), { page: userPage } ) ] );
		if ( extra.blocks.last ) {
			$hist.append( $( '<span></span>' )
				.addClass( extra.blocks.count >= 2 ? 'ronda-up-hot' : '' )
				.attr( 'title', plain( extra.blocks.last.reason ) )
				.text( ronda.msg( 'patrulha-ultimo-por', formatDate( extra.blocks.last.timestamp ), extra.blocks.last.by, extra.blocks.last.duration ? ', ' + extra.blocks.last.duration : '' ) ) );
		}
	}

	if ( act && act.sample ) {
		add( $hist, [ document.createTextNode( ronda.msg( 'patrulha-revertidas' ) ), $( '<b></b>' )
			.addClass( act.reverted / act.sample >= 0.3 ? 'ronda-up-hot' : '' )
			.text( act.reverted + ' de ' + act.sample ) ] );
	}

	if ( extra.created && extra.created.total ) {
		add( $hist, [ document.createTextNode( ronda.msg( 'patrulha-paginas-criadas' ) ),
			link( 'Special:Log/create', String( extra.created.total ) + ( extra.created.total >= 500 ? '+' : '' ), { user: user } ),
			document.createTextNode( extra.created.missing ? ' (' + extra.created.missing
				+ ( extra.created.missing === 1 ? ronda.msg( 'patrulha-nao-existe-mais' ) : ronda.msg( 'patrulha-nao-existem-mais' ) )
				+ ( extra.created.total > 200 ? ronda.msg( 'patrulha-entre-as-200-mais-recentes' ) : '' ) + ')' : '' ) ] );
		if ( lote && extra.created.existing.length && ronda.can( 'delete' ) ) {
			$hist.append( document.createTextNode( ' — ' ), $( '<a href="#" role="button" class="ronda-up-action ronda-up-admin"></a>' )
				.text( ronda.msg( 'patrulha-eliminar-as-criadas' ) )
				.attr( 'title', ronda.msg( 'patrulha-abre-o-lote-com-as-paginas', user ) )
				.on( 'click', function ( e ) {
					e.preventDefault();
					lote.open( $.extend( {}, ctx, { targetUser: user } ), { source: 'created', action: 'delete' } );
				} ) );
		}
	}

	if ( extra.deleted !== null && extra.deleted !== undefined ) {
		add( $hist, [ document.createTextNode( ronda.msg( 'patrulha-eliminadas' ) ),
			link( 'Special:DeletedContributions/' + user, extra.deleted + ( extra.deletedMore ? '+' : '' ) ) ] );
	}

	if ( act && act.last ) {
		add( $act, [ document.createTextNode( ronda.msg( 'patrulha-ultima-edicao' ) ), $( '<b></b>' ).text( new Date( act.last ).toLocaleString( 'pt-BR' ) ) ] );
		add( $act, document.createTextNode( '24 h: ' + act.day + ( act.full && act.day === 500 ? '+' : '' ) ) );
		add( $act, document.createTextNode( ronda.msg( 'patrulha-7-dias', act.week, act.full && act.week === 500 ? '+' : '' ) ) );
		add( $act, document.createTextNode( ronda.msg( 'patrulha-dominios', act.namespaces.slice( 0, 3 ).map( function ( n ) {
			return nsName( n[ 0 ] ) + ' (' + n[ 1 ] + ')';
		} ).join( ', ' ) ) ) );
	}

	if ( act && act.top.length && ronda.can( 'rollback' ) && user !== mw.config.get( 'wgUserName' ) ) {
		$links.append( sep(), $( '<a href="#" role="button" class="ronda-up-action ronda-up-admin"></a>' )
			.text( ronda.msg( 'patrulha-reverter-todas-no-topo', act.top.length ) )
			.on( 'click', function ( e ) {
				e.preventDefault();
				rollbackAll( user, act.top );
			} ) );
	}

	if ( ronda.can( 'checkuser' ) || ronda.can( 'checkuser-log' ) ) {
		$cu = line( document.createTextNode( ronda.msg( 'patrulha-checkuser' ) ) );
		if ( ronda.can( 'checkuser' ) ) {
			$cu.append( ' ', link( 'Special:CheckUser/' + user, 'verificar' ),
				sep(), link( 'Special:Investigate', 'investigar' ) );
		}
		if ( ronda.can( 'checkuser-log' ) ) {
			$cu.append( ronda.can( 'checkuser' ) ? sep() : ' ', link( 'Special:CheckUserLog/' + user, ronda.msg( 'patrulha-registro-de-verificacoes' ) ) );
		}
	}

	if ( !isIP ) {
		return;
	}

	if ( range ) {
		line( [ document.createTextNode( ronda.msg( 'patrulha-faixa', range ) ),
			link( 'Special:Contributions/' + range, ronda.msg( 'patrulha-contribuicoes' ) ), sep(),
			link( 'Special:BlockList', 'bloqueios', { wpTarget: range } ), sep(),
			external( 'https://meta.wikimedia.org/wiki/Special:GlobalBlockList?' + $.param( { target: range } ), 'bloqueios globais' ) ] );
	}

	$ip = line( [ document.createTextNode( ronda.msg( 'patrulha-ip' ) ),
		external( 'https://whois-referral.toolforge.org/gateway.py?lookup=true&ip=' + enc, 'WHOIS' ), sep(),
		external( 'https://bullseye.toolforge.org/ip/' + enc, 'localização', 'Bullseye' ), sep(),
		external( 'https://ipcheck.toolforge.org/index.php?ip=' + enc, 'proxy', 'IPCheck' ), sep(),
		external( 'https://spur.us/context/' + enc, 'Spur' ), sep(),
		external( 'https://guc.toolforge.org/?by=date&user=' + enc, 'contribuições globais', 'GUC' ) ] );

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

function isAvailable( ctx ) {
	return ronda.isUserContext( ctx );
}

function toggle( ctx ) {
	var user = ctx.targetUser,
		isIP = mw.util.isIPAddress( user, true );

	ronda.ui.togglePanel( 'usuario', function ( $panel ) {
		$panel.text( ronda.msg( 'patrulha-carregando-informacoes-de', user ) );
		$.when( loadUser( user, isIP ), loadTalk( user ), loadExtra( user, isIP ) ).then( function ( info, talk, extra ) {
			render( $panel, ctx, user, isIP, info, talk, extra );
		}, function () {
			$panel.text( ronda.msg( 'patrulha-nao-foi-possivel-obter-as-informacoes', user ) );
		} );
	} );
}

ronda.registerModule( {
	id: 'usuario',
	label: ronda.msg( 'patrulha-usuario-botao' ),
	title: ronda.msg( 'patrulha-mostrar-ou-esconder-as-informacoes-do' ),
	order: 2,
	isAvailable: isAvailable,
	open: toggle
} );

}( window.ronda ) );

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
				return { list: 'recentchanges', rctype: 'edit', rcnamespace: 0, rcshow: '!patrolled',
					rcprop: 'user|comment|title|sizes|ids', rclimit: 150 };
			}, key: 'recentchanges', link: 'revid', scores: true, empty: ronda.msg( 'patrulha-nenhuma-edicao-para-patrulhar-ou-desfazer' ) },
		{ id: 'ER', label: ronda.msg( 'patrulha-eliminacao-rapida' ), title: ronda.msg( 'patrulha-paginas-marcadas-para-eliminacao-rapida' ), params: function () {
			return { list: 'categorymembers', cmtitle: 'Categoria:!Páginas para eliminação rápida', cmlimit: MAX };
		}, key: 'categorymembers', link: 'page', empty: ronda.msg( 'patrulha-nenhuma-pagina-marcada-para-eliminacao-rapida' ) }
	],
	scoreCache = {},
	runId = 0;

function pickSuspects( list, scores ) {
	return list.filter( function ( rev ) {
		var s = scores[ rev.revid ];

		return s && s.damaging && s.goodfaith && s.damaging.prediction && !s.goodfaith.prediction;
	} ).sort( function ( a, b ) {
		return scores[ b.revid ].damaging.probability[ 'true' ] - scores[ a.revid ].damaging.probability[ 'true' ];
	} ).slice( 0, MAX );
}

function sizeDiff( item ) {
	var d = ( item.newlen || 0 ) - ( item.oldlen || 0 );

	return d > 0 ? '+' + d : String( d );
}

ronda.lists = { pickSuspects: pickSuspects, sizeDiff: sizeDiff };

function fetchScore( id, model, retry ) {
	var key = model + ':' + id;

	if ( scoreCache[ key ] ) {
		return $.Deferred().resolve( scoreCache[ key ] ).promise();
	}

	return $.ajax( {
		url: 'https://api.wikimedia.org/service/lw/inference/v1/models/ptwiki-' + model + ':predict',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify( { rev_id: id } ),
		dataType: 'json'
	} ).then( function ( res ) {
		scoreCache[ key ] = res.ptwiki.scores[ id ][ model ].score;
		return scoreCache[ key ];
	}, function ( xhr ) {
		if ( retry && ( xhr.status === 503 || xhr.status === 429 ) ) {
			return $.Deferred( function ( d ) {
				setTimeout( function () {
					fetchScore( id, model, false ).then( d.resolve, d.reject );
				}, 1000 );
			} ).promise();
		}
		return $.Deferred().reject( xhr ).promise();
	} );
}

function pool( ids, model, onResult, onProgress, stats ) {
	var d = $.Deferred(),
		queue = ids.slice(),
		total = ids.length,
		finished = 0,
		active = 0;

	function next() {
		if ( !queue.length && !active ) {
			d.resolve();
			return;
		}
		while ( active < 5 && queue.length ) {
			start( queue.shift() );
		}
	}

	function start( id ) {
		active++;
		fetchScore( id, model, true ).then( function ( score ) {
			stats.ok++;
			onResult( id, score );
		}, function () {
			stats.failures++;
		} ).always( function () {
			active--;
			finished++;
			onProgress( finished, total );
			next();
		} );
	}

	onProgress( 0, total );
	next();
	return d.promise();
}

function sep() {
	return document.createTextNode( ' · ' );
}

function pct( score ) {
	return Math.round( score.probability[ 'true' ] * 100 ) + '%';
}

function render( $out, def, list, scores ) {
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
			$li = $( '<li></li>' ).append( $( '<a></a>' ).attr( 'href', mw.util.getUrl( item.title, params ) ).text( item.title ) ),
			s = scores && scores[ item.revid ],
			d, n, comment;

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
			if ( s && s.damaging && s.goodfaith ) {
				$li.append( sep(), $( '<span class="ronda-bad"></span>' ).text( 'dano ' + pct( s.damaging ) ),
					' ', $( '<span class="ronda-feed-muted"></span>' ).text( ronda.msg( 'patrulha-boa-fe', pct( s.goodfaith ) ) ) );
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
		var list = ( data.query && data.query[ def.key ] ) || [],
			scores = {},
			stats = { ok: 0, failures: 0 },
			ids;

		if ( !def.scores ) {
			render( $out, def, list );
			return;
		}

		ids = list.map( function ( r ) {
			return r.revid;
		} );

		pool( ids, 'damaging', function ( rid, score ) {
			if ( score.prediction ) {
				scores[ rid ] = { damaging: score };
			}
		}, function ( done, total ) {
			if ( id === runId ) {
				$out.text( ronda.msg( 'patrulha-analisando-potencial-de-dano', done, total, stats.failures ? ' — ' + stats.failures + ' falha(s)' : '' ) );
			}
		}, stats ).then( function () {
			var suspects = ids.filter( function ( rid ) {
				return scores[ rid ];
			} );

			return suspects.length ? pool( suspects, 'goodfaith', function ( rid, score ) {
				scores[ rid ].goodfaith = score;
			}, function ( done, total ) {
				if ( id === runId ) {
					$out.text( ronda.msg( 'patrulha-verificando-boa-fe-nas-edicoes-suspeitas', total, done, total ) );
				}
			}, stats ) : null;
		} ).then( function () {
			var picked;

			if ( id !== runId ) {
				return;
			}
			if ( !stats.ok && stats.failures ) {
				$out.text( ronda.msg( 'patrulha-nao-foi-possivel-obter-as-pontuacoes' ) );
				return;
			}
			picked = pickSuspects( list, scores );
			if ( picked.length ) {
				render( $out, def, picked, scores );
			} else {
				$out.text( ronda.msg( 'patrulha-nenhuma-edicao-suspeita-entre-as-analisadas', ids.length, stats.failures ? ' — ' + stats.failures + ' falha(s)' : '' ) );
			}
		} );
	}, function () {
		$out.text( ronda.msg( 'patrulha-nao-foi-possivel-obter-a-lista', def.label ) );
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

( function ( ronda ) {
'use strict';

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
	return tpl.replace( /\$1/g, restoredUser || '' )
		.replace( /\$2/g, user || '' )
		.replace( /\$3/g, revid || '' )
		.replace( /\$4/g, reason || '' )
		.replace( /:\s*$/, '' );
}

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
			tpl = mode === 'agf' ? cfg().agfSummary : mode === 'vandal' ? cfg().vandalSummary
				: ronda.can( 'rollback' ) ? cfg().rollbackSummary : cfg().summary,
			summary;

		if ( !plan.ok ) {
			return $.Deferred().reject( 'ronda-quick', plan.reason ).promise();
		}
		summary = fillSummary( tpl, plan.good.user, user, plan.good.revid, reason );

		if ( ronda.can( 'rollback' ) ) {
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
					summary: fillSummary( cfg().restoreSummary, rev.user, '', rev.revid, '' ) + ( reason ? ' (' + reason + ')' : '' ),
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

	if ( ctx.type === 'diff' && links.diff ) {
		if ( ctx.newId && ( !cur || Number( ctx.newId ) === Number( cur ) ) && !$( '#mw-diff-ntitle2 .ronda-quick' ).length ) {
			$( '#mw-diff-ntitle2' ).append( ' ', revertLinks( ctx.page, ctx.targetUser ) );
		}
		if ( ctx.oldId && !$( '#mw-diff-otitle1 .ronda-quick' ).length ) {
			$( '#mw-diff-otitle1' ).append( ' ', restoreLink( ctx.page, ctx.oldId ) );
		}
	}

	if ( ctx.isRevision && links.diff && !$( '#mw-revision-info .ronda-quick' ).length ) {
		if ( mw.config.get( 'wgRevisionId' ) && Number( mw.config.get( 'wgRevisionId' ) ) !== Number( cur ) ) {
			$( '#mw-revision-info' ).append( ' ', restoreLink( ctx.page, mw.config.get( 'wgRevisionId' ) ) );
		}
	}

	if ( ctx.action === 'history' && links.history ) {
		$root.find( '#pagehistory li' ).not( ':has(.ronda-quick)' ).each( function () {
			var $li = $( this ),
				revid = $li.attr( 'data-mw-revid' );

			$li.append( ' ', cur && Number( revid ) === Number( cur )
				? revertLinks( ctx.page, userOf( $li ) )
				: restoreLink( ctx.page, revid ) );
		} );
	}

	if ( special === 'Contributions' && links.contribs ) {
		$root.find( 'li.mw-contributions-current' ).not( ':has(.ronda-quick)' ).each( function () {
			var $li = $( this ),
				title = $li.find( 'a.mw-contributions-title' ).first().text();

			if ( title && ctx.targetUser ) {
				$li.append( ' ', revertLinks( title, ctx.targetUser ) );
			}
		} );
	}

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
	mw.hook( 'wikipage.content' ).add( function ( $content ) {
		if ( ronda.ctx ) {
			decorate( $content );
		}
	} );
} );

}( window.ronda ) );
//</nowiki>

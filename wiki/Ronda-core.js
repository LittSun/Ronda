// @target Usuário:Little Sunshine/Scripts/Ronda-loader.js
// Ronda — núcleo
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
( function () {
'use strict';

var uid = 0,
	api = new mw.Api( { parameters: { formatversion: 2 } } ),
	ronda = window.ronda = {
		version: '0.7.10',
		api: api,
		modules: [],
		ctx: null,
		config: {
			tag: null,
			summarySuffix: ' (via [[User:Little Sunshine/Ronda|script]] #Ronda)',

			icon: 'UserScript Ronda Icon.svg',
			watchlist: 'preferences',
			unlink: {
				right: 'delete',
				namespaces: '0',
				currentNamespace: true
			},
			maintenance: {
				namespaces: [ 0 ]
			},
			consensus: {
				template: 'Predefinição:Página para eliminar',
				prefix: 'Wikipédia:Páginas para eliminar/',
				tagCode: 'subst:apagar',
				warnTemplate: 'Aviso-PE',
				toolsTemplate: 'PE-ferramentas2',
				headerSuffix: ' + $1 semelhantes',
				headerSuffixSingular: ' + 1 semelhante'
			},
			blockNotification: {
				gadget: 'ext.gadget.blockNotificationButton-api',
				page: 'MediaWiki:Gadget-blockNotificationButton-api.js'
			},
			deletion: {
				redirectReason: '[[WP:ER|ER]] R1: redirecionamento para página eliminada'
			},
			move: {
				deleteReason: '[[WP:ER|ER]] R2: eliminado para permitir a moção de [[$1]]'
			},
			revert: {
				summary: 'Desfeita(s) uma ou mais edições de [[Special:Contribs/$2|$2]]',
				rollbackSummary: 'Revertida(s) uma ou mais edições de [[Special:Contribs/$2|$2]]',
				agfSummary: 'Revertidas edições de boa-fé de [[Special:Contribs/$2|$2]]: $4',
				vandalSummary: 'Revertidas edições de [[Special:Contribs/$2|$2]] identificadas como vandalismo',
				restoreSummary: 'Restaurada a versão $3 de [[Special:Contribs/$1|$1]]',
				patrol: true,
				confirm: false,
				vandalWarn: true,
				links: { diff: true, history: true, contribs: true, recentchanges: true, watchlist: true }
			},
			warnings: {
				window: 30,
				marker: true,
				reportPage: 'Wikipédia:Pedidos/Revisão de nomes de usuário',
				vandalismPage: 'Wikipédia:Pedidos/Notificações de vandalismo',
				confirm: true
			}
		}
	};

ronda.messages = $.extend( {}, window.rondaMessages || {}, ( window.rondaConfig && window.rondaConfig.messages ) || {} );

ronda.msg = function ( key ) {
	var args = [].slice.call( arguments, 1 ),
		text = Object.prototype.hasOwnProperty.call( ronda.messages, key ) ? ronda.messages[ key ] : null;

	if ( text === null ) {
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

	if ( type === 'revision' ) {
		return $( '#mw-revision-name .mw-userlink bdi' ).first().text()
			|| $( '#mw-revision-name .mw-userlink' ).first().text()
			|| null;
	}

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

ronda.registerModule = function ( mod ) {
	ronda.modules.push( mod );
};

ronda.getModule = function ( id ) {
	return ronda.modules.filter( function ( m ) {
		return m.id === id;
	} )[ 0 ] || null;
};

ronda.withSuffix = function ( text ) {
	var suffix = ronda.config.summarySuffix;

	if ( !suffix || !text || text.slice( -suffix.length ) === suffix ) {
		return text;
	}
	return text + suffix;
};

ronda.params = function ( params ) {
	if ( ronda.config.tag ) {
		params.tags = ronda.config.tag;
	}
	[ 'summary', 'reason' ].forEach( function ( key ) {
		if ( typeof params[ key ] === 'string' ) {
			params[ key ] = params[ key ].trim()
				? ronda.withSuffix( params[ key ] )
				: ( ronda.config.summarySuffix || '' ).trim();
		}
	} );
	return params;
};

ronda.creationWatchlist = function () {
	return ronda.config.watchlist === 'unwatch' ? 'unwatch' : 'watch';
};

ronda.post = function ( params ) {
	return api.postWithToken( 'csrf', ronda.params( params ) );
};

ronda.loadMessages = function ( names ) {
	return api.loadMessagesIfMissing( names, { amlang: mw.config.get( 'wgContentLanguage' ) } );
};

var REASONS_TTL = 7 * 24 * 60 * 60 * 1000,
	EXPAND_REASONS = [ 'deletereason-dropdown' ];

function stripLinks( text ) {
	return text
		.replace( /\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1' )
		.replace( /\[\[([^\]]+)\]\]/g, '$1' );
}

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

ronda.notifyUser = function ( user, header, text, summary ) {
	return api.newSection(
		mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + user,
		header,
		text,
		ronda.params( { sectiontitle: header, summary: summary, watchlist: ronda.config.watchlist } )
	);
};

ronda.fail = function ( code, data ) {
	var msg = ( data && typeof data === 'object' && api.getErrorMessage )
		? api.getErrorMessage( data )
		: ronda.msg( 'core-erro', code || 'desconhecido' );

	mw.notify( msg, { type: 'error', title: ronda.msg( 'core-nome' ), autoHide: false } );
};

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

ronda.joinReason = function ( selected, extra ) {
	selected = ( selected || '' ).trim();
	extra = ( extra || '' ).trim();

	if ( selected && extra ) {
		return selected + ': ' + extra;
	}
	return selected || extra;
};

ronda.templateSafe = function ( text ) {
	return String( text ).replace( /\|/g, '{{!}}' );
};

ronda.ui = {};

ronda.ELIMINATION_TAG = /\{\{\s*(?:subst:)?(?:ER|ESR(?:2|-[\w\-]+)?|apagar\d*|usuário(?:\(a\))?:salebot\/impróprio)\s*[|}]/i;

ronda.hasEliminationTag = function ( text ) {
	return ronda.ELIMINATION_TAG.test( text || '' );
};

ronda.patrolRcid = function () {
	var href = $( '.patrollink a' ).first().attr( 'href' );

	return href ? mw.util.getParamValue( 'rcid', href ) : null;
};

ronda.useNoinclude = function ( page ) {
	return page.ns === 10 || page.title.indexOf( 'Wikipédia:Userbox/' ) === 0 || !!page.transcluded;
};

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

ronda.warnCreator = function ( title, code, summary ) {
	return ronda.eligibleCreator( title ).then( function ( creator ) {
		if ( !creator ) {
			return ronda.msg( 'core-sem-aviso-criador-nao-elegivel' );
		}

		return ronda.post( {
			action: 'edit',
			title: mw.config.get( 'wgFormattedNamespaces' )[ 3 ] + ':' + creator,
			appendtext: '\n\n{{subst:' + code + '}} ~~' + '~~',
			summary: summary || 'Aviso sobre a eliminação da página "[[' + title + ']]"',
			watchlist: ronda.config.watchlist
		} ).then( function () {
			return ronda.msg( 'core-aviso-enviado-a', creator );
		} );
	} );
};

function editForm() {
	var $box = $( '#wpTextbox1' );

	return ronda.ctx && ronda.ctx.type === 'edit' && $box.length ? $box : null;
}

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

ronda.inEditForm = function () {
	return !!editForm();
};

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

ronda.ui = ronda.ui || {};

$( document ).on( 'autocompleteopen', function ( e ) {
	var $input = $( e.target );

	if ( $input.closest( '.ronda-form, #ronda-toolbar' ).length ) {
		$input.autocomplete( 'widget' ).addClass( 'ronda-menu' );
	}
} );

ronda.ui.id = function ( prefix ) {
	return 'ronda-' + prefix + '-' + ( ++uid );
};

ronda.ui.dialog = function ( opts ) {
	var $dlg = $( '<div class="ronda-form"></div>' ).append( opts.content );

	var narrow = $( window ).width() < ( opts.width || 540 ) + 32;

	$dlg.dialog( {
		title: opts.title,
		dialogClass: 'ronda-dialog' + ( narrow ? ' ronda-dialog-narrow' : '' ),
		modal: true,
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

ronda.ui.close = function ( $dlg ) {
	$dlg.dialog( 'close' );
};

ronda.ui.setBusy = function ( $dlg, busy ) {
	$dlg.closest( '.ui-dialog' ).find( '.ui-dialog-buttonpane button' )
		.button( busy ? 'disable' : 'enable' );
};

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

ronda.ui.message = function ( type, content ) {
	return $( '<div class="ui-state-' + type + ' ui-corner-all ronda-msg"></div>' ).append(
		$( '<span class="ui-icon"></span>' ).addClass( type === 'error' ? 'ui-icon-alert' : 'ui-icon-info' ),
		content
	);
};

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

var panels = {};

ronda.ui.togglePanel = function ( id, build ) {
	var $panel = panels[ id ];

	$.each( panels, function ( k, $p ) {
		if ( k !== id ) {
			$p.hide();
		}
	} );

	if ( $panel ) {
		$panel.toggle();
		return $panel;
	}

	$panel = panels[ id ] = $( '<div class="ronda-userpanel"></div>' ).appendTo( '#ronda-toolbar' );
	build( $panel );
	return $panel;
};

ronda.ui.require = function ( $field, valid ) {
	$field.toggleClass( 'ui-state-error', !valid );
	return valid;
};

ronda.ui.onChange = function ( $el, fn ) {
	$el.on( 'change', fn );
};

ronda.ui.refreshSelect = function ( $select ) {
	$select.trigger( 'change' );
};

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
		select: function ( e, ui ) {
			$select.val( ui.item.value );
			ronda.ui.refreshSelect( $select );
			$input.val( '' );
			return false;
		}
	} );
};

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

ronda.ui.expiryValue = function ( $select, $other ) {
	return $select.val() === 'other' ? $other.val().trim() : $select.val();
};

ronda.ui.expiryLabel = function ( $select, $other ) {
	return $select.val() === 'other' ? $other.val().trim() : $select.find( 'option:selected' ).text();
};

function placeToolbar( $bar ) {
	var $target;

	if ( mw.config.get( 'skin' ) === 'vector-2022' && ( $target = $( '.vector-body-before-content' ) ).length ) {
		$target.before( $bar );
	} else if ( mw.config.get( 'skin' ) === 'minerva' && ( $target = $( '#bodyContent' ) ).length ) {
		$target.prepend( $bar );
	} else if ( ( $target = $( '#contentSub' ) ).length ) {
		$target.before( $bar );
	} else {
		mw.util.$content.before( $bar );
	}
}

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

ronda.renderToolbar = function () {
	var $group, $adminGroup, $bar,
		ctx = ronda.ctx,
		available = ronda.modules.filter( function ( m ) {
			try {
				return m.isAvailable( ctx );
			} catch ( e ) {
				console.error( '[Ronda] módulo "' + m.id + '" ignorado:', e );
				return false;
			}
		} ).sort( function ( a, b ) {
			return ( a.order || 0 ) - ( b.order || 0 );
		} );

	if ( !available.length ) {
		return null;
	}

	$group = $( '<div class="ronda-toolbar-group"></div>' );
	$adminGroup = $( '<div class="ronda-toolbar-group ronda-toolbar-admin"></div>' );

	available.forEach( function ( mod ) {
		$( '<button type="button"></button>' )
			.addClass( 'ronda-btn ronda-btn-' + mod.id + ( mod.admin ? ' ronda-btn-admin' : '' ) )
			.text( mod.label )
			.attr( 'title', mod.title || '' )
			.on( 'click', function () {
				mod.open( ctx );
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
	if ( !ronda.isMobile() ) {
		$bar.tooltip( { tooltipClass: 'ronda-tooltip' } );
	}

	return $bar;
};

ronda.PREFS = [
	{ section: 'Geral' },
	[ 'watchlist', ronda.msg( 'core-paginas-editadas' ), 'select', [ [ 'preferences', ronda.msg( 'core-seguir-as-minhas-preferencias-do-mediawiki' ) ],
		[ 'watch', ronda.msg( 'core-sempre-vigiar' ) ], [ 'nochange', ronda.msg( 'core-nao-mudar-a-vigilancia' ) ], [ 'unwatch', ronda.msg( 'core-deixar-de-vigiar' ) ] ] ],
	[ 'icon', ronda.msg( 'core-mostrar-o-icone-na-barra' ), 'icon' ],
	[ 'dryRun', ronda.msg( 'core-modo-de-simulacao-nada-e-gravado' ), 'check' ],
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
	var base = $.extend( true, {}, ronda.defaults, ronda.savedPrefs ),
		fields = [],
		$content = $( '<div></div>' ),
		$fs = null,
		$dlg;

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

	function save() {
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

		ronda.ui.setBusy( $dlg, true );
		$.Deferred( function ( d ) {
			mw.loader.using( 'mediawiki.api' ).then( function () {
				new mw.Api().postWithToken( 'csrf', {
					action: 'options',
					optionname: ronda.PREFS_OPTION,
					optionvalue: JSON.stringify( prefs )
				} ).then( d.resolve, d.reject );
			} );
		} ).then( function () {
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
};

ronda.PREFS_OPTION = 'userjs-ronda';
ronda.LOCKED_PREFS = [ 'summarySuffix', 'tag' ];
ronda.PREFS_VERSION = 2;
ronda.savedPrefs = ( function () {
	var prefs;

	try {
		prefs = JSON.parse( mw.user.options.get( ronda.PREFS_OPTION ) || '{}' ) || {};
	} catch ( e ) {
		prefs = {};
	}
	if ( !prefs._v && prefs.watchlist === 'nochange' ) {
		delete prefs.watchlist;
	}
	delete prefs._v;
	ronda.LOCKED_PREFS.forEach( function ( key ) {
		delete prefs[ key ];
	} );
	return prefs;
}() );
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

ronda.defaults = $.extend( true, {}, ronda.config );
$.extend( true, ronda.config, ronda.savedPrefs, window.rondaConfig || {} );

if ( ronda.config.dryRun ) {
	ronda.api.postWithToken = function ( tokenType, params ) {
		var p = $.extend( {}, params );

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

ronda.isMobile = function () {
	return mw.config.get( 'skin' ) === 'minerva' || document.body.classList.contains( 'mw-mf' );
};

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

function addControls( $bar ) {
	var collapsed = mw.storage.get( 'ronda-hidden' ) === '1',
		toggleLink = $bar && mw.util.addPortletLink( 'p-cactions', '#', ronda.msg( 'core-nome' ), 'ca-ronda-toggle', ronda.msg( 'core-exibir-ocultar-a-barra-do-ronda' ) ),
		prefsLink = mw.util.addPortletLink( 'p-cactions', '#', ronda.msg( 'core-preferencias-do-ronda' ), 'ca-ronda-prefs', ronda.msg( 'core-configurar-o-ronda' ) );

	function setCollapsed( value, inBar ) {
		collapsed = value;
		mw.storage.set( 'ronda-hidden', value ? '1' : '0' );
		if ( inBar ) {
			$bar.toggleClass( 'ronda-collapsed', value );
		} else {
			$bar.toggle( !value );
		}
	}

	if ( $bar && toggleLink ) {
		$bar.toggle( !collapsed );
		$( toggleLink ).on( 'click', function ( e ) {
			e.preventDefault();
			setCollapsed( !collapsed, false );
		} );
	} else if ( $bar ) {
		$bar.toggleClass( 'ronda-collapsed', collapsed );
		$bar.find( '.ronda-brand' ).attr( { role: 'button', tabindex: 0, title: ronda.msg( 'core-recolher-expandir-a-barra' ) } )
			.addClass( 'ronda-brand-toggle' )
			.on( 'click', function () {
				setCollapsed( !collapsed, true );
			} );
	}

	if ( prefsLink ) {
		$( prefsLink ).on( 'click', function ( e ) {
			e.preventDefault();
			ronda.openPreferences();
		} );
	} else if ( $bar ) {
		$( '<a href="#" role="button" class="ronda-prefs-link"></a>' )
			.text( ronda.msg( 'core-preferencias' ) )
			.on( 'click', function ( e ) {
				e.preventDefault();
				ronda.openPreferences();
			} )
			.appendTo( $bar );
	}
}

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

		$bar = ronda.renderToolbar();

		if ( $bar && ronda.config.dryRun ) {
			$bar.find( '.ronda-brand' ).after(
				$( '<span class="ui-state-highlight ui-corner-all ronda-dry"></span>' )
					.text( ronda.msg( 'core-simulacao' ) )
					.attr( 'title', ronda.msg( 'core-nada-e-gravado-na-wiki-as' ) )
			);
		}
		if ( $bar && ronda.isMobile() ) {
			$bar.addClass( 'ronda-mobile' );
		}

		addControls( $bar );

		mw.hook( 'ronda.ready' ).fire( ronda );
	} );
};

$( function () {
	ronda.start();
} );

}() );
//</nowiki>

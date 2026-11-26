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
		log = ( q.logevents || [] )[ 0 ],
		first = data.first && ( ( ( data.first.query.pages || [] )[ 0 ] || {} ).revisions || [] )[ 0 ],
		page = ( q.pages || [] ).filter( function ( p ) {
			return p.title === title && !p.missing;
		} )[ 0 ];

	if ( !log || !page || !first ) {
		return null;
	}
	return Date.parse( log.timestamp ) <= Date.parse( first.timestamp ) ? log : null;
}

ronda.infoTools = { titleSimilarity: titleSimilarity, similarTitles: similarTitles, recreation: recreation };

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
			}, ctx.ns % 2 === 0 ? {
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
				srsearch: ctx.title, srnamespace: 0, srlimit: 10, srinfo: '', srprop: '' } ) ) : null
		).then( function ( m, first, revs, deleted, patrol, views, lw, search ) {
			return { main: m, first: first, revisions: revs, deleted: deleted, patrol: patrol, views: views, autoQuality: lw, pe: pe, talk: talk,
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

		// O que havia (quem pode ver edições eliminadas): quem criou a última versão da página,
		// a última edição antes da eliminação, o total de edições e de editores
		drevs = data.deleted && ( ( ( data.deleted.query.pages || [] )[ 0 ] || {} ).deletedrevisions || [] );
		if ( drevs && drevs.length ) {
			newest = drevs[ 0 ];
			// As edições vêm da mais nova para a mais antiga; a criação mais recente é a primeira sem edição anterior
			created = drevs.filter( function ( r ) {
				return r.parentid === 0;
			} )[ 0 ];
			drevs.forEach( function ( r ) {
				editors[ r.user || '' ] = true;
			} );
			if ( created && created.user ) {
				$creation.append( document.createTextNode( ronda.msg( 'paginas-info-criada-por' ) ),
					a( mw.util.getUrl( 'Special:Contributions/' + created.user ), created.user ),
					document.createTextNode( ronda.msg( 'paginas-info-em', formatDateTime( created.timestamp ) ) ) );
			}
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
		if ( ctx.ns % 2 === 0 ) {
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
	if ( rec ) {
		$recreated.append( $( '<span class="ronda-bad"></span>' ).text( ronda.msg( 'paginas-info-recriada', formatDateTime( rec.timestamp ) ) ) );
		if ( rec.comment ) {
			addTo( $recreated, $( '<span class="ronda-feed-muted"></span>' ).text( rec.comment.replace( /<[^>]+>/g, '' ) ) );
		}
		addTo( $recreated, a( mw.util.getUrl( 'Special:Log/delete', { page: ctx.page } ), ronda.msg( 'paginas-info-registro' ) ) );
		if ( ronda.can( 'protect' ) ) {
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
		var rec = recreation( data, ctx.page );

		$( '#ronda-toolbar .ronda-btn-info' ).toggleClass( 'ronda-btn-alert', !!rec )
			.attr( 'data-alerta', rec ? ronda.msg( 'paginas-info-recriada-curto' ) : null );
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

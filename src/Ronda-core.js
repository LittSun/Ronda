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
	// assert: 'user' — se a sessão expirar (saída em outra aba, cookie vencido), a API
	// recusa o pedido em vez de gravar a edição deslogada, como IP ou conta temporária
	api = new mw.Api( { parameters: { formatversion: 2, assert: 'user' } } ),
	ronda = window.ronda = {
		version: '0.9.0',
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
			// Prazo da vigilância por tipo de ação ('' = sem prazo; ex.: '1 week', '1 month').
			// Vale quando a página passa a ser vigiada (watchlist 'watch' ou 'preferences');
			// uma vigilância sem prazo, ou com prazo mais longo, nunca é encurtada.
			watchExpiry: {
				revert: '',    // reversões, links rápidos, reverter todas no topo, restaurar versão
				warn: '',      // avisos e notificações em discussões de usuários
				tag: '',       // Manutenção, Esboço, Fusão e Redirecionar
				deletion: '',  // propostas de eliminação (ER, ESR, consenso e a discussão criada)
				request: '',   // pedidos e registros em páginas do domínio Wikipédia
				move: ''       // Mover, Restaurar e as edições do Desligar
			},
			// Buscar em segundo plano os dados dos painéis Usuário e Informações
			prefetch: true,
			// Barra personalizada (Preferências › Barra), com as chaves de ronda.moduleKey
			toolbar: {
				order: [],    // ordem escolhida; botões fora da lista vêm depois, na ordem padrão
				more: [],     // botões guardados no menu "Mais", no fim da barra
				hidden: []    // botões que não aparecem
			},
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
			speedy: {
				// Alerta ao propor ER para um artigo antigo ou com interwikis (0 = não considerar)
				oldDays: 365,         // dias desde a criação
				oldInterwikis: 3      // número de interwikis
			},
			move: {
				// Eliminação do destino antes de mover; $1 = página que será movida para lá
				deleteReason: '[[WP:ER|ER]] R2: eliminado para permitir a moção de [[$1]]'
			},
			// Filas › Grandes remoções: edições que tiraram pelo menos este número de bytes
			removals: {
				bytes: 2000
			},
			// Filas › Filtro de abusos: números dos filtros mostrados ([] = todos)
			abuseLog: {
				filters: []
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
 * @param {string} [mod.key] Chave nas preferências da barra, quando o id se repete (padrão: id)
 * @param {string[]} [mod.rights] Direitos dos quais basta um para usar o botão; sem eles, o
 *  botão não aparece nas preferências da barra
 * @param {Function} mod.isAvailable function ( ctx ) → boolean
 * @param {Function} mod.open function ( ctx, [options] )
 */
ronda.registerModule = function ( mod ) {
	ronda.modules.push( mod );
};

/** Chave do botão nas preferências da barra (toolbar.order, more e hidden) */
ronda.moduleKey = function ( mod ) {
	return mod.key || mod.id;
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
	// Sem prazo de vigilância para o tipo de ação (ronda.watchExpiry): o parâmetro sai
	if ( params.watchlistexpiry === undefined || params.watchlistexpiry === '' ) {
		delete params.watchlistexpiry;
	}
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

/** Prazos oferecidos nas preferências: [ valor da API, mensagem ] ('' = sem prazo) */
ronda.WATCH_EXPIRIES = [
	[ '', 'core-prazo-sem-prazo' ],
	[ '1 week', 'core-prazo-1-semana' ],
	[ '2 weeks', 'core-prazo-2-semanas' ],
	[ '1 month', 'core-prazo-1-mes' ],
	[ '3 months', 'core-prazo-3-meses' ],
	[ '6 months', 'core-prazo-6-meses' ]
];

/**
 * Prazo da vigilância (watchlistexpiry) para um tipo de ação de ronda.config.watchExpiry
 * (revert, warn, tag, deletion, request, move), ou undefined quando não há prazo ou a
 * página não vai ser vigiada. ronda.params tira o parâmetro quando ele é undefined.
 * @param {string} kind
 * @param {string} [watchlist] valor do parâmetro watchlist da mesma escrita
 *  (padrão: ronda.config.watchlist)
 */
ronda.watchExpiry = function ( kind, watchlist ) {
	var expiry = ( ronda.config.watchExpiry || {} )[ kind ];

	watchlist = watchlist || ronda.config.watchlist;
	if ( !expiry || expiry === 'infinite' || ( watchlist !== 'watch' && watchlist !== 'preferences' ) ) {
		return undefined;
	}
	return expiry;
};

/**
 * Momento (ms) em que um prazo relativo como '1 week' ou '3 months' termina, a partir
 * de now; null se o formato não for reconhecido. Meses contam 31 dias e anos, 366:
 * na dúvida, o prazo pedido parece mais longo e a vigilância atual é mantida.
 */
ronda.watchExpiryTime = function ( expiry, now ) {
	var DAY = 24 * 60 * 60 * 1000,
		units = { day: DAY, week: 7 * DAY, month: 31 * DAY, year: 366 * DAY },
		m = /^\s*(\d+)\s*(day|week|month|year)s?\s*$/i.exec( String( expiry || '' ) ),
		t;

	if ( m ) {
		return now + parseInt( m[ 1 ], 10 ) * units[ m[ 2 ].toLowerCase() ];
	}
	t = Date.parse( expiry );
	return isNaN( t ) ? null : t;
};

/**
 * A vigilância atual deve ficar como está? Sim se for sem prazo (current vazio) ou
 * terminar depois do prazo pedido: a API trocaria a atual pela nova, mais curta.
 * @param {string|undefined} current watchlistexpiry da página (prop=info, inprop=watched)
 * @param {string} requested prazo pedido (ex.: '1 week')
 */
ronda.keepWatch = function ( current, requested, now ) {
	var until = ronda.watchExpiryTime( requested, now || Date.now() ),
		cur;

	if ( !current ) {
		return true;
	}
	cur = Date.parse( current );
	return until !== null && !isNaN( cur ) && cur >= until;
};

/*
 * Escritas com prazo de vigilância: antes de gravar, consulta se a página já é vigiada.
 * Se a vigilância atual for sem prazo ou mais longa, o prazo é retirado do pedido, para
 * não encurtá-la. Se a consulta falhar, grava como pedido.
 */
( function () {
	var post = api.postWithToken;

	api.postWithToken = function ( type, params, ajaxOptions ) {
		var self = this,
			title = params && ( params.title || params.from );

		function send( p ) {
			return post.call( self, type, p, ajaxOptions );
		}
		if ( !params || !params.watchlistexpiry || !title ) {
			return post.apply( self, arguments );
		}
		return api.get( { action: 'query', prop: 'info', inprop: 'watched', titles: title } ).then( function ( data ) {
			var page = data && data.query && data.query.pages && data.query.pages[ 0 ],
				p = params;

			if ( page && page.watched && ronda.keepWatch( page.watchlistexpiry, params.watchlistexpiry ) ) {
				p = $.extend( {}, params );
				delete p.watchlistexpiry;
			}
			return send( p );
		}, function () {
			return send( params );
		} );
	};
}() );

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

/**
 * Sessão expirada: a API recusou um pedido por causa do assert: 'user'. Um aviso só
 * (a etiqueta substitui o anterior), que fica na tela até ser fechado.
 */
ronda.sessionExpired = function () {
	mw.notify( ronda.msg( 'core-sessao-expirada' ), {
		type: 'error',
		title: ronda.msg( 'core-nome' ),
		autoHide: false,
		tag: 'ronda-sessao'
	} );
};

// Todo pedido do Ronda (leitura ou escrita) passa por aqui; a promessa devolvida é a
// original, para não perder o abort() do mw.Api
[ 'get', 'post', 'postWithToken' ].forEach( function ( method ) {
	var original = api[ method ];

	api[ method ] = function () {
		var req = original.apply( this, arguments );

		req.then( null, function ( code ) {
			if ( code === 'assertuserfailed' ) {
				ronda.sessionExpired();
			}
		} );
		return req;
	};
} );

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
		ronda.params( { sectiontitle: header, summary: summary, watchlist: ronda.config.watchlist, watchlistexpiry: ronda.watchExpiry( 'warn' ) } )
	);
};

ronda.fail = function ( code, data ) {
	var msg;

	// Sessão expirada: o aviso próprio (ronda.sessionExpired) já foi mostrado
	if ( code === 'assertuserfailed' ) {
		return;
	}
	msg = ( data && typeof data === 'object' && api.getErrorMessage )
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
				watchlist: ronda.config.watchlist,
				watchlistexpiry: ronda.watchExpiry( 'warn' )
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

/**
 * Botões na ordem das preferências (toolbar.order): os da lista vêm na ordem dela; os
 * demais (ex.: um módulo novo), depois, na ordem padrão (mod.order).
 * @param {Object[]} mods
 * @param {string[]} [order] chaves de ronda.moduleKey
 * @return {Object[]} nova lista
 */
ronda.toolbarSort = function ( mods, order ) {
	order = order || [];

	function rank( m ) {
		var k = order.indexOf( ronda.moduleKey( m ) );

		return k === -1 ? order.length : k;
	}
	return mods.map( function ( m, i ) {
		return { m: m, i: i };
	} ).sort( function ( a, b ) {
		return ( rank( a.m ) - rank( b.m ) ) || ( ( a.m.order || 0 ) - ( b.m.order || 0 ) ) || ( a.i - b.i );
	} ).map( function ( x ) {
		return x.m;
	} );
};

ronda.renderToolbar = function () {
	var $group, $adminGroup, $bar, $more, $firstMore,
		ctx = ronda.ctx,
		testing = ronda.modoTeste(),
		tb = ronda.config.toolbar || {},
		hidden = tb.hidden || [],
		more = tb.more || [],
		available = ronda.toolbarSort( ronda.modules.filter( function ( m ) {
			if ( testing ) {
				return true;
			}
			// Módulos "hidden" só são abertos por outros (ex.: ER pelo Propor eliminação);
			// os escondidos nas preferências da barra também ficam de fora
			if ( m.hidden || hidden.indexOf( ronda.moduleKey( m ) ) !== -1 ) {
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
		} ), tb.order );

	if ( !available.length ) {
		return null;
	}

	/** Guardado no menu "Mais" (Preferências › Barra) */
	function inMore( mod ) {
		return more.indexOf( ronda.moduleKey( mod ) ) !== -1;
	}

	// Dois grupos: edição/patrulha e ações administrativas (mod.admin)
	$group = $( '<div class="ronda-toolbar-group"></div>' );
	$adminGroup = $( '<div class="ronda-toolbar-group ronda-toolbar-admin"></div>' );

	// Os do menu "Mais" vão para o fim do grupo, escondidos até o menu ser aberto
	available.filter( function ( mod ) {
		return !inMore( mod );
	} ).concat( available.filter( inMore ) ).forEach( function ( mod ) {
		$( '<button type="button"></button>' )
			.addClass( 'ronda-btn ronda-btn-' + mod.id + ( mod.admin ? ' ronda-btn-admin' : '' ) + ( inMore( mod ) ? ' ronda-btn-mais-item' : '' ) )
			.toggle( !inMore( mod ) )
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

	// Botão "Mais": mostra ou esconde os botões guardados, nos dois grupos
	if ( available.some( inMore ) ) {
		$more = $( '<button type="button" class="ronda-btn ronda-btn-mais"></button>' )
			.text( ronda.msg( 'core-barra-mais' ) )
			.attr( { title: ronda.msg( 'core-barra-mais-dica' ), 'aria-expanded': 'false' } )
			.on( 'click', function () {
				var open = $more.attr( 'aria-expanded' ) !== 'true';

				$more.attr( 'aria-expanded', String( open ) );
				$more.button( 'option', 'label', ronda.msg( open ? 'core-barra-menos' : 'core-barra-mais' ) );
				$bar.find( '.ronda-btn-mais-item' ).toggle( open );
			} );
		$firstMore = $group.children( '.ronda-btn-mais-item' ).first();
		if ( $firstMore.length ) {
			$more.insertBefore( $firstMore );
		} else {
			$more.appendTo( $group.children().length ? $group : $adminGroup );
		}
	}

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

/** Opções dos prazos de vigilância: [ valor, rótulo ] */
function watchExpiryOptions() {
	return ronda.WATCH_EXPIRIES.map( function ( o ) {
		return [ o[ 0 ], ronda.msg( o[ 1 ] ) ];
	} );
}

/** Campos do diálogo: [ caminho, rótulo, tipo, opções ]; { section } abre um grupo e { note }, uma explicação */
ronda.PREFS = [
	{ section: 'Geral' },
	[ 'theme', ronda.msg( 'core-tema' ), 'select', ronda.THEMES ],
	[ 'icon', ronda.msg( 'core-mostrar-o-icone-na-barra' ), 'icon' ],
	[ 'dryRun', ronda.msg( 'core-modo-de-simulacao-nada-e-gravado' ), 'check' ],
	[ 'prefetch', ronda.msg( 'core-pre-carregar-paineis' ), 'check' ],
	{ section: 'Vigilância' },
	[ 'watchlist', ronda.msg( 'core-paginas-editadas' ), 'select', [ [ 'preferences', ronda.msg( 'core-seguir-as-minhas-preferencias-do-mediawiki' ) ],
		[ 'watch', ronda.msg( 'core-sempre-vigiar' ) ], [ 'nochange', ronda.msg( 'core-nao-mudar-a-vigilancia' ) ], [ 'unwatch', ronda.msg( 'core-deixar-de-vigiar' ) ] ] ],
	{ note: ronda.msg( 'core-prazo-nota' ) },
	[ 'watchExpiry.revert', ronda.msg( 'core-prazo-revert' ), 'select', watchExpiryOptions() ],
	[ 'watchExpiry.warn', ronda.msg( 'core-prazo-warn' ), 'select', watchExpiryOptions() ],
	[ 'watchExpiry.tag', ronda.msg( 'core-prazo-tag' ), 'select', watchExpiryOptions() ],
	[ 'watchExpiry.deletion', ronda.msg( 'core-prazo-deletion' ), 'select', watchExpiryOptions() ],
	[ 'watchExpiry.request', ronda.msg( 'core-prazo-request' ), 'select', watchExpiryOptions() ],
	[ 'watchExpiry.move', ronda.msg( 'core-prazo-move' ), 'select', watchExpiryOptions() ],
	{ section: 'Reversão' },
	[ 'revert.patrol', ronda.msg( 'core-marcar-como-patrulhada-ao-reverter' ), 'check' ],
	[ 'revert.confirm', ronda.msg( 'core-pedir-confirmacao-antes-de-reverter-pelos' ), 'check' ],
	[ 'revert.vandalWarn', ronda.msg( 'core-abrir-o-avisar-depois-de-reverter' ), 'check' ],
	[ 'revert.links.diff', ronda.msg( 'core-links-rapidos-em-diffs-e-versoes' ), 'check' ],
	[ 'revert.links.history', ronda.msg( 'core-links-rapidos-no-historico' ), 'check' ],
	[ 'revert.links.contribs', ronda.msg( 'core-links-rapidos-nas-contribuicoes' ), 'check' ],
	[ 'revert.links.recentchanges', ronda.msg( 'core-links-rapidos-nas-mudancas-recentes' ), 'check' ],
	[ 'revert.links.watchlist', ronda.msg( 'core-links-rapidos-nas-paginas-vigiadas' ), 'check' ],
	{ section: 'Filas' },
	[ 'removals.bytes', ronda.msg( 'core-fila-remocoes-bytes' ), 'number' ],
	[ 'abuseLog.filters', ronda.msg( 'core-fila-abusos-filtros' ), 'list' ],
	{ section: 'Avisos' },
	[ 'warnings.window', ronda.msg( 'core-dias-considerados-para-sugerir-o-nivel' ), 'number' ],
	[ 'warnings.marker', ronda.msg( 'core-deixar-marca-oculta-depois-de-cada' ), 'check' ],
	[ 'warnings.confirm', ronda.msg( 'core-confirmar-aviso-repetido-em-24-h' ), 'check' ],
	{ section: 'Eliminação rápida' },
	[ 'speedy.oldDays', ronda.msg( 'core-er-antiga-dias' ), 'number', { min: 0 } ],
	[ 'speedy.oldInterwikis', ronda.msg( 'core-er-antiga-iw' ), 'number', { min: 0 } ],
	{ section: 'Outros' },
	[ 'unlink.namespaces', ronda.msg( 'core-dominios-onde-o-desligar-remove-ligacoes' ), 'text' ],
	[ 'unlink.currentNamespace', ronda.msg( 'core-desligar-tambem-no-dominio-da-propria' ), 'check' ],
	[ 'maintenance.namespaces', ronda.msg( 'core-dominios-do-botao-manutencao-ex-0' ), 'list' ],
	{ section: 'Barra' },
	[ 'toolbar', ronda.msg( 'core-barra-intro' ), 'toolbar' ]
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

/** Mínimo de um campo numérico das preferências: { min } no quarto item, ou 1 */
function numberMin( f ) {
	return f[ 3 ] && typeof f[ 3 ].min === 'number' ? f[ 3 ].min : 1;
}

/**
 * Editor da barra nas preferências: um quadro para patrulha e edição e outro para as
 * ações administrativas (cada grupo tem o seu lugar na barra), com ▲ ▼ para mudar a
 * ordem e um menu por botão: na barra, no menu "Mais" ou escondido. Só aparecem os
 * botões que a conta pode usar (mod.rights).
 * @param {Object} cur { order, more, hidden }
 * @param {string} intro texto explicativo
 * @return {{ $element: jQuery, value: Function }} value() → { order, more, hidden }
 */
function toolbarEditor( cur, intro ) {
	var testing = ronda.modoTeste(),
		$el = $( '<div class="ronda-pref-barra"></div>' ),
		mods = ronda.modules.filter( function ( m ) {
			return !m.hidden && ( testing || !m.rights || m.rights.some( function ( r ) {
				return ronda.can( r );
			} ) );
		} ),
		byDefault = ronda.toolbarSort( mods ),
		// Como no diálogo: primeiro patrulha e edição, depois administração
		defaultKeys = byDefault.filter( function ( m ) {
			return !m.admin;
		} ).concat( byDefault.filter( function ( m ) {
			return !!m.admin;
		} ) ).map( function ( m ) {
			return ronda.moduleKey( m );
		} );

	function arrow( text, msg, dir, $li ) {
		return $( '<button type="button" class="ronda-pref-barra-seta"></button>' ).text( text )
			.attr( { title: ronda.msg( msg ), 'aria-label': ronda.msg( msg ) } )
			.button()
			.on( 'click', function () {
				var $btn = $( this ),
					$other = dir < 0 ? $li.prev() : $li.next();

				if ( $other.length ) {
					$li[ dir < 0 ? 'insertBefore' : 'insertAfter' ]( $other );
				}
				$btn.trigger( 'focus' );
			} );
	}

	function row( m, conf ) {
		var key = ronda.moduleKey( m ),
			$li = $( '<li></li>' ).attr( 'data-key', key ),
			$sel = $( '<select></select>' ).append(
				$( '<option value="bar"></option>' ).text( ronda.msg( 'core-barra-na-barra' ) ),
				$( '<option value="more"></option>' ).text( ronda.msg( 'core-barra-no-mais' ) ),
				$( '<option value="hidden"></option>' ).text( ronda.msg( 'core-barra-escondido' ) )
			).attr( 'aria-label', m.label );

		$sel.val( ( conf.hidden || [] ).indexOf( key ) !== -1 ? 'hidden'
			: ( conf.more || [] ).indexOf( key ) !== -1 ? 'more' : 'bar' );
		$li.toggleClass( 'ronda-pref-barra-off', $sel.val() === 'hidden' );
		$sel.on( 'change', function () {
			$li.toggleClass( 'ronda-pref-barra-off', $sel.val() === 'hidden' );
		} );
		return $li.append(
			arrow( '▲', 'core-barra-subir', -1, $li ),
			arrow( '▼', 'core-barra-descer', 1, $li ),
			$( '<span class="ronda-pref-barra-nome"></span>' ).text( m.label ).attr( 'title', m.title || '' ),
			$sel
		);
	}

	function build( conf ) {
		var sorted = ronda.toolbarSort( mods, conf.order );

		$el.empty().append( $( '<p class="ronda-pref-barra-intro"></p>' ).text( intro ) );
		[ [ false, 'core-barra-grupo-patrulha' ], [ true, 'core-barra-grupo-admin' ] ].forEach( function ( g ) {
			var group = sorted.filter( function ( m ) {
					return !!m.admin === g[ 0 ];
				} ),
				$list = $( '<ol class="ronda-pref-barra-lista"></ol>' );

			if ( !group.length ) {
				return;
			}
			group.forEach( function ( m ) {
				$list.append( row( m, conf ) );
			} );
			$el.append( $( '<div class="ronda-pref-barra-grupo"></div>' ).text( ronda.msg( g[ 1 ] ) ), $list );
		} );
		$( '<button type="button" class="ronda-pref-barra-padrao"></button>' ).text( ronda.msg( 'core-barra-padrao' ) )
			.button()
			.on( 'click', function () {
				build( {} );
			} )
			.appendTo( $el );
	}

	build( cur );

	return {
		$element: $el,
		value: function () {
			var out = { order: [], more: [], hidden: [] };

			$el.find( 'li[data-key]' ).each( function () {
				var key = $( this ).attr( 'data-key' ),
					v = $( this ).find( 'select' ).val();

				out.order.push( key );
				if ( v === 'more' ) {
					out.more.push( key );
				} else if ( v === 'hidden' ) {
					out.hidden.push( key );
				}
			} );
			// Ordem padrão: nada a guardar (assim, mudanças futuras na ordem padrão valem)
			if ( out.order.join( '|' ) === defaultKeys.join( '|' ) ) {
				out.order = [];
			}
			return out;
		}
	};
}

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
		if ( f.note ) {
			$fs.append( $( '<p class="ronda-pref-nota"></p>' ).text( f.note ) );
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
		if ( type === 'toolbar' ) {
			cb = toolbarEditor( cur || {}, label );
			$fs.append( cb.$element );
			fields.push( { path: path, type: type, read: cb.value } );
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
				? $( '<input type="number" class="ui-widget ui-widget-content ui-corner-all ronda-input">' ).attr( 'min', numberMin( f ) ).val( cur )
				: ronda.ui.text( type === 'list' ? ( cur || [] ).join( ', ' ) : ( cur === undefined ? '' : String( cur ) ), '' );
		}
		$fs.append( ronda.ui.row( label, $input ) );
		fields.push( { path: path, type: type, min: numberMin( f ), read: function () {
			return $input.val();
		} } );
	} );

	function collect() {
		var prefs = { _v: ronda.PREFS_VERSION };

		fields.forEach( function ( f ) {
			var v = f.read();

			if ( f.type === 'number' ) {
				v = parseInt( v, 10 );
				v = Math.max( f.min, isNaN( v ) ? f.min : v );
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
	'Se a sessão expirar, o Ronda não grava nada deslogado: avisa para entrar de novo na conta',
	'Vigilância por tempo determinado: um prazo para cada tipo de ação, em Preferências › Vigilância',
	'Eliminação rápida: alerta para artigos antigos ou com interwikis, com limites em Preferências › Eliminação rápida',
	'Barra personalizável: ordem dos botões, menu "Mais" e botões escondidos, em Preferências › Barra',
	'Filas: Grandes remoções, com o limite em bytes em Preferências › Filas',
	'Filas: Filtro de abusos, com a escolha dos filtros em Preferências › Filas'
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

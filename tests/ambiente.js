/**
 * Ambiente de teste: jsdom + jQuery + jQuery UI + um "mw" simulado.
 * Carrega os arquivos de src/ como o carregador faria e registra toda escrita
 * (postWithToken, edit) em `calls`, sem nada sair para a rede.
 *
 *   const amb = criar( { rights: [ 'delete', … ], user: 'Eu', responder: ( params ) => dados } );
 *   amb.ronda, amb.$, amb.calls, amb.esperar()
 */
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { JSDOM } = require( 'jsdom' );

const SRC = process.env.RONDA_SRC || path.join( __dirname, '..', 'src' );
const ARQUIVOS = [ 'Ronda-mensagens.js', 'Ronda-core.js', 'Ronda-catalogo.js', 'Ronda-patrulha.js', 'Ronda-paginas.js', 'Ronda-admin.js' ];

function criar( opts ) {
	opts = opts || {};
	const dom = new JSDOM( '<!doctype html><html><body><div id="bodyContent"><div id="mw-content-text"></div></div></body></html>', {
		runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://pt.wikipedia.org/wiki/Teste'
	} );
	const w = dom.window;
	const calls = [];
	const consultas = [];
	const notificacoes = [];
	const confirmacoes = [];
	const user = opts.user || 'Eu';
	const rights = opts.rights || [ 'edit', 'createpage', 'move', 'patrol' ];
	const config = Object.assign( {
		wgFormattedNamespaces: { '-1': 'Especial', 0: '', 1: 'Discussão', 2: 'Usuário(a)', 3: 'Usuário(a) Discussão',
			4: 'Wikipédia', 5: 'Wikipédia Discussão', 6: 'Ficheiro', 10: 'Predefinição', 14: 'Categoria' },
		wgUserName: user, wgContentLanguage: 'pt', wgDBname: 'ptwiki', wgNamespaceNumber: 0, wgPageName: 'Teste',
		wgTitle: 'Teste', wgAction: 'view', wgCanonicalSpecialPageName: false, wgIsProbablyEditable: true,
		wgArticleId: 1, wgCurRevisionId: 10, wgRevisionId: 10, wgMainPageTitle: 'Página principal',
		wgUserGroups: [ '*', 'user' ]
	}, opts.config || {} );

	w.eval( fs.readFileSync( require.resolve( 'jquery/dist/jquery.js' ), 'utf8' ) );
	w.eval( fs.readFileSync( require.resolve( 'jquery-ui/dist/jquery-ui.js' ), 'utf8' ) );
	const $ = w.jQuery;
	const D = ( v ) => $.Deferred().resolve( v ).promise();
	const R = ( code, data ) => $.Deferred().reject( code, data || { error: { code: code } } ).promise();

	function responder( params ) {
		const r = opts.responder ? opts.responder( params ) : undefined;

		if ( r !== undefined ) {
			return r;
		}
		if ( params.meta === 'allmessages' || params.meta === 'siteinfo' ) {
			return { query: { allmessages: [], restrictions: { types: [ 'edit', 'move', 'create' ], levels: [ '', 'autoconfirmed', 'sysop' ] } } };
		}
		return { query: { pages: [ { title: params.titles, missing: true } ] } };
	}

	function Api() {}
	Api.prototype.get = function ( params ) {
		consultas.push( params );
		const r = responder( params );

		// Como o mw.Api de verdade: resolve com ( dados, jqXHR ), o que faz $.when entregar arrays
		return r && typeof r.then === 'function' ? r : $.Deferred().resolve( r, {} ).promise();
	};
	Api.prototype.postWithToken = function ( type, params ) {
		calls.push( Object.assign( { _token: type }, params ) );
		const r = opts.onPost ? opts.onPost( params ) : undefined;

		if ( r && r.error ) {
			return R( r.error.code, r );
		}
		return D( r || { [ params.action ]: { result: 'Success' } } );
	};
	Api.prototype.post = Api.prototype.postWithToken;
	Api.prototype.edit = function ( title, transform ) {
		const self = this;
		const data = responder( { action: 'query', titles: title, prop: 'revisions', rvprop: 'content', rvslots: 'main' } );
		const p = ( data.query.pages || [] )[ 0 ] || {};
		const content = p.revisions ? p.revisions[ 0 ].slots.main.content : '';

		return $.when( transform( { content: content, timestamp: '2026-01-01T00:00:00Z' } ) ).then( ( params ) =>
			self.postWithToken( 'csrf', Object.assign( { action: 'edit', title: title }, params ) ) );
	};
	Api.prototype.loadMessagesIfMissing = () => D();
	Api.prototype.getErrorMessage = () => $( '<span>' ).text( 'erro' );
	Api.prototype.saveOption = () => D();

	// Pedidos externos (métricas, LiftWing): nada sai para a rede
	const externos = [];
	$.ajax = function ( o ) {
		externos.push( o.url );
		const r = opts.ajax ? opts.ajax( o ) : undefined;

		return r !== undefined ? D( r ) : $.Deferred().reject( { status: 0 } ).promise();
	};

	const storage = {};
	const sessao = {};
	const opcoes = Object.assign( {}, opts.options || {} );
	w.mw = {
		config: { get: ( k ) => ( k === undefined ? config : config[ k ] ), set: ( k, v ) => { config[ k ] = v; } },
		Api: Api,
		util: {
			getUrl: ( t, p ) => '/wiki/' + encodeURIComponent( String( t || '' ).replace( / /g, '_' ) ) + ( p ? '?' + $.param( p ) : '' ),
			getParamValue: () => null,
			isIPAddress: ( s ) => /^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test( s ) || /:/.test( s ),
			isIPv4Address: ( s ) => /^\d+\.\d+\.\d+\.\d+$/.test( s ),
			isIPv6Address: ( s ) => /:/.test( s ),
			escapeRegExp: ( s ) => s.replace( /[\\^$.*+?()[\]{}|]/g, '\\$&' ),
			escapeIdForLink: ( s ) => s,
			addPortletLink: () => null,
			wikiScript: () => '/w/index.php'
		},
		user: {
			getName: () => user,
			isAnon: () => false,
			getRights: () => D( rights ),
			options: { get: ( k ) => ( k in opcoes ? opcoes[ k ] : null ), set: ( k, v ) => { opcoes[ k ] = v; } },
			tokens: { get: () => 'x' }
		},
		storage: { get: ( k ) => storage[ k ] || null, set: ( k, v ) => { storage[ k ] = v; }, getObject: () => null, setObject: () => {},
			session: {
				getObject: ( k ) => ( sessao[ k ] ? JSON.parse( sessao[ k ] ) : null ),
				setObject: ( k, v ) => { sessao[ k ] = JSON.stringify( v ); },
				remove: ( k ) => { delete sessao[ k ]; }
			} },
		hook: () => ( { add: () => {}, fire: () => {} } ),
		notify: ( m ) => { notificacoes.push( typeof m === 'string' ? m : $( m ).text() ); return D(); },
		message: ( k ) => ( { exists: () => false, text: () => k, plain: () => k, parse: () => k } ),
		loader: { using: () => D(), load: () => {}, getState: () => 'ready', getScript: () => D() },
		libs: {}
	};
	w.confirm = ( m ) => { confirmacoes.push( m ); return opts.confirmar !== undefined ? opts.confirmar : true; };
	w.rondaConfig = Object.assign( { dryRun: false }, opts.rondaConfig || {} );

	ARQUIVOS.forEach( ( f ) => w.eval( fs.readFileSync( path.join( SRC, f ), 'utf8' ) ) );

	const ronda = w.ronda;
	// Sem barra: o teste monta o contexto e abre os módulos diretamente
	ronda.started = true;
	ronda.ctx = Object.assign( ronda.buildContext( rights ), opts.ctx || {} );

	return {
		window: w,
		$: $,
		ronda: ronda,
		calls: calls,
		notificacoes: notificacoes,
		confirmacoes: confirmacoes,
		externos: externos,
		opcoes: opcoes,
		consultas: consultas,
		/** Espera as promessas pendentes (jQuery 3 resolve de forma assíncrona) */
		esperar: ( ms ) => new Promise( ( ok ) => setTimeout( ok, ms || 30 ) ),
		escritas: ( acao ) => calls.filter( ( c ) => !acao || c.action === acao )
	};
}

module.exports = { criar };

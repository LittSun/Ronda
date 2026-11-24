/**
 * Publica na wiki os arquivos gerados por gerar-wiki.js (pasta wiki/), com uma
 * senha de robô (Especial:BotPasswords).
 *
 * Só edita as páginas cujo conteúdo mudou; as outras ficam como estão.
 *
 * Uso (na raiz do repositório):  npm run publicar
 *   ou: node ferramentas/publicar-wiki.js [pasta]   (padrão: wiki/ na raiz)
 * Variáveis de ambiente:
 *   WIKI_BOT_USER       nome da senha de robô, ex.: "Little Sunshine@Ronda" (obrigatório)
 *   WIKI_BOT_PASSWORD   senha de robô (obrigatório)
 *   WIKI_API            API da wiki (padrão: https://pt.wikipedia.org/w/api.php)
 *   RONDA_BASE          prefixo das páginas (padrão: "Usuário:Little Sunshine/Scripts/")
 *   WIKI_SUMMARY        resumo das edições (padrão: "Atualização do Ronda <versão>")
 *   DRY_RUN             "true" = só mostra o que mudaria, sem editar
 *
 * A senha de robô precisa das permissões "Editar páginas existentes" e
 * "Editar o seu CSS/JSON/JavaScript de usuário".
 */
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const dir = path.resolve( __dirname, '..', process.argv[ 2 ] || 'wiki' );
const API = process.env.WIKI_API || 'https://pt.wikipedia.org/w/api.php';
const BASE = process.env.RONDA_BASE || 'Usuário:Little Sunshine/Scripts/';
const USER = process.env.WIKI_BOT_USER;
const PASS = process.env.WIKI_BOT_PASSWORD;
const DRY = /^(1|true|sim)$/i.test( process.env.DRY_RUN || '' );
const UA = 'RondaPublisher/1.0 (https://github.com/LittSun/ronda; User:Little Sunshine)';

// Ordem de publicação: o carregador por último, para que ele só peça arquivos já atualizados
const FILES = [ 'Ronda-mensagens.js', 'Ronda-core.js', 'Ronda-catalogo.js', 'Ronda-patrulha.js', 'Ronda-paginas.js',
	'Ronda-admin.js', 'Ronda.css', 'Ronda-loader.js' ];

const cookies = {};

function cookieHeader() {
	return Object.keys( cookies ).map( ( k ) => k + '=' + cookies[ k ] ).join( '; ' );
}

function keepCookies( res ) {
	const list = typeof res.headers.getSetCookie === 'function'
		? res.headers.getSetCookie()
		: ( res.headers.get( 'set-cookie' ) || '' ).split( /,(?=\s*[^;=\s]+=)/ );

	list.forEach( ( c ) => {
		const m = /^\s*([^=;\s]+)=([^;]*)/.exec( c );

		if ( m ) {
			cookies[ m[ 1 ] ] = m[ 2 ];
		}
	} );
}

async function api( params, post ) {
	const body = new URLSearchParams( Object.assign( { format: 'json', formatversion: '2' }, params ) );
	const res = await fetch( post ? API : API + '?' + body, {
		method: post ? 'POST' : 'GET',
		headers: Object.assign( { 'User-Agent': UA, Cookie: cookieHeader() },
			post ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {} ),
		body: post ? body : undefined
	} );
	let data;

	keepCookies( res );
	if ( !res.ok ) {
		throw new Error( 'HTTP ' + res.status + ' em ' + ( params.action || '?' ) );
	}
	data = await res.json();
	if ( data.error ) {
		throw new Error( data.error.code + ': ' + data.error.info );
	}
	return data;
}

async function login() {
	const t = await api( { action: 'query', meta: 'tokens', type: 'login' } );
	const r = await api( { action: 'login', lgname: USER, lgpassword: PASS, lgtoken: t.query.tokens.logintoken }, true );

	if ( !r.login || r.login.result !== 'Success' ) {
		throw new Error( 'Falha no login: ' + JSON.stringify( r.login || r ) );
	}
	console.log( 'Conectado como ' + r.login.lgusername );
}

async function current( title ) {
	const r = await api( { action: 'query', prop: 'revisions', titles: title, rvprop: 'content', rvslots: 'main' } );
	const p = r.query.pages[ 0 ];

	return p.missing ? null : p.revisions[ 0 ].slots.main.content;
}

async function main() {
	let version = '', token, changed = 0;

	if ( !USER || !PASS ) {
		console.log( '::notice::WIKI_BOT_USER/WIKI_BOT_PASSWORD não definidos; nada foi publicado.' );
		return;
	}
	try {
		version = fs.readFileSync( path.join( dir, 'Ronda-Versao.wiki' ), 'utf8' ).trim();
	} catch ( e ) {}

	const summary = process.env.WIKI_SUMMARY || ( 'Atualização do Ronda' + ( version ? ' ' + version : '' ) );

	await login();
	if ( !DRY ) {
		token = ( await api( { action: 'query', meta: 'tokens', type: 'csrf' } ) ).query.tokens.csrftoken;
	}

	for ( const f of FILES ) {
		const title = BASE + f;
		const text = fs.readFileSync( path.join( dir, f ), 'utf8' );
		const old = await current( title );

		if ( old !== null && old.replace( /\s+$/, '' ) === text.replace( /\s+$/, '' ) ) {
			console.log( '= ' + title + ' (sem alterações)' );
			continue;
		}
		changed++;
		if ( DRY ) {
			console.log( '~ ' + title + ' (seria ' + ( old === null ? 'criada' : 'atualizada' ) + ')' );
			continue;
		}
		const r = await api( {
			action: 'edit',
			title: title,
			text: text,
			summary: summary,
			assert: 'user',
			watchlist: 'nochange',
			token: token
		}, true );

		if ( !r.edit || r.edit.result !== 'Success' ) {
			throw new Error( title + ': ' + JSON.stringify( r.edit || r ) );
		}
		console.log( '✓ ' + title + ( r.edit.nochange !== undefined ? ' (sem alterações)' : ' → revisão ' + r.edit.newrevid ) );
	}

	console.log( changed ? changed + ' página(s) ' + ( DRY ? 'mudariam' : 'atualizada(s)' ) + '.' : 'Tudo já estava atualizado.' );
}

main().catch( ( e ) => {
	console.error( '::error::' + e.message );
	process.exit( 1 );
} );

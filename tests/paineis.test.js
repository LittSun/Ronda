/** Painéis Informações e Usuário: conteúdo e pré-carregamento */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

function ambienteInfo() {
	return criar( {
		rights: [ 'edit', 'patrol', 'deletedhistory' ],
		ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true },
		ajax: ( o ) => ( /pageviews/.test( o.url ) ? { items: [ { views: 100 }, { views: 23 } ] } : undefined ),
		responder: ( p ) => {
			if ( p.prop === 'revisions|templates' ) {
				return { query: { pages: [ { title: 'Teste', revisions: [ { size: 1234, slots: { main: { content: 'Texto curto sobre [[Algo]].' } } } ],
					templates: [ { title: 'Predefinição:Sem-fontes' } ] } ] } };
			}
			if ( p.list === 'categorymembers' ) {
				return { query: { categorymembers: p.cmtype === 'page' ? [ { title: 'Predefinição:Sem-fontes' } ] : [] } };
			}
			if ( p.list === 'recentchanges' ) {
				return { query: { recentchanges: [ { type: 'new', rcid: 99 }, { type: 'edit', rcid: 100 } ] } };
			}
			if ( p.prop === 'revisions|contributors' ) {
				return { query: { pages: [ { title: 'Teste', revisions: [ { user: 'Criador', timestamp: '2026-11-01T10:00:00Z' } ],
					contributors: [ { name: 'A' }, { name: 'B' } ], anoncontributors: 1 } ] } };
			}
			if ( p.prop === 'revisions' && p.rvprop === 'ids' ) {
				return { query: { pages: [ { title: 'Teste', revisions: [ {}, {}, {} ] } ] } };
			}
			if ( p.prop === 'deletedrevisions' ) {
				return { query: { pages: [ { title: 'Teste', deletedrevisions: [ {} ] } ] } };
			}
			if ( /info\|revisions\|categories/.test( p.prop || '' ) ) {
				return { query: {
					pages: [ { title: 'Teste', ns: 0, pageid: 1, lastrevid: 10, length: 1234, watchers: 5,
						protection: [ { type: 'edit', level: 'autoconfirmed', expiry: 'infinity' } ],
						revisions: [ { timestamp: '2026-11-20T10:00:00Z', user: 'Ultimo' } ],
						templates: [ { title: 'Predefinição:Sem-fontes' } ], langlinks: [ {}, {} ],
						pageprops: { wikibase_item: 'Q1' }, categories: [ { title: 'Categoria:X' } ] },
					{ title: 'Wikipédia:Páginas para eliminar/Teste', missing: true } ],
					logevents: [], backlinks: [] } };
			}
		}
	} );
}

test( 'Informações: proteção, criação, editores, manutenção, ligações, patrulha e público', async () => {
	const a = ambienteInfo();

	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'info' ).open( a.ronda.ctx );
	await a.esperar( 80 );
	const t = a.$( '#ronda-toolbar' ).text();

	assert.match( t, /edição: autoconfirmados \(sem prazo\)/ );
	assert.match( t, /por Criador em/ );
	assert.match( t, /Total: 3/ );
	assert.match( t, /Editores: 3 \(1 IPs\)/ );
	assert.match( t, /Sem fontes/ );
	assert.match( t, /órfã/ );
	assert.match( t, /em 2 outras línguas/ );
	assert.match( t, /Q1/ );
	assert.match( t, /página nova não patrulhada/ );
	assert.match( t, /1 edição não patrulhada/ );
	assert.match( t, /123 visualizações/ );
	assert.match( t, /estimada automaticamente: 1/ );
	assert.match( t, /para a 2 falta: .*ligações internas \(1; ≥ 10\)/ );
	assert.match( t, /marcar como patrulhada/ );
} );

test( 'Informações: o pré-carregamento faz as consultas uma vez só', async () => {
	const a = ambienteInfo();
	const mod = a.ronda.getModule( 'info' );

	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	mod.prefetch( a.ronda.ctx );
	await a.esperar( 60 );
	const antes = a.consultas.length;

	mod.open( a.ronda.ctx );
	await a.esperar( 60 );
	assert.ok( antes > 0 );
	assert.strictEqual( a.consultas.length, antes, 'abrir não repete as consultas' );
	assert.match( a.$( '#ronda-toolbar' ).text(), /por Criador/ );
} );

test( 'Informações: marcar como patrulhada envia o rcid da página nova', async () => {
	const a = ambienteInfo();

	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'info' ).open( a.ronda.ctx );
	await a.esperar( 80 );
	a.$( '#ronda-toolbar a:contains("marcar como patrulhada")' ).trigger( 'click' );
	await a.esperar();
	assert.deepStrictEqual( a.escritas( 'patrol' ).map( ( c ) => c.rcid ), [ 99 ] );
} );

test( 'Informações nas contribuições: só o usuário, com pré-carregamento', async () => {
	const a = criar( {
		rights: [ 'edit' ],
		ctx: { type: 'contribs', ns: -1, page: 'Especial:Contribuições/Fulano', targetUser: 'Fulano' },
		responder: ( p ) => ( p.list === 'users|usercontribs' ? { query: { users: [ { name: 'Fulano', editcount: 5, groups: [ 'user' ] } ], usercontribs: [] } } : undefined )
	} );
	const mod = a.ronda.getModule( 'info' );

	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	mod.prefetch( a.ronda.ctx );
	await a.esperar( 60 );
	const antes = a.consultas.length;

	mod.open( a.ronda.ctx );
	await a.esperar( 60 );
	assert.ok( antes > 0 );
	assert.strictEqual( a.consultas.length, antes );
	assert.match( a.$( '#ronda-toolbar' ).text(), /Edições: 5/ );
} );

test( 'Informações numa página de usuário: página e usuário juntos, a página primeiro', async () => {
	const a = criar( {
		rights: [ 'edit' ],
		ctx: { type: 'view', ns: 2, page: 'Usuário(a):Fulano', title: 'Fulano', exists: true, targetUser: 'Fulano' },
		responder: ( p ) => {
			if ( p.list === 'users|usercontribs' ) {
				return { query: { users: [ { name: 'Fulano', editcount: 5, groups: [ 'user' ] } ], usercontribs: [] } };
			}
			if ( /info\|revisions\|categories/.test( p.prop || '' ) ) {
				return { query: { pages: [ { title: 'Usuário(a):Fulano', ns: 2, pageid: 7, length: 321, revisions: [ { timestamp: '2026-11-20T10:00:00Z', user: 'Fulano' } ] } ] } };
			}
		}
	} );

	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	assert.ok( a.ronda.getModule( 'info' ).isAvailable( a.ronda.ctx ) );
	assert.strictEqual( a.ronda.getModule( 'usuario' ), null, 'sem botão Usuário separado' );
	a.ronda.getModule( 'info' ).open( a.ronda.ctx );
	await a.esperar( 80 );
	const t = a.$( '#ronda-toolbar' ).text();

	assert.match( t, /Usuário: Fulano/ );
	assert.match( t, /Edições: 5/ );
	assert.match( t, /Página: Usuário\(a\):Fulano/ );
	assert.match( t, /321 bytes/ );
	assert.ok( t.indexOf( 'Página:' ) < t.indexOf( 'Usuário: Fulano' ), 'página antes do usuário' );
} );

test( 'Informações num artigo: só a página', async () => {
	const a = criar( { ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true } } );

	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'info' ).open( a.ronda.ctx );
	await a.esperar( 60 );
	assert.doesNotMatch( a.$( '#ronda-toolbar' ).text(), /Usuário:/ );
} );

test( 'Informações numa página eliminada: quem, por quê, quantas vezes, o que havia e o que ainda aponta', async () => {
	const a = criar( {
		rights: [ 'edit', 'deletedhistory' ],
		ctx: { type: 'view', ns: 0, page: 'Apagada', title: 'Apagada', exists: false },
		responder: ( p ) => {
			if ( p.list === 'logevents' && p.letype === 'create' ) {
				return { query: { logevents: [ { action: 'create', user: 'Beltrano', timestamp: '2026-11-26T17:31:00Z' } ] } };
			}
			if ( p.prop === 'deletedrevisions' ) {
				return { query: { pages: [ { title: 'Apagada', deletedrevisions: [
					{ user: 'Fulano', timestamp: '2026-11-26T12:00:00Z', parentid: 2 },
					{ user: 'Beltrano', timestamp: '2026-11-25T12:00:00Z', parentid: 0 },
					{ user: 'Fulano', timestamp: '2026-11-24T12:00:00Z', parentid: 0 } ] } ] } };
			}
			if ( /info\|revisions\|categories/.test( p.prop || '' ) ) {
				return { query: {
					pages: [ { title: 'Apagada', ns: 0, missing: true }, { title: 'Wikipédia:Páginas para eliminar/Apagada', pageid: 5 } ],
					logevents: [
						{ action: 'delete', user: 'Admin', timestamp: '2026-11-26T17:44:00Z', comment: 'ER: [[WP:ER#A1|A1]]', parsedcomment: 'ER: <a href="/wiki/WP:ER#A1">A1</a>' },
						{ action: 'restore', user: 'Admin', timestamp: '2026-11-20T10:00:00Z' },
						{ action: 'delete', user: 'Outro', timestamp: '2026-11-10T10:00:00Z' } ],
					backlinks: [ { title: 'X' } ] } };
			}
		}
	} );

	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'info' ).open( a.ronda.ctx );
	await a.ate( () => /Eliminada em/.test( a.$( '#ronda-toolbar' ).text() ) );
	const t = a.$( '#ronda-toolbar' ).text();

	assert.match( t, /Eliminada em .* por Admin/ );
	assert.match( t, /ER: A1/ );
	assert.strictEqual( a.$( '#ronda-toolbar a[href="/wiki/WP:ER#A1"]' ).length, 1 );
	assert.match( t, /2 eliminações, 1 restauro/ );
	assert.match( t, /discussão de eliminação/ );
	assert.match( t, /por Beltrano em/, 'quem criou a última versão, não a primeira' );
	assert.match( t, /Última edição: Fulano em/ );
	assert.match( t, /Edições eliminadas: 3/ );
	assert.match( t, /Editores: 2/ );
	assert.match( t, /ainda há ligações para cá/ );
} );

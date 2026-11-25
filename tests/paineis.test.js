/** Painéis Informações e Usuário: conteúdo e pré-carregamento */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

function ambienteInfo() {
	return criar( {
		rights: [ 'edit', 'patrol', 'deletedhistory' ],
		ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true },
		ajax: ( o ) => ( /pageviews/.test( o.url ) ? { items: [ { views: 100 }, { views: 23 } ] } : /articlequality/.test( o.url ) ? { score: 0.42 } : undefined ),
		responder: ( p ) => {
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
	assert.match( t, /estimada pelo LiftWing: 42%/ );
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

test( 'Usuário: o pré-carregamento faz as consultas uma vez só', async () => {
	const a = criar( {
		rights: [ 'edit' ],
		ctx: { type: 'contribs', ns: -1, page: 'Especial:Contribuições/Fulano', targetUser: 'Fulano' },
		responder: ( p ) => ( p.list === 'users|usercontribs' ? { query: { users: [ { name: 'Fulano', editcount: 5, groups: [ 'user' ] } ], usercontribs: [] } } : undefined )
	} );
	const mod = a.ronda.getModule( 'usuario' );

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

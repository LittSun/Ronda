/** Filas › Páginas novas sem <ref>: lê o texto atual das páginas novas */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const nova = ( rcid, titulo ) => ( { rcid: rcid, revid: rcid, title: titulo, user: 'Autor', oldlen: 0, newlen: 900 } );

async function abrirFila( a, rotulo ) {
	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'listar' ).open( a.ronda.ctx );
	a.$( '#ronda-toolbar a[role=button]' ).filter( ( i, el ) => a.$( el ).text() === rotulo ).trigger( 'click' );
	await a.esperar( 80 );
	// Título de cada linha (o primeiro link)
	return Array.from( a.$( '#ronda-toolbar .ronda-feed li' ).map( ( i, el ) => a.$( el ).find( 'a' ).first().text() ).get() );
}

test( 'hasRefTag: <ref>, <ref name>, <ref name/>; comentários e <references/> não contam', () => {
	const { ronda } = criar();
	const tem = ronda.lists.hasRefTag;

	assert.ok( tem( 'Texto.<ref>Fonte</ref>' ) );
	assert.ok( tem( 'Texto.<ref name="a">Fonte</ref>' ) );
	assert.ok( tem( 'Texto.<ref name=a />' ) );
	assert.ok( tem( 'Texto.<REF>x</REF>' ) );
	assert.ok( !tem( 'Texto sem notas.\n== Referências ==\n<references />' ) );
	assert.ok( !tem( 'Texto.<!-- <ref>escondida</ref> -->' ) );
	assert.ok( !tem( 'Texto.{{Referências}}' ) );
} );

test( 'withoutRefs: sem <ref>, existentes, sem marcação de eliminação, sem redirecionamento, sem repetir', () => {
	const { ronda } = criar();
	const lista = ronda.lists.withoutRefs( [ nova( 1, 'A' ), nova( 2, 'B' ), nova( 3, 'C' ), nova( 4, 'D' ), nova( 5, 'E' ), nova( 6, 'A' ), nova( 7, 'F' ) ], {
		A: 'Texto sem notas.',
		B: 'Texto.<ref>Fonte</ref>',
		C: '{{ER|A1|2=~~~~}}\nTexto.',
		D: '#REDIRECIONAMENTO [[A]]',
		F: 'Outro texto.'
	} );

	assert.deepStrictEqual( Array.from( lista, ( x ) => x.title ), [ 'A', 'F' ] );
} );

test( 'Fila: uma consulta com o texto de todas as páginas novas; mostra só as sem <ref>', async () => {
	const a = criar( {
		rights: [ 'edit', 'patrol' ],
		responder: ( p ) => {
			if ( p.rctype === 'new' ) {
				return { query: { recentchanges: [ nova( 1, 'Sem notas' ), nova( 2, 'Com notas' ), nova( 3, 'Eliminada' ) ] } };
			}
			if ( p.rvprop === 'content' && /Sem notas/.test( p.titles ) ) {
				return { query: { pages: [
					{ title: 'Sem notas', revisions: [ { slots: { main: { content: 'Texto.' } } } ] },
					{ title: 'Com notas', revisions: [ { slots: { main: { content: 'Texto.<ref>F</ref>' } } } ] },
					{ title: 'Eliminada', missing: true }
				] } };
			}
		}
	} );
	const titulos = await abrirFila( a, 'Páginas novas sem <ref>' );
	const q = a.consultas.find( ( p ) => p.rvprop === 'content' );

	assert.strictEqual( q.titles, 'Sem notas|Com notas|Eliminada' );
	assert.strictEqual( a.consultas.find( ( p ) => p.rctype === 'new' ).rcshow, '!redirect|!patrolled' );
	assert.deepStrictEqual( titulos, [ 'Sem notas' ] );
	assert.match( decodeURIComponent( a.$( '#ronda-toolbar .ronda-feed a' ).first().attr( 'href' ) ), /rcid=1/ );
} );

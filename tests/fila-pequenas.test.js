/** Filas › Páginas novas pequenas: tamanho máximo configurável */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const nova = ( rcid, tamanho ) => ( { rcid: rcid, revid: rcid, title: 'Nova ' + rcid, user: 'Autor', oldlen: 0, newlen: tamanho } );

async function abrirFila( a, rotulo ) {
	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'listar' ).open( a.ronda.ctx );
	a.$( '#ronda-toolbar a[role=button]' ).filter( ( i, el ) => a.$( el ).text() === rotulo ).trigger( 'click' );
	await a.esperar( 60 );
	return Array.from( a.$( '#ronda-toolbar .ronda-feed li' ).map( ( i, el ) => a.$( el ).text() ).get() );
}

/** Campo das preferências pelo começo do rótulo (a seção Filas pode ter os campos de várias filas) */
function campo( a, rotulo ) {
	return a.$( '.ronda-dialog .ronda-row' ).filter( ( i, el ) => a.$( el ).children( 'label' ).text().startsWith( rotulo ) ).find( 'input' );
}

test( 'smallNewPages: só as com menos bytes que o limite', () => {
	const { ronda } = criar();

	assert.deepStrictEqual( Array.from( ronda.lists.smallNewPages( [ nova( 1, 300 ), nova( 2, 1000 ), nova( 3, 999 ), nova( 4, 5000 ) ], 1000 ), ( x ) => x.rcid ), [ 1, 3 ] );
} );

test( 'Fila: páginas novas sem redirecionamentos; com o direito de patrulhar, só as não patrulhadas', async () => {
	const a = criar( {
		rights: [ 'edit', 'patrol' ],
		responder: ( p ) => p.list === 'recentchanges' && p.rctype === 'new' ? { query: { recentchanges: [ nova( 1, 300 ), nova( 2, 4000 ) ] } } : undefined
	} );
	const linhas = await abrirFila( a, 'Páginas novas pequenas' );
	const rc = a.consultas.find( ( p ) => p.rctype === 'new' );

	assert.strictEqual( rc.rcshow, '!redirect|!patrolled' );
	assert.strictEqual( rc.rclimit, 500 );
	assert.deepStrictEqual( linhas, [ 'Nova 1 (+300) · Autor' ] );
	assert.match( decodeURIComponent( a.$( '#ronda-toolbar .ronda-feed a' ).first().attr( 'href' ) ), /rcid=1/ );
} );

test( 'Fila: o tamanho vem das preferências; sem o direito de patrulhar, todas as páginas novas', async () => {
	const a = criar( {
		rights: [ 'edit' ],
		rondaConfig: { smallPages: { bytes: 5000 } },
		responder: ( p ) => p.rctype === 'new' ? { query: { recentchanges: [ nova( 1, 300 ), nova( 2, 4000 ) ] } } : undefined
	} );
	const linhas = await abrirFila( a, 'Páginas novas pequenas' );

	assert.strictEqual( a.consultas.find( ( p ) => p.rctype === 'new' ).rcshow, '!redirect' );
	assert.strictEqual( linhas.length, 2 );
} );

test( 'Preferências: o tamanho das Páginas novas pequenas é salvo', async () => {
	const a = criar();

	a.ronda.openPreferences();
	const $n = campo( a, 'Páginas novas pequenas' );

	assert.strictEqual( $n.closest( 'fieldset' ).children( 'legend' ).text(), 'Filas' );

	assert.strictEqual( $n.val(), '1000' );
	$n.val( '1500' );
	a.$( '.ronda-dialog .ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.ate( () => a.escritas( 'options' ).length > 0 );
	assert.strictEqual( JSON.parse( a.escritas( 'options' )[ 0 ].optionvalue ).smallPages.bytes, 1500 );
} );

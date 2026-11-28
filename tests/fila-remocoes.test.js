/** Filas › Grandes remoções: limite configurável, sem reversões e sem as já desfeitas */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const ed = ( revid, oldlen, newlen, tags ) => ( { revid: revid, title: 'P' + revid, user: 'U' + revid, oldlen: oldlen, newlen: newlen, tags: tags || [] } );

/** Abre as Filas e clica na fila com o rótulo dado; devolve as consultas feitas */
async function abrirFila( a, rotulo ) {
	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'listar' ).open( a.ronda.ctx );
	a.$( '#ronda-toolbar a[role=button]' ).filter( ( i, el ) => a.$( el ).text() === rotulo ).trigger( 'click' );
	await a.esperar( 60 );
	return a.$( '#ronda-toolbar .ronda-feed li' ).map( ( i, el ) => a.$( el ).text() ).get();
}

/** Campo das preferências pelo começo do rótulo (a seção Filas pode ter os campos de várias filas) */
function campo( a, rotulo ) {
	return a.$( '.ronda-dialog .ronda-row' ).filter( ( i, el ) => a.$( el ).children( 'label' ).text().startsWith( rotulo ) ).find( 'input' );
}

test( 'bigRemovals: só as que tiraram o limite ou mais, sem reversões e sem as já desfeitas', () => {
	const { ronda } = criar();
	const lista = ronda.lists.bigRemovals( [
		ed( 1, 5000, 1000 ),
		ed( 2, 5000, 4500 ),
		ed( 3, 9000, 100, [ 'mw-rollback' ] ),
		ed( 4, 9000, 100, [ 'mw-reverted' ] ),
		ed( 5, 3000, 1000, [ 'mw-manual-revert' ] ),
		ed( 6, 2000, 0, [ 'mw-blank' ] )
	], 2000 );

	assert.deepStrictEqual( Array.from( lista, ( x ) => x.revid ), [ 1, 6 ] );
} );

test( 'Fila: consulta 500 mudanças, mostra as grandes remoções com a porcentagem tirada', async () => {
	const a = criar( {
		rights: [ 'edit', 'patrol' ],
		responder: ( p ) => p.list === 'recentchanges' ? { query: { recentchanges: [ ed( 1, 4000, 1000 ), ed( 2, 4000, 3900 ) ] } } : undefined
	} );
	const linhas = await abrirFila( a, 'Grandes remoções' );
	const rc = a.consultas.find( ( p ) => p.list === 'recentchanges' );

	assert.strictEqual( rc.rclimit, 500 );
	assert.match( rc.rcshow, /!autopatrolled/ );
	assert.match( rc.rcprop, /tags/ );
	assert.strictEqual( linhas.length, 1 );
	assert.match( linhas[ 0 ], /P1 \(-3000\).*U1.*tirou 75% da página/ );
	assert.match( a.$( '#ronda-toolbar .ronda-feed a' ).first().attr( 'href' ), /diff=1/ );
} );

test( 'Fila: o limite vem das preferências; sem o direito de patrulhar, sem filtro de patrulha', async () => {
	const a = criar( {
		rights: [ 'edit' ],
		rondaConfig: { removals: { bytes: 100 } },
		responder: ( p ) => p.list === 'recentchanges' ? { query: { recentchanges: [ ed( 2, 4000, 3900 ) ] } } : undefined
	} );
	const linhas = await abrirFila( a, 'Grandes remoções' );

	assert.strictEqual( linhas.length, 1 );
	assert.doesNotMatch( a.consultas.find( ( p ) => p.list === 'recentchanges' ).rcshow, /patrolled/ );
} );

test( 'Preferências: seção Filas com o limite das Grandes remoções', async () => {
	const a = criar();

	a.ronda.openPreferences();
	const $n = campo( a, 'Grandes remoções' );

	assert.strictEqual( $n.closest( 'fieldset' ).children( 'legend' ).text(), 'Filas' );

	assert.strictEqual( $n.val(), '2000' );
	$n.val( '5000' );
	a.$( '.ronda-dialog .ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.ate( () => a.escritas( 'options' ).length > 0 );
	assert.strictEqual( JSON.parse( a.escritas( 'options' )[ 0 ].optionvalue ).removals.bytes, 5000 );
} );

/** Filas › Edições a revisar: pontuações da extensão ORES da wiki */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

test( 'Edições a revisar: má-fé primeiro, depois da mais danosa para a menos', () => {
	const a = criar( {} );
	const r = ( id, d, f ) => ( { revid: id, oresscores: { damaging: { true: d }, goodfaith: { true: f } } } );
	const lista = a.ronda.lists.pickSuspects( [ r( 1, 0.86, 0.8 ), r( 2, 0.95, 0.9 ), r( 3, 0.85, 0.3 ), { revid: 4 }, r( 5, 0.9, 0.2 ) ] );

	assert.deepStrictEqual( lista.map( ( x ) => x.revid ), [ 5, 3, 2, 1 ] );
} );

test( 'Edições a revisar: uma consulta só, filtrada pela wiki, sem pedidos externos', async () => {
	const pedidos = [];
	let externos = 0;
	const a = criar( {
		rights: [ 'patrol' ],
		ajax: () => {
			externos++;
		},
		responder: ( p ) => {
			pedidos.push( p );
			if ( p.list === 'recentchanges' ) {
				return { query: { recentchanges: [
					{ revid: 10, title: 'Alfa', user: 'X', oldlen: 10, newlen: 5, oresscores: { damaging: { true: 0.9 }, goodfaith: { true: 0.2 } } }
				] } };
			}
		}
	} );

	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'listar' ).open( a.ronda.ctx );
	a.$( '#ronda-toolbar a[role=button]' ).filter( ( i, el ) => a.$( el ).text() === 'Edições a revisar' ).trigger( 'click' );
	await a.esperar( 40 );

	const rc = pedidos.filter( ( p ) => /oresreview/.test( p.rcshow || '' ) );
	assert.strictEqual( rc.length, 1 );
	assert.match( rc[ 0 ].rcprop, /oresscores/ );
	assert.strictEqual( externos, 0 );
	assert.match( a.$( '#ronda-toolbar' ).text(), /Alfa.*dano 90%.*boa-fé 20%/ );
} );

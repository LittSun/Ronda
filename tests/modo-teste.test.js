/** Modo de teste: só para o desenvolvedor, liga todos os módulos em todos os domínios */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

function barra( a ) {
	a.window.mw.util.$content = a.$( '#mw-content-text' );
	a.$( '#ronda-toolbar' ).remove();
	a.ronda.renderToolbar();
	return a.$( '#ronda-toolbar .ronda-btn' ).map( ( i, el ) => a.$( el ).text() ).get();
}

test( 'Modo de teste: o desenvolvedor vê todos os módulos, inclusive os ocultos, num domínio qualquer', () => {
	const a = criar( { user: 'Little Sunshine', rights: [ 'edit' ], ctx: { type: 'view', ns: 4, page: 'Wikipédia:Teste', title: 'Teste', exists: true } } );
	const antes = barra( a );

	a.window.mw.storage.set( 'ronda-modo-teste', '1' );
	assert.strictEqual( a.ronda.modoTeste(), true );
	const depois = barra( a );

	assert.ok( depois.length > antes.length );
	assert.strictEqual( depois.length, a.ronda.modules.length );
	assert.ok( depois.includes( 'Restaurar' ) && depois.includes( 'Bloquear' ) );
} );

test( 'Modo de teste: outra conta não liga nem com o valor salvo', () => {
	const a = criar( { user: 'Fulano', ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true } } );
	const antes = barra( a );

	a.window.mw.storage.set( 'ronda-modo-teste', '1' );
	assert.strictEqual( a.ronda.modoTeste(), false );
	assert.strictEqual( a.ronda.modoTeste( true ), false );
	assert.strictEqual( barra( a ).join( '|' ), antes.join( '|' ) );
} );

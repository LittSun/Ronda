/** Avisar: avisos de quem já foi notificado ficam esmaecidos, mas selecionáveis */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

function ambiente( categorias ) {
	return criar( {
		ctx: { type: 'view', ns: 2, page: 'Usuário(a):Fulano', title: 'Fulano', exists: true, targetUser: 'Fulano' },
		responder: ( p ) => {
			if ( p.rvprop === 'content' && /categories/.test( p.prop || '' ) ) {
				return { query: { pages: [ { title: 'Usuário(a) Discussão:Fulano', revisions: [ { slots: { main: { content: '' } } } ],
					categories: categorias.map( ( title ) => ( { title } ) ) } ] } };
			}
			if ( p.rvprop === 'timestamp|comment' ) {
				return { query: { pages: [ { title: 'Usuário(a) Discussão:Fulano', revisions: [] } ] } };
			}
		}
	} );
}

async function nomes( a ) {
	a.ronda.getModule( 'avisar' ).open( a.ronda.ctx );
	await a.ate( () => a.$( '.ronda-dialog .ronda-warn' ).length > 0 );
	return a.$( '.ronda-dialog .ronda-warn' ).filter( ( i, el ) => /Promocional|Enganoso/.test( a.$( el ).children( 'label' ).text() ) );
}

test( 'Avisar: nome impróprio esmaecido quando o usuário já está na categoria de notificados', async () => {
	const a = ambiente( [ 'Categoria:!Usuários com nomes impróprios notificados' ] );
	const $n = await nomes( a );

	assert.strictEqual( $n.length, 2 );
	assert.strictEqual( $n.filter( '.ronda-warn-done' ).length, 2 );
	assert.match( $n.first().text(), /já notificado/ );
	assert.strictEqual( $n.find( 'input:disabled' ).length, 0, 'continuam selecionáveis' );
	assert.strictEqual( a.$( '.ronda-dialog .ronda-warn-done' ).length, $n.closest( 'fieldset' ).find( '.ronda-warn' ).length, 'só os de nome impróprio' );
} );

test( 'Avisar: sem a categoria, nada muda', async () => {
	const a = ambiente( [] );
	const $n = await nomes( a );

	assert.strictEqual( $n.filter( '.ronda-warn-done' ).length, 0 );
	assert.doesNotMatch( $n.first().text(), /já notificado/ );
} );

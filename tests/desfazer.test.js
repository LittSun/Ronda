/** Desfazer: edições do Ronda agrupadas e desfeitas de uma vez */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

function ambiente( rights ) {
	let rev = 100;
	return criar( {
		rights: rights || [ 'edit' ],
		onPost: ( p ) => {
			if ( p.action === 'edit' && !p.undo ) {
				rev++;
				return { edit: { result: 'Success', title: p.title, oldrevid: p.createonly ? 0 : rev - 1, newrevid: rev, new: !!p.createonly } };
			}
		}
	} );
}

test( 'Desfazer: agrupa as edições e oferece o botão', async () => {
	const a = ambiente();

	a.ronda.post( { action: 'edit', title: 'Alfa', text: 'x' } );
	a.ronda.post( { action: 'edit', title: 'Usuário(a) Discussão:Fulano', appendtext: 'y' } );
	await a.esperar( 1700 );

	assert.strictEqual( a.ronda.undo.current.edits.length, 2 );
	assert.ok( a.notificacoes.some( ( n ) => /O Ronda fez 2 edições: Alfa, Usuário\(a\) Discussão:Fulano\. Desfazer/.test( n ) ) );
} );

test( 'Desfazer: desfaz da última para a primeira; criações sem eliminar ficam listadas', async () => {
	const a = ambiente();

	a.ronda.post( { action: 'edit', title: 'Alfa', text: 'x' } );
	a.ronda.post( { action: 'edit', title: 'Wikipédia:Páginas para eliminar/Alfa', text: 'y', createonly: true } );
	await a.esperar( 20 );
	await a.ronda.undo.run( a.ronda.undo.current );
	await a.esperar( 20 );

	const undos = a.escritas( 'edit' ).filter( ( c ) => c.undo );
	assert.strictEqual( undos.length, 1 );
	assert.strictEqual( undos[ 0 ].title, 'Alfa' );
	assert.strictEqual( undos[ 0 ].undo, 101 );
	assert.strictEqual( undos[ 0 ].undoafter, 100 );
	assert.strictEqual( a.escritas( 'delete' ).length, 0 );
	assert.ok( a.notificacoes.some( ( n ) => /precisam ser eliminadas.*Páginas para eliminar\/Alfa/.test( n ) ) );
	assert.strictEqual( a.ronda.undo.current.edits.length, 2, 'o próprio desfazer não entra num grupo novo' );
} );

test( 'Desfazer: quem pode eliminar elimina a página criada', async () => {
	const a = ambiente( [ 'edit', 'delete' ] );

	a.ronda.post( { action: 'edit', title: 'Nova', text: 'y', createonly: true } );
	await a.esperar( 20 );
	await a.ronda.undo.run( a.ronda.undo.current );
	assert.strictEqual( a.escritas( 'delete' )[ 0 ].title, 'Nova' );
} );

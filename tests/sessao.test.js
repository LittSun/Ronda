/** Sessão expirada: assert: 'user' em todo pedido e um aviso próprio quando a API recusa */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const AVISO = /Nada foi gravado/;

test( 'API: todo pedido leva assert: user (nada é gravado deslogado)', () => {
	const a = criar();

	assert.strictEqual( a.ronda.api.parametros.assert, 'user' );
	assert.strictEqual( a.ronda.api.parametros.formatversion, 2 );
} );

test( 'Sessão expirada numa escrita: um aviso só, sem o erro genérico', async () => {
	const a = criar( { onPost: () => ( { error: { code: 'assertuserfailed' } } ) } );
	let falhou = null;

	a.ronda.post( { action: 'edit', title: 'Teste', text: 'x', summary: 'y' } ).then( null, ( code, data ) => {
		falhou = code;
		a.ronda.fail( code, data );
	} );
	await a.ate( () => falhou !== null );
	await a.esperar();

	assert.strictEqual( falhou, 'assertuserfailed' );
	assert.strictEqual( a.notificacoes.filter( ( n ) => AVISO.test( n ) ).length, 1 );
	assert.strictEqual( a.notificacoes.length, 1, 'ronda.fail não repete o erro' );
} );

test( 'Sessão expirada numa leitura também avisa; outros erros não', async () => {
	const a = criar( {
		responder: ( p ) => {
			if ( p.titles === 'Expirada' || p.titles === 'Outro' ) {
				const code = p.titles === 'Expirada' ? 'assertuserfailed' : 'missingtitle';

				return a.$.Deferred().reject( code, { error: { code: code } } ).promise();
			}
			return undefined;
		}
	} );

	a.ronda.api.get( { action: 'query', titles: 'Outro' } );
	await a.esperar();
	assert.strictEqual( a.notificacoes.length, 0 );

	a.ronda.api.get( { action: 'query', titles: 'Expirada' } );
	await a.ate( () => a.notificacoes.length > 0 );
	assert.match( a.notificacoes[ 0 ], AVISO );
} );

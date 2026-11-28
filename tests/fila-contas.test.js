/** Filas › Páginas novas de contas novas: idade e edições da conta configuráveis */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const DIA = 24 * 60 * 60 * 1000;
const AGORA = Date.parse( '2026-11-27T12:00:00Z' );
const nova = ( rcid, user ) => ( { rcid: rcid, revid: rcid, title: 'Nova ' + rcid, user: user, oldlen: 0, newlen: 800 } );
const conta = ( name, dias, edicoes ) => ( { name: name, registration: new Date( Date.now() - dias * DIA - 60000 ).toISOString(), editcount: edicoes } );

async function abrirFila( a, rotulo ) {
	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'listar' ).open( a.ronda.ctx );
	a.$( '#ronda-toolbar a[role=button]' ).filter( ( i, el ) => a.$( el ).text() === rotulo ).trigger( 'click' );
	await a.esperar( 80 );
	return Array.from( a.$( '#ronda-toolbar .ronda-feed li' ).map( ( i, el ) => a.$( el ).text() ).get() );
}

/** Campo das preferências pelo começo do rótulo (a seção Filas pode ter os campos de várias filas) */
function campo( a, rotulo ) {
	return a.$( '.ronda-dialog .ronda-row' ).filter( ( i, el ) => a.$( el ).children( 'label' ).text().startsWith( rotulo ) ).find( 'input' );
}

test( 'newAccountPages: idade e edições dentro dos limites; IP entra; conta antiga ou sem registro, não', () => {
	const { ronda } = criar();
	const info = {
		Novata: { registration: new Date( AGORA - 3 * DIA ).toISOString(), editcount: 12 },
		Antiga: { registration: new Date( AGORA - 400 * DIA ).toISOString(), editcount: 5 },
		Ativa: { registration: new Date( AGORA - 3 * DIA ).toISOString(), editcount: 900 },
		Pioneira: { editcount: 3 }
	};
	const lista = ronda.lists.newAccountPages( [ nova( 1, 'Novata' ), nova( 2, 'Antiga' ), nova( 3, 'Ativa' ), nova( 4, 'Pioneira' ), nova( 5, '10.0.0.1' ), nova( 6, 'Sumida' ) ],
		info, { days: 30, edits: 100 }, AGORA );

	assert.deepStrictEqual( Array.from( lista, ( x ) => x.rcid ), [ 1, 5 ] );
	assert.deepStrictEqual( Object.assign( {}, lista[ 0 ].account ), { days: 3, edits: 12 } );
	assert.strictEqual( lista[ 1 ].account.ip, true );
} );

test( 'Fila: consulta os autores (uma vez cada) e mostra a idade da conta e as edições', async () => {
	const a = criar( {
		rights: [ 'edit', 'patrol' ],
		responder: ( p ) => {
			if ( p.rctype === 'new' ) {
				return { query: { recentchanges: [ nova( 1, 'Novata' ), nova( 2, 'Antiga' ), nova( 3, 'Novata' ), nova( 4, 'Hoje' ) ] } };
			}
			if ( p.list === 'users' ) {
				return { query: { users: [ conta( 'Novata', 3, 12 ), conta( 'Antiga', 400, 5 ), conta( 'Hoje', 0, 1 ) ] } };
			}
		}
	} );
	const linhas = await abrirFila( a, 'Páginas novas de contas novas' );
	const u = a.consultas.find( ( p ) => p.list === 'users' );

	assert.strictEqual( u.ususers, 'Novata|Antiga|Hoje' );
	assert.strictEqual( u.usprop, 'registration|editcount' );
	assert.strictEqual( a.consultas.find( ( p ) => p.rctype === 'new' ).rcshow, '!redirect|!patrolled' );
	assert.deepStrictEqual( linhas, [
		'Nova 1 (+800) · Novata · conta de 3 dias, 12 edições',
		'Nova 3 (+800) · Novata · conta de 3 dias, 12 edições',
		'Nova 4 (+800) · Hoje · conta criada hoje, 1 edição'
	] );
} );

test( 'Fila: os limites vêm das preferências', async () => {
	const a = criar( {
		rondaConfig: { newAccounts: { days: 500, edits: 10 } },
		responder: ( p ) => p.rctype === 'new' ? { query: { recentchanges: [ nova( 1, 'Novata' ), nova( 2, 'Antiga' ) ] } }
			: p.list === 'users' ? { query: { users: [ conta( 'Novata', 3, 12 ), conta( 'Antiga', 400, 5 ) ] } } : undefined
	} );
	const linhas = await abrirFila( a, 'Páginas novas de contas novas' );

	assert.strictEqual( linhas.length, 1 );
	assert.match( linhas[ 0 ], /^Nova 2 .*400 dias, 5 edições/ );
} );

test( 'Preferências: idade e edições da conta são salvas', async () => {
	const a = criar();

	a.ronda.openPreferences();
	const $dias = campo( a, 'Páginas novas de contas novas: conta criada' );
	const $edicoes = campo( a, 'Páginas novas de contas novas: conta com' );

	assert.deepStrictEqual( [ $dias.val(), $edicoes.val() ], [ '30', '100' ] );
	$dias.val( '7' );
	$edicoes.val( '20' );
	a.$( '.ronda-dialog .ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.ate( () => a.escritas( 'options' ).length > 0 );
	assert.deepStrictEqual( JSON.parse( a.escritas( 'options' )[ 0 ].optionvalue ).newAccounts, { days: 7, edits: 20 } );
} );

/** Vigilância com prazo por tipo de ação (watchExpiry), sem encurtar a vigilância que já existe */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const DIA = 24 * 60 * 60 * 1000;
const AGORA = Date.parse( '2026-11-27T12:00:00Z' );

/** Responde à consulta de vigilância (prop=info, inprop=watched) com o estado dado por título */
function vigiadas( estado ) {
	return ( p ) => {
		if ( p.prop === 'info' && p.inprop === 'watched' ) {
			const e = estado[ p.titles ];

			return { query: { pages: [ Object.assign( { title: p.titles }, e === undefined ? { watched: false } : e ) ] } };
		}
		return undefined;
	};
}

test( 'watchExpiry: sem prazo por padrão; com prazo só quando a página vai ser vigiada', () => {
	const padrao = criar();

	assert.strictEqual( padrao.ronda.watchExpiry( 'revert' ), undefined );

	const a = criar( { rondaConfig: { watchExpiry: { revert: '1 week', warn: '1 month' } } } );

	assert.strictEqual( a.ronda.watchExpiry( 'revert' ), '1 week' );
	assert.strictEqual( a.ronda.watchExpiry( 'warn', 'watch' ), '1 month' );
	assert.strictEqual( a.ronda.watchExpiry( 'tag' ), undefined );
	assert.strictEqual( a.ronda.watchExpiry( 'revert', 'nochange' ), undefined );
	assert.strictEqual( a.ronda.watchExpiry( 'revert', 'unwatch' ), undefined );

	const params = a.ronda.params( { action: 'edit', summary: 'x', watchlist: 'watch', watchlistexpiry: undefined } );

	assert.ok( !( 'watchlistexpiry' in params ), 'sem prazo, o parâmetro sai' );
} );

test( 'keepWatch: mantém vigilância sem prazo ou mais longa; troca a mais curta', () => {
	const { ronda } = criar();
	const em = ( dias ) => new Date( AGORA + dias * DIA ).toISOString();

	assert.strictEqual( ronda.keepWatch( undefined, '1 week', AGORA ), true, 'sem prazo' );
	assert.strictEqual( ronda.keepWatch( em( 60 ), '1 month', AGORA ), true, 'termina depois' );
	assert.strictEqual( ronda.keepWatch( em( 3 ), '1 week', AGORA ), false, 'termina antes' );
	assert.strictEqual( ronda.watchExpiryTime( '2 weeks', AGORA ), AGORA + 14 * DIA );
	assert.strictEqual( ronda.watchExpiryTime( 'sempre', AGORA ), null );
} );

test( 'Escrita com prazo: página não vigiada ou com prazo curto leva o prazo; vigiada sem prazo, não', async () => {
	const curta = new Date( Date.now() + DIA ).toISOString();
	const a = criar( {
		rondaConfig: { watchExpiry: { warn: '1 month' } },
		responder: vigiadas( {
			'Usuário(a) Discussão:Nova': { watched: false },
			'Usuário(a) Discussão:Curta': { watched: true, watchlistexpiry: curta },
			'Usuário(a) Discussão:Sempre': { watched: true }
		} )
	} );

	[ 'Nova', 'Curta', 'Sempre' ].forEach( ( u ) => a.ronda.notifyUser( u, 'Aviso', 'texto', 'Resumo' ) );
	await a.ate( () => a.escritas( 'edit' ).length === 3 );

	const por = ( t ) => a.escritas( 'edit' ).find( ( c ) => c.title === 'Usuário(a) Discussão:' + t );

	assert.strictEqual( por( 'Nova' ).watchlistexpiry, '1 month' );
	assert.strictEqual( por( 'Curta' ).watchlistexpiry, '1 month' );
	assert.ok( !( 'watchlistexpiry' in por( 'Sempre' ) ), 'a vigilância sem prazo não é encurtada' );
	assert.ok( a.consultas.some( ( c ) => c.inprop === 'watched' ) );
} );

test( 'Escrita sem prazo configurado não faz a consulta de vigilância', async () => {
	const a = criar( { responder: vigiadas( {} ) } );

	a.ronda.notifyUser( 'Fulano', 'Aviso', 'texto', 'Resumo' );
	await a.ate( () => a.escritas( 'edit' ).length === 1 );

	assert.ok( !( 'watchlistexpiry' in a.escritas( 'edit' )[ 0 ] ) );
	assert.ok( !a.consultas.some( ( c ) => c.inprop === 'watched' ) );
} );

test( 'Preferências: seção Vigilância com um prazo por tipo de ação, salvo na conta', async () => {
	const a = criar();

	a.ronda.openPreferences();
	const $legendas = a.$( '.ronda-dialog legend' ).map( ( i, el ) => a.$( el ).text() ).get();

	assert.ok( $legendas.includes( 'Vigilância' ) );
	const $prazos = a.$( '.ronda-dialog select' ).filter( ( i, el ) => a.$( el ).find( 'option[value="1 week"]' ).length );

	assert.strictEqual( $prazos.length, 6 );
	$prazos.eq( 0 ).val( '1 week' ).trigger( 'change' );
	a.$( '.ronda-dialog .ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.ate( () => a.escritas( 'options' ).length > 0 );

	const salvo = JSON.parse( a.escritas( 'options' )[ 0 ].optionvalue );

	assert.strictEqual( salvo.watchExpiry.revert, '1 week' );
	assert.strictEqual( salvo.watchExpiry.warn, '' );
} );

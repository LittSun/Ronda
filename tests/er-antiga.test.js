/** Alerta ao propor ER para um artigo antigo ou com interwikis (limites nas preferências) */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const DIA = 24 * 60 * 60 * 1000;
const AGORA = Date.parse( '2026-11-27T12:00:00Z' );

/** Página com a data da primeira edição e o número de interwikis */
function ambiente( pagina, extra ) {
	return criar( Object.assign( {
		rights: [ 'edit', 'move', 'patrol' ],
		ctx: { type: 'view', ns: pagina.ns || 0, page: 'Teste', title: 'Teste', exists: true },
		responder: ( p ) => {
			if ( p.prop === 'revisions|langlinks' && p.rvdir === 'newer' ) {
				return { query: { pages: [ {
					title: 'Teste',
					revisions: [ { timestamp: pagina.criada } ],
					langlinks: Array.from( { length: pagina.iw || 0 }, ( v, i ) => ( { lang: 'l' + i, title: 'T' } ) )
				} ] } };
			}
			if ( /revisions\|info/.test( p.prop || '' ) ) {
				return { query: { pages: [ { title: 'Teste', ns: pagina.ns || 0, redirect: !!pagina.redirect,
					revisions: [ { slots: { main: { content: pagina.redirect ? '#REDIRECIONAMENTO [[X]]' : 'Texto.' } } } ] } ],
				embeddedin: [], backlinks: [] } };
			}
		}
	}, extra || {} ) );
}

async function abrirER( a ) {
	a.ronda.getModule( 'rapida' ).open( a.ronda.ctx );
	await a.ate( () => a.$( '.ronda-dialog select' ).length > 0 );
	await a.esperar( 60 );
	return a.$( '.ronda-dialog' ).last();
}

test( 'oldPageCheck: idade e interwikis, cada um com o seu limite; 0 desliga o critério', () => {
	const { ronda } = criar();
	const check = ronda.proposal.oldPageCheck;
	const criada = ( dias ) => new Date( AGORA - dias * DIA ).toISOString();
	const limites = { oldDays: 365, oldInterwikis: 3 };

	// Cópia: o objeto vem da janela do jsdom (outro contexto)
	assert.deepStrictEqual( Object.assign( {}, check( { created: criada( 10 ), interwikis: 0 }, AGORA, limites ) ),
		{ warn: false, days: 10, interwikis: 0, byAge: false, byInterwikis: false } );
	assert.strictEqual( check( { created: criada( 400 ), interwikis: 0 }, AGORA, limites ).byAge, true );
	assert.strictEqual( check( { created: criada( 5 ), interwikis: 3 }, AGORA, limites ).byInterwikis, true );
	assert.strictEqual( check( { created: criada( 5000 ), interwikis: 50 }, AGORA, { oldDays: 0, oldInterwikis: 0 } ).warn, false );
	assert.strictEqual( check( { interwikis: 1 }, AGORA, limites ).days, null );
} );

test( 'ER de artigo antigo com interwikis: alerta no topo, com a data, a idade e o histórico', async () => {
	const a = ambiente( { criada: '2015-03-12T10:00:00Z', iw: 14 } );
	const $d = await abrirER( a );
	const $alerta = $d.find( '.ronda-er-antiga' );

	assert.strictEqual( $alerta.length, 1 );
	assert.match( $alerta.text(), /existe desde 12\/03\/2015 \(há 1\d anos\) e tem 14 interwikis/ );
	assert.match( $alerta.find( 'a' ).attr( 'href' ), /action=history/ );
	assert.strictEqual( a.escritas().length, 0 );
} );

test( 'ER de artigo novo, sem interwikis, de redirecionamento ou com os limites em 0: sem alerta', async () => {
	const nova = await abrirER( ambiente( { criada: new Date( Date.now() - 2 * DIA ).toISOString(), iw: 0 } ) );

	assert.strictEqual( nova.find( '.ronda-er-antiga' ).length, 0 );

	const redir = await abrirER( ambiente( { criada: '2010-01-01T00:00:00Z', iw: 9, redirect: true } ) );

	assert.strictEqual( redir.find( '.ronda-er-antiga' ).length, 0 );

	const desligado = ambiente( { criada: '2010-01-01T00:00:00Z', iw: 9 }, { rondaConfig: { speedy: { oldDays: 0, oldInterwikis: 0 } } } );
	const $d = await abrirER( desligado );

	assert.strictEqual( $d.find( '.ronda-er-antiga' ).length, 0 );
	assert.ok( !desligado.consultas.some( ( c ) => c.prop === 'revisions|langlinks' ), 'nem consulta' );
} );

test( 'Só pelos interwikis: artigo recente com muitos interwikis também alerta', async () => {
	const $d = await abrirER( ambiente( { criada: new Date( Date.now() - 20 * DIA ).toISOString(), iw: 5 } ) );

	assert.match( $d.find( '.ronda-er-antiga' ).text(), /há 20 dias\) e tem 5 interwikis/ );
} );

test( 'Preferências: os dois limites aceitam 0 e são salvos', async () => {
	const a = criar();

	a.ronda.openPreferences();
	const $legendas = a.$( '.ronda-dialog legend' ).map( ( i, el ) => a.$( el ).text() ).get();

	assert.ok( $legendas.includes( 'Eliminação rápida' ) );
	const $numeros = a.$( '.ronda-dialog fieldset' ).filter( ( i, el ) => a.$( el ).children( 'legend' ).text() === 'Eliminação rápida' )
		.find( 'input[type=number]' );

	assert.strictEqual( $numeros.length, 2 );
	assert.strictEqual( $numeros.eq( 0 ).val(), '365' );
	assert.strictEqual( $numeros.eq( 0 ).attr( 'min' ), '0' );
	$numeros.eq( 0 ).val( '0' );
	$numeros.eq( 1 ).val( '5' );
	a.$( '.ronda-dialog .ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.ate( () => a.escritas( 'options' ).length > 0 );

	const salvo = JSON.parse( a.escritas( 'options' )[ 0 ].optionvalue );

	assert.strictEqual( salvo.speedy.oldDays, 0 );
	assert.strictEqual( salvo.speedy.oldInterwikis, 5 );
	assert.strictEqual( salvo.warnings.window, 30, 'os outros números continuam com mínimo 1' );
} );

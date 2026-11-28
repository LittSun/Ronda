/** Propor eliminação (botão único), prévia das edições, Detectar VDA, recriação e títulos parecidos */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

function ambiente( pagina ) {
	return criar( {
		rights: [ 'edit', 'move', 'patrol' ],
		ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true },
		responder: ( p ) => {
			if ( p.prop === 'info|revisions' && p.rvdir === 'newer' ) {
				return { query: { pages: [ { title: 'Teste', length: pagina.length, revisions: [ { timestamp: pagina.criada } ] } ] } };
			}
			if ( /revisions\|info/.test( p.prop || '' ) ) {
				return { query: { pages: [ { title: 'Teste', ns: 0, revisions: [ { slots: { main: { content: 'Texto.' } } } ] } ], embeddedin: [], backlinks: [] } };
			}
		}
	} );
}

test( 'Propor eliminação: um botão só na barra; o diálogo abre o formulário escolhido', async () => {
	const a = ambiente( { length: 300, criada: '2026-11-26T10:00:00Z' } );

	a.window.mw.util.$content = a.$( '#mw-content-text' );
	a.ronda.renderToolbar();
	const rotulos = a.$( '#ronda-toolbar .ronda-btn' ).map( ( i, el ) => a.$( el ).text() ).get();
	assert.ok( rotulos.includes( 'Propor eliminação' ) );
	assert.ok( !rotulos.includes( 'ER' ) && !rotulos.includes( 'ESR' ) && !rotulos.includes( 'Consenso' ) );

	a.ronda.getModule( 'eliminacao' ).open( a.ronda.ctx );
	await a.ate( () => a.$( '.ronda-elim-type' ).length > 0 );
	const $d = a.$( '.ronda-dialog' ).last();
	assert.strictEqual( $d.find( 'input:checked' ).length, 0, 'nada vem escolhido' );
	assert.doesNotMatch( $d.text(), /sugerida/i );
	assert.match( $d.find( '.ronda-elim-vda a' ).attr( 'href' ), /copyvios\.toolforge\.org\/\?.*title=Teste/ );

	$d.find( 'input[value=semirrapida]' ).prop( 'checked', true );
	$d.parent().find( '.ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.ate( () => /semirrápida/i.test( a.$( '.ronda-dialog .ui-dialog-title' ).last().text() ) );
	assert.match( a.$( '.ronda-dialog .ui-dialog-title' ).last().text(), /semirrápida/i );
	assert.strictEqual( a.escritas().length, 0 );
} );

test( 'Prévia: a marcação de ER vira um diff, sem gravar nada', async () => {
	const a = ambiente( {} );
	const pedidos = [];

	a.ronda.api.post = ( p ) => {
		pedidos.push( p );
		return a.$.Deferred().resolve( { compare: { body: '<tr><td>+</td><td>{{ER|A1}}</td></tr>' } } ).promise();
	};
	a.ronda.getModule( 'rapida' ).open( a.ronda.ctx );
	await a.ate( () => a.$( '.ronda-dialog select' ).length > 0 );
	const $d = a.$( '.ronda-dialog' ).last();
	const $regra = $d.find( 'select' ).first();

	$regra.val( $regra.find( 'option' ).eq( 1 ).val() ).trigger( 'change' );
	$d.parent().find( '.ui-dialog-buttonpane button' ).filter( ( i, el ) => a.$( el ).text() === 'Prévia' ).trigger( 'click' );
	await a.ate( () => a.$( '.ronda-preview-diff' ).length > 0 );

	assert.strictEqual( pedidos[ 0 ].action, 'compare' );
	assert.match( pedidos[ 0 ][ 'totext-main' ], /\{\{ER\|/ );
	assert.strictEqual( a.escritas().length, 0 );
} );

test( 'Títulos parecidos e recriação', () => {
	const a = ambiente( {} );
	const t = a.ronda.infoTools;

	assert.strictEqual( t.similarTitles( 'João da Silva', [ { title: 'João da Silva' }, { title: 'Joao da Silva (futebolista)' }, { title: 'Futebol' } ] ).join(), 'Joao da Silva (futebolista)' );
	const dados = ( eliminada, criada ) => ( {
		main: { query: { pages: [ { title: 'Teste', ns: 0 } ], logevents: eliminada ? [ { action: 'delete', timestamp: eliminada } ] : [] } },
		first: { query: { pages: [ { revisions: [ { timestamp: criada } ] } ] } }
	} );
	assert.ok( t.recreation( dados( '2025-01-01T00:00:00Z', '2026-11-20T00:00:00Z' ), 'Teste' ) );
	assert.strictEqual( t.recreation( dados( '2026-11-25T00:00:00Z', '2020-01-01T00:00:00Z' ), 'Teste' ), null, 'eliminação parcial depois da criação não conta' );
	assert.strictEqual( t.recreation( dados( null, '2026-11-20T00:00:00Z' ), 'Teste' ), null );

	// Alerta (!): só recriação ainda não patrulhada; sem acesso à patrulha, só a criada nos últimos 30 dias
	const recente = new Date( Date.now() - 2 * 86400000 ).toISOString();
	const comPatrulha = ( rcs ) => Object.assign( dados( '2020-01-01T00:00:00Z', '2021-06-23T00:00:00Z' ), { patrol: { query: { recentchanges: rcs } } } );
	assert.ok( t.recreationAlert( comPatrulha( [ { type: 'new' } ] ), 'Teste' ) );
	assert.strictEqual( t.recreationAlert( comPatrulha( [ { type: 'edit' } ] ), 'Teste' ), null, 'criação já patrulhada' );
	assert.ok( t.recreationAlert( dados( '2025-01-01T00:00:00Z', recente ), 'Teste' ) );
	assert.strictEqual( t.recreationAlert( dados( '2020-01-01T00:00:00Z', '2021-06-23T00:00:00Z' ), 'Teste' ), null, 'recriação antiga' );
} );

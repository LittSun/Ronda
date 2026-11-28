/** Barra personalizável: ordem, menu "Mais" e botões escondidos (Preferências › Barra) */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const ARTIGO = { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true };

function barra( toolbar, rights ) {
	const a = criar( { rights: rights || [ 'edit', 'move', 'patrol' ], ctx: ARTIGO, rondaConfig: toolbar ? { toolbar: toolbar } : {} } );

	a.window.mw.util.$content = a.$( '#mw-content-text' );
	a.ronda.renderToolbar();
	return a;
}

/** Rótulos dos botões visíveis (sem o "Mais"), na ordem da barra */
function visiveis( a ) {
	// Array.from: a lista vem da janela do jsdom (outro contexto)
	return Array.from( a.$( '#ronda-toolbar .ronda-btn' ).not( '.ronda-btn-mais' )
		.filter( ( i, el ) => el.style.display !== 'none' ).map( ( i, el ) => a.$( el ).text() ).get() );
}

test( 'Chaves: Propor eliminação e Eliminar têm o mesmo id, mas chaves diferentes', () => {
	const { ronda } = criar( { rights: [ 'edit', 'delete' ] } );
	const chaves = Array.from( ronda.modules ).filter( ( m ) => m.id === 'eliminacao' ).map( ( m ) => ronda.moduleKey( m ) ).sort();

	assert.deepStrictEqual( chaves, [ 'eliminacao', 'eliminar' ] );
} );

test( 'toolbarSort: a ordem escolhida primeiro; os demais depois, na ordem padrão', () => {
	const { ronda } = criar();
	const mods = [ { id: 'a', order: 1 }, { id: 'b', order: 2 }, { id: 'c', order: 3 }, { id: 'd', order: 4 } ];

	assert.deepStrictEqual( ronda.toolbarSort( mods, [ 'c', 'a' ] ).map( ( m ) => m.id ), [ 'c', 'a', 'b', 'd' ] );
	assert.deepStrictEqual( ronda.toolbarSort( mods ).map( ( m ) => m.id ), [ 'a', 'b', 'c', 'd' ] );
} );

test( 'Barra padrão: sem botão "Mais" e na ordem de sempre', () => {
	const a = barra();
	const rotulos = visiveis( a );

	assert.strictEqual( a.$( '.ronda-btn-mais' ).length, 0 );
	assert.strictEqual( rotulos[ 0 ], 'Informações' );
	assert.ok( rotulos.includes( 'Busca' ) && rotulos.includes( 'Mover' ) );
} );

test( 'Barra personalizada: ordem, escondidos e o menu "Mais" que abre e fecha', () => {
	const a = barra( { order: [ 'pedido', 'info' ], hidden: [ 'busca' ], more: [ 'mover', 'fusao' ] } );
	let rotulos = visiveis( a );

	assert.deepStrictEqual( rotulos.slice( 0, 2 ), [ 'Pedido', 'Informações' ] );
	assert.ok( !rotulos.includes( 'Busca' ), 'escondido' );
	assert.ok( !rotulos.includes( 'Mover' ) && !rotulos.includes( 'Fusão' ), 'guardados no Mais' );
	assert.strictEqual( a.$( '#ronda-toolbar .ronda-btn-busca' ).length, 0 );

	const $mais = a.$( '#ronda-toolbar .ronda-btn-mais' );

	assert.strictEqual( $mais.length, 1 );
	assert.strictEqual( $mais.attr( 'aria-expanded' ), 'false' );
	assert.ok( $mais.next().hasClass( 'ronda-btn-mais-item' ), 'o "Mais" vem antes dos guardados' );

	$mais.trigger( 'click' );
	rotulos = visiveis( a );
	assert.ok( rotulos.includes( 'Mover' ) && rotulos.includes( 'Fusão' ) );
	assert.strictEqual( $mais.attr( 'aria-expanded' ), 'true' );
	assert.match( $mais.text(), /Menos/ );

	$mais.trigger( 'click' );
	assert.ok( !visiveis( a ).includes( 'Mover' ) );
} );

test( 'Ações administrativas guardadas no "Mais" ficam no grupo delas', () => {
	const a = barra( { more: [ 'eliminar' ] }, [ 'edit', 'move', 'patrol', 'delete', 'protect' ] );
	const $item = a.$( '#ronda-toolbar .ronda-toolbar-admin .ronda-btn-mais-item' );

	assert.strictEqual( $item.length, 1 );
	assert.strictEqual( $item.text(), 'Eliminar' );
	assert.strictEqual( a.$( '#ronda-toolbar .ronda-toolbar-group' ).first().find( '.ronda-btn-mais' ).length, 1 );
	assert.ok( visiveis( a ).includes( 'Propor eliminação' ), 'o Propor eliminação continua na barra' );
} );

test( 'Preferências › Barra: só os botões que a conta pode usar, em dois quadros', () => {
	const semAdmin = criar( { rights: [ 'edit', 'move', 'patrol' ] } );

	semAdmin.ronda.openPreferences();
	assert.strictEqual( semAdmin.$( '.ronda-pref-barra-lista' ).length, 1 );
	assert.strictEqual( semAdmin.$( '.ronda-pref-barra li[data-key=eliminar]' ).length, 0 );

	const admin = criar( { rights: [ 'edit', 'move', 'patrol', 'delete' ] } );

	admin.ronda.openPreferences();
	assert.strictEqual( admin.$( '.ronda-pref-barra-lista' ).length, 2 );
	assert.strictEqual( admin.$( '.ronda-pref-barra-lista' ).eq( 1 ).find( 'li[data-key=eliminar]' ).length, 1 );
	assert.strictEqual( admin.$( '.ronda-pref-barra li[data-key=bloqueio]' ).length, 0, 'sem o direito block' );
} );

test( 'Preferências › Barra: mudar a ordem e o lugar e salvar; sem mudanças, a ordem não é guardada', async () => {
	const a = criar();

	a.ronda.openPreferences();
	const $lista = a.$( '.ronda-pref-barra-lista' ).first();
	const primeiro = $lista.children().first().attr( 'data-key' );
	const segundo = $lista.children().eq( 1 ).attr( 'data-key' );

	$lista.children().eq( 1 ).find( '.ronda-pref-barra-seta' ).first().trigger( 'click' );
	assert.deepStrictEqual( [ $lista.children().eq( 0 ).attr( 'data-key' ), $lista.children().eq( 1 ).attr( 'data-key' ) ], [ segundo, primeiro ] );
	$lista.find( 'li[data-key=busca] select' ).val( 'hidden' ).trigger( 'change' );
	$lista.find( 'li[data-key=mover] select' ).val( 'more' ).trigger( 'change' );
	assert.ok( $lista.find( 'li[data-key=busca]' ).hasClass( 'ronda-pref-barra-off' ) );

	a.$( '.ronda-dialog .ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.ate( () => a.escritas( 'options' ).length > 0 );
	const salvo = JSON.parse( a.escritas( 'options' )[ 0 ].optionvalue ).toolbar;

	assert.deepStrictEqual( salvo.order.slice( 0, 2 ), [ segundo, primeiro ] );
	assert.deepStrictEqual( salvo.hidden, [ 'busca' ] );
	assert.deepStrictEqual( salvo.more, [ 'mover' ] );

	const b = criar();

	b.ronda.openPreferences();
	b.$( '.ronda-dialog .ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await b.ate( () => b.escritas( 'options' ).length > 0 );
	assert.deepStrictEqual( JSON.parse( b.escritas( 'options' )[ 0 ].optionvalue ).toolbar, { order: [], more: [], hidden: [] } );
} );

test( 'Preferências › Barra: "Voltar à barra padrão" desfaz as escolhas no diálogo', () => {
	// O diálogo parte das preferências salvas (não do window.rondaConfig)
	const a = criar( { options: { 'userjs-ronda': JSON.stringify( { toolbar: { order: [ 'pedido' ], hidden: [ 'busca' ], more: [] } } ) } } );

	a.ronda.openPreferences();
	assert.strictEqual( a.$( '.ronda-pref-barra-lista li' ).first().attr( 'data-key' ), 'pedido' );
	a.$( '.ronda-pref-barra-padrao' ).trigger( 'click' );
	assert.strictEqual( a.$( '.ronda-pref-barra-lista li' ).first().attr( 'data-key' ), 'info' );
	assert.strictEqual( a.$( '.ronda-pref-barra li[data-key=busca] select' ).val(), 'bar' );
} );

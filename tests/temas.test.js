/** Temas: classe em <html>, CSS carregado só quando escolhido, campo nas preferências */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const fs = require( 'fs' );
const path = require( 'path' );
const { criar } = require( './ambiente' );

function comCarregador( opts ) {
	const a = criar( opts || {} );
	const pedidos = [];

	a.window.mw.loader.load = ( url, tipo ) => pedidos.push( { url: url, tipo: tipo } );
	return { a: a, pedidos: pedidos };
}

test( 'Temas: aplicar põe a classe e carrega o CSS uma vez; trocar tira a anterior', () => {
	const { a, pedidos } = comCarregador();
	const root = a.window.document.documentElement;

	a.ronda.applyTheme( 'terminal' );
	a.ronda.applyTheme( 'terminal' );
	assert.ok( root.classList.contains( 'ronda-tema-terminal' ) );
	assert.strictEqual( pedidos.length, 1 );
	assert.strictEqual( pedidos[ 0 ].tipo, 'text/css' );
	assert.match( decodeURIComponent( pedidos[ 0 ].url ), /Scripts\/Ronda-tema-terminal\.css/ );

	a.ronda.applyTheme( 'bula' );
	assert.ok( !root.classList.contains( 'ronda-tema-terminal' ) );
	assert.ok( root.classList.contains( 'ronda-tema-bula' ) );
} );

test( 'Temas: padrão e tema desconhecido não carregam nada', () => {
	const { a, pedidos } = comCarregador();

	assert.strictEqual( a.ronda.applyTheme( '' ), null );
	assert.strictEqual( a.ronda.applyTheme( 'inexistente' ), null );
	assert.strictEqual( pedidos.length, 0 );
	assert.doesNotMatch( a.window.document.documentElement.className, /ronda-tema-/ );
} );

test( 'Temas: todo tema da lista tem o arquivo em temas/, e vice-versa', () => {
	const { a } = comCarregador();
	const ids = a.ronda.THEMES.map( ( t ) => t[ 0 ] ).filter( Boolean ).sort();
	const arquivos = fs.readdirSync( path.join( __dirname, '..', 'temas' ) ).filter( ( f ) => f.endsWith( '.css' ) )
		.map( ( f ) => f.replace( /\.css$/, '' ) ).sort();

	assert.strictEqual( ids.join(), arquivos.join() );
	assert.ok( a.ronda.PREFS.some( ( f ) => Array.isArray( f ) && f[ 0 ] === 'theme' ) );
} );

test( 'Preferências: o tema muda na hora; cancelar volta ao anterior', async () => {
	const { a } = comCarregador();
	const root = a.window.document.documentElement;

	a.ronda.openPreferences();
	const $sel = a.$( '.ronda-dialog select' ).filter( ( i, el ) => a.$( el ).find( 'option[value=terminal]' ).length );

	$sel.val( 'terminal' ).trigger( 'change' );
	assert.ok( root.classList.contains( 'ronda-tema-terminal' ), 'prévia ao vivo' );
	a.$( '.ronda-dialog .ui-dialog-buttonpane button' ).last().trigger( 'click' );
	assert.ok( !root.classList.contains( 'ronda-tema-terminal' ), 'cancelar desfaz a prévia' );
	assert.strictEqual( a.escritas( 'options' ).length, 0 );
} );

test( 'Preferências: salvar só o tema grava e aplica sem recarregar', async () => {
	const { a } = comCarregador();
	const root = a.window.document.documentElement;

	a.ronda.openPreferences();
	a.$( '.ronda-dialog select' ).filter( ( i, el ) => a.$( el ).find( 'option[value=bula]' ).length ).val( 'bula' ).trigger( 'change' );
	a.$( '.ronda-dialog .ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.ate( () => a.notificacoes.includes( 'Tema aplicado.' ) );

	assert.ok( a.notificacoes.includes( 'Tema aplicado.' ) );
	assert.ok( root.classList.contains( 'ronda-tema-bula' ) );
	assert.strictEqual( a.ronda.config.theme, 'bula' );
	assert.strictEqual( JSON.parse( a.escritas( 'options' )[ 0 ].optionvalue ).theme, 'bula' );
	assert.strictEqual( a.$( '.ronda-dialog' ).length, 0, 'o diálogo fecha' );
} );

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

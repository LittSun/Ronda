/**
 * Gera Ronda-console.js: todos os arquivos do Ronda (e o CSS) num único
 * trecho para colar no console do navegador, sem criar páginas na wiki.
 *
 * Uso (na raiz do repositório):  npm run console
 *   ou: node ferramentas/gerar-pacote-console.js   (grava dist/Ronda-console.js)
 */
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const root = path.resolve( __dirname, '..' );
const dir = path.join( root, 'src' );
const files = [
	'Ronda-mensagens.js',
	'Ronda-core.js',
	'Ronda-catalogo.js',
	'Ronda-patrulha.js',
	'Ronda-paginas.js',
	'Ronda-admin.js'
];
const deps = [
	'jquery.ui',
	'mediawiki.api',
	'mediawiki.util',
	'mediawiki.user',
	'mediawiki.storage',
	'mediawiki.notification'
];

const css = fs.readFileSync( path.join( dir, 'Ronda.css' ), 'utf8' );
const body = files.map( ( f ) =>
	'/* ===== ' + f + ' ===== */\n' + fs.readFileSync( path.join( dir, f ), 'utf8' )
).join( '\n' );

const out = `/**
 * Ronda — pacote para o console (gerado por gerar-pacote-console.js).
 * Cole este arquivo inteiro no console de qualquer página da wiki.
 * Simulação ligada: nada é gravado. Para gravar de verdade, troque para dryRun: false.
 */
window.rondaConfig = { dryRun: true };

mw.loader.using( ${ JSON.stringify( deps ) } ).then( function () {
// Permite colar de novo sem duplicar a barra
$( '#ronda-toolbar, #ca-ronda-toggle, #ronda-console-css' ).remove();
$( '<style id="ronda-console-css"></style>' ).text( ${ JSON.stringify( css ) } ).appendTo( 'head' );
( function () {
	var v = $.ui.version.split( '.' ).map( Number ), ok = v[ 0 ] > 1 || ( v[ 0 ] === 1 && v[ 1 ] >= 9 );
	console.log( '[Ronda] jQuery UI ' + $.ui.version + ( ok ? ' (ok)' : ' — precisa da 1.9 ou mais nova' ) );
}() );

${ body }
console.log( '[Ronda] carregado', window.ronda );
} );
`;

fs.mkdirSync( path.join( root, 'dist' ), { recursive: true } );
fs.writeFileSync( path.join( root, 'dist', 'Ronda-console.js' ), out );
console.log( 'dist/Ronda-console.js gerado (' + Math.round( out.length / 1024 ) + ' KB)' );

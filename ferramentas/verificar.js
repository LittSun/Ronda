/**
 * Verificações rápidas, sem navegador:
 * - sintaxe de todos os arquivos do Ronda e das ferramentas;
 * - a versão do package.json é a mesma de ronda.version (src/Ronda-core.js);
 * - toda chave usada em ronda.msg( '…' ) existe em src/Ronda-mensagens.js.
 *
 * Uso (na raiz do repositório):  npm run verificar
 */
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { execFileSync } = require( 'child_process' );

const root = path.resolve( __dirname, '..' );
const src = path.join( root, 'src' );
let erros = 0;

function erro( msg ) {
	console.error( '✗ ' + msg );
	erros++;
}

// 1. Sintaxe
const arquivos = fs.readdirSync( src ).filter( ( f ) => f.endsWith( '.js' ) ).map( ( f ) => path.join( src, f ) )
	.concat( fs.readdirSync( __dirname ).filter( ( f ) => f.endsWith( '.js' ) ).map( ( f ) => path.join( __dirname, f ) ) );

arquivos.forEach( ( f ) => {
	try {
		execFileSync( process.execPath, [ '--check', f ], { stdio: 'pipe' } );
	} catch ( e ) {
		erro( 'sintaxe: ' + path.relative( root, f ) + '\n' + String( e.stderr || e.message ) );
	}
} );

// 2. Versão
const core = fs.readFileSync( path.join( src, 'Ronda-core.js' ), 'utf8' );
const versao = ( /version:\s*'([^']+)'/.exec( core ) || [] )[ 1 ];
const pkg = JSON.parse( fs.readFileSync( path.join( root, 'package.json' ), 'utf8' ) );

if ( !versao ) {
	erro( 'ronda.version não encontrada em src/Ronda-core.js' );
} else if ( pkg.version !== versao ) {
	erro( 'versões diferentes: package.json ' + pkg.version + ', src/Ronda-core.js ' + versao );
}

// 3. Mensagens
global.window = {};
// eslint-disable-next-line no-eval
eval( fs.readFileSync( path.join( src, 'Ronda-mensagens.js' ), 'utf8' ) );
const mensagens = global.window.rondaMessages || {};

fs.readdirSync( src ).filter( ( f ) => f.endsWith( '.js' ) && f !== 'Ronda-mensagens.js' ).forEach( ( f ) => {
	const texto = fs.readFileSync( path.join( src, f ), 'utf8' );
	const re = /ronda\.msg\(\s*'([^']+)'/g;
	let m;

	while ( ( m = re.exec( texto ) ) ) {
		if ( !Object.prototype.hasOwnProperty.call( mensagens, m[ 1 ] ) ) {
			erro( 'mensagem inexistente em src/' + f + ': ' + m[ 1 ] );
		}
	}
} );

if ( erros ) {
	console.error( '\n' + erros + ' problema(s).' );
	process.exit( 1 );
}
console.log( '✓ ' + arquivos.length + ' arquivos, versão ' + versao + ', ' + Object.keys( mensagens ).length + ' mensagens: tudo certo.' );

/**
 * Gera os arquivos para colar na wiki a partir do código do repositório.
 *
 * Para cada arquivo do Ronda:
 * - tira os comentários (o código continua igual; a análise é feita pelo acorn,
 *   então textos dentro de strings e expressões regulares não são tocados);
 * - acrescenta o cabeçalho da wiki: @target (sempre o carregador), a descrição,
 *   a ligação para a documentação, as ligações para todos os arquivos e o <nowiki>
 *   (no CSS, as mesmas linhas como comentários de CSS);
 * - confere se o resultado continua sendo JavaScript válido.
 * Também grava Ronda-Versao.wiki com a versão de ronda.version.
 *
 * Uso (na raiz do repositório):  npm install && npm run wiki
 *   ou: node ferramentas/gerar-wiki.js [pasta de saída]   (padrão: wiki/ na raiz)
 * Opções (variáveis de ambiente):
 *   RONDA_BASE   prefixo das páginas (padrão: "Usuário:Little Sunshine/Scripts/")
 *   RONDA_DOC    página de documentação (padrão: "User:Little Sunshine/Ronda")
 */
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
let acorn;

try {
	acorn = require( 'acorn' );
} catch ( e ) {
	console.error( 'Falta o acorn. Rode antes, na raiz do repositório: npm install' );
	process.exit( 1 );
}

const root = path.resolve( __dirname, '..' );
const dir = path.join( root, 'src' );
const out = path.resolve( root, process.argv[ 2 ] || 'wiki' );
const BASE = process.env.RONDA_BASE || 'Usuário:Little Sunshine/Scripts/';
const DOC = process.env.RONDA_DOC || 'User:Little Sunshine/Ronda';

// Ordem do carregador; a descrição vai na segunda linha do cabeçalho
const FILES = {
	'Ronda-loader.js': 'Ronda — carregador',
	'Ronda-mensagens.js': 'Ronda — mensagens de interface',
	'Ronda-core.js': 'Ronda — núcleo',
	'Ronda-catalogo.js': 'Ronda — catálogos',
	'Ronda-patrulha.js': 'Ronda — patrulha (Reverter, Avisar, Usuário, Listar, reversão rápida)',
	'Ronda-paginas.js': 'Ronda — páginas (Manutenção, ER, ESR, Consenso, Mover, #R, Esboço, Fusão, Busca, PetScan, Informações, Pedido, Não assinou)',
	'Ronda-admin.js': 'Ronda — administração (Eliminar, Desligar, Proteger, Bloquear, Restaurar, Lote)',
	'Ronda.css': 'Ronda — estilo'
};

const PARSE = { ecmaVersion: 2020, allowHashBang: true };

function tidy( text ) {
	return text.split( '\n' ).map( ( l ) => l.replace( /[ \t]+$/, '' ) ).join( '\n' )
		.replace( /\n{3,}/g, '\n\n' ).trim();
}

/** Tira os comentários; linhas que só tinham comentário somem por inteiro */
function stripJs( code, name ) {
	const ranges = [];
	let res = code;

	acorn.parse( code, Object.assign( {}, PARSE, {
		onComment: ( block, text, start, end ) => ranges.push( [ start, end ] )
	} ) );

	ranges.sort( ( a, b ) => b[ 0 ] - a[ 0 ] ).forEach( ( [ s, e ] ) => {
		const lineStart = res.lastIndexOf( '\n', s - 1 ) + 1;
		let lineEnd = res.indexOf( '\n', e );

		if ( lineEnd === -1 ) {
			lineEnd = res.length;
		}
		if ( !res.slice( lineStart, s ).trim() && !res.slice( e, lineEnd ).trim() ) {
			res = res.slice( 0, lineStart ) + res.slice( Math.min( lineEnd + 1, res.length ) );
		} else {
			res = res.slice( 0, s ).replace( /[ \t]+$/, '' ) + res.slice( e );
		}
	} );

	try {
		acorn.parse( res, PARSE );
	} catch ( e ) {
		throw new Error( name + ': o código ficou inválido depois de tirar os comentários (' + e.message + ')' );
	}
	return tidy( res );
}

function stripCss( code ) {
	return tidy( code.replace( /\/\*[\s\S]*?\*\//g, '' ) );
}

// Documentação e ligações entre os arquivos, no formato de comentário de cada linguagem
const linkLines = [ 'Documentação: [[' + DOC + ']]' ].concat( Object.keys( FILES ).map( ( f ) => '[[' + BASE + f + ']]' ) );
const links = linkLines.map( ( l ) => '// ' + l + '\n' ).join( '' );
const cssLinks = linkLines.map( ( l ) => '/* ' + l + ' */\n' ).join( '' );
const target = BASE + 'Ronda-loader.js';

fs.mkdirSync( out, { recursive: true } );

Object.keys( FILES ).forEach( ( f ) => {
	const src = path.join( dir, f );
	let code, text;

	if ( !fs.existsSync( src ) ) {
		throw new Error( 'Arquivo ausente: ' + f );
	}
	code = fs.readFileSync( src, 'utf8' );

	if ( f.endsWith( '.css' ) ) {
		text = '/* @target ' + target + ' */\n/* ' + FILES[ f ] + ' */\n' + cssLinks + '/* <nowiki> */\n'
			+ stripCss( code ) + '\n/* </nowiki> */\n';
	} else {
		text = '// @target ' + target + '\n// ' + FILES[ f ] + '\n' + links
			+ '//<nowiki>\n' + stripJs( code, f ) + '\n//</nowiki>\n';
		acorn.parse( text, PARSE );
	}

	fs.writeFileSync( path.join( out, f ), text );
	console.log( f.padEnd( 20 ) + String( code.length ).padStart( 7 ) + ' → ' + text.length );
} );

// Versão (para a página de versão da documentação)
( function () {
	const m = /version:\s*'([^']+)'/.exec( fs.readFileSync( path.join( dir, 'Ronda-core.js' ), 'utf8' ) );

	if ( !m ) {
		throw new Error( 'ronda.version não encontrada em Ronda-core.js' );
	}
	fs.writeFileSync( path.join( out, 'Ronda-Versao.wiki' ), m[ 1 ] );
	console.log( 'Versão ' + m[ 1 ] + ' → ' + path.relative( root, out ) + '/' );
}() );

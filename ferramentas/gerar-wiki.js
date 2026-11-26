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
 * Também grava:
 * - Ronda-Versao.wiki, com a versão de ronda.version;
 * - Ronda-Changelog.wiki, o CHANGELOG.md convertido em wikitexto (cada versão
 *   com uma âncora de mesmo nome, ex.: [[/Changelog#0.7.13]]);
 * - Ronda-Documentacao.wiki, docs/documentacao.wiki com a versão da infobox
 *   atualizada e ligada ao histórico.
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

// Temas: temas/<id>.css → Ronda-tema-<id>.css (carregado só por quem escolhe o tema)
( function () {
	const tdir = path.join( root, 'temas' );

	if ( !fs.existsSync( tdir ) ) {
		return;
	}
	// Tira temas que deixaram de existir (renomeados ou removidos)
	fs.readdirSync( out ).filter( ( f ) => /^Ronda-tema-.+\.css$/.test( f ) && !fs.existsSync( path.join( tdir, f.replace( /^Ronda-tema-/, '' ) ) ) )
		.forEach( ( f ) => fs.unlinkSync( path.join( out, f ) ) );
	fs.readdirSync( tdir ).filter( ( f ) => f.endsWith( '.css' ) ).sort().forEach( ( f ) => {
		const code = fs.readFileSync( path.join( tdir, f ), 'utf8' ),
			name = ( /tema "([^"]+)"/.exec( code ) || [ '', f ] )[ 1 ],
			dest = 'Ronda-tema-' + f,
			text = '/* @target ' + target + ' */\n/* Ronda — tema "' + name + '" */\n/* Documentação: [[' + DOC + ']] */\n/* <nowiki> */\n'
				+ stripCss( code ) + '\n/* </nowiki> */\n';

		fs.writeFileSync( path.join( out, dest ), text );
		console.log( dest.padEnd( 28 ) + String( code.length ).padStart( 7 ) + ' → ' + text.length );
	} );
}() );

// Versão (para a página de versão da documentação)
const version = ( function () {
	const m = /version:\s*'([^']+)'/.exec( fs.readFileSync( path.join( dir, 'Ronda-core.js' ), 'utf8' ) );

	if ( !m ) {
		throw new Error( 'ronda.version não encontrada em Ronda-core.js' );
	}
	fs.writeFileSync( path.join( out, 'Ronda-Versao.wiki' ), m[ 1 ] );
	console.log( 'Versão ' + m[ 1 ] + ' → ' + path.relative( root, out ) + '/' );
	return m[ 1 ];
}() );

/**
 * Markdown do CHANGELOG → wikitexto. Cobre o que o arquivo usa: títulos "## ",
 * listas "- " (e aninhadas), **negrito**, `código` e [texto](endereço).
 * Fora do código, {{ e [[ ficam em <nowiki> para não virarem predefinição ou ligação.
 */
function inlineWiki( line ) {
	const parts = line.split( /(`[^`]*`)/ );

	return parts.map( ( part, i ) => {
		if ( i % 2 ) {
			return '<code><nowiki>' + part.slice( 1, -1 ) + '</nowiki></code>';
		}
		return part
			.replace( /\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '[$2 $1]' )
			.replace( /\[([^\]]+)\]\(([^)\s]+)\)/g, '$1' ) // ligações para arquivos do repositório: só o texto
			.replace( /\{\{|\}\}|\[\[|\]\]/g, ( m ) => '<nowiki>' + m + '</nowiki>' )
			.replace( /\*\*([^*]+)\*\*/g, "'''$1'''" );
	} ).join( '' );
}

function changelogWiki( md, docPage ) {
	const out = [
		'Histórico de versões do [[' + docPage + '|Ronda]]. Cada versão tem uma âncora com o próprio número, por exemplo <code><nowiki>[[/Changelog#' + version + ']]</nowiki></code>.',
		'',
		'<small>Página gerada automaticamente a partir do [https://github.com/LittSun/Ronda/blob/main/CHANGELOG.md CHANGELOG.md] do repositório; edições feitas aqui são substituídas na próxima atualização.</small>',
		''
	];
	let skip = true;

	md.split( '\n' ).forEach( ( line ) => {
		const h = /^##\s+(.+?)\s*$/.exec( line );
		let m;

		if ( h ) {
			m = /^(\d+(?:\.\d+)+)\b/.exec( h[ 1 ] );
			// Só seções de versão; as demais (ex.: "Repositório") são de interesse do desenvolvimento
			skip = !m;
			if ( !skip ) {
				out.push( '== <span id="' + m[ 1 ] + '"></span>' + inlineWiki( h[ 1 ] ) + ' ==' );
			}
			return;
		}
		if ( skip ) {
			return;
		}
		m = /^(\s*)[-*]\s+(.*)$/.exec( line );
		if ( m ) {
			out.push( '*'.repeat( 1 + Math.floor( m[ 1 ].length / 2 ) ) + ' ' + inlineWiki( m[ 2 ] ) );
		} else if ( line.trim() ) {
			out.push( inlineWiki( line.trim() ) );
		} else if ( out[ out.length - 1 ] !== '' ) {
			out.push( '' );
		}
	} );
	return out.join( '\n' ).trim() + '\n';
}

// Histórico de versões e documentação, para as páginas da wiki
( function () {
	const docPage = process.env.RONDA_DOC_PAGE || 'Usuário:Little Sunshine/Ronda',
		changelog = path.join( root, 'CHANGELOG.md' ),
		doc = path.join( root, 'docs', 'documentacao.wiki' );
	let text;

	if ( fs.existsSync( changelog ) ) {
		fs.writeFileSync( path.join( out, 'Ronda-Changelog.wiki' ), changelogWiki( fs.readFileSync( changelog, 'utf8' ), docPage ) );
		console.log( 'CHANGELOG.md → Ronda-Changelog.wiki' );
	}
	if ( fs.existsSync( doc ) ) {
		text = fs.readFileSync( doc, 'utf8' );
		if ( !/^\|\s*versão\s*=.*$/m.test( text ) ) {
			throw new Error( 'docs/documentacao.wiki: a infobox não tem o campo "versão"' );
		}
		text = text.replace( /^(\|\s*versão\s*=\s*).*$/m, '$1[[/Changelog#' + version + '|' + version + ']]' );
		fs.writeFileSync( path.join( out, 'Ronda-Documentacao.wiki' ), text );
		console.log( 'docs/documentacao.wiki → Ronda-Documentacao.wiki' );
	}
}() );

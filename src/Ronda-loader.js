/**
 * Ronda — carregador para uso como script de usuário
 *
 * No common.js:
 *   mw.loader.load( '//pt.wikipedia.org/w/index.php?title=Usuário:Little_Sunshine/Scripts/Ronda-loader.js&action=raw&ctype=text/javascript' );
 *
 * Pede explicitamente cada arquivo da lista abaixo, todos de uma vez. Quando
 * todos chegam, executa o núcleo e, em seguida, os assistentes, na ordem da
 * lista (os assistentes se registram no núcleo). Um assistente com erro não
 * impede os demais.
 *
 * Para testar sem gravar nada, antes da linha acima:
 *   window.rondaConfig = { dryRun: true };
 */
/* global mw, $ */
( function () {
'use strict';

var BASE = 'Usuário:Little Sunshine/Scripts/',
	MESSAGES = 'Ronda-mensagens.js',
	CORE = 'Ronda-core.js',
	// Assistentes, na ordem de execução; a barra é montada depois, quando o documento está pronto
	HELPERS = [
		'Ronda-catalogo.js',
		'Ronda-patrulha.js',
		'Ronda-paginas.js',
		'Ronda-admin.js'
	],
	STYLES = [ 'Ronda.css' ],
	DEPS = [
		'jquery.ui',
		'mediawiki.api',
		'mediawiki.util',
		'mediawiki.user',
		'mediawiki.storage',
		'mediawiki.notification'
	];

// Evita carregar duas vezes (ex.: script de usuário + gadget)
if ( window.ronda || window.rondaLoaderStarted ) {
	return;
}
window.rondaLoaderStarted = true;

function log( level ) {
	// eslint-disable-next-line no-console
	console[ level ].apply( console, [ '[Ronda]' ].concat( [].slice.call( arguments, 1 ) ) );
}

function url( file, type ) {
	return mw.config.get( 'wgScript' ) + '?' + $.param( {
		title: BASE + file,
		action: 'raw',
		ctype: type
	} );
}

/** Pede o texto de um arquivo; resolve com { file, code } ou { file, error } */
function request( file ) {
	return $.ajax( { url: url( file, 'text/javascript' ), dataType: 'text', cache: true } ).then(
		function ( code ) {
			return { file: file, code: code };
		},
		function ( xhr ) {
			return $.Deferred().resolve( { file: file, error: xhr.status || 'erro de rede' } ).promise();
		}
	);
}

/** Executa um arquivo já baixado; sourceURL dá o nome certo no console e no depurador */
function run( item ) {
	if ( item.error ) {
		log( 'error', 'não foi possível baixar ' + item.file + ' (' + item.error + ')' );
		return false;
	}
	try {
		$.globalEval( item.code + '\n//# sourceURL=' + item.file );
		return true;
	} catch ( e ) {
		log( 'error', 'erro ao executar ' + item.file, e );
		return false;
	}
}

STYLES.forEach( function ( file ) {
	mw.loader.load( url( file, 'text/css' ), 'text/css' );
} );

// Todos os pedidos saem juntos: dependências do MediaWiki, núcleo e assistentes
$.when.apply( $, [ mw.loader.using( DEPS ), request( MESSAGES ), request( CORE ) ].concat( HELPERS.map( request ) ) ).then( function () {
	var messages = arguments[ 1 ],
		core = arguments[ 2 ],
		helpers = [].slice.call( arguments, 3 ),
		loaded = [];

	// Sem as mensagens, a barra ainda funciona, com as chaves no lugar dos textos
	if ( run( messages ) ) {
		loaded.push( MESSAGES );
	}

	if ( !run( core ) || !window.ronda ) {
		log( 'error', 'o núcleo não carregou; nada mais foi executado.' );
		return;
	}

	loaded.push( CORE );
	helpers.forEach( function ( item ) {
		if ( run( item ) ) {
			loaded.push( item.file );
		}
	} );

	log( 'log', 'versão ' + window.ronda.version + ' carregada: ' + loaded.join( ', ' ) );
}, function ( e ) {
	log( 'error', 'não foi possível carregar as dependências', e );
} );

}() );

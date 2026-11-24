// @target Usuário:Little Sunshine/Scripts/Ronda-loader.js
// Ronda — carregador
// Documentação: [[User:Little Sunshine/Ronda]]
// [[Usuário:Little Sunshine/Scripts/Ronda-loader.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-mensagens.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-core.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-catalogo.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-patrulha.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-paginas.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda-admin.js]]
// [[Usuário:Little Sunshine/Scripts/Ronda.css]]
//<nowiki>
( function () {
'use strict';

var BASE = 'Usuário:Little Sunshine/Scripts/',
	MESSAGES = 'Ronda-mensagens.js',
	CORE = 'Ronda-core.js',
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

if ( window.ronda || window.rondaLoaderStarted ) {
	return;
}
window.rondaLoaderStarted = true;

function log( level ) {
	console[ level ].apply( console, [ '[Ronda]' ].concat( [].slice.call( arguments, 1 ) ) );
}

function url( file, type ) {
	return mw.config.get( 'wgScript' ) + '?' + $.param( {
		title: BASE + file,
		action: 'raw',
		ctype: type
	} );
}

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

$.when.apply( $, [ mw.loader.using( DEPS ), request( MESSAGES ), request( CORE ) ].concat( HELPERS.map( request ) ) ).then( function () {
	var messages = arguments[ 1 ],
		core = arguments[ 2 ],
		helpers = [].slice.call( arguments, 3 ),
		loaded = [];

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
//</nowiki>

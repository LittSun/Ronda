/**
 * Ronda — carregar os arquivos do seu computador pelo console, sem criar páginas na wiki.
 *
 * 1. Na pasta src/ do repositório, sirva os arquivos localmente, por exemplo:
 *        python3 -m http.server 8000
 *    (ou: npx http-server -p 8000)
 * 2. Abra qualquer página da wiki, abra o console (F12) e cole este trecho.
 *
 * Cada vez que você salvar um arquivo, basta colar o trecho de novo: os
 * arquivos são baixados sem cache e a barra anterior é removida.
 *
 * Se preferir não rodar servidor, use o dist/Ronda-console.js (pacote único para colar).
 *
 * O modo de simulação (dryRun) vem ligado: as leituras vão para a API normalmente,
 * mas nenhuma escrita é enviada — os parâmetros aparecem no console.
 */
( function () {
	var base = 'http://localhost:8000/',
		files = [
			'Ronda-mensagens.js',
			'Ronda-core.js',
			'Ronda-catalogo.js',
			'Ronda-patrulha.js',
			'Ronda-paginas.js',
			'Ronda-admin.js'
		];

	function url( file ) {
		return base + file + '?_=' + Date.now(); // sem cache
	}

	window.rondaConfig = { dryRun: true };

	$( '#ronda-toolbar, #ca-ronda-toggle, #ronda-console-css' ).remove();
	$( '<link rel="stylesheet" id="ronda-console-css">' ).attr( 'href', url( 'Ronda.css' ) ).appendTo( 'head' );

	mw.loader.using( [
		'jquery.ui',
		'mediawiki.api',
		'mediawiki.util',
		'mediawiki.user',
		'mediawiki.storage',
		'mediawiki.notification'
	] ).then( function () {
		var v = $.ui.version.split( '.' ).map( Number ), ok = v[ 0 ] > 1 || ( v[ 0 ] === 1 && v[ 1 ] >= 9 );
		// eslint-disable-next-line no-console
		console.log( '[Ronda] jQuery UI ' + $.ui.version + ( ok ? ' (ok)' : ' — precisa da 1.9 ou mais nova' ) );

		// Baixa todos e executa na ordem, de uma vez: a barra é montada quando o
		// núcleo vê o documento pronto, depois que todos os arquivos rodaram
		return $.when.apply( $, files.map( function ( file ) {
			return $.ajax( { url: url( file ), dataType: 'text' } );
		} ) ).then( function () {
			var texts = files.length === 1 ? [ arguments[ 0 ] ] : [].slice.call( arguments ).map( function ( a ) {
				return a[ 0 ];
			} );

			delete window.ronda;
			texts.forEach( function ( code, i ) {
				$.globalEval( code + '\n//# sourceURL=' + files[ i ] );
			} );
		} );
	} ).then( function () {
		// eslint-disable-next-line no-console
		console.log( '[Ronda] carregado', window.ronda );
	}, function ( e ) {
		// eslint-disable-next-line no-console
		console.error( '[Ronda] falha ao carregar — o servidor local está rodando em ' + base + '?', e );
	} );
}() );

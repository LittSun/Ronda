/** Meta-painel, novidades e relato de erro */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

function comBarra( opts ) {
	const a = criar( Object.assign( { ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true } }, opts ) );

	a.$( 'body' ).append( '<div id="ronda-toolbar"><span class="ronda-brand">Ronda</span></div>' );
	return a;
}

test( 'Meta-painel: versão, novidades, opções rápidas e links', async () => {
	const a = comBarra();

	a.ronda.openMeta();
	const t = a.$( '#ronda-toolbar' ).text();

	assert.match( t, new RegExp( a.ronda.version.replace( /\./g, '\\.' ) ) );
	assert.match( t, /Modo de simulação/ );
	assert.match( t, /Preferências…/ );
	assert.match( t, /Informar erro/ );
	assert.match( t, /Histórico de versões/ );
} );

test( 'Meta-painel: opção rápida grava a preferência', async () => {
	const a = comBarra();

	a.ronda.openMeta();
	a.$( '.ronda-meta-quick input' ).first().prop( 'checked', true ).trigger( 'change' );
	await a.esperar();
	const c = a.escritas( 'options' ).filter( ( x ) => x.optionname === 'userjs-ronda' )[ 0 ];

	assert.ok( c );
	assert.strictEqual( JSON.parse( c.optionvalue ).dryRun, true );
} );

test( 'Novidades: abrem uma vez depois de uma atualização; "Não mostrar mais" desliga as faixas', async () => {
	const a = comBarra( { options: { 'userjs-ronda-novidades': '0.0.1' } } );
	const $bar = a.$( '#ronda-toolbar' );

	a.ronda.meta.showNews( $bar );
	assert.match( $bar.text(), /foi atualizado/ );
	assert.strictEqual( a.opcoes[ 'userjs-ronda-novidades' ], a.ronda.version );

	a.$( '.ronda-not-again' ).trigger( 'click' );
	assert.strictEqual( a.opcoes[ 'userjs-ronda-faixas' ], 'off' );

	const b = comBarra( { options: { 'userjs-ronda-novidades': '0.0.1', 'userjs-ronda-faixas': 'off' } } );

	b.ronda.meta.showNews( b.$( '#ronda-toolbar' ) );
	assert.doesNotMatch( b.$( '#ronda-toolbar' ).text(), /foi atualizado/ );
} );

test( 'Novidades: quem nunca usou vê as boas-vindas, não as novidades', async () => {
	const a = comBarra();

	a.ronda.meta.showNews( a.$( '#ronda-toolbar' ) );
	assert.doesNotMatch( a.$( '#ronda-toolbar' ).text(), /foi atualizado/ );
} );

test( 'Informar erro: seção nova com o relato e as informações técnicas', async () => {
	const a = comBarra();

	a.ronda.openReport();
	const $d = a.$( '.ronda-dialog' ).last();

	$d.find( 'input[type=text]' ).val( 'Mover falha' );
	$d.find( 'textarea' ).val( 'Cliquei e nada.' );
	$d.find( '.ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.esperar();
	const e = a.escritas( 'edit' )[ 0 ];

	assert.strictEqual( e.title, 'Usuário Discussão:Little Sunshine/Ronda' );
	assert.strictEqual( e.section, 'new' );
	assert.strictEqual( e.sectiontitle, 'Mover falha' );
	assert.match( e.text, /Cliquei e nada\. ~~~~/ );
	assert.match( e.text, /Versão: <nowiki>/ );
} );

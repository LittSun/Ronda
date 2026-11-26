/** Manutenção: sugestões pela página, usadas recentemente e resumos */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const longo = ( n ) => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore. '.repeat( n );

test( 'Sugestões: sem referências, sem categorias, poucas ligações e desambiguações', () => {
	const a = criar( {} );
	const s = a.ronda.tags.suggest( longo( 20 ), { ns: 0, categories: 0, disambig: 2, present: {} } );
	const ids = s.map( ( x ) => x.id );

	assert.ok( ids.includes( 's-fontes' ) );
	assert.ok( ids.includes( 's-cat' ) );
	assert.ok( ids.includes( 'wkf' ) );
	assert.ok( ids.includes( 'lig-ambiguas' ) );
	assert.match( s.find( ( x ) => x.id === 'lig-ambiguas' ).reason, /2 ligação/ );
} );

test( 'Sugestões: biografia de pessoa viva, notas e o que já está na página', () => {
	const a = criar( {} );
	const sug = a.ronda.tags.suggest;
	const comBib = longo( 3 ) + '\n\n== Bibliografia ==\n* Autor. Livro. 2001.\n';

	assert.strictEqual( sug( longo( 3 ), { ns: 0, living: true, present: {} } ).map( ( x ) => x.id ).filter( ( i ) => /fontes|notas/.test( i ) ).join(), 's-fontes-bpv' );
	assert.ok( sug( comBib, { ns: 0, present: {} } ).some( ( x ) => x.id === 's-notas' ) );
	assert.ok( !sug( longo( 3 ), { ns: 0, present: { 's-fontes': true } } ).some( ( x ) => /fontes|notas/.test( x.id ) ), 'não sugere outra da mesma família' );
	assert.strictEqual( sug( longo( 3 ), { ns: 4, present: {} } ).length, 0, 'só artigos' );
} );

test( 'Sugestões: referência só com URL e artigo sem introdução', () => {
	const a = criar( {} );
	const texto = '== História ==\n' + longo( 2 ) + '<ref>https://exemplo.org/x</ref>\n';
	const ids = a.ronda.tags.suggest( texto, { ns: 0, categories: 2, present: {} } ).map( ( x ) => x.id );

	assert.ok( ids.includes( 'f-referencias' ) );
	assert.ok( ids.includes( 'intro' ) );
	assert.ok( !ids.includes( 's-cat' ) );
} );

function ambienteManut( opcoes ) {
	const texto = longo( 20 ) + '\n[[Categoria:Algo]]';
	return criar( {
		options: opcoes,
		ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true },
		responder: ( p ) => {
			if ( p.prop === 'revisions' && p.rvprop === 'content' ) {
				return { query: { pages: [ { title: 'Teste', revisions: [ { slots: { main: { content: texto } } } ] } ] } };
			}
			if ( p.prop === 'categories' ) {
				return { query: { pages: [ { title: 'Teste', categories: [ { title: 'Categoria:Oculta', hidden: true } ] } ] } };
			}
			if ( p.generator === 'links' ) {
				return { query: {} };
			}
		},
		onPost: ( p ) => ( p.action === 'edit' ? { edit: { result: 'Success', title: 'Teste', oldrevid: 10, newrevid: 11 } } : undefined )
	} );
}

test( 'Manutenção: painéis Sugeridas (com o motivo) e Usadas recentemente no topo', async () => {
	const a = ambienteManut( { 'userjs-ronda-recentes': JSON.stringify( [ 'parcial', 's-fontes' ] ) } );

	a.ronda.getModule( 'manutencao' ).open( a.ronda.ctx );
	await a.esperar( 60 );
	const $sug = a.$( '.ronda-tag-sug' );
	const $rec = a.$( '.ronda-tag-recent' );

	assert.strictEqual( $sug.length, 1 );
	assert.match( $sug.text(), /Sem fontes.*nenhuma referência no texto/ );
	assert.match( $sug.text(), /Sem categoria.*nenhuma categoria visível/ );
	assert.match( $rec.text(), /Parcial/ );
	assert.doesNotMatch( $rec.text(), /Sem fontes/, 'a sugerida não se repete nas recentes' );
	assert.ok( a.$( '.ronda-tag-groups' ).children().first().is( $sug ) );
} );

test( 'Manutenção: resumo com {{[[Pre:…]]}} e a marcação entra nas recentes', async () => {
	const a = ambienteManut( {} );

	a.ronda.getModule( 'manutencao' ).open( a.ronda.ctx );
	await a.esperar( 60 );
	a.$( '.ronda-tag-sug .ronda-tag' ).first().find( 'input' ).prop( 'checked', true ).trigger( 'change' );
	a.$( '.ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.esperar( 60 );

	const ed = a.escritas( 'edit' )[ 0 ];
	assert.match( ed.summary, /^Marcação: \{\{\[\[Pre:Sem-fontes\|Sem-fontes\]\]\}\}/ );
	const op = a.escritas( 'options' ).find( ( c ) => c.optionname === 'userjs-ronda-recentes' );
	assert.deepStrictEqual( JSON.parse( op.optionvalue ), [ 's-fontes' ] );
} );

/** Qualidade automática (incorporada do QualidadeFeedback) */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

function par( n ) {
	return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore ' + n + '.';
}

function artigo( secoes, refsPorSecao ) {
	let t = par( 0 ) + '\n\n' + Array.from( { length: 12 }, ( _, i ) => '[[Ligação ' + i + ']]' ).join( ' ' ) + '\n';
	for ( let i = 1; i <= secoes; i++ ) {
		t += '\n== Seção ' + i + ' ==\n' + par( i ) + ( refsPorSecao ? '<ref>Fonte ' + i + '</ref>' : '' ) + '\n\n' + par( i + 100 ) + '\n';
	}
	return t;
}

test( 'Qualidade: nível 2 cumprido, aponta o que falta para o 3', () => {
	const a = criar( {} );
	const q = a.ronda.quality;
	const res = q.avaliar( { content: artigo( 3, true ), size: 9000, templates: [] }, {}, { refs: 3, imagens: 0 } );

	assert.strictEqual( res.estimado, 2 );
	assert.strictEqual( res.alvo, 3 );
	const nomes = q.faltam( res ).map( ( i ) => i.nome );
	assert.ok( nomes.includes( 'Tamanho' ) );
	assert.ok( nomes.includes( 'Referências' ) );
	assert.ok( nomes.includes( 'Imagens' ) );
	assert.ok( !nomes.some( ( n ) => /Seções/.test( n ) ), '3 seções de nível 2 bastam' );
} );

test( 'Qualidade: predefinições proibidas e de aviso derrubam o nível', () => {
	const a = criar( {} );
	const res = a.ronda.quality.avaliar( { content: artigo( 3, true ), size: 9000, templates: [ 'Predefinição:Reciclagem' ] }, {}, { refs: 3, imagens: 0 } );

	assert.strictEqual( res.estimado, 1 );
	assert.match( res.niveis[ 0 ].itens[ 4 ].atual, /Reciclagem/ );
} );

test( 'Qualidade: artigo destacado é 6, seções sem referência aparecem no nível 4', () => {
	const a = criar( {} );
	const q = a.ronda.quality;
	const dest = q.avaliar( { content: '', size: 0, templates: [ 'Predefinição:Artigo destacado' ] }, {}, { refs: 0, imagens: 0 } );
	const semRef = q.avaliar( { content: artigo( 2, false ), size: 30000, templates: [] }, {}, { refs: 20, imagens: 3 } );

	assert.strictEqual( dest.estimado, 6 );
	assert.match( semRef.niveis[ 2 ].itens[ 7 ].atual, /Seção 1; Seção 2/ );
} );

test( 'Qualidade: contagem pelo wikitexto fora da versão atual', () => {
	const a = criar( {} );
	const c = a.ronda.quality.contagemTexto( 'a<ref>x</ref> b<ref name="n">y</ref> c<ref name="n" /> {{sfn|A|2000}}\n[[Ficheiro:A.jpg|thumb]]\n{{Info|imagem = B.png}}' );

	assert.strictEqual( c.refs, 3 );
	assert.strictEqual( c.imagens, 2 );
} );

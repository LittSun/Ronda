/** Funções puras: escape de parâmetros, leitura de predefinições, substituições e textos do painel */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const { ronda } = criar();

test( 'templateSafe: barras soltas viram {{!}}; as de ligações e predefinições ficam', () => {
	assert.strictEqual( ronda.templateSafe( 'a|b' ), 'a{{!}}b' );
	assert.strictEqual( ronda.templateSafe( '{{User|Fulano}}' ), '{{User|Fulano}}' );
	assert.strictEqual( ronda.templateSafe( '[[WP:FF|fiáveis]] e x|y' ), '[[WP:FF|fiáveis]] e x{{!}}y' );
} );

test( 'templateSafe: "}}" solto não fecha a predefinição (SEC-11)', () => {
	assert.strictEqual( ronda.templateSafe( 'e }} solto' ), 'e &#125;&#125; solto' );
	assert.strictEqual( ronda.templateSafe( '{{a}} }}' ), '{{a}} &#125;&#125;' );
} );

test( 'templateParams: lê parâmetros com ligações e predefinições aninhadas', () => {
	const t = '{{ER|A4|2=[[Usuário(a):R|R]] ([[Usuário(a) Discussão:R|discussão]])|3=Sem fontes [[WP:FF|fiáveis]] e {{x|y}}.}}';

	assert.deepStrictEqual( JSON.parse( JSON.stringify( ronda.templateParams( t, 'ER' ) ) ), {
		1: 'A4',
		2: '[[Usuário(a):R|R]] ([[Usuário(a) Discussão:R|discussão]])',
		3: 'Sem fontes [[WP:FF|fiáveis]] e {{x|y}}.'
	} );
	assert.strictEqual( ronda.templateParams( '{{ERRO|x}}', 'ER' ), null );
} );

test( 'literal: texto do usuário com $ entra como está (SEC-10)', () => {
	assert.strictEqual( 'por $1'.replace( /\$1/g, ronda.literal( 'Usuário$&Teste' ) ), 'por Usuário$&Teste' );
	assert.strictEqual( ronda.quick.summary( 'Revertidas edições de $2', 'A', 'B$1C', 1, '' ), 'Revertidas edições de B$1C' );
} );

test( 'durationText: durações do registro em português', () => {
	const d = ronda.userInfo.durationText;

	assert.strictEqual( d( '3 weeks' ), '3 semanas' );
	assert.strictEqual( d( '1 week 2 days' ), '1 semana e 2 dias' );
	assert.strictEqual( d( 'infinite' ), 'sem prazo' );
	assert.strictEqual( d( '31 hours' ), '31 horas' );
} );

test( 'quick.plan: recusa se a última edição não é do usuário', () => {
	const p = ronda.quick.plan( [ { user: 'Outro', revid: 3 }, { user: 'X', revid: 2 } ], 'X' );

	assert.strictEqual( p.ok, false );
	assert.ok( ronda.quick.plan( [ { user: 'X', revid: 3 }, { user: 'Y', revid: 2 } ], 'X' ).ok );
} );

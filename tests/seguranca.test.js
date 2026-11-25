/**
 * Testes de regressão dos achados da auditoria técnica da 0.7.15 (SEC-01 a SEC-04).
 * Cada um reproduz o cenário relatado e exige que nenhuma escrita perigosa saia.
 */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

function pagina( title, extra ) {
	return { query: { pages: [ Object.assign( { title: title, ns: 0, pageid: 5, lastrevid: 10 }, extra || {} ) ] } };
}

function tecla( $el, key ) {
	$el.trigger( $el.constructor.Event( 'keydown', { key: key } ) );
}

/* ---------------- SEC-01: Mover ---------------- */

function ambienteMover( destino ) {
	return criar( {
		rights: [ 'edit', 'move', 'delete' ],
		ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true },
		responder: ( p ) => {
			if ( p.prop === 'info' && p.titles === 'Teste' ) {
				return pagina( 'Teste' );
			}
			if ( p.prop === 'info' ) {
				return { query: { pages: String( p.titles ).split( '|' ).map( ( t ) => t === destino.title
					? { title: t, ns: 0, pageid: 9, redirect: destino.redirect || undefined }
					: { title: t, missing: true } ) } };
			}
			if ( p.prop === 'revisions' && p.titles === destino.title ) {
				return pagina( destino.title, { revisions: destino.revisions } );
			}
		}
	} );
}

async function abrirMover( a ) {
	a.ronda.getModule( 'mover' ).open( a.ronda.ctx );
	await a.esperar();
	return a.$( '.ronda-dialog' ).last();
}

test( 'SEC-01: Enter num destino com conteúdo não elimina nada', async () => {
	const a = ambienteMover( { title: 'Brasil', revisions: [ { slots: { main: { content: 'Texto' } } }, { slots: { main: { content: 'x' } } } ] } );
	const $d = await abrirMover( a );
	const $t = $d.find( 'input[type=text]' ).first();

	$t.val( 'Brasil' ).trigger( 'input' );
	tecla( $t, 'Enter' );
	await a.esperar( 60 );

	assert.deepStrictEqual( a.escritas().map( ( c ) => c.action ), [] );
	assert.match( $d.text(), /já existe/ );
} );

test( 'SEC-01: clicar em Mover logo depois de digitar não elimina nada', async () => {
	const a = ambienteMover( { title: 'Brasil', revisions: [ { slots: { main: { content: 'Texto' } } }, { slots: { main: { content: 'x' } } } ] } );
	const $d = await abrirMover( a );

	$d.find( 'input[type=text]' ).first().val( 'Brasil' ).trigger( 'input' );
	$d.parent().find( '.ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.esperar( 60 );

	assert.strictEqual( a.escritas( 'delete' ).length, 0 );
	assert.strictEqual( a.escritas( 'move' ).length, 0 );
} );

test( 'SEC-01: destino com conteúdo só é eliminado com a caixa marcada e o título digitado', async () => {
	const a = ambienteMover( { title: 'Brasil', revisions: [ { slots: { main: { content: 'Texto' } } }, { slots: { main: { content: 'x' } } } ] } );
	const $d = await abrirMover( a );
	const $t = $d.find( 'input[type=text]' ).first();
	const mover = () => $d.parent().find( '.ui-dialog-buttonpane button' ).first().trigger( 'click' );

	$t.val( 'Brasil' ).trigger( 'input' ).trigger( 'blur' );
	await a.esperar();
	const $cb = $d.find( 'input[type=checkbox]' ).filter( ( i, el ) => /Eliminar o destino/.test( a.$( el ).parent().text() ) );

	assert.strictEqual( $cb.prop( 'checked' ), false, 'a caixa começa desmarcada' );
	$cb.prop( 'checked', true ).trigger( 'change' );
	mover();
	await a.esperar( 60 );
	assert.strictEqual( a.escritas( 'delete' ).length, 0, 'sem o título digitado, nada' );

	$d.find( 'input[id*=move-confirm]' ).val( 'Brasil' );
	mover();
	await a.esperar( 60 );
	assert.deepStrictEqual( a.escritas().map( ( c ) => c.action ), [ 'delete', 'move' ] );
} );

test( 'SEC-01: destino livre, Enter move direto', async () => {
	const a = ambienteMover( { title: 'Outro' } );
	const $d = await abrirMover( a );
	const $t = $d.find( 'input[type=text]' ).first();

	$t.val( 'Livre' ).trigger( 'input' );
	tecla( $t, 'Enter' );
	await a.esperar( 80 );

	assert.deepStrictEqual( a.escritas().map( ( c ) => c.action ), [ 'move' ] );
} );

/* ---------------- SEC-02: Lote › Proteger ---------------- */

test( 'SEC-02: Lote › Proteger começa sem nível escolhido; "Remover proteção" é explícita', async () => {
	const a = criar( {
		rights: [ 'edit', 'delete', 'protect', 'undelete' ],
		ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true },
		responder: ( p ) => {
			if ( p.prop === 'info' && /A\|B|^A$/.test( p.titles || '' ) ) {
				return { query: { pages: [ { title: 'A', ns: 0, pageid: 1 }, { title: 'B', ns: 0, pageid: 2 } ] } };
			}
		}
	} );

	a.ronda.getModule( 'lote' ).open( a.ronda.ctx, {} );
	await a.esperar();
	const $d = a.$( '.ronda-dialog' ).last().find( '.ronda-form' );
	const $selects = $d.find( 'select' );
	const $acao = $selects.filter( ( i, el ) => a.$( el ).find( 'option[value=protect]' ).length );

	$acao.val( 'protect' ).trigger( 'change' );
	const $nivel = $selects.filter( ( i, el ) => a.$( el ).find( 'option[value=all]' ).length );
	assert.strictEqual( $nivel.length, 2, 'edição e moção' );
	$nivel.each( ( i, el ) => assert.strictEqual( a.$( el ).val(), '', 'sem nível pré-escolhido' ) );
	assert.match( $nivel.first().find( 'option[value=all]' ).text(), /Remover proteção/ );
} );

/* ---------------- SEC-03: Bloquear (reversor) ---------------- */

test( 'SEC-03: reversor não recebe a opção de alterar bloqueio de outra pessoa', async () => {
	const a = criar( {
		user: 'Reversor',
		rights: [ 'edit', 'rollback', 'block' ],
		ctx: { type: 'contribs', ns: -1, page: 'Especial:Contribuições/1.2.3.4', targetUser: '1.2.3.4' },
		responder: ( p ) => {
			if ( p.list && /blocks/.test( p.list ) ) {
				return { query: { blocks: [ { id: 7, user: '1.2.3.4', by: 'Admin', expiry: 'infinity', reason: 'LTA', restrictions: [] } ] } };
			}
		}
	} );

	a.ronda.getModule( 'bloqueio' ).open( a.ronda.ctx );
	await a.esperar( 60 );
	const valores = a.$( '.ronda-dialog select option' ).map( ( i, o ) => o.value ).get();

	assert.ok( valores.includes( 'new' ), 'o formulário abriu, com a opção de acrescentar' );
	assert.ok( !valores.includes( 'edit:7' ), 'sem "alterar" no bloqueio do administrador' );
	assert.ok( !valores.includes( 'unblock:7' ), 'nem "remover"' );
} );

/* ---------------- SEC-04: Consenso ---------------- */

function ambienteConsenso( criadaHaDias ) {
	return criar( {
		rights: [ 'edit', 'createpage', 'move' ],
		ctx: { type: 'view', ns: 0, page: 'Teste', title: 'Teste', exists: true },
		responder: ( p ) => {
			if ( p.titles === 'Teste' && p.prop === 'revisions' ) {
				return pagina( 'Teste', { revisions: [ { slots: { main: { content: 'Texto sem marcação' } } } ] } );
			}
			if ( /^Wikipédia:Páginas para eliminar\/Teste$/.test( p.titles || '' ) && p.prop === 'revisions' ) {
				return pagina( p.titles, { ns: 4, revisions: [ { timestamp: new Date( Date.now() - criadaHaDias * 864e5 ).toISOString() } ] } );
			}
		}
	} );
}

test( 'SEC-04: Consenso com discussão recente (aberta) não abre o formulário', async () => {
	const a = ambienteConsenso( 2 );

	a.ronda.getModule( 'consenso' ).open( a.ronda.ctx );
	await a.esperar( 60 );

	assert.strictEqual( a.$( '.ronda-dialog' ).length, 0 );
	assert.match( a.notificacoes.join( ' ' ), /provavelmente ainda está aberta/ );
	assert.strictEqual( a.escritas().length, 0 );
} );

test( 'SEC-04: discussão antiga exige marcar o arquivamento antes de qualquer escrita', async () => {
	const a = ambienteConsenso( 400 );

	a.ronda.getModule( 'consenso' ).open( a.ronda.ctx );
	await a.esperar( 60 );
	const $d = a.$( '.ronda-dialog' ).last();

	assert.match( $d.text(), /já existe/ );
	$d.find( 'textarea' ).val( 'Sem relevância.' );
	$d.find( '.ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.esperar( 60 );
	assert.strictEqual( a.escritas().length, 0 );
	assert.match( a.notificacoes.join( ' ' ), /arquivá-la/ );
} );

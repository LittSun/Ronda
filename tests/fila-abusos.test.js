/** Filas › Filtro de abusos: só edições gravadas, filtros escolhidos nas preferências */
'use strict';

const test = require( 'node:test' );
const assert = require( 'node:assert' );
const { criar } = require( './ambiente' );

const oc = ( id, filtro, revid, titulo ) => ( { id: id, filter_id: String( filtro ), filter: 'Filtro ' + filtro, user: 'Fulano', title: titulo || 'Alfa', action: 'edit', result: revid ? 'tag' : 'disallow', revid: revid || 0 } );

async function abrirFila( a, rotulo ) {
	a.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	a.ronda.getModule( 'listar' ).open( a.ronda.ctx );
	a.$( '#ronda-toolbar a[role=button]' ).filter( ( i, el ) => a.$( el ).text() === rotulo ).trigger( 'click' );
	await a.esperar( 60 );
	return Array.from( a.$( '#ronda-toolbar .ronda-feed li' ).map( ( i, el ) => a.$( el ).text() ).get() );
}

/** Campo das preferências pelo começo do rótulo (a seção Filas pode ter os campos de várias filas) */
function campo( a, rotulo ) {
	return a.$( '.ronda-dialog .ronda-row' ).filter( ( i, el ) => a.$( el ).children( 'label' ).text().startsWith( rotulo ) ).find( 'input' );
}

test( 'savedAbuseHits: só as gravadas, uma linha por edição com todos os filtros', () => {
	const { ronda } = criar();
	const lista = ronda.lists.savedAbuseHits( [ oc( 9, 3, 500 ), oc( 8, 17, 500 ), oc( 7, 3, 0 ), oc( 6, 42, 501, 'Beta' ) ] );

	assert.deepStrictEqual( Array.from( lista, ( x ) => x.revid ), [ 500, 501 ] );
	assert.deepStrictEqual( Array.from( lista[ 0 ].filters, ( f ) => f.id + '@' + f.log ), [ '3@9', '17@8' ] );
} );

test( 'abuseFilters: números válidos da preferência, em lista ou texto', () => {
	assert.deepStrictEqual( Array.from( criar( { rondaConfig: { abuseLog: { filters: [ 3, 17 ] } } } ).ronda.lists.abuseFilters() ), [ 3, 17 ] );
	assert.deepStrictEqual( Array.from( criar( { rondaConfig: { abuseLog: { filters: '5, x | 8' } } } ).ronda.lists.abuseFilters() ), [ 5, 8 ] );
	assert.deepStrictEqual( Array.from( criar().ronda.lists.abuseFilters() ), [] );
} );

test( 'Fila: pede só os filtros escolhidos e mostra a edição com a ligação para cada ocorrência', async () => {
	const a = criar( {
		rights: [ 'edit', 'abusefilter-log' ],
		rondaConfig: { abuseLog: { filters: [ 3, 17 ] } },
		responder: ( p ) => p.list === 'abuselog' ? { query: { abuselog: [ oc( 9, 3, 500 ), oc( 8, 17, 500 ), oc( 7, 3, 0, 'Impedida' ) ] } } : undefined
	} );
	const linhas = await abrirFila( a, 'Filtro de abusos' );
	const q = a.consultas.find( ( p ) => p.list === 'abuselog' );

	assert.strictEqual( q.aflfilter, '3|17' );
	assert.match( q.aflprop, /revid/ );
	assert.strictEqual( linhas.length, 1 );
	assert.match( linhas[ 0 ], /^Alfa · Fulano · 3: Filtro 3; 17: Filtro 17$/ );
	const hrefs = Array.from( a.$( '#ronda-toolbar .ronda-feed li a' ).map( ( i, el ) => decodeURIComponent( a.$( el ).attr( 'href' ) ) ).get() );

	assert.ok( hrefs.some( ( h ) => /diff=500/.test( h ) ) );
	assert.ok( hrefs.some( ( h ) => /AbuseLog\/9/.test( h ) ) && hrefs.some( ( h ) => /AbuseLog\/8/.test( h ) ) );
} );

test( 'Fila: sem filtros escolhidos, pede todos; sem o direito, a fila não aparece', async () => {
	const a = criar( { rights: [ 'edit', 'abusefilter-log' ], responder: ( p ) => p.list === 'abuselog' ? { query: { abuselog: [] } } : undefined } );
	const linhas = await abrirFila( a, 'Filtro de abusos' );

	assert.ok( !( 'aflfilter' in a.consultas.find( ( p ) => p.list === 'abuselog' ) ) );
	assert.strictEqual( linhas.length, 0 );
	assert.match( a.$( '#ronda-toolbar' ).text(), /Nenhuma edição gravada/ );

	const b = criar( { rights: [ 'edit' ] } );

	b.$( 'body' ).append( '<div id="ronda-toolbar"></div>' );
	b.ronda.getModule( 'listar' ).open( b.ronda.ctx );
	assert.doesNotMatch( b.$( '#ronda-toolbar' ).text(), /Filtro de abusos/ );
} );

test( 'Preferências: os números dos filtros são salvos como lista', async () => {
	const a = criar();

	a.ronda.openPreferences();
	const $f = campo( a, 'Filtro de abusos' );

	assert.strictEqual( $f.closest( 'fieldset' ).children( 'legend' ).text(), 'Filas' );
	$f.val( '3, 17 42' );
	a.$( '.ronda-dialog .ui-dialog-buttonpane button' ).first().trigger( 'click' );
	await a.ate( () => a.escritas( 'options' ).length > 0 );
	assert.deepStrictEqual( JSON.parse( a.escritas( 'options' )[ 0 ].optionvalue ).abuseLog.filters, [ 3, 17, 42 ] );
} );

/* ---------------- Descrições, acesso e alertas ---------------- */

const FILTROS = { query: { abusefilters: [
	{ id: 3, description: 'Remoção de conteúdo', enabled: '', hits: 10 },
	{ id: 17, description: 'Spam', enabled: '', 'private': '', hitsredacted: '' },
	{ id: 42, description: 'Antigo', hits: 0 }
] } };

test( 'Filtros: descrição, marcas e se a conta vê o registro (hitsredacted)', async () => {
	const a = criar( { rights: [ 'edit', 'abusefilter-log' ], responder: ( p ) => p.list === 'abusefilters' ? FILTROS : undefined } );
	let dados;

	a.ronda.abuse.info().then( ( d ) => {
		dados = d;
	} );
	await a.ate( () => dados );
	assert.strictEqual( dados.byId[ 3 ].visible, true );
	assert.strictEqual( dados.byId[ 17 ].visible, false );
	assert.strictEqual( dados.byId[ 17 ][ 'private' ], true );
	assert.strictEqual( dados.byId[ 42 ].enabled, false );
	assert.strictEqual( a.ronda.abuse.label( 3 ), '3: Remoção de conteúdo' );
	const acesso = a.ronda.abuse.access().map( ( x ) => x.id + '=' + x.ok ).join( ' ' );

	assert.match( acesso, /public=true private=false protected=false suppressed=false/ );
} );

test( 'Escolher filtros: sem acesso fica esmaecido e desabilitado; aplicar devolve fila e alerta', async () => {
	const a = criar( { rights: [ 'edit', 'abusefilter-log' ], responder: ( p ) => p.list === 'abusefilters' ? FILTROS : undefined } );
	let saida;

	a.ronda.abuse.openPicker( { filters: [ 3 ], alert: [] }, ( o ) => {
		saida = o;
	} );
	await a.ate( () => a.$( '.ronda-af-table tr[data-id]' ).length > 0 );
	const $d = a.$( '.ronda-dialog' ).last();

	assert.match( $d.text(), /Remoção de conteúdo/ );
	assert.ok( $d.find( 'tr[data-id=17]' ).hasClass( 'ronda-af-off' ) );
	assert.strictEqual( $d.find( 'tr[data-id=17] input:disabled' ).length, 2 );
	assert.match( $d.find( 'tr[data-id=17]' ).attr( 'title' ), /privado/i );
	assert.strictEqual( $d.find( 'tr[data-id=42]' ).css( 'display' ), 'none', 'desativado escondido por padrão' );
	$d.find( 'tr[data-id=3] input[data-k=alert]' ).prop( 'checked', true );
	$d.parent().find( '.ui-dialog-buttonpane button' ).first().trigger( 'click' );
	assert.strictEqual( saida.filters.join(), '3' );
	assert.strictEqual( saida.alert.join(), '3' );
} );

test( 'Alerta: a primeira consulta só marca o ponto de partida; as seguintes avisam das novas', async () => {
	let registro = [ oc( 10, 3, 500 ) ];
	const a = criar( { rights: [ 'edit', 'abusefilter-log' ], rondaConfig: { abuseLog: { alert: [ 3 ] } },
		responder: ( p ) => p.list === 'abuselog' ? { query: { abuselog: registro } } : undefined } );
	let novas;

	a.$( 'body' ).append( '<div id="ronda-toolbar"><button class="ronda-btn-listar"></button></div>' );
	assert.strictEqual( a.ronda.abuse.fresh( registro, null ).length, 0 );

	a.ronda.abuse.poll().then( ( h ) => {
		novas = h;
	} );
	await a.ate( () => novas );
	assert.strictEqual( novas.length, 0 );
	assert.strictEqual( a.consultas.find( ( p ) => p.list === 'abuselog' ).aflfilter, '3' );

	registro = [ oc( 12, 3, 502, 'Gama' ), oc( 11, 3, 501, 'Beta' ), oc( 10, 3, 500 ) ];
	novas = null;
	a.ronda.abuse.poll().then( ( h ) => {
		novas = h;
	} );
	await a.ate( () => novas );
	assert.deepStrictEqual( Array.from( novas, ( e ) => e.id ), [ 12, 11 ] );
	assert.ok( a.$( '.ronda-btn-listar' ).hasClass( 'ronda-btn-alert' ) );
	assert.match( a.notificacoes.map( ( n ) => typeof n === 'string' ? n : a.$( n ).text() ).join( ' ' ), /3: Filtro 3 — Fulano em Gama/ );

	a.ronda.abuse.clearBadge();
	assert.ok( !a.$( '.ronda-btn-listar' ).hasClass( 'ronda-btn-alert' ) );
} );

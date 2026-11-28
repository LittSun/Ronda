// @target Usuário:Little Sunshine/Scripts/Ronda-loader.js
// Ronda — catálogos
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
( function ( ronda ) {
'use strict';

ronda.catalog = ronda.catalog || {};

ronda.catalog.multipleIssues = 'Múltiplos problemas';

ronda.catalog.maintenance = [
	{ id: 's-fontes', group: 'Fontes e referências', label: 'Sem fontes', template: 'Sem-fontes', action: 'subst:s-fontes',
		title: 'Página não cita nenhuma fonte ou referência', warn: 'cite fonte', sameEditor: true },
	{ id: 's-fontes-bpv', group: 'Fontes e referências', label: 'Sem fontes BPV', template: 'Sem-fontes-bpv', action: 'subst:s-fontes-bpv',
		title: 'Biografia de pessoa viva que não cita nenhuma fonte', warn: 'cite fonte', sameEditor: true },
	{ id: 's-notas', group: 'Fontes e referências', label: 'Sem notas', template: 'Sem notas', action: 'subst:s-notas',
		title: 'Existem fontes no final da página, mas não são citadas no corpo do artigo' },
	{ id: 's-notas-bpv', group: 'Fontes e referências', label: 'Sem notas BPV', template: 'Sem notas BPV', action: 'subst:s-notas-bpv',
		title: 'Biografia de pessoa viva com fontes no final, mas não citadas no corpo' },
	{ id: 'm-notas', group: 'Fontes e referências', label: 'Mais notas', template: 'Mais notas', action: 'subst:m-notas',
		title: 'Página cita fontes confiáveis, mas não cobre todo o texto' },
	{ id: 'm-fontes-bpv', group: 'Fontes e referências', label: 'Mais fontes BPV', template: 'Mais fontes-bpv', action: 'subst:m-fontes-bpv',
		title: 'Biografia de pessoa viva que cita fontes, porém que não cobrem todo o texto' },
	{ id: 'fpr', group: 'Fontes e referências', label: 'Fonte primária', template: 'Fontes primárias', action: 'subst:fpr',
		title: 'Artigo necessita de fontes secundárias confiáveis publicadas por terceiros' },
	{ id: '1f', group: 'Fontes e referências', label: 'Uma fonte', template: 'Uma-fonte', action: 'subst:1F',
		title: 'Página se baseia numa única fonte' },
	{ id: 'f-referencias', group: 'Fontes e referências', label: 'Formatar referências', template: 'Formatar referências', action: 'subst:f-referências',
		title: 'Artigo contém referências que necessitam de formatação' },
	{ id: 'wkf', group: 'Formatação e estilo', label: 'Wikificar', template: 'Wikificação', action: 'subst:wkf',
		title: 'Não está formatado de acordo com o livro de estilo' },
	{ id: 'rec', group: 'Formatação e estilo', label: 'Reciclagem', template: 'Reciclagem', action: 'subst:rec',
		title: 'Página precisa ser reciclada de acordo com o livro de estilo' },
	{ id: 's-cat', group: 'Categorias', label: 'Sem categoria', template: 'Sem cat', action: 'subst:s-cat',
		title: 'Página não está em nenhuma categoria', warn: 'categoria' },
	{ id: 'c-def', group: 'Categorias', label: 'Categorização deficiente', template: 'Cat def', action: 'subst:c-def',
		title: 'Página está com categorização deficiente' },
	{ id: 'sem-infocaixa', group: 'Formatação e estilo', label: 'Sem infocaixa', template: 'Sem infocaixa', action: 'Sem infocaixa',
		title: 'Página não possui nenhuma infocaixa', groupable: false,
		params: [ { name: '1', label: 'Infocaixa sugerida (só o NOME, sem "Predefinição:Info/")' } ] },
	{ id: 'sem-sinopse', group: 'Formatação e estilo', label: 'Sem sinopse', template: 'Sem sinopse', action: 'Sem sinopse',
		title: 'Página não possui nenhuma sinopse', groupable: false, placement: 'fim' },
	{ id: 'parcial', group: 'Conteúdo', label: 'Parcial', template: 'Parcial', action: 'Parcial', extra: '|{{subst:DATA}}',
		title: 'Artigo possui passagens que não respeitam o princípio da imparcialidade' },
	{ id: 'pub', group: 'Conteúdo', label: 'Publicidade', template: 'Publicidade', action: 'subst:pub',
		title: 'O conteúdo da página está possivelmente apresentado em formato publicitário' },
	{ id: 'ctx', group: 'Conteúdo', label: 'Contexto', template: 'Contextualizar', action: 'subst:ctx',
		title: 'Página carece de contexto' },
	{ id: 'nao-enc', group: 'Conteúdo', label: 'Não enciclopédico', template: 'Não enciclopédico', action: 'subst:não-enc',
		title: 'O conteúdo da página é possivelmente apresentado de maneira não enciclopédica' },
	{ id: 'global', group: 'Perspectiva global', label: 'Global', template: 'Global', action: 'Global', groupable: false,
		title: 'Conteúdo redigido sob uma perspectiva regionalizada (genérico)' },
	{ id: 'global-lusofonia', group: 'Perspectiva global', label: 'Global/Lusofonia', template: 'Global/Lusofonia', action: 'Global/Lusofonia', groupable: false,
		title: 'Conteúdo redigido sob uma perspectiva majoritariamente lusófona' },
	{ id: 'global-brasil', group: 'Perspectiva global', label: 'Global/Brasil', template: 'Global/Brasil', action: 'Global/Brasil', groupable: false,
		title: 'Conteúdo redigido sob uma perspectiva majoritariamente brasileira' },
	{ id: 'global-portugal', group: 'Perspectiva global', label: 'Global/Portugal', template: 'Global/Portugal', action: 'Global/Portugal', groupable: false,
		title: 'Conteúdo redigido sob uma perspectiva majoritariamente portuguesa' },
	{ id: 'm-traducao', group: 'Conteúdo', label: 'Má tradução', template: 'Má tradução', action: 'subst:m-tradução', groupable: false,
		title: 'O conteúdo da página está possivelmente mal traduzido',
		params: [ { name: '1', label: 'Página original, ex.: consulte [[:en:Título]] (inglês)' } ] },
	{ id: 'criado-ia', group: 'Conteúdo', label: 'Criado por IA', template: 'Criado por IA', action: 'subst:criado-ia',
		title: 'O conteúdo da página foi possivelmente criado por IA' },
	{ id: 'corrigir', group: 'Formatação e estilo', label: 'Corrigir', template: 'Corrigir', action: 'Corrigir',
		title: 'O conteúdo possivelmente precisa de correção ortográfico-gramatical' },
	{ id: 'revisao', group: 'Conteúdo', label: 'Revisão', template: 'Revisão', action: 'Revisão',
		title: 'O conteúdo da página está possivelmente inconsistente' },
	{ id: 'intro', group: 'Formatação e estilo', label: 'Má introdução', template: 'Má introdução', action: 'subst:Intro',
		title: 'A página não possui uma seção introdutória ou ela está malformatada' },
	{ id: 'sin', group: 'Formatação e estilo', label: 'Sinopse extensa', template: 'Sinopse', action: 'subst:sin',
		title: 'A sinopse do artigo é extensa demais ou muito detalhada' },
	{ id: 'em-manutencao', group: 'Estado da página', label: 'Em manutenção', template: 'Em manutenção', action: 'Em manutenção', groupable: false,
		title: 'Manutenção emergencial, a fim de evitar uma eliminação', listing: true,
		params: [ { name: 'situacao', label: 'Resumo da situação atual (vai para WP:Páginas precisando de manutenção)', required: true, external: true } ] },
	{ id: 'em-construcao', group: 'Estado da página', label: 'Em construção', template: 'Em construção', action: 'Em construção', groupable: false,
		title: 'Página em processo de construção' },
	{ id: 'e-traducao', group: 'Estado da página', label: 'Em tradução', template: 'Em tradução', action: 'subst:e-tradução', groupable: false,
		title: 'Página em processo de tradução' },
	{ id: 'desatualizado', group: 'Conteúdo', label: 'Desatualizado', template: 'Desatualizado', action: 'Desatualizado', extra: '|{{subst:DATA}}',
		title: 'A página contém conteúdo que pode estar desatualizado' },
	{ id: 'ev-atual', group: 'Estado da página', label: 'Evento atual', template: 'Evento atual', action: 'subst:ev-atual', groupable: false,
		title: 'Artigo sobre um evento atual',
		params: [ { name: '1', label: 'Tema do evento (ver Predefinição:Evento atual#Uso)' } ] },
	{ id: 'ev-futuro', group: 'Estado da página', label: 'Evento futuro', template: 'Evento futuro', action: 'subst:ev-futuro', groupable: false,
		title: 'Artigo sobre um evento futuro',
		params: [ { name: '1', label: 'Tema do evento (ver Predefinição:Evento futuro#Uso)' } ] },
	{ id: 'renomear', group: 'Estado da página', label: 'Renomear página', template: 'Renomear página', action: 'Renomear página', groupable: false,
		title: 'Proposta de renomeação da página',
		params: [ { name: '1', label: 'Novo nome', required: true }, { name: '2', label: 'Motivo' } ] },
	{ id: 'lig-ambiguas', group: 'Formatação e estilo', label: 'Ligações ambíguas', template: 'Ligações ambíguas', action: 'subst:Ligações ambíguas',
		title: 'Artigo com múltiplas ligações para páginas de desambiguação' }
];

function serie( tpl ) {
	return {
		1: tpl + '|1|$pagina',
		2: tpl + '|2|$pagina',
		3: tpl + '|3|$pagina'
	};
}

ronda.catalog.welcome = {
	user: 'bem-vindo(a)',
	ip: 'bem-vindo IP'
};

var OBS_NOME = [ { key: 'obs', label: 'Observação (opcional)' } ];

ronda.catalog.warnings = [
	{ id: 'bv', group: 'Boas-vindas', label: 'Boas-vindas', code: 'bem-vindo(a)', ip: false, welcome: false,
		title: 'Boas-vindas à Wikipédia (conta registrada)', summary: 'Mensagem de boas-vindas a novo usuário' },
	{ id: 'bv-ip', group: 'Boas-vindas', label: 'Boas-vindas (IP)', code: 'bem-vindo IP', ip: true, welcome: false,
		title: 'Boas-vindas para usuário não registrado', summary: 'Mensagem de boas-vindas a novo usuário' },
	{ id: 'av-bv', group: 'Boas-vindas', label: 'Erro em artigo + boas-vindas', code: 'bv-av-registrado|$pagina', ip: false, welcome: false,
		title: 'Aviso sobre erro em artigo e boas-vindas (conta registrada)', summary: 'Aviso sobre erro em artigo e boas-vindas' },
	{ id: 'av-bv-ip', group: 'Boas-vindas', label: 'Erro em artigo + boas-vindas (IP)', code: 'bv-av|$pagina', ip: true, welcome: false,
		title: 'Aviso sobre erro em artigo e boas-vindas (IP)', summary: 'Aviso sobre erro em artigo e boas-vindas' },
	{ id: 'bv-propaganda', group: 'Boas-vindas', label: 'Propaganda + boas-vindas', code: 'bv-propaganda', welcome: false,
		title: 'Pede que não faça propaganda e dá as boas-vindas', summary: 'Aviso sobre propaganda e boas-vindas' },

	{ id: 'generico', group: 'Avisos em série', label: 'Genérico (erro em artigo)',
		levels: { 1: 'aviso|$pagina', 2: 'aviso2|$pagina', 3: 'aviso3|$pagina' },
		title: 'Aviso genérico sobre erro em artigo', summary: 'Aviso', match: [ 'subst:aviso|', 'predefinição:aviso|' ] },
	{ id: 'vandalismo', group: 'Avisos em série', label: 'Vandalismo', levels: serie( 'Vandalismo' ),
		title: 'Não vandalize os artigos', summary: 'Aviso sobre vandalismo', match: [ 'aviso-vandalismo' ] },
	{ id: 'spam', group: 'Avisos em série', label: 'Spam', levels: serie( 'Av-Spam' ),
		title: 'Não insira ligações externas inadequadas', summary: 'Aviso sobre spam', match: [ 'av-spam' ] },
	{ id: 'publicidade', group: 'Avisos em série', label: 'Publicidade', levels: serie( 'Av-pub' ),
		title: 'Não inclua informações promocionais', summary: 'Aviso sobre divulgação publicitária', match: [ 'av-pub' ] },
	{ id: 'bpv', group: 'Avisos em série', label: 'Difamação (BPV)', levels: serie( 'Av-Bpv' ), welcome: false,
		title: 'Não adicione conteúdo difamatório em biografias de pessoas vivas', summary: 'Aviso sobre difamação',
		match: [ 'av-bpv', 'adição de difamação' ] },
	{ id: 'teste', group: 'Avisos em série', label: 'Testes', levels: serie( 'Av-teste' ),
		title: 'Não faça testes nos artigos', summary: 'Aviso sobre testes', match: [ 'av-teste' ] },
	{ id: 'fontes', group: 'Avisos em série', label: 'Cite fontes',
		levels: { 1: 'Aviso-cite fonte|$pagina', 2: 'Aviso-cite fonte|$pagina|2', 3: 'Aviso-cite fonte|$pagina|3' },
		title: 'Faltou citar fontes', summary: 'Aviso sobre falta de fontes', match: [ 'aviso-cite fonte' ] },
	{ id: 'ia', group: 'Avisos em série', label: 'Uso de IA', levels: serie( 'Aviso-IA' ),
		title: 'Não use IA para editar artigos', summary: 'Aviso sobre uso de IA', match: [ 'aviso-ia' ] },
	{ id: 'mocao', group: 'Avisos em série', label: 'Moção indevida', levels: serie( 'Aviso-moção' ),
		title: 'Não mova páginas indevidamente', summary: 'Aviso sobre moção indevida', match: [ 'aviso-moção' ] },
	{ id: 'remocao', group: 'Avisos em série', label: 'Remoção de conteúdo', levels: serie( 'Av-Remoção' ),
		title: 'Não remova conteúdo dos artigos', summary: 'Aviso sobre remoção de conteúdos', match: [ 'av-remoção' ] },
	{ id: 'tag', group: 'Avisos em série', label: 'Remoção de marcação', levels: serie( 'Aviso-tag' ),
		title: 'Não remova predefinições de manutenção', summary: 'Aviso sobre remoção de predefinições de manutenção' },
	{ id: 'ataques', group: 'Avisos em série', label: 'Ataques pessoais', levels: serie( 'Av-nfap' ),
		title: 'Não faça ataques pessoais', summary: 'Aviso sobre ataques pessoais', match: [ 'av-nfap' ] },
	{ id: 'forum', group: 'Avisos em série', label: 'Discussão como fórum', levels: serie( 'Aviso-não é um fórum' ), welcome: false,
		title: 'Não use páginas de discussão como fórum', summary: 'Aviso de uso de páginas de discussão como fórum' },

	{ id: 'fnc', group: 'Fontes e conteúdo', label: 'Fontes não confiáveis', code: 'Aviso-fontes não confiáveis|$pagina',
		title: 'Não use fontes não confiáveis', summary: 'Aviso sobre uso de fontes não confiáveis' },
	{ id: 'imdb', group: 'Fontes e conteúdo', label: 'IMDb como fonte', code: 'Aviso-IMDb|$pagina',
		title: 'Não cite o IMDb como fonte', summary: 'Aviso sobre uso do IMDb como fonte' },
	{ id: 'wp-fonte', group: 'Fontes e conteúdo', label: 'Wikipédia como fonte', code: 'Aviso-Wikipédia|$pagina',
		title: 'Não cite a Wikipédia como fonte', summary: 'Aviso sobre uso da Wikipédia como fonte' },
	{ id: 'fonte-removida', group: 'Fontes e conteúdo', label: 'Fontes removidas', code: 'Av-fonte|$pagina',
		title: 'Não remova fontes', summary: 'Aviso sobre remoção de fontes' },
	{ id: 'npi', group: 'Fontes e conteúdo', label: 'Pesquisa inédita', code: 'Av-npi|$pagina',
		title: 'Material não verificável por fontes', summary: 'Aviso sobre pesquisa inédita' },
	{ id: 'vda', group: 'Fontes e conteúdo', label: 'Violação de direitos de autor', code: 'Aviso-cópia|$pagina',
		title: 'Conteúdo copiado (VDA)', summary: 'Aviso sobre violação de direitos de autor' },
	{ id: 'vda-url', group: 'Fontes e conteúdo', label: 'Cópia (com URL)', code: 'cópia|$pagina|$url',
		title: 'Artigo copiado de fonte externa, indicando a origem', summary: 'Aviso sobre violação de direitos de autor',
		fields: [ { key: 'url', label: 'URL da página copiada', required: true } ] },
	{ id: 'vda-suspeito', group: 'Fontes e conteúdo', label: 'Suspeita de VDA', code: 'Aviso-suspeito|$pagina|15 minutos',
		title: 'Suspeita de violação de direitos de autor', summary: 'Aviso sobre suspeita de violação de direitos de autor' },
	{ id: 'parcial', group: 'Fontes e conteúdo', label: 'Parcialidade', code: 'Aviso-pdi|$pagina',
		title: 'Não faça edições parciais', summary: 'Aviso sobre parcialidade' },
	{ id: 'conflito', group: 'Fontes e conteúdo', label: 'Conflito de interesses', code: 'Aviso-conflito de interesses|$pagina',
		title: 'Conflito de interesses', summary: 'Aviso sobre conflitos de interesses' },
	{ id: 'autobiografia', group: 'Fontes e conteúdo', label: 'Autobiografia', code: 'Aviso-autobiografia|$pagina',
		title: 'Não crie autobiografias', summary: 'Aviso sobre autobiografia' },
	{ id: 'bsre', group: 'Fontes e conteúdo', label: 'Biografia sem relevo', code: 'BSRE|$pagina',
		title: 'Biografia sem relevo enciclopédico', summary: 'Aviso sobre biografia sem relevo enciclopédico' },
	{ id: 'propaganda', group: 'Fontes e conteúdo', label: 'Propaganda', code: 'propaganda|$pagina',
		title: 'Não faça propaganda', summary: 'Aviso sobre propaganda' },
	{ id: 'blogue', group: 'Fontes e conteúdo', label: 'Não é um blogue', code: 'Aviso-blogue|$pagina',
		title: 'Não use a Wikipédia como blogue ou plataforma de divulgação', summary: 'Aviso sobre não ser um blogue' },

	{ id: 'vlp', group: 'Estilo e edição', label: 'Variante da língua (VLP)', code: 'Aviso-ortografia|$pagina',
		title: 'Não mude a variante da língua portuguesa', summary: 'Aviso sobre mudanças entre [[WP:VLP]]' },
	{ id: 'previsao', group: 'Estilo e edição', label: 'Mostrar previsão', code: 'Mostrar previsão|$pagina',
		title: 'Não faça salvamentos sucessivos; use "Mostrar previsão"', summary: 'Aviso sobre botão de previsão' },
	{ id: 'layout', group: 'Estilo e edição', label: 'Mudança drástica de layout', code: 'Av-layout|$pagina',
		title: 'Mudanças drásticas no layout de artigos', summary: 'Aviso sobre mudanças drásticas em layout de artigos' },
	{ id: 'icones', group: 'Estilo e edição', label: 'Ícones e bandeiras', code: 'Aviso-ícones|$pagina',
		title: 'Não use ícones ou bandeiras fora das recomendações', summary: 'Aviso sobre uso indevido de ícones ou bandeiras' },
	{ id: 'assinatura', group: 'Estilo e edição', label: 'Assinatura em artigo', code: 'Aviso-assinatura|$pagina',
		title: 'Não assine artigos', summary: 'Aviso sobre assinatura em artigos' },
	{ id: 'traducao', group: 'Estilo e edição', label: 'Tradução em andamento', code: 'Aviso-tradução|$pagina',
		title: 'Tradução em andamento de artigos', summary: 'Aviso sobre tradução em andamento de artigos' },
	{ id: 'informe', group: 'Estilo e edição', label: 'Marcou sem informar', code: 'informar|$pagina',
		title: 'Incluiu predefinição de aviso ou alerta em artigo sem informar o motivo',
		summary: 'Aviso sobre inclusão de predefinição de aviso ou alerta em artigo sem informar' },
	{ id: 'categoria', group: 'Estilo e edição', label: 'Faltou categoria', code: 'Aviso-categoria|$pagina',
		title: 'Faltou categorizar a página', summary: 'Aviso sobre artigo não categorizado', match: [ 'av-categoria' ] },
	{ id: 'interwiki', group: 'Estilo e edição', label: 'Faltou interwiki', code: 'Aviso-interwiki|$pagina',
		title: 'Faltou ligar a página aos outros idiomas', summary: 'Aviso sobre artigo sem hiperligações para outros idiomas',
		match: [ 'av-interwiki' ] },
	{ id: 'assinatura', group: 'Estilo e edição', label: 'Assinatura não permitida', code: 'Aviso-assinatura não permitida|1=$pontos',
		title: 'Assinatura em desacordo com as regras para assinaturas', summary: 'Aviso sobre [[Wikipédia:Regras para assinaturas|assinatura não permitida]]',
		fields: [ { key: 'pontos', label: 'Regras violadas', required: true, checks: [
			[ '1.1', '1.1 Não identifica o usuário', 'A assinatura destina-se a identificar clara e inequivocamente o usuário em questão.' ],
			[ '2.1', '2.1 Engana, traz mensagens ou sugere cargos', 'Não é permitido ter uma assinatura que induza o leitor em erro atribuindo-a a terceiro, que contenha mensagens de nenhum tipo, ou que leve o leitor a supor o desempenho de cargos ou funções de controlo ou vigilância do conteúdo ou qualidade dos artigos.' ],
			[ '2.2', '2.2 Sem ligação para a página ou a discussão do usuário', 'A assinatura deve obrigatoriamente conter um link para a página do usuário ou de discussão.' ],
			[ '2.3', '2.3 Anúncios', 'Não são permitidos quaisquer anúncios nas assinaturas, que devem conter apenas e tão somente o nome do utilizador.' ],
			[ '2.4', '2.4 Ligações externas', 'Não são permitidos links externos para outros sites fora do âmbito dos projetos da Wikimedia.' ],
			[ '3.1', '3.1 Imagens ou <math>', 'Não são permitidas imagens, nem fórmulas feitas com <math> em assinaturas.' ],
			[ '3.2', '3.2 Texto a piscar ou animações', 'Não é permitido texto a piscar ou quaisquer outras animações.' ],
			[ '3.3', '3.3 Maior que 16 caracteres "m"', 'O tamanho visível da assinatura não deve ultrapassar 16 caracteres "m" em tamanho e fonte normal.' ],
			[ '3.4', '3.4 Altera o espaçamento entre linhas', 'O tamanho das letras não deve alterar o espaçamento normal entre linhas.' ],
			[ '3.5', '3.5 Mais de 3 cores', 'Não é permitido usar mais de 3 cores na assinatura, incluindo o preto.' ],
			[ '4.1', '4.1 Predefinição sem subst:', 'O software só permite a inclusão de predefinições se for usado subst:.' ],
			[ '4.2', '4.2 Código com mais de 255 caracteres', 'O código wiki da assinatura (depois de substituída, e sem contar a data) deve ter no máximo 255 caracteres.' ],
			[ '4.3', '4.3 Código mal formatado ou não fechado', 'Qualquer código HTML ou wiki deve estar corretamente formatado e fechado.' ],
			[ '5.1', '5.1 Acessibilidade ou código obsoleto', 'A assinatura deve seguir as regras de acessibilidade e não deve conter códigos obsoletos.' ]
		] } ] },

	{ id: 'av-er', group: 'Eliminação', label: 'Eliminação rápida', code: 'aviso-ER|$pagina|$regra|$obs', welcome: false,
		title: 'Aviso sobre eliminação rápida', summary: 'Aviso sobre eliminação rápida',
		fields: [ { key: 'regra', label: 'Regra de eliminação (ex.: A4)', required: true }, { key: 'obs', label: 'Observação (opcional)' } ] },
	{ id: 'av-esr', group: 'Eliminação', label: 'Eliminação semirrápida', code: 'aviso-ESR|$pagina', welcome: false,
		title: 'Aviso sobre eliminação semirrápida', summary: 'Aviso sobre eliminação semirrápida' },
	{ id: 'av-pe', group: 'Eliminação', label: 'Eliminação por consenso', code: 'aviso-PE|$pagina', welcome: false,
		title: 'Aviso sobre eliminação por consenso', summary: 'Aviso sobre eliminação por consenso' },
	{ id: 'nao-remova', group: 'Eliminação', label: 'Removeu marca de eliminação', code: 'Aviso-não remova|$pagina|$tipo',
		title: 'Não remova marcações de eliminação', summary: 'Aviso sobre remoção da marcação de eliminação',
		match: [ 'não remova' ],
		fields: [ { key: 'tipo', label: 'Tipo de marcação', options: [ [ '', 'Não especificar' ],
			[ 'er', 'Eliminação rápida' ], [ 'esr', 'Eliminação semirrápida' ], [ 'ec', 'Eliminação por consenso' ] ] } ] },

	{ id: 'ameaca', group: 'Conduta', label: 'Ameaça judicial', code: 'Av-ameaça', welcome: false,
		title: 'Não faça ameaças judiciais', summary: 'Aviso sobre ameaças judiciais' },
	{ id: 'linguagem', group: 'Conduta', label: 'Linguagem inadequada', code: 'linguagem incorreta',
		title: 'Não insulte nem use linguagem inadequada', summary: 'Aviso sobre linguagem inadequada' },
	{ id: 'morder', group: 'Conduta', label: 'Morder os novatos', code: 'morder|$usuario|$obs', welcome: false,
		title: 'Não seja agressivo com os novatos', summary: 'Aviso sobre agressividade com novatos',
		fields: [ { key: 'usuario', label: 'Usuário que foi "mordido"', required: true }, { key: 'obs', label: 'Observação (opcional)' } ] },
	{ id: 'assine', group: 'Conduta', label: 'Assine os comentários', code: 'assine|$local',
		title: 'Faltou assinar um comentário', summary: 'Aviso sobre assinatura de comentários',
		fields: [ { key: 'local', label: 'Local do comentário', required: true } ] },
	{ id: 'ge', group: 'Conduta', label: 'Guerra de edições', code: 'aviso-GE|$pagina', welcome: false,
		title: 'A página foi protegida por guerra de edições', summary: 'Aviso sobre guerra de edições' },
	{ id: 'pdu', group: 'Conduta', label: 'Uso da PDU', code: 'Av-pdu',
		title: 'Uso impróprio da página de discussão de usuário', summary: 'Aviso sobre uso impróprio de página de discussão de usuário' },
	{ id: 'pu', group: 'Conduta', label: 'Página de usuário', code: 'av-página de usuário',
		title: 'Considere refazer a página de usuário', summary: 'Aviso sobre a página de usuário' },
	{ id: 'branqueio', group: 'Conduta', label: 'Branqueio da PDU', code: 'Branqueio|1||~~' + '~~', sign: false, welcome: false,
		title: 'Mensagem sobre o branqueio da página de discussão do usuário', summary: 'Mensagem sobre branqueio da PDU' },
	{ id: 'branqueio-avisos', group: 'Conduta', label: 'Removeu avisos da PDU', code: 'Branqueio|2||~~' + '~~', sign: false, welcome: false,
		title: 'Mensagem sobre a remoção de avisos da página de discussão do usuário', summary: 'Mensagem sobre remoção de avisos da PDU' },
	{ id: 'vandalismo-repetido', group: 'Conduta', label: 'Vandalismo repetido (IP)', code: 'Vandalismo repetido',
		subst: false, sign: false, welcome: false, ip: true, top: true,
		title: 'Marca que informa que o IP tem sido bloqueado com frequência', summary: 'Marcando IP com vandalismo repetido' },

	{ id: 'bloqueado', group: 'Notificação de bloqueio', label: 'Bloqueado', code: 'bloqueado|$tempo|$motivo', welcome: false,
		header: 'Notificação de bloqueio',
		title: 'Bloqueio quando o usuário NÃO pode usar a própria discussão', summary: 'Notificação de bloqueio',
		fields: [ { key: 'tempo', label: 'Duração', required: true }, { key: 'motivo', label: 'Motivo', required: true } ] },
	{ id: 'bloqueado-disc', group: 'Notificação de bloqueio', label: 'Bloqueado (pode usar a discussão)',
		code: 'bloqueado-disc|$tempo|$motivo', welcome: false, header: 'Notificação de bloqueio',
		title: 'Bloqueio quando o usuário pode usar a própria discussão', summary: 'Notificação de bloqueio',
		fields: [ { key: 'tempo', label: 'Duração', required: true }, { key: 'motivo', label: 'Motivo', required: true } ] },
	{ id: 'bloqueado-cpv', group: 'Notificação de bloqueio', label: 'Conta para vandalismo', code: 'bloqueado-CPV', welcome: false,
		header: 'Notificação de bloqueio', ip: false,
		title: 'Bloqueio de conta usada só para vandalismo', summary: 'Notificação de bloqueio' },
	{ id: 'proxy', group: 'Notificação de bloqueio', label: 'Proxy', code: 'proxy', welcome: false, header: 'Notificação de bloqueio',
		title: 'Notificação de proxy bloqueado', summary: 'Notificação de bloqueio' },

	{ id: 'nome-ofensivo', group: 'Nome impróprio', label: 'Ofensivo/difamatório', code: 'Nome impróprio/ofensivo-difamatório|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'default',
		title: 'Nome ofensivo ou difamatório, passível de bloqueio imediato',
		summary: 'Aviso sobre nome impróprio ([[WP:NOMEATAQUE|ofensivo]]/[[WP:ABUSOBPV|difamatório]])' },
	{ id: 'nome-promocional', group: 'Nome impróprio', label: 'Promocional', code: 'Nome impróprio/promocional-compartilhado|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'optional',
		title: 'Nome de empresa, organização, site, produto, grupo ou evento',
		summary: 'Aviso sobre nome impróprio ([[WP:NOMEPROMO|promocional]])' },
	{ id: 'nome-confuso', group: 'Nome impróprio', label: 'Confuso/comprido', code: 'Nome impróprio/confuso-comprido|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'optional',
		title: 'Nome confuso, ininteligível ou excessivamente comprido',
		summary: 'Aviso sobre nome impróprio ([[WP:NOMECONF|confuso]]/[[WP:NOMECOMPRIDO|comprido]])' },
	{ id: 'nome-enganoso', group: 'Nome impróprio', label: 'Enganoso', code: 'Nome impróprio/enganoso|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'optional',
		title: 'Nome potencialmente enganoso', summary: 'Aviso sobre nome impróprio ([[WP:NOMEENGANOSO|enganoso]])' },
	{ id: 'nome-caracteres', group: 'Nome impróprio', label: 'Fora dos sistemas de escrita', code: 'Nome impróprio/caracteres|1=$obs',
		fields: OBS_NOME, ip: false, welcome: false, report: 'optional',
		title: 'Nome com caracteres fora dos sistemas de escrita', summary: 'Aviso sobre nome impróprio ([[WP:NOEMOJI|caracteres fora dos sistemas de escrita]])' }
];

ronda.catalog.notifiedCategories = [
	{ category: 'Categoria:!Usuários com nomes impróprios notificados', groups: [ 'Nome impróprio' ] }
];

ronda.catalog.deletionReasons = [
	{ label: 'Redirecionamentos', options: [
		{ label: 'R1 - Redirecionamento indevido, desnecessário, sem afluentes, para página inexistente ou eliminada', value: 'R1 - [[WP:ER#ERr1|Redirecionamento indevido, desnecessário, sem afluentes, para página inexistente ou eliminada]]' },
		{ label: 'R2 - Eliminação de redirecionamento para movimentar página de destino', value: 'R2 - [[WP:ER#ERr2|Eliminação de redirecionamento para movimentar página de destino]]' }
	] },
	{ label: 'Eliminação de páginas de usuário', ns: [ 2, 3 ], options: [
		{ label: 'U1 - Uso impróprio da página ou subpágina de usuário', value: 'U1 - [[WP:ER#ERU1|Uso impróprio da página ou subpágina de usuário]]' },
		{ label: 'U2 - Página de usuário criada por outro usuário', value: 'U2 - [[WP:ER#ERU2|Página de usuário criada por outro usuário]]' }
	] },
	{ label: 'Eliminação de ficheiros', ns: [ 6 ], options: [
		{ label: 'F1 - Ficheiro duplicado ou que não cumpre a política de conteúdo restrito', value: 'F1 - [[WP:ER#ERF1|Ficheiro duplicado ou que não cumpre a política de conteúdo restrito]]' }
	] },
	{ label: 'Eliminação de predefinições e módulos', ns: [ 10, 11, 828, 829 ], options: [
		{ label: 'P1 - Predefinição vazia, desnecessária ou substituída', value: 'P1 - [[WP:ER#ERP1|Predefinição vazia, desnecessária ou substituída]]' },
		{ label: 'P2 - Predefinição que seja deturpação inequívoca de regras estabelecidas', value: 'P2 - [[WP:ER#ERP2|Predefinição que seja deturpação inequívoca de regras estabelecidas]]' }
	] },
	{ label: 'Eliminação de categorias', ns: [ 14 ], options: [
		{ label: 'C1 - Categoria vazia, desnecessária ou substituída', value: 'C1 - [[WP:ER#ERC1|Categoria vazia, desnecessária ou substituída]]' }
	] },
	{ label: 'Eliminação de páginas de discussão', ns: 'talk', options: [
		{ label: 'D1 - Discussão de página inexistente', value: 'D1 - [[WP:ER#ERd1|Discussão de página inexistente]]' },
		{ label: 'D2 - Discussões de páginas para eliminação ou com histórico irrelevante', value: 'D2 - [[WP:ER#ERd2|Discussões de páginas para eliminação ou com histórico irrelevante]]' },
		{ label: 'Discussão de página de redirecionamento', value: 'Discussão de página de redirecionamento', add: true }
	] },
	{ label: 'Eliminação no domínio principal', ns: [ 0 ], options: [
		{ label: 'A2 - Sem contexto', value: 'A2 - [[WP:ER#ERa2|Sem contexto]]' },
		{ label: 'A3 - Sem conteúdo', value: 'A3 - [[WP:ER#ERa3|Sem conteúdo]]' },
		{ label: 'A4 - Sem indicação de importância (pessoa, animal, organização, evento ou conteúdo web)', value: 'A4 - [[WP:ER#ERa4|Sem indicação de importância (pessoa, animal, organização, evento ou conteúdo web)]]' },
		{ label: 'A5 - Sem indicação de importância (gravação musical ou livro)', value: 'A5 - [[WP:ER#ERa5|Sem indicação de importância (gravação musical ou livro)]]' },
		{ label: 'A6 - Artigo criado recentemente que duplica um tópico existente', value: 'A6 - [[WP:ER#ERa6|Artigo criado recentemente que duplica um tópico existente]]' },
		{ label: 'Autobiografia', value: '[[WP:AUTO|Autobiografia]]' },
		{ label: 'Biografia sem notoriedade', value: '[[WP:BSRE|Biografia sem notoriedade]]' },
		{ label: 'Currículo', value: '[[WP:CURRÍCULO|Currículo]]' },
		{ label: 'Difamação sem fontes comprobatórias', value: '[[WP:BPV|Difamação sem fontes comprobatórias]]' },
		{ label: 'Diretório de links', value: '[[WP:NOLINKS|Diretório de links]]' },
		{ label: 'Desambiguação desnecessária', value: '[[WP:DES|Desambiguação desnecessária]]' },
		{ label: 'Disparate / incompreensível', value: 'Disparate / incompreensível' },
		{ label: 'Entrada de dicionário', value: '[[WP:NODIC|Entrada de dicionário]]' },
		{ label: 'Falso e/ou especulativo', value: '[[WP:Verificabilidade|Falso e/ou especulativo]]' },
		{ label: 'Fórum de discussão / blog', value: '[[WP:FORUM|Fórum de discussão / blog]]' },
		{ label: 'Guia ou manual', value: '[[WP:GUIA|Guia ou manual]]' },
		{ label: 'Ofensivo / baixo calão', value: 'Ofensivo / baixo calão' },
		{ label: 'Repositório desordenado de informação', value: '[[WP:RDI|Repositório desordenado de informação]]' },
		{ label: 'Spam / propaganda / proselitismo religioso ou político', value: '[[WP:SPAM|Spam / propaganda / proselitismo religioso ou político]]' },
		{ label: 'Texto em língua estrangeira', value: '[[WP:EST|Texto em língua estrangeira]]' },
		{ label: 'Texto em maiúsculas', value: '[[WP:MAIÚSCULAS|Texto em maiúsculas]]' },
		{ label: 'Texto pronto', value: '[[WP:TEXTOPRONTO|Texto pronto]]' },
		{ label: 'Texto opinativo', value: '[[WP:OPI|Texto opinativo]]' }
	] },
	{ label: 'Motivos relacionados a ESR, EC ou redirecionamentos', ns: [ 0, 6 ], options: [
		{ label: 'ESR - Eliminação semirrápida', value: '[[WP:ESR|Eliminação semirrápida]]' },
		{ label: 'ESR-MATRAD - Eliminação por má tradução (automática ou incompreensível)', value: '[[WP:ESR-MATRAD|Eliminação por má tradução (automática ou incompreensível)]]' },
		{ label: 'ESR-SIW - Eliminação semirrápida de artigo sem fontes nem ligações interlínguas', value: '[[WP:ESR-SIW|Eliminação semirrápida de artigo sem fontes nem ligações interlínguas]]' }
	] },
	{ label: 'Regras gerais', options: [
		{ label: 'G1 - Eliminação técnica', value: 'G1 - [[WP:ER#ERg1|Eliminação técnica]]' },
		{ label: 'G2 - Impróprio', value: 'G2 - [[WP:ER#ERg2|Impróprio]]' },
		{ label: 'G3 - Violação de direitos autorais', value: 'G3 - [[WP:ER#ERg3|Violação de direitos autorais]]' },
		{ label: 'G4 - Página criada por editor bloqueado ou banido', value: 'G4 - [[WP:ER#ERg4|Página criada por editor bloqueado ou banido]]' },
		{ label: 'G5 - Aparecimento recorrente', value: 'G5 - [[WP:ER#ERg5|Aparecimento recorrente]]' },
		{ label: 'G6 - Spam', value: 'G6 - [[WP:ER#ERg6|Spam]]' },
		{ label: 'G7 - Eliminação a pedido do autor', value: 'G7 - [[WP:ER#ERg7|Eliminação a pedido do autor]]' }
	] }
];

ronda.catalog.speedy = [
	{ rule: 'A2', title: 'Sem contexto', ns: [ 0 ] },
	{ rule: 'A3', title: 'Sem conteúdo', ns: [ 0 ] },
	{ rule: 'A4', title: 'Sem indicação de importância (pessoas, animais, organizações, conteúdo web, eventos)', ns: [ 0 ] },
	{ rule: 'A5', title: 'Sem indicação de importância (gravações musicais e livros)', ns: [ 0 ] },
	{ rule: 'A6', title: 'Artigo criado recentemente que duplica um tópico existente', ns: [ 0 ] },
	{ rule: 'C1', title: 'Categoria vazia, desnecessária ou substituída', ns: [ 14 ], noWarn: true },
	{ rule: 'D1', title: 'Discussão de página inexistente', talk: true, noWarn: true },
	{ rule: 'D2', title: 'Discussão de página para eliminação ou com histórico irrelevante', talk: true, noWarn: true },
	{ rule: 'U1', title: 'Uso impróprio da página de usuário', ns: [ 2, 3 ] },
	{ rule: 'U2', title: 'Página de usuário criada por outro usuário', ns: [ 2 ] },
	{ rule: 'P1', title: 'Predefinição vazia, desnecessária ou substituída', ns: [ 10 ], noWarn: true },
	{ rule: 'P2', title: 'Predefinição que é uma deturpação das regras', ns: [ 10 ] },
	{ rule: 'F1', title: 'Ficheiro duplicado ou que não cumpre a política de conteúdo restrito', ns: [ 6 ] },
	{ rule: 'R1', title: 'Redirecionamento indevido, desnecessário, sem afluentes, para página inexistente ou eliminada', redirect: true, noWarn: true },
	{ rule: 'R2', title: 'Redirecionamento sem histórico relevante (mover para cá a página redirecionada)', redirect: true, noWarn: true },
	{ rule: 'G1', title: 'Eliminação técnica', noWarn: true },
	{ rule: 'G2', title: 'Impróprio' },
	{ rule: 'G3', title: 'Violação flagrante de direitos de autor, sem histórico relevante', ns: [ 0 ] },
	{ rule: 'G4', title: 'Página criada por editor bloqueado ou banido', ns: [ 0 ] },
	{ rule: 'G5', title: 'Aparecimento recorrente (conteúdo igual ao eliminado por consenso)' },
	{ rule: 'G6', title: 'Título é spam', ns: [ 0 ] },
	{ rule: 'G7', title: 'Eliminação a pedido do autor' }
];

( function () {
	var FONTES = ' Páginas pessoais, sites de fãs, sites colaborativos (como Discogs, IMDb, Wikipédia, etc.), fóruns de discussão,'
			+ ' blogues (como Blogspot, Blogger, WordPress, etc.) e redes sociais (como Facebook, Instagram, Twitter, etc.)'
			+ ' não são fontes confiáveis.',
		SEM_FONTES = 'sem [[WP:FC|fontes confiáveis]] e [[WP:FI|independentes]] que confirmem as afirmações do texto e atestem ',
		GENERICO = 'Artigo ' + SEM_FONTES + 'notoriedade.';

	function esr( lead, criterio ) {
		return lead + ' Ver [[WP:V|princípio da verificabilidade]] e [[WP:CDN|critérios de notoriedade]]'
			+ ( criterio ? ' (e o [[Wikipédia:Critérios de notoriedade/' + criterio[ 0 ] + '|critério específico para '
				+ criterio[ 1 ] + ']])' : '' )
			+ '.' + FONTES;
	}

	ronda.catalog.esrSubjects = [
		{ label: 'Arte', text: esr( GENERICO ) },
		{ label: 'Banda', template: 'ESR-banda', text: esr( 'Artigo sobre banda/grupo musical ' + SEM_FONTES
			+ 'a notoriedade do artista ou de sua obra.', [ 'Música', 'música' ] ) },
		{ label: 'Cantores, álbuns e músicas', text: esr( 'Artigo relacionado à música ' + SEM_FONTES
			+ 'a notoriedade do artista ou de sua obra.', [ 'Música', 'música' ] ) },
		{ label: 'Ciência', text: esr( GENERICO ) },
		{ label: 'Ciências sociais', text: esr( GENERICO ) },
		{ label: 'Educação', text: esr( GENERICO, [ 'Educação', 'educação' ] ) },
		{ label: 'Entretenimento', text: esr( GENERICO ) },
		{ label: 'Esporte/desporto', text: esr( GENERICO, [ 'Desporto', 'desporto' ] ) },
		{ label: 'História e sociedade', text: esr( GENERICO ) },
		{ label: 'Medicina', text: esr( GENERICO ) },
		{ label: 'Organização', template: 'ESR-organização', text: esr( 'Artigo sobre organização '
			+ SEM_FONTES + 'a notoriedade da organização.' ) },
		{ label: 'Países', text: esr( GENERICO ) },
		{ label: 'Pessoas', template: 'ESR-bio', text: esr( 'Biografia ' + SEM_FONTES
			+ 'a notoriedade do biografado.', [ 'Biografias', 'biografias' ] ) },
		{ label: 'Política', text: esr( GENERICO, [ 'Política', 'política' ] ) }
	];
}() );

ronda.catalog.requests = [
	{ id: 'vandalismo', label: 'Vandalismo', target: 'user', page: 'Wikipédia:Pedidos/Notificações de vandalismo',
		title: 'Notificar a ação de um vândalo',
		placeholder: 'Dê mais detalhes sobre o vandalismo.' },
	{ id: 'desprotecao', label: 'Desproteção', target: 'page', page: 'Wikipédia:Pedidos/Desproteção',
		title: 'Pedir a desproteção de uma página', placeholder: 'Justifique o pedido de desproteção.' },
	{ id: 'edicao', label: 'Edição', target: 'page', page: 'Wikipédia:Pedidos/Páginas protegidas',
		title: 'Pedir uma alteração numa página protegida', placeholder: 'Especifique a alteração e o motivo.' },
	{ id: 'historico', label: 'Histórico', target: 'page', history: true, page: 'Wikipédia:Pedidos/Histórico',
		title: 'Pedir a fusão do histórico de uma página com outra', placeholder: 'Justifique a fusão de históricos.' },
	{ id: 'protecao', label: 'Proteção', target: 'page', page: 'Wikipédia:Pedidos/Proteção',
		title: 'Pedir a proteção de uma página', placeholder: 'Justifique o pedido de proteção.' },
	{ id: 'restauro', label: 'Restauro', target: 'page', page: 'Wikipédia:Pedidos/Restauro',
		title: 'Pedir o restauro de uma página', placeholder: 'Justifique o pedido de restauro.' },
	{ id: 'ocultacao', label: 'Ocultação', target: 'page', page: 'Wikipédia:Pedidos/Ocultação',
		title: 'Pedir a ocultação de uma ou mais edições', placeholder: 'Especifique as edições e o motivo.' },
	{ id: 'nome', label: 'Nome impróprio', target: 'user', noText: true, page: 'Wikipédia:Pedidos/Revisão de nomes de usuário',
		title: 'Notificar um usuário com nome impróprio' },
	{ id: 'incidente', label: 'Incidente', target: 'user', page: 'Wikipédia:Pedidos/Notificação de incidentes',
		title: 'Notificar incidentes urgentes de conduta', placeholder: 'Esclareça o pedido.' },
	{ id: 'outro', label: 'Outro', target: 'free', page: 'Wikipédia:Pedidos/Outros',
		title: 'Fazer um pedido sobre outro assunto', placeholder: 'Esclareça o pedido.' }
];

ronda.catalog.search = [
	{ label: 'Google', title: 'Pesquisar o título no Google', url: '//www.google.com/search?&as_eq=wikipedia&as_epq=' },
	{ label: 'Google Notícias', title: 'Pesquisar o título no Google Notícias', url: '//google.com/search?tbm=nws&q=' },
	{ label: 'Google Livros', title: 'Pesquisar o título no Google Livros', url: '//books.google.com/books?&as_brr=0&as_epq=' },
	{ label: 'Google Acadêmico', title: 'Pesquisar o título no Google Acadêmico', url: '//scholar.google.com/scholar?q=' },
	{ label: 'Google Brasil', title: 'Pesquisar o título no Google Brasil', url: '//www.google.com/search?cr=countryBR&q=' },
	{ label: 'Google Portugal', title: 'Pesquisar o título no Google Portugal', url: '//www.google.com/search?cr=countryPT&q=' },
	{ label: 'Bing', title: 'Pesquisar o título no Bing', url: '//www.bing.com/search?q=' }
];

ronda.catalog.petscan = [
	{ label: 'Sem fontes', title: 'Páginas desta categoria que precisam de fontes', params: { templates_yes: 'Sem-fontes' } },
	{ label: 'Revisão', title: 'Páginas desta categoria que precisam de revisão', params: { templates_yes: 'Revisão' } },
	{ label: 'Wikificação', title: 'Páginas desta categoria que precisam de wikificação', params: { templates_yes: 'Wikificação' } },
	{ label: 'Menos de 1 000 bytes ou 4 links', title: 'Páginas pequenas desta categoria', params: { smaller: 1000, minlinks: 4 } },
	{ label: 'Menos de 500 bytes ou 2 links', title: 'Páginas muito pequenas desta categoria', params: { smaller: 500, minlinks: 2 } }
];

}( window.ronda ) );
//</nowiki>

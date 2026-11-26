# Temas do Ronda (rascunho)

Cada arquivo muda só a aparência da barra, dos painéis e das janelas do Ronda.
Vale quando o Ronda põe a classe `ronda-tema-<nome>` em `<html>`. Ainda não há
seletor nas preferências: por enquanto os arquivos servem para avaliar os temas.

Regras para todo tema:
- só CSS e fontes do sistema; nada de imagens, logotipos, ícones ou nomes de marcas de terceiros;
- tudo restrito a `html.ronda-tema-<nome>` (barra `#ronda-toolbar` e janelas `.ronda-dialog`);
- paleta própria e fixa (os temas não seguem o modo claro/escuro da wiki), exceto o Ronda original, que mantém o modo escuro da 0.7.20, e os temas de humor (abaixo).

Os **temas de humor** (Madrugada a Silêncio, na tabela) funcionam de um terceiro jeito: não reescrevem a barra nem as janelas, só trocam as variáveis de cor do Codex (`--background-color-base`, `--color-progressive`…) dentro de `#ronda-toolbar`, `.ronda-dialog`, `.ronda-tooltip` e `.ronda-menu`. Assim o estilo "cartão com título" do CSS principal continua valendo, e cada tema traz uma paleta clara e outra escura (`skin-theme-clientpref-night` e o automático com o sistema escuro). Além das cores, só mudam os cantos e, em alguns, a letra da aba e dos títulos. Toda combinação de texto e fundo tem contraste de pelo menos 4,5:1.

O Ronda original funciona de outro jeito: o CSS principal só aplica o estilo novo da barra e das janelas quando `<html>` não tem a classe `ronda-tema-original`, e `original.css` devolve as regras da 0.7.20.

| Arquivo | Tema |
|---|---|
| original.css | Ronda original (a aparência até a 0.7.20: barra clara e jQuery UI puro) |
| previsao.css | Previsão do tempo |
| prova.css | Prova (preto e branco) |
| passaporte.css | Passaporte |
| volante.css | Volante de aposta |
| bula.css | Bula |
| bauhaus.css | Bauhaus |
| planta.css | Planta baixa |
| synthwave.css | s y n t h w a v e |
| brutalismo.css | Brutalismo |
| relevo.css | Clássico em relevo |
| listrado.css | Retrô listrado |
| terminal.css | Terminal |
| metro.css | Metrô |
| ocorrencia.css | Boletim de ocorrência |
| onibus.css | Ônibus |
| web1.css | Web 1.0 |
| azulejo.css | Azulejo português |
| newton.css | Newton |
| pregao.css | Pregão |
| madrugada.css | Madrugada (humor) |
| cafe.css | Café coado (humor) |
| neblina.css | Neblina (humor) |
| herbario.css | Herbário (humor) |
| brasa.css | Brasa (humor) |
| crepusculo.css | Crepúsculo (humor) |
| geada.css | Geada (humor) |
| terraroxa.css | Terra roxa (humor) |
| biblioteca.css | Biblioteca (humor) |
| domingo.css | Domingo à tarde (humor) |
| mare.css | Maré baixa (humor) |
| silencio.css | Silêncio (humor) |

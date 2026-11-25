import { useLayoutEffect, useRef } from 'react';
import { asset } from '../lib/asset.js';
import { animate, onScroll, reduzMovimento, stagger, svg, useEntrada, utils } from '../lib/movimento.js';
import './Inspiracao.css';

// Homenagem a Dr. Gladys Mae West, inspiração do CANIDÉ.
// Fatos conferidos em: Royal Academy of Engineering (10/06/2021), IEEE Spectrum (30/07/2024), Wikipedia e
// notícias de falecimento (NPR, Military Times, AP, janeiro de 2026). Datas divergentes entre fontes ficaram de fora.

const FORMACAO = [
  { ano: 1930, texto: 'Nasce em Sutherland, condado de Dinwiddie, Virgínia.' },
  { ano: 1948, texto: 'Melhor aluna da turma no ensino médio. Ganha bolsa para a Virginia State College.' },
  { ano: 1952, texto: 'Bacharelado em Matemática.' },
  { ano: 1955, texto: 'Mestrado em Matemática, na mesma instituição.' },
  { ano: 1973, texto: 'Mestrado em Administração Pública, University of Oklahoma.' },
  { ano: 2000, texto: 'Doutorado em Administração Pública e Assuntos Públicos, Virginia Tech.' }
];

const CARREIRA = [
  { numero: '1956', rotulo: 'Início na Marinha', texto: 'Contratada como matemática em Dahlgren, Virgínia.' },
  { numero: '42', unidade: 'anos', rotulo: 'De contribuição', texto: 'Matemática aplicada, programação e análise de dados de satélites.' },
  { numero: '1998', rotulo: 'Aposentadoria', texto: 'Encerra a carreira no centro de pesquisas.' }
];

const ETAPAS = [
  { nome: 'A forma real', texto: 'A Terra não é uma esfera. É achatada nos polos e mais larga no equador: os dois raios diferem em cerca de 21 km.' },
  { nome: 'O geoide', texto: 'Se o mar em repouso se estendesse sob os continentes, formaria uma superfície irregular, moldada pela gravidade. Esse é o geoide. Ele se afasta do elipsoide em até cerca de 100 metros.' },
  { nome: 'Os satélites', texto: 'A gravidade desvia levemente a órbita dos satélites, e o radar a bordo mede a altura do mar. Cada passagem é uma medição do planeta.' },
  { nome: 'O cálculo', texto: 'Medições com ruído e lacunas só viram modelo pelo cálculo. Gladys West programou computadores como o IBM 7030 Stretch para refinar, passo a passo, a forma da Terra.' },
  { nome: 'A precisão', texto: 'O GPS expressa cada posição sobre um modelo da Terra e usa um modelo do geoide para dar a altitude acima do nível do mar. Modelo melhor, posição mais confiável.' }
];

const PREMIOS = [
  { ano: '2018', nome: 'BBC 100 Women', texto: 'Selecionada entre as 100 mulheres do ano pela BBC.' },
  { ano: '2018', nome: 'Space and Missile Pioneers Hall of Fame', texto: 'Introduzida no hall da fama da Força Aérea dos EUA, em cerimônia no Pentágono, em 6 de dezembro.' },
  { ano: '2021', nome: 'Prince Philip Medal', texto: 'A maior honraria individual da Royal Academy of Engineering. Primeira mulher a recebê-la desde 1991.' },
  { ano: '2024', nome: 'IEEE President’s Award', texto: 'Pela modelagem matemática e pelos modelos de geodésia por satélite que tiveram papel decisivo no GPS.' }
];

const FONTES = [
  { nome: 'U.S. Department of Defense — Navy Scientist Helped Develop GPS', url: 'https://www.war.gov/News/Feature-Stories/Story/Article/3700859/navy-scientist-helped-develop-gps/' },
  { nome: 'United States Space Force — Dr. Gladys B. West (Space Pioneers)', url: 'https://www.spaceforce.mil/Portals/2/Documents/Space_Pioneers/Space_Pioneers_Bios/SF_Space_Pioneers_Bio_West.pdf' },
  { nome: 'Library of Congress — Gladys B. West and Ira V. West Papers', url: 'https://findingaids.loc.gov/repositories/19/resources/6417' },
  { nome: 'American Physical Society — Birth of Gladys West, the mathematician who laid the groundwork for GPS', url: 'https://www.aps.org/apsnews/2024/09/west-mathematician-groundwork-gps' },
  { nome: 'Nature — Gladys Mae West (1930–2026), obituário', url: 'https://www.nature.com/articles/d41586-026-00254-z' },
  { nome: 'Royal Academy of Engineering — Prince Philip Medal, 2021', url: 'https://www.raeng.org.uk/news/news-releases/2021/june/%E2%80%98hidden-figure-whose-mathematical-modelling-enable' },
  { nome: 'IEEE Spectrum — Gladys West: The Hidden Figure Behind GPS, 2024', url: 'https://spectrum.ieee.org/gladys-west-hidden-figure-gps' }
];

// Diagrama do geoide (viewBox 0 0 640 440). O relevo do geoide é exagerado para ficar visível.
const C = { x: 320, y: 250 };
const R = 140;
const geoide = (() => {
  const pts = [];
  for (let i = 0; i <= 180; i++) {
    const t = (i / 180) * Math.PI * 2;
    const r = R + 4 + 7 * Math.sin(3 * t + 0.6) + 4 * Math.cos(5 * t + 1.1) + 2.5 * Math.sin(8 * t);
    pts.push(`${(C.x + r * Math.cos(t) * 1.06).toFixed(1)} ${(C.y + r * Math.sin(t)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
})();
// Satélites ao longo de uma órbita e os pulsos de radar até a superfície
const ORBITA = { rx: 280, ry: 205 };
const SATELITES = [-150, -118, -90, -62, -30].map(g => {
  const t = (g * Math.PI) / 180;
  return { x: C.x + ORBITA.rx * Math.cos(t), y: C.y + ORBITA.ry * Math.sin(t), t };
});

function DiagramaGeoide() {
  return (
    <svg className="geoide" viewBox="0 0 640 440" role="img" aria-labelledby="geoide-titulo geoide-desc">
      <title id="geoide-titulo">Esfera, elipsoide e geoide, com satélites medindo a superfície</title>
      <desc id="geoide-desc">
        Uma esfera tracejada, um elipsoide achatado nos polos e o geoide, uma superfície irregular com relevo exagerado.
        Acima, satélites em órbita enviam pulsos de radar até a superfície.
      </desc>
      <g className="geoide__grade" aria-hidden="true">
        <path d={`M${C.x} 20 V430`} />
        <path d={`M40 ${C.y} H600`} />
      </g>
      <circle className="geoide__esfera" cx={C.x} cy={C.y} r={R} />
      <ellipse className="geoide__elipsoide" cx={C.x} cy={C.y} rx={R * 1.06} ry={R} />
      <path className="geoide__geoide" d={geoide} />
      <ellipse className="geoide__orbita" cx={C.x} cy={C.y} rx={ORBITA.rx} ry={ORBITA.ry} />
      {SATELITES.map((s, i) => {
        const fim = { x: C.x + (R + 8) * 1.06 * Math.cos(s.t), y: C.y + (R + 8) * Math.sin(s.t) };
        return (
          <g key={i} className="geoide__satelite">
            <path className="geoide__pulso" d={`M${s.x.toFixed(1)} ${s.y.toFixed(1)} L${fim.x.toFixed(1)} ${fim.y.toFixed(1)}`} />
            <rect x={s.x - 4} y={s.y - 4} width="8" height="8" />
            <path className="geoide__painel" d={`M${s.x - 14} ${s.y} H${s.x - 5} M${s.x + 5} ${s.y} H${s.x + 14}`} />
          </g>
        );
      })}
      <g className="geoide__legendas">
        <text x="474" y="398">Esfera</text>
        <path className="geoide__guia" d="M470 394 L420 360" />
        <text x="96" y="120">Elipsoide</text>
        <path className="geoide__guia" d="M150 126 L210 148" />
        <text x="476" y="300">Geoide</text>
        <path className="geoide__guia" d="M472 296 L462 280" />
        <text x="28" y="36">Órbita e pulsos de radar</text>
      </g>
    </svg>
  );
}

function DiagramaAltimetro() {
  return (
    <svg className="altimetro" viewBox="0 0 320 260" role="img" aria-labelledby="alt-titulo">
      <title id="alt-titulo">Altimetria por radar: o satélite mede o tempo de ida e volta do pulso até o mar</title>
      <path className="altimetro__orbita" d="M10 40 Q160 10 310 40" />
      <rect x="152" y="18" width="16" height="12" />
      <path className="altimetro__painel" d="M132 24 H150 M170 24 H188" />
      <path className="altimetro__pulso" d="M160 34 V198" />
      <path className="altimetro__onda" d="M10 206 C40 196 70 214 100 204 C130 194 150 212 180 202 C210 192 240 210 270 200 C290 194 300 202 310 200" />
      <path className="altimetro__cota" d="M214 34 V198 M206 34 H222 M206 198 H222" />
      <text x="228" y="112">d = c · t ÷ 2</text>
      <text x="10" y="244">Altura do mar = altitude da órbita − d</text>
    </svg>
  );
}

export default function Inspiracao() {
  const ref = useRef(null);
  useEntrada(ref);

  useLayoutEffect(() => {
    const raiz = ref.current;
    if (!raiz || reduzMovimento()) return undefined;
    const limpar = [];
    const quando = alvo => onScroll({ target: alvo, enter: 'bottom-=15% top', repeat: false });

    // Fotografias: abrem de baixo para cima atrás de uma máscara, com a imagem assentando
    raiz.querySelectorAll('[data-revela]').forEach(fig => {
      const img = fig.querySelector('img');
      utils.set(fig, { clipPath: 'inset(100% 0% 0% 0%)' });
      utils.set(img, { scale: 1.08 });
      const a = animate(fig, { clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'], duration: 1400, ease: 'inOutQuart', autoplay: quando(fig) });
      const b = animate(img, { scale: [1.08, 1], duration: 2200, ease: 'outQuart', autoplay: quando(fig) });
      limpar.push(() => a.revert(), () => b.revert());
    });

    // Diagramas: traços desenhados na ordem do raciocínio
    raiz.querySelectorAll('.geoide, .altimetro, .regua__linha, .premios__trilho').forEach(alvo => {
      const tracos = svg.createDrawable(alvo.querySelectorAll('path, circle, ellipse, line'));
      utils.set(tracos, { draw: '0 0' });
      const a = animate(tracos, { draw: ['0 0', '0 1'], duration: 1600, ease: 'inOutQuad', delay: stagger(140), autoplay: quando(alvo) });
      limpar.push(() => a.revert());
    });

    return () => limpar.forEach(f => f());
  }, []);

  const inicio = 1930;
  const fim = 2000;

  return (
    <section id="inspiracao" ref={ref} className="inspiracao secao" aria-labelledby="insp-titulo">
      {/* 1 · Apresentação */}
      <header className="moldura insp-abertura" data-grupo>
        <div className="insp-abertura__texto">
          <p className="rotulo" data-entra>
            Nossa inspiração
          </p>
          <h2 id="insp-titulo" className="display editorial insp-abertura__nome" data-titulo>
            Gladys Mae West
          </h2>
          <p className="insp-abertura__lema editorial" data-entra>
            Uma mente que ajudou o mundo a encontrar seu caminho.
          </p>
          <p className="insp-abertura__resumo" data-entra>
            Matemática, cientista e pioneira da geodésia por satélite. Seu trabalho ajudou a construir as bases
            matemáticas que tornaram a navegação por satélite mais precisa.
          </p>
          <p className="insp-abertura__datas numeros" data-entra>
            <span>1930 — 2026</span>
            <span aria-hidden="true">|</span>
            <span>Matemática e cientista norte-americana</span>
          </p>
        </div>
        <figure className="insp-retrato" data-entra>
          <div className="insp-retrato__quadro" data-revela>
            <img
              src={asset('media/gladys-west-retrato-320.webp')}
              width="320"
              height="638"
              alt="Retrato de Gladys West já idosa, sorrindo, de óculos, cabelo grisalho curto e blazer escuro, com as mãos cruzadas sobre uma mesa."
            />
          </div>
          <figcaption className="legenda">
            Retrato de Gladys West. Imagem do acervo do projeto, sem autoria identificada nos arquivos.
          </figcaption>
          <span className="insp-retrato__coord numeros" aria-hidden="true">
            37° N · 77° W
          </span>
        </figure>
      </header>

      {/* 2 · Formação */}
      <article className="moldura insp-bloco insp-sonho" data-grupo aria-labelledby="insp-sonho-titulo">
        <div className="insp-bloco__cabeca">
          <p className="insp-bloco__num numeros" data-entra>I</p>
          <h3 id="insp-sonho-titulo" className="titulo" data-titulo>
            Uma história que começou com um sonho.
          </h3>
        </div>
        <div className="insp-sonho__texto texto" data-entra>
          <p>
            Gladys Mae West nasceu em 27 de outubro de 1930, em Sutherland, no estado da Virgínia, Estados Unidos.
            Cresceu numa pequena fazenda, em uma família trabalhadora, em meio às dificuldades sociais e à segregação
            racial da época.
          </p>
          <p>
            Desde cedo, fez dos estudos o seu caminho. Foi a melhor aluna da turma no ensino médio e conquistou uma bolsa
            para a Virginia State College, hoje Virginia State University. Formou-se em Matemática em 1952 e concluiu o
            mestrado na mesma área em 1955. Mais tarde, já trabalhando, voltou a estudar: mestrado em Administração
            Pública pela University of Oklahoma, em 1973, e doutorado em Administração Pública e Assuntos Públicos pela
            Virginia Tech, em 2000.
          </p>
        </div>
        <div className="regua">
          <svg className="regua__linha" viewBox="0 0 1000 24" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 12 H1000" />
            {Array.from({ length: 15 }, (_, i) => (
              <path key={i} d={`M${(i * 1000) / 14} ${i % 2 ? 8 : 4} V${i % 2 ? 16 : 20}`} />
            ))}
            {FORMACAO.map(f => (
              <path key={f.ano} className="regua__marca" d={`M${((f.ano - inicio) / (fim - inicio)) * 1000} 0 V24`} />
            ))}
          </svg>
          <ol className="regua__lista" aria-label="Formação de Gladys West, de 1930 a 2000">
          {FORMACAO.map(f => (
            <li
              key={f.ano}
              className="regua__marco"
              data-entra
            >
              <span className="regua__ano numeros">{f.ano}</span>
              <span className="regua__texto">{f.texto}</span>
            </li>
          ))}
          </ol>
        </div>
      </article>

      {/* 3 · Dahlgren */}
      <article className="insp-bloco insp-carreira" data-grupo aria-labelledby="insp-carreira-titulo">
        <div className="moldura insp-bloco__cabeca">
          <p className="insp-bloco__num numeros" data-entra>II</p>
          <h3 id="insp-carreira-titulo" className="titulo" data-titulo>
            Uma mulher num lugar onde poucas tinham espaço.
          </h3>
        </div>
        <figure className="moldura insp-foto-larga">
          <div className="midia insp-foto-larga__quadro" data-revela>
            <img
              src={asset('media/gladys-west-1985-1024.webp')}
              srcSet={`${asset('media/gladys-west-1985-800.webp')} 800w, ${asset('media/gladys-west-1985-1024.webp')} 1024w`}
              sizes="(max-width: 1099px) 92vw, 1024px"
              width="1024"
              height="695"
              loading="lazy"
              alt="Fotografia em preto e branco de 1985: Gladys West aponta com uma caneta para mapas e cálculos sobre a mesa, ao lado de Sam Smith, numa sala com dois globos terrestres."
            />
            <span className="insp-foto-larga__marca numeros" aria-hidden="true">
              38° N · 77° W — Dahlgren
            </span>
          </div>
          <figcaption className="legenda">
            Gladys West e Sam Smith, 1985. Foto: Marinha dos EUA (U.S. Navy), domínio público, via{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Gladys_West_and_Sam_Smith.jpg">Wikimedia Commons</a>.
          </figcaption>
        </figure>
        <div className="moldura insp-carreira__corpo">
          <div className="texto" data-entra>
            <p>
              Em 1956, Gladys West foi contratada como matemática pelo centro de pesquisas da Marinha dos Estados Unidos
              em Dahlgren, na Virgínia. Era a segunda mulher negra contratada ali e uma entre apenas quatro funcionários
              negros.
            </p>
            <p>
              Durante 42 anos trabalhou com matemática aplicada, programação, processamento de dados e análise de
              informações vindas de satélites, num período em que mulheres negras enfrentavam barreiras sociais e
              profissionais para ocupar espaço na ciência e na tecnologia. Aposentou-se em 1998.
            </p>
          </div>
          <dl className="marcos">
            {CARREIRA.map(c => (
              <div key={c.rotulo} className="marcos__item" data-entra>
                <dt className="marcos__rotulo">{c.rotulo}</dt>
                <dd className="marcos__numero editorial numeros">
                  {c.numero}
                  {c.unidade && <span className="marcos__unidade"> {c.unidade}</span>}
                </dd>
                <dd className="marcos__texto">{c.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </article>

      {/* 4 · Geodésia */}
      <article className="moldura insp-bloco insp-terra" data-grupo aria-labelledby="insp-terra-titulo">
        <div className="insp-bloco__cabeca">
          <p className="insp-bloco__num numeros" data-entra>III</p>
          <h3 id="insp-terra-titulo" className="titulo" data-titulo>
            O trabalho que ajudou a medir a Terra.
          </h3>
        </div>
        <p className="enunciado insp-terra__enunciado" data-entra>
          Nas décadas de 1970 e 1980, Gladys West fez cálculos complexos para representar com precisão a forma do
          planeta, usando dados de satélites e algoritmos matemáticos.
        </p>
        <div className="insp-terra__grade">
          <figure className="insp-terra__figura" data-entra>
            <DiagramaGeoide />
            <figcaption className="legenda">Representação esquemática. O relevo do geoide está muito exagerado.</figcaption>
          </figure>
          <ol className="etapas">
            {ETAPAS.map((e, i) => (
              <li key={e.nome} className="etapas__item" data-entra>
                <span className="etapas__num numeros">{String(i + 1).padStart(2, '0')}</span>
                <p className="etapas__nome">{e.nome}</p>
                <p className="etapas__texto">{e.texto}</p>
              </li>
            ))}
          </ol>
        </div>
        <p className="insp-terra__nota texto" data-entra>
          Esses modelos de geodésia por satélite foram incorporados mais tarde ao GPS. O sistema foi obra de muitas
          equipes; Gladys West não o inventou sozinha. Sua contribuição está na base matemática da precisão, que hoje
          acompanha cada posição calculada por um receptor.
        </p>
      </article>

      {/* 5 · Seasat */}
      <article className="moldura insp-bloco insp-seasat" data-grupo aria-labelledby="insp-seasat-titulo">
        <div className="insp-bloco__cabeca">
          <p className="insp-bloco__num numeros" data-entra>IV</p>
          <h3 id="insp-seasat-titulo" className="titulo" data-titulo>
            O projeto Seasat.
          </h3>
        </div>
        <div className="insp-seasat__grade">
          <div className="texto" data-entra>
            <p>
              Lançado em junho de 1978 e ativo até outubro do mesmo ano, o Seasat foi um dos primeiros satélites capazes
              de observar os oceanos por sensoriamento remoto. Um dos seus instrumentos era um altímetro de radar: ele
              mede o tempo que um pulso leva para descer até o mar e voltar.
            </p>
            <p>
              Gladys West foi gerente de projeto da altimetria por radar do Seasat. O trabalho de transformar esses ecos
              em medidas da superfície do oceano ampliou o que se podia saber sobre o mar e alimentou a geodésia por
              satélite. Anos depois, ela assinou as especificações do sistema de processamento de dados do altímetro do
              Geosat, outro satélite da Marinha, num relatório técnico de 1986.
            </p>
          </div>
          <figure className="insp-seasat__figura" data-entra>
            <DiagramaAltimetro />
            <figcaption className="legenda">Princípio da altimetria por radar, em esquema.</figcaption>
          </figure>
        </div>
      </article>

      {/* 6 · Reconhecimentos */}
      <article className="moldura insp-bloco insp-legado" data-grupo aria-labelledby="insp-legado-titulo">
        <div className="insp-bloco__cabeca">
          <p className="insp-bloco__num numeros" data-entra>V</p>
          <h3 id="insp-legado-titulo" className="titulo" data-titulo>
            Um legado reconhecido pelo mundo.
          </h3>
        </div>
        <div className="premios">
          <svg className="premios__trilho" viewBox="0 0 4 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 0 V100" />
          </svg>
          <ol className="premios__lista">
            {PREMIOS.map(p => (
              <li key={p.nome} className="premios__item" data-entra>
                <span className="premios__ano editorial numeros">{p.ano}</span>
                <div>
                  <p className="premios__nome">{p.nome}</p>
                  <p className="premios__texto">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </article>

      {/* 7 · A história continua */}
      <article className="moldura insp-bloco insp-continua" data-grupo aria-labelledby="insp-continua-titulo">
        <div className="insp-bloco__cabeca">
          <p className="insp-bloco__num numeros" data-entra>VI</p>
          <h3 id="insp-continua-titulo" className="titulo" data-titulo>
            Sua história continua.
          </h3>
        </div>
        <div className="insp-continua__grade">
          <div className="texto" data-entra>
            <p>
              Gladys Mae West faleceu em 17 de janeiro de 2026, aos 95 anos, em Fredericksburg, na Virgínia. Deixou
              uma contribuição duradoura para a matemática, a ciência, a geodésia e a navegação por satélite.
            </p>
            <p>
              Em 2020, publicou a autobiografia <cite>It Began with a Dream</cite>, escrita com M. H. Jackson. Nela,
              conta a trajetória que percorreu, os desafios que enfrentou e o caminho que construiu até a carreira
              científica.
            </p>
          </div>
          <p className="livro" data-entra>
            <span className="livro__rotulo">Autobiografia · 2020</span>
            <cite className="livro__titulo editorial">It Began with a Dream</cite>
            <span className="livro__autoria">Gladys B. West, com M. H. Jackson</span>
          </p>
        </div>
      </article>

      {/* Conexão com o CANIDÉ */}
      <div className="moldura insp-conexao" data-grupo>
        <p className="rotulo" data-entra>
          Por que ela está aqui
        </p>
        <div className="insp-conexao__texto">
          <p className="insp-conexao__abre editorial" data-entra>
            O CANIDÉ nasce de uma admiração pela ciência, pela capacidade humana de transformar conhecimento em
            tecnologia e pela busca constante por compreender melhor o mundo ao nosso redor.
          </p>
          <div className="texto" data-entra>
            <p>
              Cada ponto que a tag registra depende de satélites, de relógios e de um modelo da Terra. O receptor GPS da
              tag, um NEO-6M, informa a altitude acima do nível médio do mar com base num modelo do geoide. Por trás
              dessa conta simples estão décadas de matemática, e parte delas foi feita por uma mulher que começou numa
              pequena fazenda da Virgínia.
            </p>
            <p>
              Gladys West não participou deste projeto. Ela é a nossa inspiração: sua dedicação à matemática e à análise
              de dados de satélites ajudou a ampliar a precisão com que entendemos posições e movimentos sobre a Terra.
              É dessa inspiração que nasce a nossa vontade de explorar, medir, acompanhar trajetórias e transformar dados
              em conhecimento.
            </p>
          </div>
        </div>
        <p className="insp-conexao__assinatura editorial" data-entra>
          <strong>CANIDÉ</strong> — inspirado por quem ajudou a humanidade a compreender melhor o planeta.
        </p>
      </div>

      {/* Referências */}
      <div className="moldura insp-fontes" data-grupo>
        <h3 className="insp-fontes__titulo" data-entra>
          Referências
        </h3>
        <ol className="insp-fontes__lista" data-entra>
          {FONTES.map(f => (
            <li key={f.url}>
              <a href={f.url} target="_blank" rel="noreferrer">
                {f.nome}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

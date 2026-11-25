import { useLayoutEffect, useMemo, useRef } from 'react';
import { animate, onScroll, reduzMovimento, stagger, svg, useEntrada, utils } from '../lib/movimento.js';
import { WGS84, criarCenario } from '../lib/gnss.js';
import DemoGps from '../gps/DemoGps.jsx';
import { CalculadoraHaversine, CeuDop, Propagacao, Trajetoria, Trilateracao2D } from '../gps/interativos.jsx';
import './Matematica.css';

// "A matemática que nos localiza": fundamentos do GPS em seis partes e uma simulação 3D.
// Conteúdo complementar à pesquisa original (que cita Kaplan e Hegarty, 2017), com base em GPS.gov, NIST, NGA e NOAA.
// O que o CANIDÉ faz de fato foi conferido no código do gateway e da trajetória online (clone git/ECOTAM).

const PARTES = [
  { id: 'mat-tempo', nome: 'Tempo vira distância' },
  { id: 'mat-geometria', nome: 'A geometria dos satélites' },
  { id: 'mat-laboratorio', nome: 'Laboratório' },
  { id: 'mat-coordenadas', nome: 'Coordenadas e referenciais' },
  { id: 'mat-distancia', nome: 'Distância na superfície' },
  { id: 'mat-trajetoria', nome: 'Velocidade e trajetória' },
  { id: 'mat-qualidade', nome: 'Qualidade do posicionamento' }
];

const FATORES = [
  { nome: 'Geometria dos satélites', texto: 'Satélites agrupados numa parte do céu cruzam suas esferas em ângulos rasos e ampliam qualquer erro. É o que o DOP mede.' },
  { nome: 'Erros de relógio', texto: 'O receptor resolve o próprio erro de relógio, mas os relógios dos satélites também têm pequenos desvios, corrigidos pelos dados de navegação.' },
  { nome: 'Atraso ionosférico', texto: 'Na ionosfera, a camada eletricamente carregada da alta atmosfera, o sinal se atrasa de forma variável ao longo do dia e da atividade solar.' },
  { nome: 'Atraso troposférico', texto: 'Na baixa atmosfera, pressão, temperatura e vapor d’água também atrasam o sinal, mais ainda para satélites baixos no horizonte.' },
  { nome: 'Multicaminhamento', texto: 'O sinal refletido em prédios, rochas ou água chega por um caminho mais longo e se mistura ao sinal direto.' },
  { nome: 'Ruído do receptor', texto: 'A eletrônica que mede o tempo de chegada tem um limite de resolução e acrescenta pequenas flutuações.' },
  { nome: 'Qualidade da antena', texto: 'Antenas pequenas e mal posicionadas captam sinais mais fracos e rejeitam pior as reflexões.' },
  { nome: 'Condições de recepção', texto: 'Copas de árvores, relevo, construções e interferência de rádio bloqueiam ou degradam os sinais.' }
];

const CONCEITOS = [
  { nome: 'Precisão', texto: 'Quanto as medidas repetidas concordam entre si: pontos agrupados.' },
  { nome: 'Exatidão', texto: 'Quanto as medidas se aproximam do valor verdadeiro: pontos em torno do alvo.' },
  { nome: 'Integridade', texto: 'A capacidade do sistema de avisar, a tempo, quando sua posição não merece confiança.' },
  { nome: 'Disponibilidade', texto: 'A parcela do tempo em que há sinais suficientes para calcular uma posição com a qualidade exigida.' }
];

// Milhares separados por espaço fino (SI), para não confundir com a vírgula decimal
const num = (v, casas = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).replace(/\./g, '\u202f');

/** Corte da Terra: elipsoide, geoide e superfície, com h, H e N. Relevo muito exagerado. */
function DiagramaAltitudes() {
  return (
    <svg className="altitudes" viewBox="0 0 560 300" role="img" aria-labelledby="alt-h-titulo alt-h-desc">
      <title id="alt-h-titulo">Altitude elipsoidal, altitude ortométrica e ondulação do geoide</title>
      <desc id="alt-h-desc">
        Num corte vertical, o terreno fica acima do geoide e do elipsoide. A altitude elipsoidal h vai do elipsoide ao ponto;
        a altitude ortométrica H vai do geoide ao ponto; a ondulação N é a distância entre o elipsoide e o geoide, e h ≈ H + N.
      </desc>
      <path className="altitudes__terreno" d="M0 120 C70 104 120 96 170 108 C230 122 270 82 330 74 C390 66 450 98 560 86" />
      <path className="altitudes__geoide" d="M0 214 C90 204 160 190 250 196 C340 202 420 222 560 210" />
      <path className="altitudes__elipsoide" d="M0 236 C180 232 380 232 560 236" />
      <circle className="altitudes__ponto" cx="330" cy="74" r="6" />
      <path className="altitudes__cota altitudes__cota--H" d="M322 74 V201 M314 74 H330 M314 201 H330" />
      <path className="altitudes__cota altitudes__cota--N" d="M322 201 V233 M314 233 H330" />
      <path className="altitudes__cota altitudes__cota--h" d="M366 74 V233 M358 74 H374 M358 233 H374" />
      <path className="altitudes__guia" d="M330 74 H366" />
      <text x="308" y="144" textAnchor="end">H</text>
      <text x="308" y="226" textAnchor="end">N</text>
      <text x="380" y="160">h</text>
      <text className="altitudes__nome" x="12" y="108">Terreno</text>
      <text className="altitudes__nome" x="12" y="200">Geoide</text>
      <text className="altitudes__nome" x="12" y="258">Elipsoide WGS 84</text>
    </svg>
  );
}

/** Alvos: precisão sem exatidão e precisão com exatidão. Pontos fixos, só para o conceito. */
function Alvos() {
  const anel = cx => [44, 30, 16].map(r => <circle key={r} cx={cx} cy="60" r={r} className="alvos__anel" />);
  const preciso = [[34, -14], [39, -10], [31, -9], [36, -17], [40, -15]];
  const exato = [[-2, 3], [3, -2], [1, 4], [-4, -3], [2, 1]];
  return (
    <svg className="alvos" viewBox="0 0 260 128" role="img" aria-label="À esquerda, pontos agrupados longe do centro: precisos, mas não exatos. À direita, pontos agrupados no centro: precisos e exatos.">
      {anel(62)}
      {anel(198)}
      {preciso.map(([x, y], i) => <circle key={i} className="alvos__tiro" cx={62 + x * 0.7} cy={60 + y * 0.7} r="3.4" />)}
      {exato.map(([x, y], i) => <circle key={i} className="alvos__tiro" cx={198 + x} cy={60 + y} r="3.4" />)}
      <text x="62" y="124" textAnchor="middle">Preciso, não exato</text>
      <text x="198" y="124" textAnchor="middle">Preciso e exato</text>
    </svg>
  );
}

export default function Matematica() {
  const ref = useRef(null);
  useEntrada(ref);
  const exemplo = useMemo(() => criarCenario(), []);

  // Diagramas de linha desenham-se quando entram na tela
  useLayoutEffect(() => {
    const raiz = ref.current;
    if (!raiz || reduzMovimento()) return undefined;
    const limpar = [];
    raiz.querySelectorAll('.altitudes, .alvos').forEach(alvo => {
      const tracos = svg.createDrawable(alvo.querySelectorAll('path'));
      utils.set(tracos, { draw: '0 0' });
      const a = animate(tracos, {
        draw: ['0 0', '0 1'],
        duration: 1400,
        ease: 'inOutQuad',
        delay: stagger(120),
        autoplay: onScroll({ target: alvo, enter: 'bottom-=15% top', repeat: false })
      });
      limpar.push(() => a.revert());
    });
    return () => limpar.forEach(f => f());
  }, []);

  return (
    <section id="matematica" ref={ref} className="matematica secao" aria-labelledby="mat-titulo">
      <header className="moldura mat-abertura" data-grupo>
        <p className="rotulo" data-entra>
          <span className="rotulo__num">07</span> Matemática do GPS
        </p>
        <h2 id="mat-titulo" className="display editorial mat-abertura__titulo" data-titulo>
          A matemática que nos localiza
        </h2>
        <p className="enunciado mat-abertura__sub" data-entra>
          Por trás de cada coordenada existe uma combinação de tempo, distância, geometria, física e processamento
          matemático.
        </p>
        <p className="texto mat-abertura__ponte" data-entra>
          O modelo da Terra que Gladys West ajudou a refinar é o chão dessa conta. Agora, a conta em si: como um receptor
          do tamanho de uma moeda transforma sinais de rádio vindos de 20 000 km de altura numa posição sobre o planeta.
        </p>
        <nav className="mat-indice" aria-label="Partes desta seção" data-entra>
          <ol>
            {PARTES.map((p, i) => (
              <li key={p.id}>
                <a href={`#${p.id}`}>
                  <span className="numeros">{String(i + 1).padStart(2, '0')}</span> {p.nome}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      {/* 3.1 */}
      <article id="mat-tempo" className="moldura mat-parte" data-grupo aria-labelledby="mat-tempo-t">
        <div className="mat-parte__cabeca">
          <p className="mat-parte__num numeros" data-entra>01</p>
          <h3 id="mat-tempo-t" className="titulo" data-titulo>Tempo vira distância.</h3>
        </div>
        <div className="mat-parte__corpo">
          <div className="texto" data-entra>
            <p>
              Cada satélite GPS transmite, sem parar, um sinal de rádio com duas informações: o instante exato em que o sinal
              saiu, marcado por relógios atômicos a bordo, e os dados da sua órbita. O receptor compara esse instante de
              transmissão com o instante em que o sinal chegou e obtém o tempo de propagação.
            </p>
            <p>
              Como o sinal viaja à velocidade da luz, tempo vira distância. A medida se chama <em>pseudodistância</em>{' '}
              porque não é a distância geométrica pura: carrega o erro de sincronização entre os relógios, os atrasos da
              atmosfera, o ruído do receptor e outras fontes de erro.
            </p>
          </div>
          <div className="mat-parte__lado" data-entra>
            <p className="formula" role="math" aria-label="rô igual a c vezes delta t">
              ρ = c · Δt
            </p>
            <dl className="simbolos">
              <div><dt>ρ</dt><dd>pseudodistância estimada, em metros</dd></div>
              <div><dt>c</dt><dd>velocidade da luz no vácuo: 299 792 458 m/s, valor exato por definição do SI</dd></div>
              <div><dt>Δt</dt><dd>diferença entre o instante de recepção e o de transmissão, medida pelo receptor</dd></div>
            </dl>
            <Propagacao />
          </div>
        </div>
      </article>

      {/* 3.2 */}
      <article id="mat-geometria" className="moldura mat-parte" data-grupo aria-labelledby="mat-geo-t">
        <div className="mat-parte__cabeca">
          <p className="mat-parte__num numeros" data-entra>02</p>
          <h3 id="mat-geo-t" className="titulo" data-titulo>A geometria dos satélites.</h3>
        </div>
        <p className="formula formula--larga" role="math" aria-label="rô i igual à raiz quadrada de x menos x i ao quadrado, mais y menos y i ao quadrado, mais z menos z i ao quadrado, mais c vezes delta t, mais épsilon i" data-entra>
          ρ<sub>i</sub> = √[(x − x<sub>i</sub>)² + (y − y<sub>i</sub>)² + (z − z<sub>i</sub>)²] + c·δt + ε<sub>i</sub>
        </p>
        <div className="mat-parte__corpo">
          <div className="texto" data-entra>
            <p>
              Uma distância a um satélite de posição conhecida diz que o receptor está em algum ponto de uma esfera centrada
              nele. Duas esferas se cruzam num círculo; a terceira reduz esse círculo a dois pontos, e um deles costuma
              ficar longe da Terra. Encontrar a posição a partir de distâncias se chama <strong>trilateração</strong>.
            </p>
            <p>
              Não é triangulação: a triangulação usa ângulos medidos entre direções, e o GPS não mede ângulos, mede
              tempos.
            </p>
            <p>
              Há, porém, uma quarta incógnita. O relógio do receptor é de quartzo, muito menos estável que os relógios
              atômicos dos satélites, e seu erro δt é o mesmo em todas as medidas do mesmo instante. Com x, y, z e δt
              desconhecidos, são necessárias pelo menos quatro equações, ou seja, quatro satélites. Com mais satélites, o
              receptor combina todas as medidas por mínimos quadrados e reduz o efeito dos erros ε<sub>i</sub>.
            </p>
          </div>
          <div className="mat-parte__lado" data-entra>
            <dl className="simbolos">
              <div><dt>x, y, z</dt><dd>coordenadas do receptor no sistema cartesiano terrestre (ECEF)</dd></div>
              <div><dt>x<sub>i</sub>, y<sub>i</sub>, z<sub>i</sub></dt><dd>posição conhecida do satélite i, calculada a partir das efemérides</dd></div>
              <div><dt>δt</dt><dd>erro de sincronização do relógio do receptor</dd></div>
              <div><dt>c</dt><dd>velocidade da luz</dd></div>
              <div><dt>ε<sub>i</sub></dt><dd>erros e efeitos não modelados: atmosfera, multicaminhamento, ruído</dd></div>
            </dl>
            <Trilateracao2D interativo />
          </div>
        </div>
      </article>

      {/* Etapa 4 · Laboratório */}
      <article id="mat-laboratorio" className="mat-lab" data-grupo aria-labelledby="mat-lab-t">
        <div className="moldura mat-lab__cabeca">
          <p className="mat-parte__num numeros" data-entra>03</p>
          <h3 id="mat-lab-t" className="titulo" data-titulo>Do sinal à coordenada, em seis etapas.</h3>
          <p className="enunciado" data-entra>
            Quatro satélites, um receptor em Brasília e um relógio 2 ms fora de hora. Acompanhe a conta que o receptor resolve
            a cada segundo.
          </p>
        </div>
        <div className="moldura">
          <DemoGps />
        </div>
      </article>

      {/* 3.3 */}
      <article id="mat-coordenadas" className="moldura mat-parte" data-grupo aria-labelledby="mat-coord-t">
        <div className="mat-parte__cabeca">
          <p className="mat-parte__num numeros" data-entra>04</p>
          <h3 id="mat-coord-t" className="titulo" data-titulo>Uma posição, duas linguagens.</h3>
        </div>
        <div className="coordenadas">
          <div className="coordenadas__col" data-entra>
            <p className="coordenadas__tipo">Coordenadas geográficas</p>
            <dl className="simbolos">
              <div><dt>φ</dt><dd>latitude: ângulo ao norte ou ao sul do equador</dd></div>
              <div><dt>λ</dt><dd>longitude: ângulo a leste ou a oeste do meridiano de Greenwich</dd></div>
              <div><dt>h</dt><dd>altitude sobre o elipsoide</dd></div>
            </dl>
            <p className="coordenadas__exemplo numeros">
              {num(Math.abs(exemplo.receptor.lat), 4)}° S · {num(Math.abs(exemplo.receptor.lon), 4)}° O · {num(exemplo.receptor.h, 0)} m
            </p>
          </div>
          <div className="coordenadas__col" data-entra>
            <p className="coordenadas__tipo">Cartesianas geocêntricas (ECEF)</p>
            <dl className="simbolos">
              <div><dt>X</dt><dd>no plano do equador, em direção ao meridiano de Greenwich</dd></div>
              <div><dt>Y</dt><dd>no plano do equador, a 90° de longitude leste</dd></div>
              <div><dt>Z</dt><dd>ao longo do eixo de rotação, para o polo norte</dd></div>
            </dl>
            <p className="coordenadas__exemplo numeros">
              X {num(exemplo.receptorEcef[0] / 1000, 3)} · Y {num(exemplo.receptorEcef[1] / 1000, 3)} · Z {num(exemplo.receptorEcef[2] / 1000, 3)} km
            </p>
          </div>
        </div>
        <p className="nota coordenadas__nota" data-entra>
          Ponto demonstrativo em Brasília, o mesmo do laboratório, nas duas formas. Conversão calculada nesta página.
        </p>
        <div className="mat-parte__corpo">
          <div className="texto" data-entra>
            <p>
              O ECEF (<em>Earth-Centered, Earth-Fixed</em>) é um sistema cartesiano com origem no centro de massa da Terra e
              eixos que giram com ela, seguindo o referencial terrestre adotado. É nele que o receptor resolve as equações.
              Depois, converte o resultado para latitude, longitude e altitude, mais fáceis de ler.
            </p>
            <p>
              A conversão precisa de uma forma de referência para a Terra. O GPS usa o <strong>WGS 84</strong> (<em>World
              Geodetic System 1984</em>), mantido pela National Geospatial-Intelligence Agency dos EUA: um elipsoide
              achatado nos polos, ajustado ao planeta inteiro.
            </p>
          </div>
          <div className="mat-parte__lado" data-entra>
            <p className="formula formula--bloco" role="math" aria-label="X igual a R n mais h vezes cosseno de fi vezes cosseno de lambda; Y igual a R n mais h vezes cosseno de fi vezes seno de lambda; Z igual a R n vezes 1 menos e ao quadrado, mais h, vezes seno de fi">
              X = (R<sub>N</sub> + h) cos φ cos λ<br />
              Y = (R<sub>N</sub> + h) cos φ sen λ<br />
              Z = (R<sub>N</sub>(1 − e²) + h) sen φ
            </p>
            <p className="formula-linha formula-linha--centro">R<sub>N</sub> = a / √(1 − e² sen² φ)</p>
            <table className="tabela-num tabela-num--wgs">
              <caption>Parâmetros do elipsoide WGS 84</caption>
              <tbody>
                <tr><th scope="row">a · semieixo maior</th><td>{num(WGS84.a, 0)} m</td></tr>
                <tr><th scope="row">1/f · achatamento inverso</th><td>298,257223563</td></tr>
                <tr><th scope="row">b · semieixo menor (derivado)</th><td>{num(WGS84.b, 3)} m</td></tr>
                <tr><th scope="row">e² · excentricidade ao quadrado</th><td>{num(WGS84.e2, 9)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mat-alturas">
          <div className="texto" data-entra>
            <h4 className="subtitulo">Duas altitudes que não são a mesma.</h4>
            <p>
              A altitude que sai da conta do GPS é <strong>elipsoidal</strong> (h): a distância até o elipsoide, uma
              superfície matemática. A altitude dos mapas é <strong>ortométrica</strong> (H): a distância até o geoide,
              a superfície que acompanha o nível médio do mar sob a ação da gravidade. A diferença entre as duas é a
              ondulação do geoide (N), que varia de lugar para lugar e pode passar de 100 m.
            </p>
            <p className="formula-linha">h ≈ H + N</p>
            <p>
              O receptor da tag, um NEO-6M, informa a altitude em relação ao nível médio do mar, aplicando internamente um
              modelo do geoide. O CANIDÉ grava esse valor como <em>altitude GPS</em>. A <em>altitude barométrica</em> do
              BME280 é uma terceira grandeza: vem da pressão do ar e depende de uma pressão de referência.
            </p>
          </div>
          <figure className="mat-alturas__figura" data-entra>
            <DiagramaAltitudes />
            <figcaption className="legenda">Corte esquemático. Relevo e ondulação muito exagerados.</figcaption>
          </figure>
        </div>
      </article>

      {/* 3.4 */}
      <article id="mat-distancia" className="moldura mat-parte" data-grupo aria-labelledby="mat-dist-t">
        <div className="mat-parte__cabeca">
          <p className="mat-parte__num numeros" data-entra>05</p>
          <h3 id="mat-dist-t" className="titulo" data-titulo>A distância sobre a superfície.</h3>
        </div>
        <div className="mat-parte__corpo">
          <div className="texto" data-entra>
            <p>
              Entre duas posições, a menor distância sobre uma esfera segue um arco de círculo máximo. A fórmula de
              Haversine calcula esse arco a partir das latitudes e longitudes, e é estável mesmo para pontos muito
              próximos, como duas amostras seguidas de um trajeto.
            </p>
            <p className="formula formula--bloco" role="math" aria-label="a igual a seno ao quadrado de delta fi sobre 2, mais cosseno de fi 1 vezes cosseno de fi 2 vezes seno ao quadrado de delta lambda sobre 2. d igual a 2 R vezes arco tangente de dois argumentos, raiz de a e raiz de 1 menos a">
              a = sen²(Δφ/2) + cos φ<sub>1</sub> · cos φ<sub>2</sub> · sen²(Δλ/2)
              <br />
              d = 2R · atan2(√a, √(1 − a))
            </p>
            <dl className="simbolos">
              <div><dt>φ</dt><dd>latitude, em radianos</dd></div>
              <div><dt>λ</dt><dd>longitude, em radianos</dd></div>
              <div><dt>R</dt><dd>raio médio da Terra na aproximação esférica: 6 371 008,8 m</dd></div>
              <div><dt>d</dt><dd>distância calculada, na mesma unidade de R</dd></div>
            </dl>
            <p>
              A Terra, porém, é um elipsoide. A fórmula é uma aproximação esférica, com diferenças que chegam a cerca de
              0,5%. Para geodésia de alta precisão usam-se métodos sobre o elipsoide, como o de Vincenty (1975), que a
              calculadora ao lado usa para comparar.
            </p>
          </div>
          <div className="mat-parte__lado" data-entra>
            <CalculadoraHaversine />
          </div>
        </div>
        <aside className="no-canide" data-entra aria-label="Como o CANIDÉ usa essa matemática">
          <p className="no-canide__rotulo">No CANIDÉ</p>
          <p>
            A trajetória online soma a distância de Haversine entre posições com fix consecutivas, com R = 6 371 008,8 m,
            para mostrar a distância percorrida. O plano de voo do painel local usa outra aproximação, adequada a
            deslocamentos de poucos quilômetros: converte cada posição em metros a partir da primeira, com x = Δλ · 111 320 ·
            cos φ₀ e y = Δφ · 110 574 (Δ em graus).
          </p>
        </aside>
      </article>

      {/* 3.5 */}
      <article id="mat-trajetoria" className="moldura mat-parte" data-grupo aria-labelledby="mat-traj-t">
        <div className="mat-parte__cabeca">
          <p className="mat-parte__num numeros" data-entra>06</p>
          <h3 id="mat-traj-t" className="titulo" data-titulo>De pontos soltos a um trajeto.</h3>
        </div>
        <div className="mat-parte__corpo">
          <div className="texto" data-entra>
            <p>
              Uma posição sozinha diz onde. Uma sequência de posições com horário diz por onde, em que direção e com que
              rapidez. A velocidade média entre duas amostras é a distância percorrida dividida pelo tempo:
            </p>
            <p className="formula" role="math" aria-label="v igual a delta s sobre delta t">v = Δs / Δt</p>
            <p>
              Somando todos os trechos e dividindo pelo tempo total, obtém-se a velocidade média do percurso. Usando só o
              trecho mais recente, entre amostras próximas, obtém-se uma estimativa da velocidade instantânea. A direção
              do deslocamento vem do rumo entre duas posições:
            </p>
            <p className="formula-linha" role="math" aria-label="theta igual a arco tangente de dois argumentos: seno de delta lambda vezes cosseno de fi 2; cosseno de fi 1 vezes seno de fi 2 menos seno de fi 1 vezes cosseno de fi 2 vezes cosseno de delta lambda">
              θ = atan2(sen Δλ · cos φ<sub>2</sub>, cos φ<sub>1</sub> sen φ<sub>2</sub> − sen φ<sub>1</sub> cos φ<sub>2</sub> cos Δλ)
            </p>
            <p>
              A qualidade do trajeto depende de três coisas: da qualidade de cada posição, da frequência das amostras e do
              processamento. Parado, um receptor ainda oscila alguns metros; somar essas oscilações cria distância que não
              existiu, e amostras espaçadas demais cortam as curvas.
            </p>
          </div>
          <div className="mat-parte__lado" data-entra>
            <Trajetoria />
          </div>
        </div>
        <aside className="no-canide" data-entra aria-label="Como o CANIDÉ usa essa matemática">
          <p className="no-canide__rotulo">No CANIDÉ</p>
          <p>
            O protocolo V3 da tag não transmite velocidade, e o sistema não a calcula: o painel informa a ausência em vez de
            inventar um valor. A trajetória online calcula a distância percorrida e o rumo. Para o rumo, usa a posição mais
            recente que esteja a pelo menos 3 m da atual, o que evita direções aleatórias causadas pela oscilação do GPS
            quando o objeto está parado.
          </p>
        </aside>
      </article>

      {/* 3.6 */}
      <article id="mat-qualidade" className="moldura mat-parte" data-grupo aria-labelledby="mat-qual-t">
        <div className="mat-parte__cabeca">
          <p className="mat-parte__num numeros" data-entra>07</p>
          <h3 id="mat-qual-t" className="titulo" data-titulo>Quanto vale uma posição.</h3>
        </div>
        <p className="enunciado mat-qualidade__enunciado" data-entra>
          Segundo o GPS.gov, um celular com GPS costuma acertar a posição num raio de 4,9 m sob céu aberto. Perto de prédios,
          pontes e árvores, a exatidão piora.
        </p>
        <dl className="fontes-erro">
          {FATORES.map((f, i) => (
            <div key={f.nome} className="fontes-erro__item" data-entra>
              <dt>
                <span className="numeros">{String(i + 1).padStart(2, '0')}</span> {f.nome}
              </dt>
              <dd>{f.texto}</dd>
            </div>
          ))}
        </dl>

        <div className="mat-parte__corpo mat-dop">
          <div className="texto" data-entra>
            <h4 className="subtitulo">A geometria também pesa: DOP.</h4>
            <p>
              A diluição de precisão (<em>Dilution of Precision</em>, DOP) mede quanto a distribuição dos satélites no céu
              amplia os erros das pseudodistâncias. Ela sai da mesma conta de mínimos quadrados do laboratório: com a matriz
              H das direções aos satélites, Q = (HᵀH)⁻¹, e cada DOP é a raiz de uma parte da diagonal de Q.
            </p>
            <p>
              Satélites espalhados, alguns altos e outros perto do horizonte, cruzam suas esferas em ângulos abertos: DOP
              baixo. Satélites agrupados cruzam em ângulos rasos: um pequeno erro desloca muito o ponto de cruzamento.
            </p>
          </div>
          <div className="mat-parte__lado" data-entra>
            <CeuDop />
          </div>
        </div>

        <div className="conceitos">
          <dl className="conceitos__lista">
            {CONCEITOS.map(c => (
              <div key={c.nome} data-entra>
                <dt className="editorial">{c.nome}</dt>
                <dd>{c.texto}</dd>
              </div>
            ))}
          </dl>
          <figure className="conceitos__figura" data-entra>
            <Alvos />
          </figure>
        </div>

        <aside className="no-canide" data-entra aria-label="O que o CANIDÉ faz com a qualidade">
          <p className="no-canide__rotulo">No CANIDÉ</p>
          <p>
            A tag transmite se há fix e quantos satélites estão em uso, mas não o DOP. O sistema não aplica correção
            diferencial (DGPS), RTK nem filtragem de posições: grava o que o receptor entregou e, sem fix, não grava
            coordenadas. A tela Qualidade audita a integridade dos <em>registros</em> (lacunas, sequências e campos fora de
            faixa), o que é diferente da integridade do posicionamento por satélite.
          </p>
        </aside>
      </article>
    </section>
  );
}

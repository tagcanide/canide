import { useRef } from 'react';
import { useEntrada } from '../lib/movimento.js';
import './Referencias.css';

// Referências do conteúdo científico. Duas origens, sempre separadas:
// 1) as da pesquisa original (docx do Grupo 5), preservadas; só a formatação foi uniformizada e dois erros
//    de digitação foram corrigidos (Rossiter e o ano de Hebblewhite e Haydon, conferido no PMC);
// 2) as complementares, usadas na seção "A matemática que nos localiza". Links conferidos em 25/11/2026.
// As fontes da homenagem a Gladys West ficam na própria seção Nossa inspiração.

const PESQUISA = [
  { texto: 'KAPLAN, Elliott D.; HEGARTY, Christopher J. Understanding GPS/GNSS: principles and applications. 3. ed. Boston: Artech House, 2017.' },
  { texto: 'ROSSITER, Margaret W. Women scientists in America: struggles and strategies to 1940. Baltimore: Johns Hopkins University Press, 1982. Citado na pesquisa como “Mulheres cientistas na América: lutas e estratégias até 1940”.' },
  { texto: 'ROSSITER, Margaret W. The Matthew Matilda effect in science. Social Studies of Science, v. 23, n. 2, 1993. Citado na pesquisa como “O ‘Efeito Matilda’ na ciência”.' },
  { texto: 'HEBBLEWHITE, Mark; HAYDON, Daniel T. Distinguishing technology from biology: a critical review of the use of GPS telemetry data in ecology. Philosophical Transactions of the Royal Society B, 2010.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2894965/' },
  { texto: 'BERGER-TAL, Oded et al. Conservation translocations: a review of common difficulties and promising directions. Animal Conservation, 2020.' },
  { texto: 'HARVEY-CARROLL et al. A framework for the ethical use of animal-borne devices in post-release monitoring following rehabilitation. Wildlife Biology, 2025.' },
  { texto: 'AEROSPACE. Uma breve história do GPS (A brief history of GPS).', url: 'https://aerospace.org/article/brief-history-gps' },
  { texto: 'LAB ANIMAL. Telemetria para fisiologia de pequenos animais.', url: 'https://www.nature.com/articles/laban.1048' },
  { texto: 'SMITHSONIAN’S NATIONAL ZOO & CONSERVATION BIOLOGY INSTITUTE. O que é telemetria por satélite.', url: 'https://nationalzoo.si.edu/migratory-birds/what-satellite-telemetry' },
  { texto: 'O GLOBO. ‘Mãe do GPS’: conheça a mulher negra por trás da invenção que mudou a tecnologia. 2024.', url: 'https://oglobo.globo.com/economia/tecnologia/noticia/2024/03/27/mae-do-gps-conheca-a-mulher-negra-por-tras-da-invencao-que-mudou-a-tecnologia.ghtml' },
  { texto: 'JORNAL DE BRASÍLIA. Hospital Veterinário Público de Animais Silvestres recebe e trata primeiras vítimas de incêndios florestais de 2025.', url: 'https://jornaldebrasilia.com.br/brasilia/hospital-veterinario-publico-de-animais-silvestres-recebe-e-trata-primeiras-vitimas-de-incendios-florestais-de-2025/' },
  { texto: 'CORREIO BRAZILIENSE. Incêndio na Floresta Nacional de Brasília deixa rastro de destruição. 2024.', url: 'https://www.correiobraziliense.com.br/cidades-df/2024/09/6935856-incendio-na-floresta-nacional-de-brasilia-deixa-rastro-de-destruicao.html' },
  { texto: 'CREARE SISTEMAS. Entenda a diferença entre telemetria e rastreamento.', url: 'https://crearesistemas.com.br/diferenca-rastreamento-telemetria/' },
  { texto: 'BRASIL ESCOLA. GPS: Sistema de Posicionamento Global.', url: 'https://brasilescola.uol.com.br/geografia/gpssistema-posicionamento-global.htm' },
  { texto: 'IBM. O que é telemetria?', url: 'https://www.ibm.com/br-pt/think/topics/telemetry' },
  { texto: 'TECNOBLOG. O que é GPS? Entenda como funciona o sistema de posicionamento global.', url: 'https://tecnoblog.net/responde/o-que-e-gps/' }
];

const COMPLEMENTARES = [
  { texto: 'GPS.GOV. Space Segment: órbitas a cerca de 20 200 km e constelação de pelo menos 24 satélites.', url: 'https://www.gps.gov/space-segment' },
  { texto: 'GPS.GOV. GPS Accuracy: fatores que afetam a exatidão e a referência de 4,9 m para celulares.', url: 'https://www.gps.gov/gps-accuracy' },
  { texto: 'GPS.GOV. GPS and Telling Time: relógios atômicos e o tempo como quarta dimensão.', url: 'https://www.gps.gov/gps-and-telling-time' },
  { texto: 'NASA. GPS: o que é e como funciona.', url: 'https://www.nasa.gov/general/what-is-gps/' },
  { texto: 'NIST. CODATA: speed of light in vacuum (c = 299 792 458 m/s, valor exato).', url: 'https://physics.nist.gov/cgi-bin/cuu/Value?c' },
  { texto: 'NATIONAL GEOSPATIAL-INTELLIGENCE AGENCY. World Geodetic System 1984: its definition and relationships with local geodetic systems. NGA.STND.0036_1.0.0_WGS84, 2014.' },
  { texto: 'NOAA NATIONAL OCEAN SERVICE. What is the geoid?', url: 'https://oceanservice.noaa.gov/facts/geoid.html' },
  { texto: 'NOAA NATIONAL GEODETIC SURVEY. GEOID: modelos do geoide e altitudes.', url: 'https://geodesy.noaa.gov/GEOID/' },
  { texto: 'VINCENTY, Thaddeus. Direct and inverse solutions of geodesics on the ellipsoid with application of nested equations. Survey Review, v. 23, n. 176, p. 88–93, 1975.' },
  { texto: 'SINNOTT, Roger W. Virtues of the haversine. Sky and Telescope, v. 68, n. 2, p. 159, 1984.' },
  { texto: 'LANGLEY, Richard B. Dilution of precision. GPS World, v. 10, n. 5, p. 52–59, 1999.' },
  { texto: 'U-BLOX. NEO-6 u-blox 6 GPS Modules: data sheet (GPS.G6-HW-09005).', url: 'https://content.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_%28GPS.G6-HW-09005%29.pdf' }
];

function Lista({ itens }) {
  return (
    <ol className="refs__lista">
      {itens.map(r => (
        <li key={r.texto}>
          <span>{r.texto}</span>
          {r.url && (
            <>
              {' '}
              <a className="refs__link" href={r.url} target="_blank" rel="noreferrer">
                Acessar
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function Referencias() {
  const ref = useRef(null);
  useEntrada(ref);
  return (
    <section id="referencias" ref={ref} className="referencias secao" aria-labelledby="refs-titulo">
      <div className="moldura refs" data-grupo>
        <div className="refs__cabeca">
          <p className="rotulo" data-entra>
            Referências
          </p>
          <h2 id="refs-titulo" className="subtitulo" data-entra>
            De onde vem o que está nesta página.
          </h2>
          <p className="nota refs__intro" data-entra>
            O conteúdo sobre o projeto vem da pesquisa original do grupo. A explicação matemática do GPS foi complementada
            com fontes institucionais e acadêmicas, listadas à parte. O funcionamento do CANIDÉ foi conferido no código do
            sistema.
          </p>
        </div>
        <div className="refs__colunas">
          <div data-entra>
            <h3 className="refs__grupo">Da pesquisa original</h3>
            <Lista itens={PESQUISA} />
          </div>
          <div data-entra>
            <h3 className="refs__grupo">Complementares · matemática do GPS</h3>
            <Lista itens={COMPLEMENTARES} />
          </div>
        </div>
      </div>
    </section>
  );
}

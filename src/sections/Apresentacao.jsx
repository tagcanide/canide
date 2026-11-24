import { useLayoutEffect, useRef } from 'react';
import { asset } from '../lib/asset.js';
import { animate, onScroll, reduzMovimento, stagger, svg, useEntrada, utils } from '../lib/movimento.js';
import './Apresentacao.css';

// Cada fator tem um diagrama de linha (viewBox 0 0 96 48) que se desenha na entrada.
const FATORES = [
  { nome: 'Sinal', texto: 'Sem satélites suficientes à vista, o receptor não calcula a posição.',
    linhas: ['M10 44 H86', 'M48 44 V30', 'M36 22 A16 16 0 0 1 60 22', 'M28 14 A26 26 0 0 1 68 14', 'M20 6 A36 36 0 0 1 76 6'] },
  { nome: 'Alcance', texto: 'O rádio precisa chegar ao receptor para que a leitura seja entregue.',
    linhas: ['M10 28 H86', 'M10 22 V34', 'M86 22 V34', 'M30 26 V30', 'M48 26 V30', 'M66 26 V30', 'M10 12 C30 2 66 2 86 12'] },
  { nome: 'Bateria', texto: 'A autonomia limita por quanto tempo a tag registra e transmite.',
    linhas: ['M14 14 H78 V34 H14 Z', 'M78 20 H84 V28 H78', 'M20 20 H44 V28 H20 Z'] },
  { nome: 'Ambiente', texto: 'Relevo, vegetação e clima interferem no sinal e no equipamento.',
    linhas: ['M6 42 C22 30 34 34 48 24 C60 16 72 22 90 12', 'M6 46 C24 38 38 40 52 32 C66 26 76 30 90 22', 'M62 40 V30 M58 34 L62 30 L66 34'] }
];

const PERFIS = [
  { quem: 'Equipes de reintrodução', uso: 'Registrar localização, deslocamento e condições do ambiente depois da soltura.', situacao: 'Objetivo da pesquisa. Ainda sem teste em animais.', tipo: 'pendente' },
  { quem: 'Pesquisadores em ecologia', uso: 'Comparar sessões, auditar lacunas e exportar os registros em CSV para análise.', situacao: 'Disponível no painel.', tipo: 'pronto' },
  { quem: 'Professores e estudantes', uso: 'Projetos com GPS, telemetria, sensores e análise de dados, do circuito à tela.', situacao: 'Origem do projeto.', tipo: 'pronto' },
  { quem: 'Lançamentos experimentais', uso: 'Localizar o equipamento depois da queda e reconstruir o trajeto.', situacao: 'Em teste, com foguete de garrafa PET.', tipo: 'teste' }
];

export default function Apresentacao() {
  const ref = useRef(null);
  const fatoresRef = useRef(null);
  useEntrada(ref);

  useLayoutEffect(() => {
    if (reduzMovimento()) return undefined;
    const tracos = svg.createDrawable(fatoresRef.current.querySelectorAll('.fatores__desenho path'));
    utils.set(tracos, { draw: '0 0' });
    const a = animate(tracos, {
      draw: ['0 0', '0 1'],
      duration: 1100,
      ease: 'inOutQuad',
      delay: stagger(60),
      autoplay: onScroll({ target: fatoresRef.current, enter: 'bottom-=20% top', repeat: false })
    });
    return () => a.revert();
  }, []);

  return (
    <section id="proposito" ref={ref} className="apresentacao secao" aria-labelledby="apresentacao-titulo">
      <div className="moldura apresentacao__topo" data-grupo>
        <div className="apresentacao__texto">
          <p className="rotulo" data-entra>
            <span className="rotulo__num">02</span> Propósito
          </p>
          <h2 id="apresentacao-titulo" className="titulo" data-titulo>
            Soltar o animal é metade do trabalho.
          </h2>
          <p className="enunciado" data-entra>
            Depois da soltura, falta saber por onde ele anda e como se adapta, longe e em terreno difícil. O CANIDÉ
            registra posição e ambiente e entrega cada leitura a uma central no computador da equipe.
          </p>
        </div>
        <figure className="apresentacao__foto" data-entra>
          <div className="midia">
            <img
              src={asset('media/arara-em-voo-1600.webp')}
              srcSet={`${asset('media/arara-em-voo-800.webp')} 800w, ${asset('media/arara-em-voo-1600.webp')} 1600w`}
              sizes="(max-width: 899px) 92vw, 44vw"
              width="1600"
              height="1236"
              loading="lazy"
              alt="Arara-canindé em voo, asas abertas, diante da copa das árvores."
            />
          </div>
          <figcaption className="legenda">Arara-canindé em voo. Foto: Luc Viatour.</figcaption>
        </figure>
      </div>

      <div className="moldura apresentacao__fatores" data-grupo>
        <h3 className="subtitulo" data-entra>
          Quatro fatores decidem se um registro chega.
        </h3>
        <ol className="fatores" ref={fatoresRef}>
          {FATORES.map((f, i) => (
            <li key={f.nome} className="fatores__item" data-entra>
              <svg className="fatores__desenho" viewBox="0 0 96 48" aria-hidden="true">
                {f.linhas.map(d => (
                  <path key={d} d={d} />
                ))}
              </svg>
              <span className="fatores__num numeros">[{String(i + 1).padStart(2, '0')}]</span>
              <p className="fatores__nome">{f.nome}</p>
              <p className="fatores__texto">{f.texto}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="moldura apresentacao__perfis" data-grupo>
        <h3 className="subtitulo" data-entra>
          Para quem precisa do trajeto.
        </h3>
        <table className="perfis" data-entra>
          <caption className="sr-only">Perfis de uso e situação atual de cada um</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Perfil</th>
              <th scope="col">Uso</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            {PERFIS.map(p => (
              <tr key={p.quem}>
                <th scope="row">{p.quem}</th>
                <td>{p.uso}</td>
                <td className={`perfis__situacao perfis__situacao--${p.tipo}`}>{p.situacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="nota apresentacao__origem" data-entra>
          O CANIDÉ nasceu no Centro Educacional 04 de Taguatinga, DF, na pesquisa “Tecnologia de localização no auxílio da
          reintrodução de animais no seu habitat natural”, apresentada no 15º Circuito de Ciências das Escolas Públicas
          do DF.
        </p>
      </div>
    </section>
  );
}

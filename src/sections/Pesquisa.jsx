import { useRef } from 'react';
import { useEntrada } from '../lib/movimento.js';
import './Pesquisa.css';

// Conteúdo do projeto de pesquisa original ("Tecnologia de localização no auxílio da reintrodução de animais no seu
// habitat natural", Grupo 5, arquivo PROJETO DE PESQUISA GRUPO 5 PROF REGIANE .docx). Resumido sem acrescentar
// resultados: o documento é qualitativo e exploratório e não traz medições numéricas.

const OBJETIVOS = [
  'Compreender o funcionamento e a importância do GPS como tecnologia de localização.',
  'Conhecer os conceitos básicos de telemetria e sua aplicação no acompanhamento de animais.',
  'Investigar a importância da análise das trajetórias e dos deslocamentos durante a reintrodução.',
  'Relacionar o uso de tags de localização ao monitoramento da movimentação no ambiente natural.',
  'Analisar como os dados de localização podem ajudar a avaliar a adaptação dos animais após a soltura.',
  'Identificar contribuições das tecnologias de localização para a conservação das espécies.',
  'Valorizar a contribuição de Gladys West e a participação feminina na ciência e na tecnologia.'
];

const METODO = [
  { nome: 'Pesquisa bibliográfica', texto: 'Livros, artigos científicos e sites institucionais sobre posicionamento por satélite e telemetria.' },
  { nome: 'Teste da tag em foguete', texto: 'A tag de localização foi testada em foguetes de garrafa PET, para encontrar o ponto de queda sem prejudicar o desempenho do foguete.' },
  { nome: 'Protótipo de baixo custo', texto: 'Microcontrolador, módulo GPS, rádio, bateria e sensores: coletar, transmitir e registrar posições ao longo do tempo.' },
  { nome: 'Software de leitura', texto: 'Receber os dados, organizá-los e mostrar latitude, longitude, horário, distância percorrida e trajetória. A proposta deu origem ao painel do CANIDÉ.' },
  { nome: 'Entrevistas no Hfaus', texto: 'Em andamento: entrevistas estruturadas com veterinários e biólogos do Hospital da Fauna Silvestre, em Taguatinga, sobre como instalar o sistema em animais silvestres com segurança.' },
  { nome: 'Estande na escola', texto: 'Apresentar o projeto e o trabalho de Gladys West à comunidade escolar.' }
];

const ACHADOS = [
  { titulo: 'Posições no tempo viram trajeto', texto: 'Registradas ao longo do tempo, as posições deixam de indicar só onde um objeto está e passam a mostrar por onde ele andou.' },
  { titulo: 'GPS e telemetria se completam', texto: 'São conceitos diferentes: o GPS determina a posição; a telemetria transmite essa informação a um sistema de acompanhamento.' },
  { titulo: 'O alcance tem limites', texto: 'A eficiência depende do alcance do sistema, da disponibilidade de sinal, da duração da bateria e das condições do ambiente.' },
  { titulo: 'Ferramenta, não substituto', texto: 'A proposta é demonstrar, em escala experimental e sem uso em animais, uma possibilidade que auxilie os biólogos, não substituir seus métodos.' }
];

export default function Pesquisa() {
  const ref = useRef(null);
  useEntrada(ref);

  return (
    <section id="pesquisa" ref={ref} className="pesquisa secao" aria-labelledby="pesq-titulo">
      <div className="moldura pesq-abertura" data-grupo>
        <p className="rotulo" data-entra>
          <span className="rotulo__num">03</span> A pesquisa
        </p>
        <h2 id="pesq-titulo" className="titulo" data-titulo>
          Uma pergunta antes do circuito.
        </h2>
        <blockquote className="pesq-pergunta" data-entra>
          <p className="editorial">
            Como um sistema de localização por meio de uma tag, associado aos conceitos de GPS e telemetria, pode auxiliar
            na obtenção de dados sobre a localização e a trajetória de animais reintroduzidos à natureza?
          </p>
          <footer className="nota">
            Questão-problema do projeto “Tecnologia de localização no auxílio da reintrodução de animais no seu habitat
            natural”. A pesquisa pergunta também pela contribuição de Gladys West às tecnologias de posicionamento.
          </footer>
        </blockquote>
      </div>

      <div className="moldura pesq-contexto" data-grupo>
        <div className="pesq-contexto__col" data-entra>
          <h3 className="pesq-rotulo">O problema</h3>
          <p>
            Depois da soltura, o animal deixa de ser observado diretamente. Quando percorre grandes distâncias ou ocupa áreas
            de difícil acesso, a falta de dados de localização dificulta o trabalho dos biólogos e limita o que se sabe sobre
            sua adaptação.
          </p>
          <p>
            Em 2025, animais silvestres foram resgatados na Floresta Nacional de Brasília (Flona) depois de incêndios
            florestais, entre eles um jabuti e um tamanduá-mirim com queimaduras graves. Segundo dados do ICMBio citados na
            pesquisa, um animal resgatado e reabilitado foi reintroduzido na Flona em maio de 2025 e passou a ser monitorado
            por satélite e rádio VHF.
          </p>
        </div>
        <div className="pesq-contexto__col" data-entra>
          <h3 className="pesq-rotulo">A hipótese</h3>
          <p>
            O ponto de partida foi um problema simples: encontrar um foguete de garrafa PET depois da queda. Uma tag de
            localização a bordo, testada nos lançamentos, mostrou-se eficaz para encontrar o ponto de queda e preservar o equipamento.
          </p>
          <p className="pesq-destaque editorial">
            A mesma tag, levada do foguete a animais reintroduzidos, poderia mostrar seus deslocamentos, revelar padrões de
            movimentação e ajudar a verificar o sucesso da reintrodução.
          </p>
        </div>
      </div>

      <div className="moldura pesq-objetivos" data-grupo>
        <div className="pesq-objetivos__geral" data-entra>
          <h3 className="pesq-rotulo">Objetivo geral</h3>
          <p className="pesq-objetivos__texto">
            Investigar a aplicação de um sistema de localização por meio de uma tag, relacionando GPS e telemetria ao
            acompanhamento da trajetória de animais reintroduzidos, para compreender como essas tecnologias podem auxiliar no
            monitoramento, na análise de deslocamentos e na conservação das espécies.
          </p>
        </div>
        <div data-entra>
          <h3 className="pesq-rotulo">Objetivos específicos</h3>
          <ol className="pesq-lista">
            {OBJETIVOS.map((o, i) => (
              <li key={o}>
                <span className="numeros">{String(i + 1).padStart(2, '0')}</span>
                <span>{o}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="moldura pesq-metodo" data-grupo>
        <div className="pesq-metodo__cabeca">
          <h3 className="subtitulo" data-entra>
            Como a pesquisa foi feita.
          </h3>
          <p className="texto" data-entra>
            Abordagem qualitativa e exploratória. O protótipo começou em objetos, para simular uma aplicação futura em animais
            sem colocá-los em risco.
          </p>
        </div>
        <ol className="pesq-passos">
          {METODO.map((m, i) => (
            <li key={m.nome} data-entra>
              <span className="pesq-passos__num numeros">{String(i + 1).padStart(2, '0')}</span>
              <p className="pesq-passos__nome">{m.nome}</p>
              <p className="pesq-passos__texto">{m.texto}</p>
            </li>
          ))}
        </ol>
        <p className="nota pesq-foguete" data-entra>
          O desenho do foguete de teste se inspira no tucano: asas curtas e arredondadas que dão manobrabilidade entre as
          árvores baixas do Cerrado, e um equilíbrio entre bico e corpo que lembra o centro de massa de que um foguete precisa
          para subir reto.
        </p>
      </div>

      <div className="moldura pesq-achados" data-grupo>
        <h3 className="subtitulo" data-entra>
          O que a pesquisa encontrou.
        </h3>
        <dl className="pesq-achados__lista">
          {ACHADOS.map(a => (
            <div key={a.titulo} data-entra>
              <dt className="editorial">{a.titulo}</dt>
              <dd>{a.texto}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="moldura pesq-inclusao" data-grupo>
        <h3 className="pesq-rotulo" data-entra>
          Inclusão social pela ciência
        </h3>
        <div className="pesq-inclusao__texto texto" data-entra>
          <p>
            A pesquisa escolheu o GPS também pela história de quem ajudou a construí-lo. Margaret Rossiter mostrou que muitas
            cientistas foram excluídas de laboratórios e sociedades científicas, e chamou de <em>Efeito Matilda</em> a
            atribuição de descobertas de mulheres a colegas homens. A trajetória de Gladys West, marcada por barreiras de
            gênero e raça, é a resposta do projeto: a escola como lugar de ampliar referências e de mostrar às meninas que a
            ciência também é delas.
          </p>
          <p>
            <a className="link" href="#inspiracao">
              Conheça Gladys Mae West
            </a>
          </p>
        </div>
        <p className="pesq-palavras nota" data-entra>
          Palavras-chave da pesquisa: protagonismo feminino, geometria, inclusão.
        </p>
      </div>
    </section>
  );
}

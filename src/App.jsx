import Nav from './components/Nav.jsx';
import Hero from './sections/Hero.jsx';
import Identidade from './sections/Identidade.jsx';
import Apresentacao from './sections/Apresentacao.jsx';
import Produto from './sections/Produto.jsx';
import Desmontagem from './sections/Desmontagem.jsx';
import Funcionalidades from './sections/Funcionalidades.jsx';
import Sessao from './sections/Sessao.jsx';
import Integracao from './sections/Integracao.jsx';
import Diferenciais from './sections/Diferenciais.jsx';
import Inspiracao from './sections/Inspiracao.jsx';
import Pesquisa from './sections/Pesquisa.jsx';
import Matematica from './sections/Matematica.jsx';
import Telemetria from './sections/Telemetria.jsx';
import Referencias from './sections/Referencias.jsx';
import Final from './sections/Final.jsx';
import Rodape from './sections/Rodape.jsx';

export default function App() {
  return (
    <>
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Nav />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <Identidade />
        <Apresentacao />
        <Pesquisa />
        <Produto />
        <Desmontagem />
        <Funcionalidades />
        <Sessao />
        <Integracao />
        <Inspiracao />
        <Matematica />
        <Telemetria />
        <Diferenciais />
        <Referencias />
        <Final />
      </main>
      <Rodape />
    </>
  );
}

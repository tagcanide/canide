import { useEffect, useRef, useState } from 'react';
import { asset } from '../lib/asset.js';
import { formatarCodigo, limparCodigo, remotoDisponivel } from '../remoto/conexao.js';
import { MODULOS, roteiroValido } from '../data/modulos.js';
import { gravarFavoritos, lerFavoritos, lerSelecao, limparSelecao, salvarSelecao } from './armazenamento.js';
import Livre, { vibrar } from './Livre.jsx';
import Roteiro from './Roteiro.jsx';
import { Favoritos, Selecao, Sequencia } from './Selecao.jsx';
import './Controle.css';

const CHAVE = 'canide-remoto-sid';

const FASES = {
  conectado: { tom: 'ok', texto: 'Conectado ao computador' },
  reconectando: { tom: 'alerta', texto: 'Sem internet. Reconectando…' },
  'computador-ausente': { tom: 'alerta', texto: 'Computador sem conexão. Aguardando…' },
  encerrado: { tom: 'fim', texto: 'Sessão encerrada' }
};

function lerSessaoDoEndereco() {
  const m = /[#&]s=([A-Za-z0-9_-]{24,})/.exec(window.location.hash);
  if (m) {
    // o identificador sai da barra de endereço, mas fica guardado nesta aba para reconectar
    try {
      sessionStorage.setItem(CHAVE, m[1]);
    } catch {
      /* sem armazenamento: segue só com a memória */
    }
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return m[1];
  }
  try {
    return sessionStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export default function Controle() {
  const [fase, setFase] = useState(remotoDisponivel() ? 'inicio' : 'indisponivel');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [conexao, setConexao] = useState(null);
  const [eco, setEco] = useState('');
  const [selecao, setSelecao] = useState([]);
  const [salva, setSalva] = useState(null); // seleção salva nesta sessão
  const [favoritos, setFavoritos] = useState(lerFavoritos);
  const [movido, setMovido] = useState(null);
  const [aviso, setAviso] = useState('');
  const controleRef = useRef(null);
  const ecoRef = useRef(0);
  const movidoRef = useRef(0);
  const avisoRef = useRef(0);

  async function conectarCom({ sid, codigo: cod }) {
    setErro('');
    setFase('pareando');
    try {
      const { parear } = await import('../remoto/controle.js');
      controleRef.current = await parear({
        sid,
        codigo: cod,
        aoEstado: e => {
          setConexao(e);
          if (e.fase === 'encerrado') {
            // fim da sessão: a seleção temporária vai junto; as favoritas ficam
            try {
              sessionStorage.removeItem(CHAVE);
            } catch {
              /* nada a limpar */
            }
            limparSelecao();
            setSalva(null);
          }
        }
      });
      const guardada = lerSelecao(controleRef.current.sid);
      if (guardada) {
        setSelecao(guardada);
        setSalva(guardada);
      }
      setFase('controle');
    } catch (e) {
      try {
        sessionStorage.removeItem(CHAVE);
      } catch {
        /* nada a limpar */
      }
      setErro(e?.message || 'Não foi possível conectar. Verifique a internet e tente de novo.');
      setFase('inicio');
    }
  }

  useEffect(() => {
    if (fase !== 'inicio') return;
    const sid = lerSessaoDoEndereco();
    if (sid) conectarCom({ sid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviar = (tipo, arg) => {
    const ok = controleRef.current?.enviar(tipo, arg);
    if (!ok) return;
    if (!tipo.endsWith('-segurar')) {
      setEco(tipo);
      clearTimeout(ecoRef.current);
      ecoRef.current = setTimeout(() => setEco(''), 600);
    }
  };

  const avisar = texto => {
    setAviso(texto);
    clearTimeout(avisoRef.current);
    avisoRef.current = setTimeout(() => setAviso(''), 2400);
  };

  /* ---------- seleção e ordem ---------- */
  const alternar = id => {
    vibrar(8);
    setSelecao(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  };
  const mover = (i, d) => {
    vibrar(8);
    setSelecao(s => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const n = [...s];
      [n[i], n[j]] = [n[j], n[i]];
      setMovido(n[j]);
      return n;
    });
    clearTimeout(movidoRef.current);
    movidoRef.current = setTimeout(() => setMovido(null), 500);
  };
  const salvar = () => {
    if (salvarSelecao(controleRef.current?.sid, selecao)) avisar('Seleção salva nesta sessão.');
    else avisar('Este navegador não permite salvar. A seleção continua na tela.');
    setSalva(selecao);
  };
  const limpar = () => {
    limparSelecao();
    setSalva(null);
    setSelecao([]);
    avisar('Seleção limpa.');
  };
  const iniciar = () => {
    const ids = roteiroValido(selecao);
    if (!ids.length) return;
    vibrar(20);
    salvarSelecao(controleRef.current?.sid, ids);
    setSalva(ids);
    enviar('roteiro', ids.join(','));
  };
  const guardarFavorito = nome => {
    const lista = [...favoritos, { nome, ids: selecao }];
    setFavoritos(lista);
    avisar(gravarFavoritos(lista) ? `Sequência “${nome}” guardada neste celular.` : 'Este navegador não permite guardar sequências.');
  };
  const excluirFavorito = i => {
    const lista = favoritos.filter((_, n) => n !== i);
    setFavoritos(lista);
    gravarFavoritos(lista);
  };
  const carregarFavorito = f => {
    vibrar();
    setSelecao(roteiroValido(f.ids));
    avisar(`Sequência “${f.nome}” carregada. Revise e inicie.`);
  };

  const pagina = conexao?.estado;
  const pausado = Boolean(pagina?.pausado);
  const roteiro = pagina?.roteiro || null;
  const infoFase = FASES[conexao?.fase] || FASES.conectado;
  const encerrado = conexao?.fase === 'encerrado';
  const conectado = !encerrado && conexao?.fase === 'conectado';
  const desativado = !conectado || pausado;
  const estadoSalva = !salva ? null : salva.join(',') === selecao.join(',') ? 'igual' : 'mudou';

  return (
    <main className="cr">
      <header className="cr-topo">
        <img src={asset('brand/02-monocromatica-azul.svg')} alt="CANIDÉ" width="120" height="27" />
        {fase === 'controle' && (
          <p className={`cr-estado cr-estado--${infoFase.tom}`} role="status" aria-live="polite">
            <span className="cr-ponto" aria-hidden="true" />
            {infoFase.texto}
          </p>
        )}
      </header>

      {fase === 'indisponivel' && (
        <section className="cr-aviso">
          <h1 className="cr-titulo">Controle remoto indisponível.</h1>
          <p>O serviço de conexão não está configurado nesta versão do site.</p>
        </section>
      )}

      {(fase === 'inicio' || fase === 'pareando') && (
        <section className="cr-parear">
          <p className="rotulo">Controle remoto</p>
          <h1 className="cr-titulo">Conecte ao computador.</h1>
          <p className="cr-texto">
            Escaneie o QR Code mostrado no computador ou digite o código de 8 caracteres que aparece abaixo dele.
          </p>
          <form
            className="cr-form"
            onSubmit={e => {
              e.preventDefault();
              conectarCom({ codigo });
            }}
          >
            <label htmlFor="cr-codigo">Código de pareamento</label>
            <input
              id="cr-codigo"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              placeholder="XXXX-XXXX"
              value={codigo.length > 4 ? formatarCodigo(codigo) : codigo}
              onChange={e => setCodigo(limparCodigo(e.target.value))}
              aria-describedby={erro ? 'cr-erro' : undefined}
              disabled={fase === 'pareando'}
            />
            <button type="submit" className="botao" disabled={codigo.length !== 8 || fase === 'pareando'}>
              {fase === 'pareando' ? 'Conectando…' : 'Conectar'}
            </button>
            {erro && (
              <p id="cr-erro" className="cr-erro" role="alert">
                {erro}
              </p>
            )}
          </form>
        </section>
      )}

      {fase === 'controle' && (
        <section className="cr-painel" aria-label="Controles da apresentação">
          {encerrado ? (
            <div className="cr-aviso">
              <h1 className="cr-titulo">Controle desconectado.</h1>
              <p>{conexao?.motivo}</p>
              <p>Para continuar, gere um novo código no computador.</p>
              <button
                type="button"
                className="botao"
                onClick={() => {
                  setConexao(null);
                  setCodigo('');
                  setFase('inicio');
                }}
              >
                Parear de novo
              </button>
            </div>
          ) : (
            <>
              {roteiro ? (
                <Roteiro roteiro={roteiro} pausado={pausado} enviar={enviar} eco={eco} conectado={conectado} />
              ) : (
                <>
                  <Selecao
                    selecao={selecao}
                    alternar={alternar}
                    todos={() => setSelecao(s => [...s, ...MODULOS.map(m => m.id).filter(id => !s.includes(id))])}
                    nenhum={() => setSelecao([])}
                    limpar={limpar}
                    salvar={salvar}
                    salva={estadoSalva}
                  />
                  <Sequencia selecao={selecao} mover={mover} remover={alternar} movido={movido} />
                  <Favoritos favoritos={favoritos} selecao={selecao} guardar={guardarFavorito} carregar={carregarFavorito} excluir={excluirFavorito} />

                  <details className="cr-sumario cr-livre">
                    <summary>Navegação livre, sem roteiro</summary>
                    <Livre pagina={pagina} enviar={enviar} eco={eco} desativado={desativado} pausado={pausado} podePausar={conectado} />
                  </details>

                  <div className="cr-iniciar">
                    <button type="button" className="botao cr-iniciar__botao" onClick={iniciar} disabled={!selecao.length || !conectado}>
                      Iniciar apresentação
                      <span className="numeros">{selecao.length ? `${selecao.length} ${selecao.length === 1 ? 'módulo' : 'módulos'}` : 'escolha os módulos'}</span>
                    </button>
                  </div>
                </>
              )}

              <p className="cr-aviso-rapido" role="status" aria-live="polite">
                {aviso}
              </p>

              <button type="button" className="cr-desconectar" onClick={() => controleRef.current?.desconectar()}>
                Encerrar sessão
              </button>
            </>
          )}
        </section>
      )}
    </main>
  );
}

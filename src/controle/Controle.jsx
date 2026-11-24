import { useEffect, useRef, useState } from 'react';
import { asset } from '../lib/asset.js';
import { SEGURAR_MS, formatarCodigo, limparCodigo, remotoDisponivel } from '../remoto/conexao.js';
import './Controle.css';

const CHAVE = 'canide-remoto-sid';

const FASES = {
  conectado: { tom: 'ok', texto: 'Conectado ao computador' },
  reconectando: { tom: 'alerta', texto: 'Sem internet. Reconectando…' },
  'computador-ausente': { tom: 'alerta', texto: 'Computador sem conexão. Aguardando…' },
  encerrado: { tom: 'fim', texto: 'Sessão encerrada' }
};

const vibrar = (ms = 12) => navigator.vibrate?.(ms);

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

/** Botão que dá um passo no toque curto e rola continuamente enquanto pressionado. */
function BotaoSegurar({ dir, rotulo, seta, enviar, desativado }) {
  const temporizador = useRef(0);
  const repetidor = useRef(0);
  const segurando = useRef(false);
  const pressionado = useRef(false);
  const [ativo, setAtivo] = useState(false);

  // pointerup e lostpointercapture chegam juntos: só o primeiro conta
  const soltar = () => {
    clearTimeout(temporizador.current);
    clearInterval(repetidor.current);
    if (!pressionado.current) return;
    pressionado.current = false;
    setAtivo(false);
    if (segurando.current) {
      segurando.current = false;
      enviar('parar');
    } else {
      enviar(dir);
    }
  };

  const pressionar = e => {
    if (desativado) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pressionado.current = true;
    setAtivo(true);
    vibrar();
    temporizador.current = setTimeout(() => {
      segurando.current = true;
      vibrar(20);
      enviar(`${dir}-segurar`);
      repetidor.current = setInterval(() => enviar(`${dir}-segurar`), SEGURAR_MS);
    }, 260);
  };

  useEffect(() => () => {
    clearTimeout(temporizador.current);
    clearInterval(repetidor.current);
  }, []);

  return (
    <button
      type="button"
      className={`cr-botao cr-botao--grande ${ativo ? 'cr-botao--ativo' : ''}`}
      disabled={desativado}
      onPointerDown={pressionar}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      onLostPointerCapture={soltar}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!e.repeat) enviar(dir);
        }
      }}
      onContextMenu={e => e.preventDefault()}
    >
      <span className="cr-botao__seta" aria-hidden="true">
        {seta}
      </span>
      <span>{rotulo}</span>
      <span className="cr-botao__dica">Segure para rolar</span>
    </button>
  );
}

export default function Controle() {
  const [fase, setFase] = useState(remotoDisponivel() ? 'inicio' : 'indisponivel');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [conexao, setConexao] = useState(null);
  const [eco, setEco] = useState('');
  const controleRef = useRef(null);
  const ecoRef = useRef(0);

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
            try {
              sessionStorage.removeItem(CHAVE);
            } catch {
              /* nada a limpar */
            }
          }
        }
      });
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

  const enviar = tipo => {
    const ok = controleRef.current?.enviar(tipo);
    if (!ok) return;
    if (!tipo.endsWith('-segurar')) {
      setEco(tipo);
      clearTimeout(ecoRef.current);
      ecoRef.current = setTimeout(() => setEco(''), 600);
    }
  };
  const tocar = tipo => () => {
    vibrar();
    enviar(tipo);
  };

  const pagina = conexao?.estado;
  const pausado = Boolean(pagina?.pausado);
  const infoFase = FASES[conexao?.fase] || FASES.conectado;
  const encerrado = conexao?.fase === 'encerrado';
  const desativado = encerrado || conexao?.fase !== 'conectado' || pausado;

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
              <div className="cr-secao" aria-live="polite">
                <p className="cr-secao__num numeros">
                  {pagina ? `${String(pagina.secao + 1).padStart(2, '0')} / ${String(pagina.total).padStart(2, '0')}` : '-- / --'}
                </p>
                <p className="cr-secao__nome">{pagina?.nome || 'Aguardando a página…'}</p>
                <span className="cr-secao__barra" aria-hidden="true">
                  <span style={{ transform: `scaleX(${pagina ? (pagina.secao + 1) / pagina.total : 0})` }} />
                </span>
              </div>

              <div className="cr-grade">
                <BotaoSegurar dir="subir" rotulo="Subir" seta="↑" enviar={enviar} desativado={desativado} />
                <BotaoSegurar dir="descer" rotulo="Descer" seta="↓" enviar={enviar} desativado={desativado} />

                <button type="button" className={`cr-botao ${eco === 'anterior' ? 'cr-botao--eco' : ''}`} onClick={tocar('anterior')} disabled={desativado}>
                  <span className="cr-botao__seta" aria-hidden="true">‹</span> Seção anterior
                </button>
                <button type="button" className={`cr-botao cr-botao--azul ${eco === 'proxima' ? 'cr-botao--eco' : ''}`} onClick={tocar('proxima')} disabled={desativado}>
                  Próxima seção <span className="cr-botao__seta" aria-hidden="true">›</span>
                </button>

                <button type="button" className={`cr-botao cr-botao--fino ${eco === 'inicio' ? 'cr-botao--eco' : ''}`} onClick={tocar('inicio')} disabled={desativado}>
                  Ir ao início
                </button>
                <button type="button" className={`cr-botao cr-botao--fino ${eco === 'fim' ? 'cr-botao--eco' : ''}`} onClick={tocar('fim')} disabled={desativado}>
                  Ir ao final
                </button>

                <button
                  type="button"
                  className={`cr-botao cr-botao--largo ${pausado ? 'cr-botao--pausado' : ''}`}
                  aria-pressed={pausado}
                  onClick={tocar(pausado ? 'retomar' : 'pausar')}
                  disabled={encerrado || conexao?.fase !== 'conectado'}
                >
                  {pausado ? 'Retomar navegação' : 'Pausar navegação'}
                </button>
              </div>

              <button type="button" className="cr-desconectar" onClick={() => controleRef.current?.desconectar()}>
                Desconectar
              </button>
            </>
          )}
        </section>
      )}
    </main>
  );
}

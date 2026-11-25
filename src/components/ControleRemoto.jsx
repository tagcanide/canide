import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatarCodigo, remotoDisponivel } from '../remoto/conexao.js';
import { GRUPOS, MODULO } from '../data/modulos.js';
import './ControleRemoto.css';

const FASES = {
  criando: { tom: 'espera', texto: 'Criando a sessão…' },
  aguardando: { tom: 'espera', texto: 'Aguardando o celular' },
  conectado: { tom: 'ok', texto: 'Controle conectado' },
  'controle-ausente': { tom: 'alerta', texto: 'Celular sem conexão. Aguardando reconexão…' },
  expirado: { tom: 'fim', texto: 'O código expirou sem pareamento.' },
  encerrado: { tom: 'fim', texto: 'Sessão encerrada.' },
  erro: { tom: 'fim', texto: 'Não foi possível criar a sessão.' }
};

function useRestante(ate) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (!ate) return undefined;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ate]);
  if (!ate) return '';
  const s = Math.max(0, Math.round((ate - agora) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Marcador da apresentação no telão: módulo atual, próximo e progresso da sequência escolhida no celular. */
function Marcador({ roteiro, pausado, tom }) {
  const ids = roteiro.ids.split(',').filter(id => MODULO[id]);
  const i = Math.max(0, Math.min(ids.length - 1, roteiro.atual));
  const atual = MODULO[ids[i]];
  const proximo = MODULO[ids[i + 1]];
  if (!atual) return null;
  return (
    <aside className={`marcador-ap ${pausado ? 'marcador-ap--pausado' : ''}`} aria-label="Apresentação em andamento" aria-live="polite">
      <div className="marcador-ap__topo">
        <span className={`remoto__ponto remoto__ponto--${tom}`} aria-hidden="true" />
        <span className="numeros">
          {String(i + 1).padStart(2, '0')} / {String(ids.length).padStart(2, '0')}
        </span>
        <span>{pausado ? 'Pausada' : GRUPOS[atual.grupo].nome}</span>
      </div>
      <p key={atual.id} className="marcador-ap__nome">
        {atual.nome}
      </p>
      {proximo && <p className="marcador-ap__proximo">A seguir: {proximo.nome}</p>}
      <ol className="marcador-ap__trilho" aria-hidden="true">
        {ids.map((id, n) => (
          <li key={id} className={n < i ? 'feito' : n === i ? 'atual' : ''} />
        ))}
      </ol>
    </aside>
  );
}

/** Botão "Controle remoto" e a janela de pareamento. Só aparece com o serviço configurado. */
export default function ControleRemoto({ className = '' }) {
  const dialogoRef = useRef(null);
  const sessaoRef = useRef(null);
  const [estado, setEstado] = useState(null);
  const [qr, setQr] = useState('');
  const [aberto, setAberto] = useState(false);
  const restante = useRestante(estado?.fase === 'aguardando' ? estado.pareamentoAte : null);

  const ativa = estado && ['criando', 'aguardando', 'conectado', 'controle-ausente'].includes(estado.fase);

  async function iniciar() {
    setQr('');
    setEstado({ fase: 'criando', online: true });
    try {
      const [{ iniciarApresentacao }, QR] = await Promise.all([import('../remoto/anfitriao.js'), import('qrcode')]);
      sessaoRef.current = await iniciarApresentacao({ aoEstado: setEstado });
      const svg = await QR.toString(sessaoRef.current.estado.url, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 0,
        color: { dark: '#0367A6', light: '#FFFFFF' }
      });
      setQr(svg);
    } catch (e) {
      setEstado({ fase: 'erro', online: navigator.onLine, erro: e?.message });
    }
  }

  function abrir() {
    setAberto(true);
    dialogoRef.current?.showModal();
    if (!ativa) iniciar();
  }

  function fechar() {
    dialogoRef.current?.close();
  }

  async function encerrar() {
    await sessaoRef.current?.encerrar();
    sessaoRef.current = null;
    setQr('');
  }

  // Fecha a sessão se a página for fechada ou recarregada.
  useEffect(() => {
    const sair = () => sessaoRef.current?.encerrar();
    window.addEventListener('pagehide', sair);
    return () => window.removeEventListener('pagehide', sair);
  }, []);

  // Conectado: a janela se fecha sozinha depois de um instante, para a apresentação seguir.
  useEffect(() => {
    if (estado?.fase !== 'conectado' || !aberto) return undefined;
    const t = setTimeout(fechar, 1400);
    return () => clearTimeout(t);
  }, [estado?.fase, aberto]);

  if (!remotoDisponivel()) return null;

  const fase = FASES[estado?.fase] || FASES.criando;
  const roteiro = estado?.pagina?.roteiro || null;
  const textoFase = estado?.fase === 'encerrado' && estado.motivo ? estado.motivo : fase.texto;

  return (
    <>
      <button type="button" className={`remoto__abrir ${className}`} onClick={abrir} aria-haspopup="dialog">
        <span className={`remoto__ponto remoto__ponto--${ativa ? fase.tom : 'inativo'}`} aria-hidden="true" />
        Controle remoto
      </button>

      <dialog ref={dialogoRef} className="remoto" aria-labelledby="remoto-titulo" onClose={() => setAberto(false)}>
        <div className="remoto__grade">
          <div className="remoto__texto">
            <p className="rotulo">Controle remoto</p>
            <h2 id="remoto-titulo" className="remoto__titulo">
              Conduza pelo celular.
            </h2>
            <p className="remoto__ajuda">
              Aponte a câmera do celular para o código ou abra a página de controle e digite o código curto. Celular e
              computador só precisam de internet.
            </p>
            <p className={`remoto__estado remoto__estado--${fase.tom}`} role="status" aria-live="polite">
              <span className={`remoto__ponto remoto__ponto--${fase.tom}`} aria-hidden="true" />
              {textoFase}
              {estado && !estado.online && estado.fase !== 'erro' && ' Sem internet neste computador.'}
            </p>
            {estado?.fase === 'aguardando' && <p className="remoto__prazo numeros">O código vale por mais {restante}.</p>}
            <div className="remoto__acoes">
              {ativa ? (
                <button type="button" className="botao botao--contorno" onClick={encerrar}>
                  Encerrar sessão
                </button>
              ) : (
                <button type="button" className="botao" onClick={iniciar}>
                  Gerar novo código
                </button>
              )}
              <button type="button" className="botao botao--contorno" onClick={fechar}>
                {estado?.fase === 'conectado' ? 'Voltar à apresentação' : 'Fechar'}
              </button>
            </div>
          </div>

          <div className="remoto__qr">
            {estado?.fase === 'aguardando' && qr ? (
              <>
                <div className="remoto__qr-imagem" role="img" aria-label="QR Code para abrir o controle no celular" data-url={estado.url} dangerouslySetInnerHTML={{ __html: qr }} />
                <p className="remoto__codigo">
                  <span>Código</span>
                  <strong className="numeros">{formatarCodigo(estado.codigo)}</strong>
                  <small>em {estado.url.replace(/^https?:\/\//, '').replace(/#.*$/, '')}</small>
                </p>
              </>
            ) : (
              <div className={`remoto__qr-vazio remoto__qr-vazio--${fase.tom}`} aria-hidden="true">
                {estado?.fase === 'conectado' ? 'Conectado' : estado?.fase === 'criando' ? '' : 'Sem código ativo'}
              </div>
            )}
          </div>
        </div>
      </dialog>

      {/* no corpo da página: a barra de navegação some durante a apresentação e não pode levar estes junto */}
      {ativa &&
        !aberto &&
        createPortal(
          roteiro ? (
            <Marcador roteiro={roteiro} pausado={Boolean(estado.pagina?.pausado)} tom={fase.tom} />
          ) : (
            <div className={`remoto__selo remoto__selo--${fase.tom}`} role="status">
              <span className={`remoto__ponto remoto__ponto--${fase.tom}`} aria-hidden="true" />
              <span>{fase.texto}</span>
              <button type="button" onClick={abrir}>
                Detalhes
              </button>
              <button type="button" onClick={encerrar}>
                Encerrar
              </button>
            </div>
          ),
          document.body
        )}
    </>
  );
}

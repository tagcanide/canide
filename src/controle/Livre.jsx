import { useEffect, useRef, useState } from 'react';
import { SEGURAR_MS } from '../remoto/conexao.js';

export const vibrar = (ms = 12) => navigator.vibrate?.(ms);

/** Botão que dá um passo no toque curto e rola continuamente enquanto pressionado. */
export function BotaoSegurar({ dir, rotulo, seta, enviar, desativado, compacto = false }) {
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
      className={`cr-botao ${compacto ? 'cr-botao--rolar' : 'cr-botao--grande'} ${ativo ? 'cr-botao--ativo' : ''}`}
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
      {!compacto && <span className="cr-botao__dica">Segure para rolar</span>}
    </button>
  );
}

/** Navegação livre: a página inteira, seção a seção, sem roteiro. */
export default function Livre({ pagina, enviar, eco, desativado, pausado, podePausar }) {
  const tocar = tipo => () => {
    vibrar();
    enviar(tipo);
  };
  return (
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
          disabled={!podePausar}
        >
          {pausado ? 'Retomar navegação' : 'Pausar navegação'}
        </button>
      </div>
    </>
  );
}

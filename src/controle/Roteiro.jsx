import { GRUPOS, MODULO } from '../data/modulos.js';
import { BotaoSegurar, vibrar } from './Livre.jsx';
import { MarcaGrupo } from './Selecao.jsx';

/** Apresentação em andamento: módulo atual, vizinhos, progresso e controles da sequência. */
export default function Roteiro({ roteiro, pausado, enviar, eco, conectado }) {
  const ids = roteiro.ids.split(',').filter(id => MODULO[id]);
  const total = ids.length;
  const i = Math.max(0, Math.min(total - 1, roteiro.atual));
  const atual = MODULO[ids[i]];
  const anterior = i > 0 ? MODULO[ids[i - 1]] : null;
  const proximo = i < total - 1 ? MODULO[ids[i + 1]] : null;
  const travado = !conectado || pausado;
  const tocar = (tipo, arg) => () => {
    vibrar();
    enviar(tipo, arg);
  };

  if (!atual) return null;

  return (
    <section className="cr-roteiro" aria-label="Apresentação em andamento">
      <div className="cr-progresso">
        <p className="cr-progresso__texto numeros" aria-live="polite">
          Módulo <strong>{String(i + 1).padStart(2, '0')}</strong> de {String(total).padStart(2, '0')}
          {pausado && <span className="cr-progresso__pausa">Pausada</span>}
        </p>
        <ol className="cr-progresso__trilho" aria-hidden="true">
          {ids.map((id, n) => (
            <li key={id} className={n < i ? 'feito' : n === i ? 'atual' : ''} />
          ))}
        </ol>
      </div>

      <div className="cr-atual" aria-live="polite">
        <MarcaGrupo grupo={atual.grupo} />
        <div>
          <p className="cr-atual__grupo">{GRUPOS[atual.grupo].nome} · no telão agora</p>
          <p className="cr-atual__nome">{atual.nome}</p>
          <p className="cr-atual__desc">{atual.descricao}</p>
        </div>
      </div>

      <div className="cr-vizinhos">
        <button type="button" className={`cr-vizinho ${eco === 'modulo-anterior' ? 'cr-botao--eco' : ''}`} onClick={tocar('modulo-anterior')} disabled={!anterior || travado}>
          <span className="cr-vizinho__rotulo">‹ Módulo anterior</span>
          <span className="cr-vizinho__nome">{anterior ? anterior.nome : 'Início da sequência'}</span>
        </button>
        <button type="button" className={`cr-vizinho cr-vizinho--proximo ${eco === 'modulo-proximo' ? 'cr-botao--eco' : ''}`} onClick={tocar('modulo-proximo')} disabled={!proximo || travado}>
          <span className="cr-vizinho__rotulo">Próximo módulo ›</span>
          <span className="cr-vizinho__nome">{proximo ? proximo.nome : 'Fim da sequência'}</span>
        </button>
      </div>

      <div className="cr-grade">
        <button type="button" className="cr-botao cr-botao--fino" onClick={tocar('modulo-inicio')} disabled={i === 0 || travado}>
          Ir para o início
        </button>
        <button type="button" className="cr-botao cr-botao--fino" onClick={tocar('modulo-fim')} disabled={i === total - 1 || travado}>
          Ir para o final
        </button>
        <BotaoSegurar dir="subir" rotulo="Rolar acima" seta="↑" enviar={enviar} desativado={travado} compacto />
        <BotaoSegurar dir="descer" rotulo="Rolar abaixo" seta="↓" enviar={enviar} desativado={travado} compacto />
        <button
          type="button"
          className={`cr-botao cr-botao--largo ${pausado ? 'cr-botao--pausado' : ''}`}
          aria-pressed={pausado}
          onClick={tocar(pausado ? 'retomar' : 'pausar')}
          disabled={!conectado}
        >
          {pausado ? 'Retomar apresentação' : 'Pausar apresentação'}
        </button>
      </div>

      <details className="cr-sumario">
        <summary>Ver a sequência e pular para um módulo</summary>
        <ol className="cr-ordem cr-ordem--pular">
          {ids.map((id, n) => (
            <li key={id}>
              <button type="button" className={`cr-pular ${n === i ? 'cr-pular--atual' : ''}`} onClick={tocar('modulo-ir', n)} disabled={travado || n === i} aria-current={n === i ? 'step' : undefined}>
                <span className="cr-ordem__num numeros">{String(n + 1).padStart(2, '0')}</span>
                <span className="cr-ordem__nome">{MODULO[id].nome}</span>
              </button>
            </li>
          ))}
        </ol>
      </details>

      <button type="button" className="cr-voltar" onClick={tocar('roteiro-sair')} disabled={!conectado}>
        Voltar à seleção de módulos
      </button>
    </section>
  );
}

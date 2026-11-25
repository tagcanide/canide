import { useState } from 'react';
import { GRUPOS, MODULO, MODULOS } from '../data/modulos.js';
import { MAX_FAVORITOS } from './armazenamento.js';
import { vibrar } from './Livre.jsx';

/** Identificação visual de cada grupo: página (capítulo), placa de circuito e gráfico (painel). */
export function MarcaGrupo({ grupo, numero }) {
  return (
    <span className={`cr-marca cr-marca--${grupo} ${numero ? 'cr-marca--numero' : ''}`} aria-hidden="true">
      {numero ? (
        <span className="numeros">{String(numero).padStart(2, '0')}</span>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {grupo === 'capitulo' && <path d="M6 4h9l3 3v13H6zM9 10h6M9 13.5h6M9 17h4" />}
          {grupo === 'placa' && <path d="M5 5h14v14H5zM9 9h6v6H9zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />}
          {grupo === 'painel' && <path d="M4 4v16h16M7 15l4-5 3 3 5-6" />}
        </svg>
      )}
    </span>
  );
}

const ORDEM_GRUPOS = ['capitulo', 'placa', 'painel'];

/** Lista de módulos com caixas de seleção. A posição na sequência aparece no lugar do ícone. */
export function Selecao({ selecao, alternar, todos, nenhum, limpar, salvar, salva }) {
  const total = MODULOS.length;
  return (
    <section className="cr-bloco" aria-labelledby="cr-modulos-titulo">
      <div className="cr-bloco__cabeca">
        <h2 id="cr-modulos-titulo" className="cr-bloco__titulo">
          Módulos da apresentação
        </h2>
        <p className="cr-bloco__conta numeros" aria-live="polite">
          {selecao.length} de {total}
        </p>
      </div>

      <div className="cr-ferramentas" role="group" aria-label="Ações da seleção">
        <button type="button" className="cr-chip" onClick={todos} disabled={selecao.length === total}>
          Selecionar todos
        </button>
        <button type="button" className="cr-chip" onClick={nenhum} disabled={!selecao.length}>
          Desmarcar todos
        </button>
        <button type="button" className="cr-chip" onClick={limpar} disabled={!selecao.length && !salva}>
          Limpar seleção
        </button>
        <button type="button" className="cr-chip cr-chip--forte" onClick={salvar} disabled={!selecao.length || salva === 'igual'}>
          {salva === 'igual' ? 'Seleção salva' : 'Salvar seleção atual'}
        </button>
      </div>
      <p className="cr-nota">
        {salva === 'igual'
          ? 'Salva nesta sessão. Some quando a sessão terminar.'
          : salva
            ? 'Há mudanças desde a última vez que você salvou.'
            : 'A seleção fica salva só durante esta sessão.'}
      </p>

      {ORDEM_GRUPOS.map(g => (
        <fieldset key={g} className="cr-grupo">
          <legend className="cr-grupo__nome">
            {GRUPOS[g].nome} <span>{GRUPOS[g].texto}</span>
          </legend>
          <ul className="cr-lista">
            {MODULOS.filter(m => m.grupo === g).map(m => {
              const pos = selecao.indexOf(m.id) + 1;
              return (
                <li key={m.id}>
                  <label className={`cr-item ${pos ? 'cr-item--marcado' : ''}`}>
                    <input type="checkbox" className="cr-item__caixa" checked={Boolean(pos)} onChange={() => alternar(m.id)} />
                    <MarcaGrupo grupo={m.grupo} numero={pos} />
                    <span className="cr-item__texto">
                      <span className="cr-item__nome">{m.nome}</span>
                      <span className="cr-item__desc">{m.descricao}</span>
                    </span>
                    <span className="cr-item__check" aria-hidden="true" />
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
    </section>
  );
}

/** Ordem da apresentação: subir, descer ou tirar cada módulo. */
export function Sequencia({ selecao, mover, remover, movido }) {
  return (
    <section className="cr-bloco" aria-labelledby="cr-ordem-titulo">
      <div className="cr-bloco__cabeca">
        <h2 id="cr-ordem-titulo" className="cr-bloco__titulo">
          Sequência
        </h2>
        <p className="cr-bloco__conta numeros">{selecao.length ? `${selecao.length} módulos` : ''}</p>
      </div>
      {selecao.length === 0 ? (
        <p className="cr-vazio">Marque os módulos acima. Eles entram aqui na ordem em que forem escolhidos.</p>
      ) : (
        <ol className="cr-ordem">
          {selecao.map((id, i) => {
            const m = MODULO[id];
            return (
              <li key={id} className={`cr-ordem__item ${movido === id ? 'cr-ordem__item--movido' : ''}`}>
                <span className="cr-ordem__num numeros">{String(i + 1).padStart(2, '0')}</span>
                <span className="cr-ordem__nome">
                  {m.nome}
                  <small>{GRUPOS[m.grupo].nome}</small>
                </span>
                <span className="cr-ordem__acoes">
                  <button type="button" className="cr-icone" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${m.nome}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button type="button" className="cr-icone" onClick={() => mover(i, 1)} disabled={i === selecao.length - 1} aria-label={`Descer ${m.nome}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button type="button" className="cr-icone cr-icone--tirar" onClick={() => remover(id)} aria-label={`Tirar ${m.nome} da sequência`}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** Sequências favoritas, guardadas neste celular e separadas da seleção da sessão. */
export function Favoritos({ favoritos, selecao, guardar, carregar, excluir }) {
  const [nome, setNome] = useState('');
  const cheio = favoritos.length >= MAX_FAVORITOS;
  return (
    <section className="cr-bloco" aria-labelledby="cr-fav-titulo">
      <div className="cr-bloco__cabeca">
        <h2 id="cr-fav-titulo" className="cr-bloco__titulo">
          Sequências favoritas
        </h2>
        <p className="cr-bloco__conta numeros">
          {favoritos.length}/{MAX_FAVORITOS}
        </p>
      </div>
      <p className="cr-nota">Ficam neste celular para as próximas apresentações. Não mudam a seleção desta sessão até você carregar uma.</p>

      {favoritos.length > 0 && (
        <ul className="cr-favs">
          {favoritos.map((f, i) => (
            <li key={`${f.nome}-${i}`} className="cr-fav">
              <span className="cr-fav__texto">
                <span className="cr-fav__nome">{f.nome}</span>
                <span className="cr-fav__lista">{f.ids.map(id => MODULO[id].nome).join(' · ')}</span>
              </span>
              <button type="button" className="cr-chip cr-chip--forte" onClick={() => carregar(f)}>
                Carregar
              </button>
              <button type="button" className="cr-icone cr-icone--tirar" onClick={() => excluir(i)} aria-label={`Excluir a sequência ${f.nome}`}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="cr-fav-form"
        onSubmit={e => {
          e.preventDefault();
          if (!nome.trim() || !selecao.length || cheio) return;
          vibrar();
          guardar(nome.trim());
          setNome('');
        }}
      >
        <label htmlFor="cr-fav-nome" className="sr-only">
          Nome da sequência
        </label>
        <input
          id="cr-fav-nome"
          type="text"
          maxLength={40}
          placeholder={cheio ? 'Limite atingido: exclua uma' : 'Nome, ex.: Reunião com parceiros'}
          value={nome}
          onChange={e => setNome(e.target.value)}
          disabled={cheio}
          enterKeyHint="done"
        />
        <button type="submit" className="cr-chip cr-chip--forte" disabled={!nome.trim() || !selecao.length || cheio}>
          Guardar
        </button>
      </form>
    </section>
  );
}

// Armazenamento do celular, em dois níveis que não se misturam:
// - seleção da sessão: sessionStorage, presa ao identificador da sessão; some ao encerrar ou fechar a aba;
// - sequências favoritas: localStorage, ficam neste celular para as próximas apresentações.
// Tudo passa por roteiroValido: módulos que deixaram de existir no site são descartados ao ler.
import { roteiroValido } from '../data/modulos.js';

const SELECAO = 'canide-remoto-selecao';
const FAVORITOS = 'canide-remoto-favoritos';
export const MAX_FAVORITOS = 8;

function ler(area, chave) {
  try {
    return JSON.parse(area.getItem(chave) || 'null');
  } catch {
    return null;
  }
}
function gravar(area, chave, valor) {
  try {
    if (valor == null) area.removeItem(chave);
    else area.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false; // navegação privada ou armazenamento bloqueado: segue só na memória
  }
}

/** Seleção salva desta sessão (ou null). */
export function lerSelecao(sid) {
  const v = ler(sessionStorage, SELECAO);
  return v && v.sid === sid ? roteiroValido(v.ids) : null;
}
export const salvarSelecao = (sid, ids) => gravar(sessionStorage, SELECAO, { sid, ids });
export const limparSelecao = () => gravar(sessionStorage, SELECAO, null);

/** Sequências favoritas: [{ nome, ids }], já sem módulos inexistentes. */
export function lerFavoritos() {
  const v = ler(localStorage, FAVORITOS);
  if (!Array.isArray(v)) return [];
  return v
    .filter(f => f && typeof f.nome === 'string')
    .map(f => ({ nome: f.nome.slice(0, 40), ids: roteiroValido(f.ids) }))
    .filter(f => f.ids.length)
    .slice(0, MAX_FAVORITOS);
}
export const gravarFavoritos = lista => gravar(localStorage, FAVORITOS, lista.slice(0, MAX_FAVORITOS));

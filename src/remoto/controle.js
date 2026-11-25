// Lado do celular: pareia com uma sessão (link do QR Code ou código curto) e envia comandos.
import { conectar, limparCodigo } from './conexao.js';

export class ErroPareamento extends Error {}

/**
 * Pareia com a apresentação e devolve { sid, enviar, desconectar }.
 * aoEstado recebe { fase: 'conectado' | 'reconectando' | 'computador-ausente' | 'encerrado', online, estado }.
 */
export async function parear({ sid, codigo, aoEstado }) {
  const { db, uid, rtdb } = await conectar();
  const { ref, get, set, remove, onValue, onDisconnect } = rtdb;

  // Relógio do servidor: comandos carregam a hora do servidor, não a do celular.
  let desvio = 0;
  const desligarDesvio = onValue(ref(db, '.info/serverTimeOffset'), s => (desvio = s.val() || 0));
  const agoraServidor = () => Date.now() + desvio;

  if (!sid) {
    const cod = limparCodigo(codigo || '');
    if (cod.length !== 8) throw new ErroPareamento('O código tem 8 caracteres.');
    let snap;
    try {
      snap = await get(ref(db, `codigos/${cod}`));
    } catch {
      snap = null;
    }
    if (!snap?.exists()) throw new ErroPareamento('Código não encontrado ou expirado. Gere um novo no computador.');
    sid = snap.val().sid;
  }

  const base = `sessoes/${sid}`;
  try {
    await set(ref(db, `${base}/controle`), uid);
  } catch {
    throw new ErroPareamento('Não foi possível parear: o link expirou ou outro celular já controla esta apresentação.');
  }

  let ultimoSeq = 0;
  try {
    const c = await get(ref(db, `${base}/comando/seq`));
    ultimoSeq = c.val() || 0;
  } catch {
    /* sem comando anterior */
  }

  let estado = { fase: 'conectado', online: true, estado: null };
  const emitir = m => {
    estado = { ...estado, ...m };
    aoEstado(estado);
  };

  const presenca = ref(db, `${base}/presenca/controle`);
  const marcarPresenca = async () => {
    await onDisconnect(presenca).remove();
    await set(presenca, true);
  };
  await marcarPresenca();

  const desligar = [desligarDesvio];
  let encerrada = false;

  desligar.push(
    onValue(ref(db, '.info/connected'), s => {
      const online = s.val() === true;
      if (encerrada) return;
      emitir({ online, fase: online ? (estado.fase === 'reconectando' ? 'conectado' : estado.fase) : 'reconectando' });
      if (online) marcarPresenca().catch(() => {});
    })
  );

  // Toda a sessão: estado da página no computador e presença dele. Se sumir, a sessão acabou.
  desligar.push(
    onValue(
      ref(db, base),
      s => {
        const v = s.val();
        if (!v || v.controle !== uid) return finalizar('A apresentação foi encerrada no computador.');
        emitir({
          estado: v.estado || null,
          fase: estado.online ? (v.presenca?.host ? 'conectado' : 'computador-ausente') : 'reconectando'
        });
      },
      () => finalizar('A sessão expirou ou foi encerrada.')
    )
  );

  function finalizar(motivo) {
    if (encerrada) return;
    encerrada = true;
    desligar.forEach(f => f());
    onDisconnect(presenca).cancel().catch(() => {});
    emitir({ fase: 'encerrado', motivo });
  }

  return {
    /** Identificador da sessão (para guardar a seleção de módulos só enquanto ela durar). */
    sid,
    /**
     * Envia um comando. Sem conexão, não enfileira: o comando seria executado fora de hora.
     * arg (opcional): ids do roteiro separados por vírgula ou o índice do módulo.
     */
    enviar(tipo, arg) {
      if (encerrada || !estado.online) return false;
      ultimoSeq = Math.max(ultimoSeq + 1, agoraServidor());
      const comando = { tipo, seq: ultimoSeq, t: agoraServidor() };
      if (arg != null) comando.arg = String(arg);
      set(ref(db, `${base}/comando`), comando).catch(() => {});
      return true;
    },
    async desconectar() {
      if (encerrada) return;
      await Promise.allSettled([remove(presenca), remove(ref(db, `${base}/controle`))]);
      finalizar('Você desconectou o controle.');
    }
  };
}

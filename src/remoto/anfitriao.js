// Lado do computador: cria a sessão, espera o pareamento, executa os comandos e limpa tudo no fim.
import {
  COMANDO_VELHO_MS,
  PAREAMENTO_MS,
  SESSAO_MS,
  conectar,
  gerarCodigo,
  gerarSessaoId,
  urlDoControle
} from './conexao.js';
import { criarNavegador } from './navegador.js';

/**
 * estados emitidos em aoEstado:
 *  { fase: 'criando' | 'aguardando' | 'conectado' | 'controle-ausente' | 'expirado' | 'encerrado' | 'erro',
 *    online, codigo, url, pareamentoAte, expira, erro, pagina }
 * pagina: { secao, total, nome, pausado, roteiro: { ids, atual } | null }, o mesmo estado enviado ao celular.
 */
export async function iniciarApresentacao({ aoEstado }) {
  const { db, uid, rtdb } = await conectar();
  const { ref, set, update, remove, onValue, onDisconnect } = rtdb;

  const sid = gerarSessaoId();
  const codigo = gerarCodigo();
  const agora = Date.now();
  const expira = agora + SESSAO_MS;
  const pareamentoAte = agora + PAREAMENTO_MS;
  const sessaoRef = ref(db, `sessoes/${sid}`);
  const codigoRef = ref(db, `codigos/${codigo}`);

  let estado = { fase: 'criando', online: true, codigo, url: urlDoControle(sid), pareamentoAte, expira };
  const emitir = mudanca => {
    estado = { ...estado, ...mudanca };
    aoEstado(estado);
  };

  await set(sessaoRef, { host: uid, criada: agora, expira, pareamentoAte, presenca: { host: true } });
  await set(codigoRef, { sid, host: uid, expira: pareamentoAte });
  // Se a aba fechar ou a conexão cair de vez, o servidor apaga a sessão e o código.
  // (registrado depois de criar: o servidor confere a permissão já no registro)
  await onDisconnect(sessaoRef).remove();
  await onDisconnect(codigoRef).remove();
  emitir({ fase: 'aguardando' });

  const navegador = criarNavegador({
    aoMudar: e => {
      emitir({ pagina: e }); // o computador também mostra o roteiro (marcador da apresentação)
      if (controleUid) update(ref(db, `sessoes/${sid}/estado`), e).catch(() => {});
    }
  });

  let controleUid = null;
  let ultimoSeq = 0;
  let desvio = 0; // diferença entre o relógio local e o do servidor
  const desligar = [onValue(ref(db, '.info/serverTimeOffset'), s => (desvio = s.val() || 0))];

  // Controle pareado: o código curto é descartado e ninguém mais pode assumir a sessão.
  desligar.push(
    onValue(ref(db, `sessoes/${sid}/controle`), snap => {
      const novo = snap.val();
      if (novo && novo !== controleUid) {
        controleUid = novo;
        remove(codigoRef).catch(() => {});
        onDisconnect(codigoRef).cancel().catch(() => {});
        emitir({ fase: 'conectado' });
        navegador.informar();
      } else if (!novo && controleUid) {
        controleUid = null;
        emitir({ fase: 'encerrado', motivo: 'O celular desconectou.' });
        encerrar();
      }
    })
  );

  // Presença do celular: mostra quando a conexão dele cai e volta.
  desligar.push(
    onValue(ref(db, `sessoes/${sid}/presenca/controle`), snap => {
      if (!controleUid) return;
      emitir({ fase: snap.val() ? 'conectado' : 'controle-ausente' });
    })
  );

  // Comandos: só os novos (seq crescente) e recentes são executados; repetidos são ignorados.
  desligar.push(
    onValue(ref(db, `sessoes/${sid}/comando`), snap => {
      const c = snap.val();
      if (!c || c.seq <= ultimoSeq) return;
      ultimoSeq = c.seq;
      if (Date.now() + desvio - c.t > COMANDO_VELHO_MS) return;
      navegador.executar(c.tipo, c.arg);
    })
  );

  // Conexão do próprio computador com o serviço.
  desligar.push(
    onValue(ref(db, '.info/connected'), snap => {
      const online = snap.val() === true;
      emitir({ online });
      if (online && estado.fase !== 'encerrado') {
        // ao reconectar, a presença e a limpeza automática são registradas de novo
        onDisconnect(sessaoRef).remove().catch(() => {});
        set(ref(db, `sessoes/${sid}/presenca/host`), true).catch(() => {});
      }
    })
  );

  // Prazos: o pareamento expira em 10 minutos e a sessão inteira em 2 horas.
  const prazoPareamento = setTimeout(() => {
    if (!controleUid) {
      emitir({ fase: 'expirado' });
      encerrar();
    }
  }, PAREAMENTO_MS);
  const prazoSessao = setTimeout(() => {
    emitir({ fase: 'encerrado', motivo: 'A sessão chegou ao limite de 2 horas.' });
    encerrar();
  }, SESSAO_MS);

  let encerrada = false;
  async function encerrar() {
    if (encerrada) return;
    encerrada = true;
    clearTimeout(prazoPareamento);
    clearTimeout(prazoSessao);
    desligar.forEach(f => f());
    navegador.destruir();
    await Promise.allSettled([remove(codigoRef), remove(sessaoRef)]);
    await Promise.allSettled([onDisconnect(sessaoRef).cancel(), onDisconnect(codigoRef).cancel()]);
  }

  return {
    get estado() {
      return estado;
    },
    async encerrar() {
      await encerrar();
      if (estado.fase !== 'expirado') emitir({ fase: 'encerrado', motivo: estado.motivo || 'Sessão encerrada.' });
    }
  };
}

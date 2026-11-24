// Testa as regras de segurança do controle remoto contra o Firebase Emulator.
// Uso: npx firebase-tools emulators:start --project demo-canide-remoto --only auth,database
//      node teste/regras-remoto.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, set, get, remove } from 'firebase/database';

const cfg = { apiKey: 'demo', projectId: 'demo-canide-remoto', databaseURL: 'http://127.0.0.1:9000?ns=demo-canide-remoto-default-rtdb' };
async function cliente(nome, anonimo = true) {
  const app = initializeApp(cfg, nome);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  const uid = anonimo ? (await signInAnonymously(auth)).user.uid : null;
  return { db, uid };
}
let falhas = 0;
async function espera(rotulo, promessa, deveFuncionar) {
  let ok = true;
  try { await promessa; } catch { ok = false; }
  const certo = ok === deveFuncionar;
  if (!certo) falhas++;
  console.log(`${certo ? 'OK  ' : 'FALHA'} ${rotulo} (${ok ? 'permitido' : 'negado'})`);
}

const host = await cliente('host');
const cel = await cliente('cel');
const intruso = await cliente('intruso');
const semLogin = await cliente('semlogin', false);
const sid = 'TESTE' + Math.random().toString(36).slice(2).padEnd(24, 'x');
const agora = Date.now();
const sessao = { host: host.uid, criada: agora, expira: agora + 2 * 3600e3, pareamentoAte: agora + 600e3 };

await espera('host cria sessão de 2 h', set(ref(host.db, `sessoes/${sid}`), sessao), true);
await espera('host não cria sessão de 5 h', set(ref(host.db, `sessoes/${sid}x`), { ...sessao, expira: agora + 5 * 3600e3 }), false);
await espera('intruso não cria sessão em nome do host', set(ref(intruso.db, `sessoes/${sid}y`), sessao), false);
await espera('host cria código de 8', set(ref(host.db, 'codigos/ABCD2345'), { sid, host: host.uid, expira: agora + 600e3 }), true);
await espera('sem login não lê o código', get(ref(semLogin.db, 'codigos/ABCD2345')), false);
await espera('ninguém lista todas as sessões', get(ref(intruso.db, 'sessoes')), false);
await espera('ninguém lista todos os códigos', get(ref(intruso.db, 'codigos')), false);
await espera('intruso não envia comando antes do pareamento', set(ref(intruso.db, `sessoes/${sid}/comando`), { tipo: 'descer', seq: 1, t: Date.now() }), false);
await espera('celular pareia (assume o controle)', set(ref(cel.db, `sessoes/${sid}/controle`), cel.uid), true);
await espera('intruso não assume controle já pareado', set(ref(intruso.db, `sessoes/${sid}/controle`), intruso.uid), false);
await espera('intruso não envia comando', set(ref(intruso.db, `sessoes/${sid}/comando`), { tipo: 'descer', seq: Date.now(), t: Date.now() }), false);
await espera('intruso não apaga a sessão', remove(ref(intruso.db, `sessoes/${sid}`)), false);
await espera('celular envia comando válido', set(ref(cel.db, `sessoes/${sid}/comando`), { tipo: 'descer', seq: 100, t: Date.now() }), true);
await espera('celular não repete seq (reenvio)', set(ref(cel.db, `sessoes/${sid}/comando`), { tipo: 'descer', seq: 100, t: Date.now() }), false);
await espera('celular não envia tipo desconhecido', set(ref(cel.db, `sessoes/${sid}/comando`), { tipo: 'executar', seq: 200, t: Date.now() }), false);
await espera('celular não escreve campo extra', set(ref(cel.db, `sessoes/${sid}/comando`), { tipo: 'descer', seq: 300, t: Date.now(), x: 1 }), false);
await espera('celular não altera o host', set(ref(cel.db, `sessoes/${sid}/host`), cel.uid), false);
await espera('celular não estende a sessão', set(ref(cel.db, `sessoes/${sid}/expira`), agora + 7000e3), false);
await espera('celular desconecta (libera o controle)', remove(ref(cel.db, `sessoes/${sid}/controle`)), true);
await espera('host encerra a sessão', remove(ref(host.db, `sessoes/${sid}`)), true);
await espera('host apaga o código', remove(ref(host.db, 'codigos/ABCD2345')), true);

// sessão com pareamento vencido não aceita novo controle
const sid2 = sid + 'v';
await set(ref(host.db, `sessoes/${sid2}`), { ...sessao, pareamentoAte: Date.now() - 1000 });
await espera('pareamento vencido recusa celular', set(ref(cel.db, `sessoes/${sid2}/controle`), cel.uid), false);
await remove(ref(host.db, `sessoes/${sid2}`));

console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTodas as verificações passaram.');
process.exit(falhas ? 1 : 0);

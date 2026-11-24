// Conexão do controle remoto: Firebase Realtime Database com login anônimo, carregada só quando usada.
// A configuração vem de variáveis VITE_FIREBASE_* (veja README, seção "Controle remoto").
// A config web do Firebase identifica o projeto, não dá privilégio: quem protege as sessões são as
// regras em database.rules.json. Nenhuma credencial administrativa entra no frontend.

const CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const EMULADOR = import.meta.env.VITE_FIREBASE_EMULADOR === '1';

export const remotoDisponivel = () => Boolean(CONFIG.apiKey && CONFIG.databaseURL && CONFIG.projectId);

let pronta = null;

/** Inicializa o Firebase (uma vez), entra como anônimo e devolve { db, uid, rtdb }. */
export function conectar() {
  if (pronta) return pronta;
  pronta = (async () => {
    const [{ initializeApp }, authMod, rtdb] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/database')
    ]);
    const app = initializeApp(CONFIG, 'canide-remoto');
    const auth = authMod.getAuth(app);
    const db = rtdb.getDatabase(app);
    if (EMULADOR) {
      authMod.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      rtdb.connectDatabaseEmulator(db, '127.0.0.1', 9000);
    }
    const { user } = await authMod.signInAnonymously(auth);
    return { db, uid: user.uid, rtdb };
  })();
  pronta.catch(() => {
    pronta = null; // permite tentar de novo depois de uma falha de rede
  });
  return pronta;
}

/* ---------- protocolo ---------- */
export const SESSAO_MS = 2 * 60 * 60 * 1000; // a sessão dura no máximo 2 horas
export const PAREAMENTO_MS = 10 * 60 * 1000; // o QR Code e o código valem 10 minutos
export const SEGURAR_MS = 320; // intervalo do sinal de "botão pressionado"
export const SEGURAR_LIMITE_MS = 900; // sem sinal por esse tempo, o computador para de rolar
export const COMANDO_VELHO_MS = 8000; // comandos atrasados mais que isso são ignorados

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O e 1/I

/** Identificador de sessão: 144 bits aleatórios em base64url (24 caracteres). */
export function gerarSessaoId() {
  const b = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Código curto de 8 caracteres (cerca de 40 bits), válido por 10 minutos e descartado no pareamento. */
export function gerarCodigo() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b, x => ALFABETO_CODIGO[x % 32]).join('');
}

export const formatarCodigo = c => `${c.slice(0, 4)}-${c.slice(4)}`;
export const limparCodigo = c => c.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

/** Endereço da página de controle com a sessão no fragmento (o fragmento não vai para servidores). */
export function urlDoControle(sid) {
  const base = new URL(import.meta.env.BASE_URL, window.location.href);
  return `${new URL('controle.html', base).href}#s=${sid}`;
}

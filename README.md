# Site CANIDÉ

Site institucional do CANIDÉ: tag de localização GPS e central de telemetria local para acompanhar animais
reintroduzidos na natureza. Página única, estática, pronta para o GitHub Pages. Direção clara e editorial: a abertura
desenha a silhueta azul da arara-canindé; as placas eletrônicas do projeto se desmontam em 3D com a rolagem.

## Executar localmente

Requer Node.js 22 ou superior.

```bash
npm install
npm run dev       # desenvolvimento em http://localhost:5173
np## Estrutura

```
index.html                    metadados, Open Graph, favicon
vite.config.js                base relativa, divisão de código (three, anime), robots.txt e sitemap.xml
src/config.js                 links e contatos centralizados (repositório, sistema, e-mail, redes)
src/data/modulos.js           fonte única dos módulos (capítulos, telas do painel, placas): site e controle remoto
src/styles/tokens.css         design system claro: cores do manual, tipografia, espaços, camadas, movimento
src/styles/base.css           reset, grade, rótulos de seção, botões, foco, movimento reduzido
src/lib/movimento.js          Anime.js: entradas de seção, revelação de títulos por linha, scroll
src/bancada/kit.js            primitivos 3D com a mesma assinatura dos desenhos *-exploded.html
src/bancada/placas/           porte 3D de cada placa + info.js (nomes, rótulos, medidas, sem Three.js)
src/bancada/cena.js           cena Three.js: monta, separa as peças, foco, câmera, rótulos na tela
src/bancada/useBancada.js     hook React: carrega a cena sob demanda, pausa fora da tela, libera WebGL
src/lib/arara.js              silhueta da arara (corpo vetorizado do kit, cabeça desenhada à mão)
src/components/Arara.jsx      silhueta em camadas animáveis (traço, máscara, cortes da face, olho)
src/sections/                 JSX + CSS por seção (Hero, Identidade, Propósito, A pesquisa, Produto,
                              Desmontagem, Funcionalidades, Sessão, Integração, Nossa inspiração,
                              A matemática que nos localiza, Da matemática à telemetria, Diferenciais,
                              Referências, Conhecer, Rodapé com o vídeo da logo)
src/lib/gnss.js               matemática do GPS sem DOM: WGS 84, ECEF, Haversine, Vincenty, rumo,
                              mínimos quadrados e DOP (cenário demonstrativo, nunca dados reais)
src/gps/                      laboratório 3D do GPS (cenaGps.js, Three.js sob demanda), DemoGps.jsx e
                              as peças interativas da seção de matemática
src/data/session.json         sessão real do receptor, sem latitude, longitude ou altitude GPS
public/desmontagem/           vistas explodidas em SVG, usadas sem WebGL (geradas dos originais)
public/brand, fonts, media    kit da marca, fontes e capturas do painel
*-exploded.html               desenhos técnicos originais das placas (fonte da geometria, não alterar)
scripts/gerar-alternativas.mjs  regera public/desmontagem/ a partir dos *-exploded.html
teste/bancada.html            página local para inspecionar cada placa (fora do build):
                              /teste/bancada.html?placa=esp|bz|node|rf|neo|bme&p=0..1&az=&el=
backup/site-claro-2026-11-23/ primeira versão clara
backup/site-escuro-2026-11-23/ versão escura
```

## Animação

Um só motor: Anime.js. A desmontagem é uma timeline ligada à rolagem (`onScroll` com `sync`) que move um
objeto de valores (progresso das peças e câmera); a cena 3D só desenha esses valores. Cada peça usa o
deslocamento, o atraso e a curva definidos no desenho técnico original. Com `prefers-reduced-motion`, a
arara aparece pronta, o vídeo da logo vira imagem estática, as entradas ficam estáticas e a desmontagem vira um seletor Montada/Desmontada.

ts/prepare-assets.py  regera public/media e src/data/session.json a partir das fontes
```

## Publicar no GitHub Pages

1. Crie um repositório e envie este projeto para a branch `main`.
2. Em **Settings > Pages**, escolha **Source: GitHub Actions**.
3. O endereço público fica em `VITE_SITE_URL`, no arquivo `.env.production`.
4. Cada push na `main` executa `.github/workflows/deploy.yml` e publica `dist/`.

Os caminhos são relativos (`base: './'`), então o mesmo build funciona em `/<repositorio>/` e na raiz de um
domínio próprio. Para usar domínio próprio, configure-o em **Settings > Pages > Custom domain**, crie
`public/CNAME` com o domínio e atualize `VITE_SITE_URL` em `.env.production`.

## Atualizar conteúdo

- Links, e-mail e redes sociais: `src/config.js`. Itens `null` ou vazios não aparecem no site.
- Textos: no JSX de cada seção em `src/sections/`.
- Nomes e descrições das peças: `src/bancada/placas/info.js`.
- Capturas e dados da sessão: `py -3 scripts/prepare-assets.py <pasta-das-capturas> <csv-da-sessao-rx>`.

## Controle remoto

Permite conduzir a apresentação pelo celular: o computador mostra um QR Code e um código curto, o celular abre
`controle.html` e passa a rolar a página, ir para a próxima seção ou para a anterior, ir ao início ou ao fim e pausar.
A rolagem remota anda quadro a quadro (nunca salta), então as animações ligadas ao scroll e a cena 3D acompanham.

### Módulos da apresentação

No celular, a área **Módulos da apresentação** lista tudo o que `src/data/modulos.js` define: capítulos da página,
as cinco telas do painel e as cinco placas (lidas de `src/bancada/placas/info.js`). Escolha os módulos, ajuste a ordem
com subir e descer e toque em **Iniciar apresentação**. O computador passa a andar só pelos módulos escolhidos, na
ordem escolhida; nas placas, a página monta a placa atual, troca e desmonta a nova pela mesma rolagem do palco.
A navegação pública não muda: os módulos fora da seleção continuam no site.

- **Seleção da sessão:** fica no `sessionStorage` do celular, presa à sessão, e é apagada ao encerrar.
- **Sequências favoritas:** ficam no `localStorage` do celular (até 8), separadas da seleção da sessão.
- Comandos novos no mesmo canal: `roteiro`, `roteiro-sair`, `modulo-proximo`, `modulo-anterior`, `modulo-inicio`,
  `modulo-fim`, `modulo-ir`. O argumento (`arg`) só aceita `a-z`, `0-9`, vírgula e hífen, até 600 caracteres.

**Comunicação:** Firebase Realtime Database com login anônimo. Funciona com celular e computador em redes
diferentes, só com internet. Não há servidor próprio.

**Segurança (database.rules.json):**
- sessão com identificador de 144 bits, no fragmento do QR Code (`#s=`), que não chega a servidores;
- código curto de 8 caracteres válido por 10 minutos e apagado no pareamento;
- só o primeiro celular que parear controla a sessão; ninguém lista sessões ou códigos;
- comandos aceitos só do celular pareado, de uma lista fixa, com número de sequência crescente (sem repetição);
- a sessão dura no máximo 2 horas, é apagada ao encerrar e também quando o computador desconecta.

Sessões abandonadas que o servidor não conseguir apagar ficam ilegíveis depois do prazo (as regras recusam a leitura).

### Configurar (uma vez)

1. Crie um projeto novo no [console do Firebase](https://console.firebase.google.com/), só para o controle remoto.
   Não use o projeto do sistema CANIDÉ.
2. **Authentication > Sign-in method:** ative **Anonymous**.
3. **Realtime Database:** crie o banco e publique as regras de `database.rules.json` (cole na aba Regras ou rode
   `npx firebase-tools deploy --only database --project <id-do-projeto>`).
4. **Configurações do projeto > Seus apps:** crie um app Web e copie `apiKey`, `authDomain`, `databaseURL`,
   `projectId` e `appId`.
5. Coloque os valores em `.env.production` (usado pelo build do GitHub Pages). Para desenvolvimento local,
   copie `.env.example` para `.env.local`.
6. Recomendado: no Google Cloud Console, restrinja a chave de API aos referenciadores HTTP do domínio do site.

Esses valores identificam o projeto e acabam visíveis no navegador; não são segredo. Nunca coloque chaves de
conta de serviço ou credenciais administrativas no frontend.

### Testar sem projeto real

```bash
npx firebase-tools emulators:start --project demo-canide-remoto --only auth,database
npm run dev:remoto              # usa .env.emulador.local (fora do Git), em http://localhost:5174
node teste/regras-remoto.mjs    # 27 verificações das regras de segurança
```

`.env.emulador.local` contém só valores de demonstração do emulador (projeto `demo-*`, sem conta real).

// Dados das placas sem geometria: nomes, medidas e rótulos (português, a partir dos rótulos dos originais).
// Fica fora do pacote do Three.js para a interface aparecer antes do 3D.
// Descrições físicas tiradas do próprio modelo. A função de cada placa no sistema CANIDÉ ainda não foi
// informada; quando for, entra em `funcao` e aparece na interface.
export const INFO = {
  'esp32-c3': {
    id: 'esp32-c3',
    nome: 'ESP32-C3 Super Mini',
    medidas: '18 × 23,4 mm',
    arquivo: 'esp32-c3-exploded.html',
    rotulos: {
      ant: { nome: 'Antena cerâmica', texto: 'Bloco vermelho de 4,9 × 1,7 mm com dois terminais metálicos, na borda superior da placa.' },
      mcu: { nome: 'Microcontrolador ESP32-C3', texto: 'Encapsulamento QFN de 5 × 5 mm, girado a 45 graus no centro da placa.' },
      xtal: { nome: 'Cristal de 40 MHz', texto: 'Base cerâmica de 3,3 × 2,6 mm com tampa metálica marcada 40.000 MHZ.' },
      rst: { nome: 'Botão RST', texto: 'Chave tátil de 3 × 2,2 mm com quatro terminais soldados.' },
      boot: { nome: 'Botão BOOT', texto: 'Chave tátil igual à do RST, do lado oposto da placa.' },
      reg: { nome: 'Regulador de tensão', texto: 'Encapsulamento SOT-23-5, com cinco terminais.' },
      usb: { nome: 'Conector USB-C', texto: 'Carcaça metálica de 8,9 mm com doze contatos dourados, na borda inferior.' },
      smd: { nome: 'Capacitores e resistores SMD', texto: 'Quatro componentes de montagem em superfície: dois capacitores, um resistor e um LED.' }
    },
    extras: [
      { id: 'pcb', nome: 'Placa preta', texto: 'Placa de circuito de 18 × 23,4 mm e 1 mm de espessura.', ponto: [18, 19, -0.5] },
      { id: 'pins', nome: 'Pinos castelados dourados', texto: 'Oito meias-vias em cada lateral, para soldar a placa sobre outra.', ponto: [17.25, 2.6 + 7 * 2.62, 0] }
    ]
  },
  'nodemcu-v3': {
    id: 'nodemcu-v3',
    nome: 'NodeMCU V3',
    medidas: '31 × 58 mm',
    arquivo: 'nodemcu-v3-exploded.html',
    rotulos: {
      mod: { nome: 'Módulo Wi-Fi ESP-12', texto: 'Módulo de 16 × 24 mm com blindagem metálica marcada ESP8266MOD e antena impressa em zigue-zague.' },
      ch: { nome: 'CI USB-serial CH340C', texto: 'Encapsulamento SOIC de 16 terminais, perto do conector micro-USB.' },
      reg: { nome: 'Regulador AMS1117 3,3 V', texto: 'Encapsulamento SOT-223, com três terminais e uma aba metálica.' },
      rst: { nome: 'Botão RST', texto: 'Chave tátil de 4,2 × 3,2 mm no canto inferior esquerdo.' },
      io0: { nome: 'Botão IO0', texto: 'Chave tátil igual à do RST, no canto inferior direito.' },
      smd: { nome: 'Resistores, capacitores e diodos SMD', texto: 'Cinco componentes de montagem em superfície, entre eles dois diodos de vidro.' },
      hdr: { nome: 'Barras de pinos macho', texto: 'Duas fileiras de 15 pinos com passo de 2,54 mm, soldadas por baixo da placa.' }
    },
    extras: [
      { id: 'pcb', nome: 'Placa preta com antena dourada', texto: 'Placa de 31 × 58 mm e 1,6 mm de espessura, com quatro furos de fixação.', ponto: [22.6, 5.8, 0] },
      { id: 'usb', nome: 'Conector micro-USB', texto: 'Carcaça metálica na borda inferior da placa.', ponto: [14.0, 57.4, 1.4] }
    ]
  },
  'bz-251': {
    id: 'bz-251',
    nome: 'BZ-251 GPS',
    medidas: '25 × 25 mm',
    arquivo: 'bz251-gps-exploded.html',
    rotulos: {
      ant: { nome: 'Antena cerâmica de patch', texto: 'Bloco cerâmico de 15 × 16,8 mm e 4,4 mm de altura, apoiado sobre a blindagem.' },
      can: { nome: 'Blindagem metálica', texto: 'Tampa aberta de 3 mm de altura que cobre o módulo receptor marcado BZ-251 GPS.' },
      jst: { nome: 'Conector JST de 6 vias', texto: 'Corpo bege de 13,4 mm com seis contatos, na lateral direita da placa.' },
      gnd: { nome: 'Plano de terra de cobre', texto: 'Placa de cobre de 25 × 25 mm sob a placa principal.' }
    },
    extras: [
      { id: 'pcb', nome: 'Placa principal roxa', texto: 'Placa de 25 × 25 mm com o módulo receptor, os LEDs e seis pads de borda.', ponto: [0.6, 18, -0.5] },
      { id: 'pps', nome: 'LED PPS', texto: 'LED azul marcado PPS na serigrafia.', ponto: [19.0, 21.8, 0.5] },
      { id: 'tx', nome: 'LED TX', texto: 'LED laranja marcado TX na serigrafia.', ponto: [22.4, 21.8, 0.5] }
    ]
  },
  'modulos-rf': {
    id: 'modulos-rf',
    nome: 'Módulos RF',
    medidas: 'três placas: 12 × 18, 11 × 11 e 9 × 10 mm',
    arquivo: 'rf-modules-exploded.html',
    rotulos: {
      ant: { nome: 'Antenas dipolo em T', texto: 'Dois elementos de borracha de 46 mm, cada um preso ao seu cabo.' },
      coax: { nome: 'Cabos coaxiais', texto: 'Dois cabos, de 25 e 15 mm no modelo, entre a antena e o plugue.' },
      ufl: { nome: 'Conectores IPEX/U.FL', texto: 'Plugues dourados que encaixam nos soquetes das duas primeiras placas.' },
      rf1: { nome: 'Chip transceptor de RF', texto: 'Encapsulamento QFP de 5 × 5 mm marcado SX1280 no modelo, na primeira placa.' },
      mcu1: { nome: 'Microcontrolador maior', texto: 'Encapsulamento QFP de 5 × 5 mm, abaixo do transceptor na primeira placa.' },
      mcu2: { nome: 'Chip MCU/RF médio', texto: 'Encapsulamento QFN de 4 × 4 mm na segunda placa.' },
      mcu3: { nome: 'Chip MCU/RF menor', texto: 'Encapsulamento QFN de 3 × 3 mm na terceira placa.' },
      hdr: { nome: 'Barra de 5 pinos', texto: 'Plugue bege com cinco pinos dourados, encaixado no soquete da terceira placa.' }
    },
    extras: [
      { id: 'pads', nome: 'Pads de solda', texto: 'Quatro pads marcados RX, TX, 5V e GND na primeira placa.', ponto: [4.6, 16.6, 0] },
      { id: 'pcb', nome: 'Placas de circuito', texto: 'Três placas pretas de 1 mm de espessura, lado a lado.', ponto: [39, -1.0, -0.5] },
      { id: 'sock', nome: 'Soquete de 5 vias', texto: 'Soquete azul-acinzentado fixo na terceira placa.', ponto: [38.4, -2.0, 1.3] }
    ]
  }
};

export const ORDEM = ['esp32-c3', 'bz-251', 'nodemcu-v3', 'modulos-rf'];

export const CARREGAR = {
  'esp32-c3': () => import('./esp32c3.js'),
  'bz-251': () => import('./bz251.js'),
  'nodemcu-v3': () => import('./nodemcu.js'),
  'modulos-rf': () => import('./rf.js')
};

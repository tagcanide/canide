// Fonte única dos módulos do CANIDÉ: usada pelas seções do site e pelo controle remoto do celular.
// Três grupos: capítulos da página, telas do painel (confirmadas no código do gateway) e placas modeladas em 3D
// (lidas de src/bancada/placas/info.js). Para acrescentar um módulo, edite só este arquivo ou info.js.
// Sem Three.js nem React: o controle remoto importa este arquivo sem carregar a cena.
import { INFO, ORDEM } from '../bancada/placas/info.js';

export const GRUPOS = {
  capitulo: { nome: 'Capítulos', sigla: 'C', texto: 'Partes da página, da abertura ao contato.' },
  painel: { nome: 'Painel', sigla: 'P', texto: 'Telas do sistema no computador da equipe.' },
  placa: { nome: 'Placas', sigla: 'H', texto: 'Eletrônica modelada em 3D, peça por peça.' }
};

/** Telas do painel, confirmadas no gateway (GATEWAY_PC) e nas capturas. `origem` liga a tela às placas. */
export const PAINEL = [
  {
    id: 'tempo-real',
    titulo: 'Tempo real',
    resumo: 'Sessão, protocolo e estado de cada parte, ao vivo.',
    texto: 'Sessão, fluxo, protocolo e o estado de cada parte: gateway, fonte, pacotes, sensores, CSV e banco. Os gráficos usam uma janela de 60, 120 ou 240 amostras.',
    img: 'painel-visao-geral', w: 1440, h: 1450,
    alt: 'Tela Tempo real do painel CANIDÉ com cartões de sessão e protocolo e o estado do sistema.',
    origem: ['esp32-c3', 'modulos-rf', 'nodemcu-v3']
  },
  {
    id: 'plano-de-voo',
    titulo: 'Plano de voo local',
    resumo: 'Trajetória em metros, sem mapas externos.',
    texto: 'A trajetória aparece em metros a partir da primeira posição válida, sem mapas externos. Sem fix, nenhuma posição é desenhada, e um botão oculta as coordenadas da tela.',
    img: 'painel-plano-de-voo', w: 740, h: 813,
    alt: 'Quadro Plano de voo local aguardando fix de GPS, com bússola e campos de fix, satélites, latitude, longitude e altitude vazios.',
    origem: ['gy-neo6mv2']
  },
  {
    id: 'atmosfera',
    titulo: 'Atmosfera',
    resumo: 'Temperatura, pressão, umidade e altitude barométrica.',
    texto: 'Temperatura, pressão em hPa, umidade relativa e altitude barométrica. Cada canal tem sua curva e uma fita com o valor atual entre o mínimo e o máximo da janela.',
    img: 'painel-atmosfera', w: 1184, h: 834,
    alt: 'Quatro gráficos do sensor BME280: temperatura, pressão, umidade e altitude barométrica.',
    origem: ['bme-280']
  },
  {
    id: 'historico',
    titulo: 'Histórico',
    resumo: 'Períodos de até 31 dias, comparação e CSV.',
    texto: 'Consulte períodos de até 31 dias, compare duas sessões alinhadas pelo tempo decorrido e exporte os pontos em CSV. A consulta só lê: nenhum dado é alterado.',
    img: 'painel-historico', w: 1440, h: 1300,
    alt: 'Tela Histórico de sessões com seleção de período e variável e a área de comparação entre sessão A e sessão B.'
  },
  {
    id: 'qualidade',
    titulo: 'Qualidade dos dados',
    resumo: 'Lacunas, duplicações e campos fora de faixa.',
    texto: 'A auditoria lê os registros brutos, sem médias, e aponta lacunas de tempo, sequências duplicadas, puladas ou em retrocesso e campos ausentes ou fora de faixa.',
    img: 'painel-qualidade', w: 1440, h: 1050,
    alt: 'Tela Qualidade dos dados com auditoria de período, índice de integridade, contadores de amostras e lacunas.'
  }
];

const CAPITULOS = [
  { id: 'abertura', nome: 'Abertura', descricao: 'A marca desenhada pela arara-canindé.', sel: '#inicio' },
  { id: 'identidade', nome: 'Identidade', descricao: 'O símbolo e o que cada traço representa.', sel: '#identidade' },
  { id: 'proposito', nome: 'Propósito', descricao: 'Por que acompanhar animais reintroduzidos.', sel: '#proposito' },
  { id: 'produto', nome: 'O produto', descricao: 'Tag, receptor, gateway e painel.', sel: '#produto' },
  { id: 'sessao', nome: 'Sessão real', descricao: 'Dados gravados num teste do protótipo.', sel: '#sessao' },
  { id: 'integracao', nome: 'Integração', descricao: 'O caminho de uma leitura, do sensor à tela.', sel: '#integracao' },
  { id: 'diferenciais', nome: 'Diferenciais', descricao: 'O que distingue o sistema e em que pé está.', sel: '#diferenciais' },
  { id: 'inspiracao', nome: 'Nossa inspiração', descricao: 'Gladys Mae West e a matemática da forma da Terra.', sel: '#inspiracao' },
  { id: 'contato', nome: 'Conhecer', descricao: 'Contato e próximos passos.', sel: '#contato' }
];

/** Painéis que usam os dados de cada placa (inverso de PAINEL[].origem). */
export const telasDaPlaca = id => PAINEL.filter(p => p.origem?.includes(id));

/**
 * Lista completa, na ordem da página. Cada módulo tem:
 * { id, grupo, nome, descricao, alvo: { tipo: 'secao' | 'painel' | 'placa', sel?, placa? } }
 */
export const MODULOS = [
  ...CAPITULOS.slice(0, 4).map(c => ({ id: c.id, grupo: 'capitulo', nome: c.nome, descricao: c.descricao, alvo: { tipo: 'secao', sel: c.sel } })),
  ...ORDEM.map(id => ({
    id: `placa-${id}`,
    grupo: 'placa',
    nome: INFO[id].nome,
    descricao: INFO[id].funcao ? INFO[id].funcao.split('.')[0] + '.' : `Placa modelada em 3D, ${INFO[id].medidas}.`,
    alvo: { tipo: 'placa', placa: id }
  })),
  ...PAINEL.map(p => ({ id: `painel-${p.id}`, grupo: 'painel', nome: p.titulo, descricao: p.resumo, alvo: { tipo: 'painel', sel: `#modulo-${p.id}` } })),
  ...CAPITULOS.slice(4).map(c => ({ id: c.id, grupo: 'capitulo', nome: c.nome, descricao: c.descricao, alvo: { tipo: 'secao', sel: c.sel } }))
];

export const MODULO = Object.fromEntries(MODULOS.map(m => [m.id, m]));

/** Aceita só ids conhecidos, sem repetição (lista vinda do celular ou do armazenamento local). */
export const roteiroValido = ids => [...new Set((ids || []).filter(id => MODULO[id]))];

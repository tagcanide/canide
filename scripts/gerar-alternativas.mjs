// Gera public/desmontagem/<id>.svg a partir dos arquivos *-exploded.html da raiz:
// roda o núcleo puro de cada original (entre // <core> e // </core>) com a placa aberta, sem rótulos.
// Usado como imagem alternativa quando o navegador não tem WebGL. Os originais não são alterados.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ORIGINAIS = {
  'esp32-c3': 'esp32-c3-exploded.html',
  'gy-neo6mv2': 'gy-neo6mv2-exploded.html',
  'bme-280': 'bme-bmp280-exploded.html',
  'bz-251': 'bz251-gps-exploded.html',
  'nodemcu-v3': 'nodemcu-v3-exploded.html',
  'modulos-rf': 'rf-modules-exploded.html'
};

mkdirSync('public/desmontagem', { recursive: true });
for (const [id, arquivo] of Object.entries(ORIGINAIS)) {
  const html = readFileSync(arquivo, 'utf8');
  const nucleo = html.slice(html.indexOf('// <core>'), html.indexOf('// </core>'));
  const render = new Function(`${nucleo}\nreturn render;`)();
  let svg = render(1, { labels: false });
  // fundo transparente e linhas-guia claras para o tema escuro do site
  svg = svg.replace(/stroke="#5f6368"/g, 'stroke="#7f8a96"').replace(/fill="#5f6368"/g, 'fill="#7f8a96"');
  writeFileSync(`public/desmontagem/${id}.svg`, svg);
  console.log(id, (svg.length / 1024).toFixed(0), 'KB');
}

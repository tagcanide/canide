// Arquitetura de movimento: um só motor, Anime.js.
// Entradas de seção, revelação de títulos por linha e timelines ligadas à rolagem passam por aqui.
// A cena 3D não anima sozinha: recebe valores das timelines do Anime.js.
import { useLayoutEffect } from 'react';
import { animate, createTimeline, onScroll, splitText, stagger, utils, svg } from 'animejs';

export const reduzMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Entrada das partes de uma seção, uma vez, quando o grupo chega a 80% da tela.
 * [data-titulo] revela linha por linha atrás de uma máscara; [data-entra] sobe 24 px com stagger de 70 ms.
 * O conteúdo só é escondido pelo próprio script, então continua visível se o JavaScript falhar.
 */
export function useEntrada(ref, deps = []) {
  useLayoutEffect(() => {
    const raiz = ref.current;
    if (!raiz || reduzMovimento()) return undefined;
    const limpar = [];
    const grupos = raiz.querySelectorAll('[data-grupo]');
    (grupos.length ? [...grupos] : [raiz]).forEach(grupo => {
      const gatilho = () => onScroll({ target: grupo, enter: 'bottom-=20% top', repeat: false });
      grupo.querySelectorAll('[data-titulo]').forEach(t => limpar.push(revelarLinhas(t, { gatilho })));
      const itens = [...grupo.querySelectorAll('[data-entra]')];
      if (!itens.length) return;
      utils.set(itens, { opacity: 0, translateY: 24 });
      const a = animate(itens, {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 900,
        ease: 'outExpo',
        delay: stagger(70, { start: 180 }),
        autoplay: gatilho()
      });
      limpar.push(() => a.revert());
    });
    return () => limpar.forEach(f => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Revela um título linha por linha atrás de uma máscara.
 * As linhas só existem depois da medição do texto, por isso a animação nasce em addEffect;
 * se a largura mudar depois da revelação, as linhas são refeitas sem tocar de novo.
 */
export function revelarLinhas(el, { gatilho = null, atraso = 0 } = {}) {
  let tocou = false;
  let vivo = true;
  let div = null;
  el.style.visibility = 'hidden';
  const mostrar = () => (el.style.visibility = '');
  const reserva = setTimeout(mostrar, 2000); // se a divisão falhar, o título aparece mesmo assim
  // A divisão só começa com as fontes prontas: uma instância criada antes e desfeita (StrictMode)
  // ainda dividiria o texto quando a promessa de fontes resolvesse.
  (document.fonts?.ready ?? Promise.resolve()).then(() => {
    if (!vivo) return;
    div = splitText(el, { lines: { wrap: 'clip' } });
    div.addEffect(({ lines }) => {
      clearTimeout(reserva);
      mostrar();
      if (tocou || !lines.length) return undefined;
      utils.set(lines, { translateY: '105%' });
      return animate(lines, {
        translateY: ['105%', '0%'],
        duration: 1000,
        ease: 'outExpo',
        delay: stagger(80, { start: atraso }),
        autoplay: gatilho ? gatilho() : true,
        onBegin: () => {
          tocou = true;
        }
      });
    });
  });
  return () => {
    vivo = false;
    clearTimeout(reserva);
    div?.revert();
    mostrar();
  };
}

export { animate, createTimeline, onScroll, splitText, stagger, utils, svg };

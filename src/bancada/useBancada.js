import { useEffect, useRef, useState } from 'react';
import { CARREGAR } from './placas/info.js';

/**
 * Cria a bancada 3D dentro de `caixaRef` quando o módulo Three.js termina de carregar (import dinâmico).
 * Pausa o desenho fora da tela e libera o contexto WebGL ao desmontar.
 * estado: 'carregando' | 'pronta' | 'sem-webgl'
 */
export function useBancada(caixaRef, placaId, { sombras = true } = {}) {
  const api = useRef(null);
  const [estado, setEstado] = useState('carregando');
  const placaRef = useRef(placaId);
  placaRef.current = placaId;
  const carregada = useRef(null);

  useEffect(() => {
    const caixa = caixaRef.current;
    let vivo = true;
    let bancada = null;
    let ro = null;
    let io = null;
    // O canvas nasce aqui: um contexto WebGL perdido não pode ser reaproveitado no mesmo elemento.
    const canvas = document.createElement('canvas');
    canvas.className = 'bancada__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    caixa.appendChild(canvas);

    Promise.all([import('./cena.js'), CARREGAR[placaRef.current]()])
      .then(([{ criarBancada, suportaWebGL }, modulo]) => {
        if (!vivo) return;
        if (!suportaWebGL()) {
          canvas.remove();
          setEstado('sem-webgl');
          return;
        }
        const mobile = window.matchMedia('(max-width: 767px)').matches;
        bancada = criarBancada(canvas, { mobile, sombras });
        bancada.carregar(modulo.default);
        carregada.current = modulo.default.id;
        bancada.iniciar();
        api.current = bancada;
        ro = new ResizeObserver(() => bancada.redimensionar());
        ro.observe(caixa);
        io = new IntersectionObserver(([e]) => bancada.pausar(!e.isIntersecting), { rootMargin: '100px' });
        io.observe(caixa);
        setEstado('pronta');
      })
      .catch(() => {
        if (!vivo) return;
        canvas.remove();
        setEstado('sem-webgl');
      });

    return () => {
      vivo = false;
      ro?.disconnect();
      io?.disconnect();
      bancada?.destruir();
      api.current = null;
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (estado !== 'pronta' || carregada.current === placaId) return;
    let vivo = true;
    CARREGAR[placaId]().then(m => {
      if (!vivo || !api.current) return;
      api.current.carregar(m.default);
      carregada.current = placaId;
    });
    return () => {
      vivo = false;
    };
  }, [placaId, estado]);

  return { api, estado };
}

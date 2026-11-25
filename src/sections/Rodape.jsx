import { useEffect, useRef, useState } from 'react';
import { SITE } from '../config.js';
import { reduzMovimento } from '../lib/movimento.js';
import { asset } from '../lib/asset.js';
import './Rodape.css';

const NAV = [
  { href: '#identidade', label: 'Identidade' },
  { href: '#proposito', label: 'Propósito' },
  { href: '#produto', label: 'O produto' },
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#sessao', label: 'Sessão real' },
  { href: '#integracao', label: 'Integração' },
  { href: '#diferenciais', label: 'Diferenciais' },
  { href: '#estado', label: 'Estado atual' },
  { href: '#inspiracao', label: 'Nossa inspiração' }
];

// Vídeo original da logo como faixa de ponta a ponta. Toca em loop só enquanto está na tela.
// Com movimento reduzido, fica parado no quadro final (a assinatura sobre branco) até o visitante tocar.
function FaixaDaMarca() {
  const videoRef = useRef(null);
  const [reduzido] = useState(reduzMovimento);
  const [tocando, setTocando] = useState(!reduzido);
  const pausadoPeloVisitante = useRef(reduzido);

  useEffect(() => {
    const v = videoRef.current;
    if (reduzido) {
      const aoCarregar = () => {
        v.currentTime = Math.max(0, v.duration - 0.05);
      };
      v.addEventListener('loadedmetadata', aoCarregar, { once: true });
    }
    const io = new IntersectionObserver(([e]) => {
      if (pausadoPeloVisitante.current) return;
      if (e.isIntersecting) v.play().catch(() => setTocando(false));
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [reduzido]);

  const alternar = () => {
    const v = videoRef.current;
    if (v.paused) {
      pausadoPeloVisitante.current = false;
      v.play().then(() => setTocando(true)).catch(() => {});
    } else {
      pausadoPeloVisitante.current = true;
      v.pause();
      setTocando(false);
    }
  };

  return (
    <div className="rodape__faixa">
      <video
        ref={videoRef}
        className="rodape__video"
        src={asset('media/logo-animada.mp4')}
        width="1920"
        height="1080"
        autoPlay={!reduzido}
        loop
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-label="Assinatura animada da marca CANIDÉ"
      />
      <button type="button" className="rodape__pausa" onClick={alternar} aria-pressed={!tocando}>
        {tocando ? 'Pausar animação' : 'Tocar animação'}
      </button>
    </div>
  );
}

export default function Rodape() {
  return (
    <footer className="rodape" aria-labelledby="rodape-titulo">
      <FaixaDaMarca />
      <div className="moldura rodape__grade">
        <div className="rodape__marca">
          <h2 id="rodape-titulo" className="sr-only">
            Rodapé
          </h2>
          <img src={asset('brand/02-monocromatica-azul.svg')} alt="CANIDÉ" width="220" height="49" loading="lazy" />
          <p>Telemetria e rastreamento. Tag de localização GPS e central de telemetria local.</p>
          <p className="nota">Projeto apresentado no 15º Circuito de Ciências das Escolas Públicas do DF.</p>
        </div>

        <nav className="rodape__nav" aria-label="Rodapé">
          <ul>
            {NAV.map(l => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rodape__contato">
          {(SITE.contactEmail || SITE.social.length > 0) && <p className="rodape__rotulo">Contato</p>}
          <ul>
            {SITE.contactEmail && (
              <li>
                <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
              </li>
            )}
            {SITE.social.map(s => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="rodape__topo" href="#inicio">
            Voltar ao início ↑
          </a>
        </div>
      </div>

      <div className="moldura rodape__base">
        <p className="nota">© 2026 CANIDÉ. Marca e identidade visual CANIDÉ.</p>
        <p className="nota rodape__creditos">
          Fotos: “Ara ararauna” por{' '}
          <a href="https://commons.wikimedia.org/wiki/File:Ara_ararauna_Luc_Viatour.jpg">Luc Viatour</a>,{' '}
          <a href="https://creativecommons.org/licenses/by/2.0">CC BY 2.0</a>; “Arara canindé” por{' '}
          <a href="https://commons.wikimedia.org/wiki/File:Arara_canind%C3%A9_-_Ara_ararauna.jpg">Renato Augusto Martins</a>,{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY-SA 4.0</a>. Ambas via Wikimedia Commons, redimensionadas.
          “Gladys West and Sam Smith” (1985), Marinha dos EUA, domínio público, via Wikimedia Commons. Retrato de Gladys
          West do acervo do projeto, sem autoria identificada.
          Silhueta da arara desenhada a partir do kit de identidade CANIDÉ. Placas eletrônicas modeladas em 3D a partir dos
          desenhos técnicos do projeto.
        </p>
      </div>
    </footer>
  );
}

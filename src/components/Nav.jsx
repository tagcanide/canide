import { useEffect, useRef, useState } from 'react';
import ControleRemoto from './ControleRemoto.jsx';
import { asset } from '../lib/asset.js';
import './Nav.css';

const LINKS = [
  { href: '#identidade', label: 'Identidade' },
  { href: '#proposito', label: 'Propósito' },
  { href: '#produto', label: 'Produto' },
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#integracao', label: 'Integração' },
  { href: '#inspiracao', label: 'Nossa inspiração' }
];

export default function Nav() {
  const [aberto, setAberto] = useState(false);
  const [claro, setClaro] = useState(false);
  const botaoRef = useRef(null);

  useEffect(() => {
    // A barra fica transparente só no topo da página; ao rolar, ganha fundo de papel e uma linha fina.
    const aoRolar = () => setClaro(window.scrollY > 8);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = e => {
      if (e.key === 'Escape') {
        setAberto(false);
        botaoRef.current?.focus();
      }
    };
    document.addEventListener('keydown', aoTeclar);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = '';
    };
  }, [aberto]);

  const fechar = () => setAberto(false);

  return (
    <header className={`nav ${claro ? 'nav--claro' : ''} ${aberto ? 'nav--aberto' : ''}`}>
      <div className="moldura nav__barra">
        <a className="nav__marca" href="#inicio" aria-label="CANIDÉ, voltar ao início" onClick={fechar}>
          <img
            src={asset('brand/02-monocromatica-azul.svg')}
            alt=""
            width="150"
            height="36"
          />
        </a>
        <nav className="nav__links" aria-label="Seções">
          <ul>
            {LINKS.map(l => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <ControleRemoto className="nav__remoto" />
        <button
          ref={botaoRef}
          type="button"
          className="nav__menu"
          aria-expanded={aberto}
          aria-controls="menu-movel"
          onClick={() => setAberto(v => !v)}
        >
          {aberto ? 'Fechar' : 'Menu'}
        </button>
      </div>
      <div id="menu-movel" className="nav__painel" hidden={!aberto}>
        <nav aria-label="Seções">
          <ul>
            {LINKS.map(l => (
              <li key={l.href}>
                <a href={l.href} onClick={fechar}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

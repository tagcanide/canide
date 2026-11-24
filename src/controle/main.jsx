import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import '../styles/base.css';
import Controle from './Controle.jsx';

createRoot(document.getElementById('controle')).render(
  <StrictMode>
    <Controle />
  </StrictMode>
);

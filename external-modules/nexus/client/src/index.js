import React from 'react';
import { createRoot } from 'react-dom/client';
import AccessScreen from './components/AccessScreen';
import './index.css'; // Changed from './styles/index.css'

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AccessScreen />
  </React.StrictMode>
);

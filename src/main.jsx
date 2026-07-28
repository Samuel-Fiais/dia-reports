import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Fraunces (substituto da "Exposure" do Dia) e Inter (fallback fiel de SF Pro
// fora do ecossistema Apple) — self-hosted, sem depender de CDN externo.
import '@fontsource/fraunces/500-italic.css'
import '@fontsource/fraunces/600-italic.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/jetbrains-mono/400.css'

import './styles/dia.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

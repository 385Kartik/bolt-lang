import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './.bolt-generated/App.jsx'
import BoltErrorBoundary from './.bolt-generated/components/BoltErrorBoundary.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BoltErrorBoundary>
      <App />
    </BoltErrorBoundary>
  </React.StrictMode>,
)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import SuccessPage from './successPage.jsx'
import Form from './Form.jsx'
import Navigate from './Navigate.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Navigate />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="auth/success" element={<SuccessPage />} />
        <Route path='/form' element={<Form />} />
      </Routes>
    </Router>
  </StrictMode>,
)

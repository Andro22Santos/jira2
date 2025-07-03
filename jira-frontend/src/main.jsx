import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function PrivateRoute({ children }) {
  const logged = localStorage.getItem('logged_in') === '1';
  return logged ? children : <Navigate to="/login" />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<PrivateRoute><App /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

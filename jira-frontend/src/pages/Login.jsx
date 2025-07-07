import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Configuração inteligente da API (mesma lógica do App.jsx)
const getApiUrl = () => {
  // Se VITE_API_URL está definida (produção), use ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Para desenvolvimento local (quando roda com npm run dev)
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api'
  }
  
  // Fallback para build de produção sem VITE_API_URL
  return '/api'
}

// Função simples de codificação para ofuscar dados
const encodeData = (data) => {
  return btoa(JSON.stringify(data))
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const API_URL = getApiUrl();
      
      // Ofuscar dados antes de enviar
      const payload = {
        data: encodeData({ username, password })
      };
      
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('logged_in', '1');
        navigate('/');
      } else {
        setError('Usuário ou senha inválidos');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <input
          className="w-full mb-4 p-2 border rounded"
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full mb-4 p-2 border rounded"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold" type="submit">Entrar</button>
      </form>
    </div>
  );
} 
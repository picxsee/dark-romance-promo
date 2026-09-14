'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        router.push('/characters');
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setInfo('Compte cree. Verifie ta boite mail pour confirmer, puis connecte-toi.');
        setMode('login');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid #333' }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'login' ? '2px solid #e11d48' : '2px solid transparent',
              color: mode === 'login' ? '#fff' : '#888',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'signup' ? '2px solid #e11d48' : '2px solid transparent',
              color: mode === 'signup' ? '#fff' : '#888',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Creer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            required
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #333', background: '#151515', color: '#fff' }}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #333', background: '#151515', color: '#fff' }}
          />

          {error && <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>}
          {info && <p style={{ color: '#4ade80', fontSize: 14 }}>{info}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: '#e11d48',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Patiente...' : mode === 'login' ? 'Se connecter' : 'Creer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}

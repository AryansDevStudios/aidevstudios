import React, { useState } from 'react';
import { Bot } from 'lucide-react';

interface AuthProps {
  onAuth: (user: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:8787");

export default function Auth({ onAuth }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuth(data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-8 text-center bg-yellow-400 dark:bg-yellow-500">
          <Bot className="w-16 h-16 mx-auto text-gray-900 mb-2" />
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AIDevStudios</h1>
          <p className="text-yellow-900 font-medium mt-1">
            Sign in to continue to your workspace
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-gray-100 flex flex-col gap-6">
        <div className="text-center">
          <Link to="/" className="text-3xl font-black text-green-600 tracking-tight">ApartmentHub</Link>
          <h2 className="text-xl font-bold text-gray-800 mt-4">Welcome Back</h2>
          <p className="text-sm text-gray-400 mt-1">Please enter your credentials to log in.</p>
        </div>

        {searchParams.get('expired') && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-lg font-semibold">
            Your login session has expired. Please sign in again.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-lg font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="e.g. residenta@apartmenthub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition-all shadow-sm flex items-center justify-center disabled:bg-green-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 font-semibold">
          Don't have an account? <Link to="/register" className="text-green-600 hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

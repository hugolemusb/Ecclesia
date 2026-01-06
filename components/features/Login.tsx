
import React, { useState } from 'react';
import { Church as ChurchIcon, Lock, Mail, Sparkles, ShieldCheck, Terminal, ArrowRight } from 'lucide-react';
import { MOCK_USERS, MOCK_CHURCH } from '../../constants';
import { User } from '../../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && (password === MOCK_CHURCH.claveAdmin || password === '123456')) {
      onLogin(user);
    } else {
      setError('Credenciales inválidas ministerial.');
    }
  };

  const handleDevLogin = () => {
    console.log("Attempting Dev Login...");
    if (!MOCK_USERS || MOCK_USERS.length === 0) {
      alert("Error: No hay usuarios de prueba definidos en constants.");
      return;
    }
    const adminUser = MOCK_USERS[0];
    console.log("Logging in as:", adminUser);
    try {
      onLogin(adminUser);
    } catch (e) {
      console.error("Login Error:", e);
      alert("Error al iniciar sesión: " + e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md animate-in zoom-in-95 duration-500 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-10 text-white text-center">
            <div className="inline-flex p-5 bg-white/20 rounded-3xl mb-6 shadow-xl backdrop-blur-md">
              <ChurchIcon size={48} />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Ecclesia Insights</h1>
            <p className="text-blue-100 text-sm mt-2 font-medium opacity-80 uppercase tracking-widest">{MOCK_CHURCH.name}</p>
          </div>

          <div className="p-10 pt-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl text-center border border-red-100 animate-pulse">{error}</div>}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Correo Ministerial</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="pastor@imp.cl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Clave de Acceso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/30 flex items-center justify-center gap-3 transition-all active:scale-95 group"
              >
                Ingresar al Panel Pastoral
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDevLogin}
                  className="w-full flex items-center justify-center gap-2.5 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent"
                >
                  <Terminal size={16} /> Entrar en Modo Edición
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">IMP Lo Prado - Ecclesia v1.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

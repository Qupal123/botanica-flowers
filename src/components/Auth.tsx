import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize admin if not exists
    const users: User[] = JSON.parse(localStorage.getItem('botanica_users') || '[]');
    if (!users.some(u => u.role === 'admin')) {
      users.push({ username: 'admin', passwordHash: 'admin', role: 'admin' });
      localStorage.setItem('botanica_users', JSON.stringify(users));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users: User[] = JSON.parse(localStorage.getItem('botanica_users') || '[]');
    
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (isLogin) {
      const user = users.find(u => u.username === cleanUsername && u.passwordHash === cleanPassword);
      if (user) {
        onLogin(user);
      } else {
        setError('Неверный логин или пароль');
      }
    } else {
      if (users.some(u => u.username === cleanUsername)) {
        setError('Пользователь с таким логином уже существует');
        return;
      }
      
      const newUser: User = { username: cleanUsername, passwordHash: cleanPassword, role: 'user' };
      users.push(newUser);
      localStorage.setItem('botanica_users', JSON.stringify(users));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950 p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-800/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-emerald-900/30 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-emerald-500/20 w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.2 }}
            className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-400/20 mb-4"
          >
            <Leaf className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h1 className="font-serif text-4xl text-white font-bold tracking-tight mb-2">Ботаника</h1>
          
          <div className="h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p 
                key={isLogin ? 'login' : 'register'}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-emerald-200/60"
              >
                {isLogin ? 'Войдите в свою учетную запись' : 'Создайте новую учетную запись'}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-emerald-100/70 mb-1.5 ml-1">Логин</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-emerald-950/50 border border-emerald-700/50 text-white rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all placeholder:text-emerald-700/50 shadow-inner"
              placeholder="Введите логин"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-medium text-emerald-100/70 mb-1.5 ml-1">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-emerald-950/50 border border-emerald-700/50 text-white rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all placeholder:text-emerald-700/50 shadow-inner"
              placeholder="Введите пароль"
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <p className="text-red-400 text-sm font-medium bg-red-400/10 py-2 px-3 rounded-lg border border-red-400/20 text-center">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-2"
          >
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold rounded-xl transition-all outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98]"
            >
              {isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </motion.div>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setUsername('');
              setPassword('');
            }}
            className="text-emerald-400/80 hover:text-emerald-300 text-sm font-medium transition-colors outline-none"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

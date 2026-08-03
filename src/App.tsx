import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { UserShop } from './components/UserShop';
import { SplashScreen } from './components/SplashScreen';
import { User } from './types';
import { Leaf, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('botanica_currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('botanica_currentUser', JSON.stringify(user));
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('botanica_currentUser', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('botanica_currentUser');
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      
      <AnimatePresence mode="wait">
        {!showSplash && (
          !currentUser ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Auth onLogin={handleLogin} />
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="min-h-screen flex flex-col font-sans bg-emerald-950 text-emerald-50 selection:bg-emerald-500/30"
            >
              <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-emerald-950 to-emerald-950 pointer-events-none" />
              
              <header className="relative bg-emerald-950/50 backdrop-blur-md border-b border-emerald-900/50 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-400/20">
                      <Leaf className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="font-serif text-xl font-semibold text-emerald-50 tracking-tight">Ботаника</span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4"
                  >
                    <span className="text-emerald-200/70 text-sm hidden sm:inline">
                      {currentUser.role === 'admin' ? 'Админ: ' : 'Клиент: '}
                      <strong className="text-emerald-100 font-medium">{currentUser.username}</strong>
                    </span>
                    <button 
                      onClick={handleLogout}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-800/30 text-emerald-300 hover:text-emerald-100 transition-all text-sm font-medium outline-none"
                    >
                      <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="hidden sm:inline">Выйти</span>
                    </button>
                  </motion.div>
                </div>
              </header>
              
              <main className="relative flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full z-0">
                {currentUser.role === 'admin' ? (
                  <AdminDashboard currentUser={currentUser} onUserUpdate={handleUserUpdate} />
                ) : (
                  <UserShop currentUser={currentUser} />
                )}
              </main>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </>
  );
}


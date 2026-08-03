import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Sparkles, ArrowRight } from 'lucide-react';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(onFinish, 1000); // Wait for exit animation
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950 overflow-hidden"
        >
          {/* Animated background glow */}
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.15, scale: 1.5 }}
            transition={{ duration: 4, ease: "easeOut" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent pointer-events-none"
          />

          <div className="relative z-10 flex flex-col items-center justify-center text-emerald-50 px-4 w-full max-w-lg">
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 120,
                damping: 15,
                delay: 0.2
              }}
              className="relative"
            >
              <Leaf className="w-24 h-24 text-emerald-400 mb-6 drop-shadow-2xl" />
              
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 1, duration: 0.6, type: "spring", bounce: 0.6 }}
                className="absolute -top-4 -right-4 text-yellow-300"
              >
                <Sparkles className="w-8 h-8 drop-shadow-lg" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.6
              }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white drop-shadow-lg">
                Ботаника
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
              className="text-center"
            >
              <p className="mt-4 text-emerald-200/80 tracking-[0.2em] uppercase text-sm font-medium mb-8">
                Магазин уникальных растений
              </p>
              <p className="text-stone-300 mb-12 text-lg font-light leading-relaxed">
                Откройте для себя мир зелени. Мы предлагаем лучшие комнатные и уличные растения для вашего дома и сада.
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.8, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnter}
              className="group flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-8 py-4 rounded-full font-semibold text-lg transition-colors shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] outline-none"
            >
              Войти на сайт
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
          
          {/* Subtle particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  y: "100vh", 
                  x: Math.random() * 100 - 50 + "vw" 
                }}
                animate={{ 
                  opacity: [0, 0.6, 0], 
                  y: "-20vh",
                  x: (Math.random() * 100 - 50) + "vw"
                }}
                transition={{ 
                  duration: Math.random() * 3 + 4, 
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute bottom-0 w-2 h-2 rounded-full bg-emerald-300/40 blur-[1px]"
                style={{
                  left: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

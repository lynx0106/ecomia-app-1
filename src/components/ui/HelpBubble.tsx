'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

/**
 * Floating Help Bubble - Bottom right corner of the screen
 * Appears on all pages (except help/tutorials page)
 */
export function HelpBubble() {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleTutoriales = () => {
    router.push('/tutorials');
    setShowMenu(false);
  };

  const handleChat = () => {
    router.push('/chat');
    setShowMenu(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-xl mb-2 p-2 min-w-48"
          >
            <button
              onClick={handleTutoriales}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <span className="text-lg">📚</span>
              Ver Tutoriales
            </button>

            <button
              onClick={handleChat}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <span className="text-lg">💬</span>
              Pregunta en el Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bubble Button */}
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all ${
          showMenu
            ? 'bg-indigo-600 dark:bg-indigo-500'
            : 'bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600'
        } text-white`}
        title="Ayuda / Tutoriales"
      >
        <AnimatePresence mode="wait">
          {showMenu ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="help"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

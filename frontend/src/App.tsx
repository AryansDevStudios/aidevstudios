import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import Chat from './Chat';
import Sidebar from './Sidebar';
import { Menu, X, Sun, Moon, Settings } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [model, setModel] = useState('@cf/meta/llama-3-8b-instruct');
  const [extendedThinking, setExtendedThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Auth onAuth={setUser} />;
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-900 overflow-hidden font-sans">
      {/* Mobile Sidebar Toggle Overlay */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-20 p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 md:hidden"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 fixed md:relative z-30 h-full w-72 flex-shrink-0 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800`}>
        <Sidebar 
          user={user} 
          activeConversation={activeConversation}
          setActiveConversation={setActiveConversation}
          onCloseMobile={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <span className="md:hidden w-10"></span>
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">AIDevStudios</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
              <Settings size={20} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>

        <Chat 
          user={user} 
          conversationId={activeConversation}
          setConversationId={setActiveConversation}
          model={model}
          extendedThinking={extendedThinking}
        />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Model
                </label>
                <select 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="@cf/meta/llama-3-8b-instruct">Llama 3 8B Instruct</option>
                  <option value="@cf/openai/gpt-oss-20b">GPT OSS 20B (Custom)</option>
                  <option value="@cf/mistral/mistral-7b-instruct-v0.1">Mistral 7B</option>
                  <option value="@cf/google/gemma-7b-it">Gemma 7B IT</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Extended Thinking</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Allow AI more time to reason for complex coding tasks.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={extendedThinking} onChange={(e) => setExtendedThinking(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

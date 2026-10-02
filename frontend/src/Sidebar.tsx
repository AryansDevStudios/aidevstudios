import { useEffect, useState } from 'react';
import { Plus, MessageSquare, LogOut, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "https://aidevstudios.adsbackend01.workers.dev";

export default function Sidebar({ user, activeConversation, setActiveConversation, onCloseMobile, onLogout }: any) {
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/conversations?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error("Failed to fetch conversations");
    }
  };

  const handleNewChat = () => {
    setActiveConversation(null);
    if (window.innerWidth < 768) onCloseMobile();
  };

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    if (window.innerWidth < 768) onCloseMobile();
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 flex items-center justify-between md:block">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden md:flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center text-gray-900">AI</span>
          DevStudios
        </h1>
        <button onClick={onCloseMobile} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
          <X size={20} />
        </button>
        
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-500 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all font-medium"
        >
          <Plus size={18} className="text-yellow-500" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 mt-2">
        {conversations.length === 0 ? (
          <div className="text-center px-4 py-8 text-sm text-gray-500 dark:text-gray-400">
            No previous chats found. Start a new conversation!
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left truncate transition-colors ${
                activeConversation === conv.id 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 font-medium' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <MessageSquare size={16} className={activeConversation === conv.id ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'} />
              <span className="truncate flex-1 text-sm">{conv.title || 'New Conversation'}</span>
            </button>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold uppercase">
              {user.username.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {user.username}
            </span>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}




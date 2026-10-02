import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Send, Bot, User, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "https://aidevstudios.adsbackend01.workers.dev";

interface ChatProps {
  user: any;
  conversationId: string | null;
  setConversationId: (id: string) => void;
  model: string;
  extendedThinking: boolean;
}

export default function Chat({ user, conversationId, setConversationId, model, extendedThinking }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/messages?conversationId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
      }
    } catch (e) {
      console.error("Failed to fetch messages");
    }
  };

  const createConversation = async (title: string) => {
    const res = await fetch(`${API_URL}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, title })
    });
    const data = await res.json();
    setConversationId(data.id);
    return data.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    
    let currentConvId = conversationId;
    if (!currentConvId) {
      currentConvId = await createConversation(userMsg.slice(0, 30) + (userMsg.length > 30 ? '...' : ''));
    }

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const systemPrompt = extendedThinking 
        ? "You are an expert full-stack developer. Think step-by-step deeply before answering." 
        : "You are an expert full-stack developer.";

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: newMessages,
          stream: true,
          conversationId: currentConvId
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "").trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              // Handle both standard Cloudflare AI and OpenAI compatible formats
              const token = parsed.response !== undefined 
                ? parsed.response 
                : (parsed.choices?.[0]?.delta?.content || "");
              
              fullReply += token;
              
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].content = fullReply;
                return updated;
              });
            } catch (e) {
              // Incomplete JSON chunk, skip
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Error: Failed to fetch response from AI.";
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-32">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4">
            <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-400/20">
              <Bot size={40} className="text-gray-900" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How can I help you code today?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              I am an expert developer AI. Ask me about architecture, writing code, or fixing bugs. I support Markdown and LaTeX!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {['Build a React hook for geolocation', 'Explain the event loop in Node.js', 'Write a SQL query for daily active users', 'Design a scalable microservices architecture'].map((hint, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(hint)}
                  className="p-4 text-sm text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-yellow-50 dark:hover:bg-gray-700 border border-transparent hover:border-yellow-200 dark:hover:border-gray-600 transition-all"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-yellow-400 flex items-center justify-center mt-1">
                    <Bot size={18} className="text-gray-900" />
                  </div>
                )}
                
                <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-br-none' 
                    : 'bg-transparent text-gray-900 dark:text-gray-100'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content || '...'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                
                {msg.role === 'user' && (
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center mt-1">
                    <User size={18} className="text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 pt-10">
        <div className="max-w-4xl mx-auto relative">
          <form onSubmit={handleSubmit} className="relative flex items-end shadow-xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-yellow-400 transition-shadow">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message AIDevStudios..."
              className="w-full max-h-48 bg-transparent py-4 pl-4 pr-12 text-gray-900 dark:text-gray-100 resize-none outline-none overflow-y-auto"
              rows={Math.min(Math.max(input.split('\n').length, 1), 6)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-3 bottom-3 p-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 disabled:opacity-50 disabled:hover:bg-yellow-400 transition-colors"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-400">AIDevStudios can make mistakes. Consider verifying important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}



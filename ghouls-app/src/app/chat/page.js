"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ChatRoom() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'GHOULS system online. Awaiting autonomous operational directives.' }
  ]);
  const [input, setInput] = useState('');

  // NEW: Boot sequence - Load memory on startup
  useEffect(() => {
    fetch('/api/memory')
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(err => console.error("Memory load failed:", err));
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Instantly show user message in UI
    const updatedWithUser = [...messages, { role: 'user', text: input }];
    setMessages(updatedWithUser);
    const currentInput = input;
    setInput('');

    try {
      // Ping the native backend API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput })
      });
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update UI with AI response
      const finalMessages = [
        ...updatedWithUser, 
        { 
          role: 'assistant', 
          text: data.reply + (data.log ? `\n\n[TERMINAL OUTPUT]:\n${data.log}` : '') 
        }
      ];
      setMessages(finalMessages);

      // NEW: Save the entire updated conversation to the local database
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalMessages })
      });
      
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: `[CRITICAL FAILURE]: ${error.message}` }]);
    }
  };

  return (
    <main className="flex h-screen w-screen bg-[#030712] text-white font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <div className="w-64 border-r border-gray-800 bg-gray-950/60 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 px-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">GHOULS CORE</span>
          </div>
          
          <nav className="space-y-1">
            <button className="w-full text-left px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-emerald-400 text-sm font-medium">
              🤖 Active Swarm
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-900/50 hover:text-white text-sm font-medium transition-colors">
              🛡️ DAST Agent
            </button>
          </nav>
        </div>

        <Link href="/" className="text-xs text-gray-500 hover:text-gray-400 px-2 transition-colors">
          ← Disconnect Terminal
        </Link>
      </div>

      {/* RIGHT MAIN PANEL */}
      <div className="flex-1 flex flex-col justify-between h-full bg-gradient-to-b from-gray-950 to-gray-900">
        
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl w-full mx-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white font-medium rounded-tr-none shadow-md' 
                  : msg.text.includes('[CRITICAL FAILURE]') 
                    ? 'bg-red-900/50 border border-red-800 text-red-200 rounded-tl-none'
                    : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-6 border-t border-gray-800/60 bg-gray-950/40 backdrop-blur-md">
          <div className="max-w-3xl w-full mx-auto relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Ghouls to write apps, execute exploit analysis, or deploy platforms..." 
              className="w-full pl-4 pr-16 py-4 bg-gray-900 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder-gray-500 transition-all"
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-md"
            >
              Send
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
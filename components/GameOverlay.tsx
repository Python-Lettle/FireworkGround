import React, { useState, useRef, useEffect } from 'react';
import { Player, ChatMessage } from '../types';

interface GameOverlayProps {
  players: Player[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

// Icons
const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);
const MaximizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

export const GameOverlay: React.FC<GameOverlayProps> = ({ players, messages, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isPlayerListOpen, setPlayerListOpen] = useState(true);
  const [isChatOpen, setChatOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between overflow-hidden">
      
      {/* Top Left: Player List */}
      <div className="p-4 pointer-events-auto max-w-xs transition-all duration-300 ease-in-out">
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setPlayerListOpen(!isPlayerListOpen)}
          >
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <UsersIcon />
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Players ({players.length})
            </h2>
            <div className="text-slate-400">
              {isPlayerListOpen ? <MinimizeIcon /> : <MaximizeIcon />}
            </div>
          </div>
          
          <div className={`transition-all duration-300 ease-in-out ${isPlayerListOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
             <ul className="space-y-2 overflow-y-auto pr-2 custom-scrollbar p-3 pt-0">
              {players.map((player) => (
                <li key={player.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: player.color }}
                    ></div>
                    <span className={`${player.isCurrentUser ? 'text-white font-semibold' : 'text-slate-300'}`}>
                      {player.name} {player.isCurrentUser && '(You)'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom: Chat Area */}
      <div className="w-full max-w-2xl mx-auto p-4 pointer-events-auto">
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ease-in-out">
          
          {/* Chat Header / Toggle */}
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 border-b border-white/0 hover:border-white/5 transition-colors bg-slate-800/30"
            onClick={() => setChatOpen(!isChatOpen)}
          >
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
               <ChatIcon />
               <span>Chat Room</span>
             </div>
             <div className="text-slate-400">
               {isChatOpen ? <MinimizeIcon /> : <MaximizeIcon />}
             </div>
          </div>

          {/* Collapsible Content */}
          <div className={`transition-all duration-300 ease-in-out ${isChatOpen ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            {/* Message History */}
            <div className="h-48 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col">
              {messages.length === 0 && (
                <div className="text-slate-500 text-xs text-center italic mt-auto">
                  Room created. Waiting for messages...
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm break-words animate-fade-in-up">
                  <span 
                    className="font-bold mr-2" 
                    style={{ color: msg.color }}
                  >
                    {msg.playerName}:
                  </span>
                  <span className="text-slate-200 shadow-black drop-shadow-sm">{msg.text}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="border-t border-white/10 bg-slate-800/50 p-2 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 px-3 py-2 rounded-lg focus:outline-none focus:bg-white/5 transition-colors text-sm"
                onKeyDown={(e) => e.stopPropagation()} 
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FireworkCanvas, FireworkCanvasHandle } from './components/FireworkCanvas';
import { GameOverlay } from './components/GameOverlay';
import { Player, ChatMessage } from './types';

// Helper to generate random colors for names
const getRandomColor = () => {
  const colors = ['#f472b6', '#c084fc', '#818cf8', '#60a5fa', '#34d399', '#facc15'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const App: React.FC = () => {
  const canvasRef = useRef<FireworkCanvasHandle>(null);
  
  // State for multiplayer data
  const [currentUser] = useState<Player>(() => ({
    id: Math.random().toString(36).substr(2, 9),
    name: `Player ${Math.floor(Math.random() * 1000)}`,
    color: getRandomColor(),
    isCurrentUser: true,
  }));

  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize mock players
  useEffect(() => {
    setPlayers([
      currentUser,
      { id: 'bot-1', name: 'CosmicVoyager', color: '#60a5fa', isCurrentUser: false },
      { id: 'bot-2', name: 'StarDust', color: '#facc15', isCurrentUser: false },
    ]);

    // Initial welcome message
    setMessages([
      {
        id: 'system-1',
        playerId: 'system',
        playerName: 'System',
        text: 'Welcome to the Firework Room! Tap to launch fireworks.',
        timestamp: Date.now(),
        color: '#94a3b8'
      }
    ]);
  }, [currentUser]);

  const handleFireworkLaunch = useCallback(() => {
    // In a real app, emit 'launch' event to socket here
  }, []);

  const handleExplosion = useCallback(() => {
    // In a real app, could emit sound sync
  }, []);

  const handleSendMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      playerId: currentUser.id,
      playerName: currentUser.name,
      text: text,
      timestamp: Date.now(),
      color: currentUser.color,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    // In a real app, emit 'message' event to socket here
  };

  return (
    <div className="relative w-full h-screen bg-slate-900 text-white overflow-hidden font-sans">
      <FireworkCanvas 
        ref={canvasRef}
        onLaunch={handleFireworkLaunch} 
        onExplode={handleExplosion} 
      />
      <GameOverlay 
        players={players} 
        messages={messages} 
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default App;
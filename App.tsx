import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FireworkCanvas, FireworkCanvasHandle } from './components/FireworkCanvas';
import { GameOverlay } from './components/GameOverlay';
import { Player, ChatMessage } from './types';

// ==========================================
// 配置文件 / CONFIGURATION
// ==========================================
const USE_MOCK_DATA = true; // 切换为 false 以启用真实 WebSocket 连接
const WS_URL = 'ws://localhost:3000/socket'; // 后端 WebSocket 地址

// ==========================================
// 辅助函数 / HELPERS
// ==========================================

const getRandomColor = () => {
  const colors = ['#f472b6', '#c084fc', '#818cf8', '#60a5fa', '#34d399', '#facc15', '#fb923c', '#2dd4bf'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomName = () => {
  const prefixes = ['快乐', '忧郁', '飞翔', '神秘', '无敌', '幸运', '追光', '闪亮'];
  const nouns = ['烟花', '熊猫', '宇航员', '旅行者', '星星', '探险家', '梦想家', '极客'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}的${nouns[Math.floor(Math.random() * nouns.length)]}`;
};

// ==========================================
// 主应用 / MAIN APP
// ==========================================

const App: React.FC = () => {
  const canvasRef = useRef<FireworkCanvasHandle>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // State
  const [currentUser, setCurrentUser] = useState<Player>(() => ({
    id: Math.random().toString(36).substr(2, 9),
    name: getRandomName(),
    color: getRandomColor(),
    isCurrentUser: true,
  }));

  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // ----------------------------------------------------------------
  // 模式 1: 模拟数据模式 (MOCK DATA MODE)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!USE_MOCK_DATA) return;

    console.log("Mock Mode Activated");

    // 1. 初始化模拟玩家
    setPlayers([
      currentUser,
      { id: 'bot-1', name: '银河漫步者', color: '#60a5fa', isCurrentUser: false },
      { id: 'bot-2', name: '暗夜烟火', color: '#facc15', isCurrentUser: false },
    ]);

    // 2. 初始化系统消息
    setMessages([
      {
        id: 'system-1',
        playerId: 'system',
        playerName: '系统',
        text: '欢迎来到烟花房！点击或长按屏幕发射烟花。',
        timestamp: Date.now(),
        color: '#94a3b8'
      }
    ]);

    // 3. 模拟其他玩家发射烟花 (Bot behavior)
    const fireworkInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        // Random launch position
        const sx = Math.random() * window.innerWidth;
        const sy = window.innerHeight;
        const tx = Math.random() * window.innerWidth;
        const ty = window.innerHeight * 0.2 + Math.random() * window.innerHeight * 0.5;
        const hue = Math.random() * 360;
        
        canvasRef.current?.launchRocket(sx, sy, tx, ty, hue);
      }
    }, 2000);

    // 4. 模拟其他玩家发送消息
    const chatInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        const phrases = ['真漂亮！', '哇！', '新年快乐！', '我也来放一个', '看我的！', '🎆🎆🎆'];
        const randomBot = Math.random() > 0.5 ? 'bot-1' : 'bot-2';
        const botName = randomBot === 'bot-1' ? '银河漫步者' : '暗夜烟火';
        const botColor = randomBot === 'bot-1' ? '#60a5fa' : '#facc15';

        const newMsg: ChatMessage = {
          id: Math.random().toString(36),
          playerId: randomBot,
          playerName: botName,
          text: phrases[Math.floor(Math.random() * phrases.length)],
          timestamp: Date.now(),
          color: botColor
        };
        setMessages(prev => [...prev, newMsg]);
      }
    }, 5000);

    return () => {
      clearInterval(fireworkInterval);
      clearInterval(chatInterval);
    };
  }, [currentUser]); // Depend on currentUser to ensure it's in the list

  // ----------------------------------------------------------------
  // 模式 2: 真实后端模式 (BACKEND CONNECTION MODE)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (USE_MOCK_DATA) return;

    console.log("Connecting to WebSocket:", WS_URL);
    
    // 建立连接
    // 注意: 这里假设后端存在。如果后端不存在，连接会失败。
    const socket = new WebSocket(`${WS_URL}?name=${encodeURIComponent(currentUser.name)}&color=${encodeURIComponent(currentUser.color)}`);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket Connected");
      // 可选: 发送加入房间事件，取决于后端协议是否需要显式 join
      socket.send(JSON.stringify({ type: 'join_room', payload: { name: currentUser.name, color: currentUser.color } }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        switch (type) {
          case 'init_state':
            // payload: { selfId, players, chatHistory }
            setCurrentUser(prev => ({ ...prev, id: payload.selfId }));
            setPlayers(payload.players.map((p: any) => ({ ...p, isCurrentUser: p.id === payload.selfId })));
            setMessages(payload.chatHistory);
            break;

          case 'player_joined':
            // payload: Player
            setPlayers(prev => [...prev, { ...payload, isCurrentUser: false }]);
            break;

          case 'player_left':
            // payload: { id }
            setPlayers(prev => prev.filter(p => p.id !== payload.id));
            break;

          case 'remote_launch':
            // payload: { sx, sy, tx, ty, hue }
            canvasRef.current?.launchRocket(payload.sx, payload.sy, payload.tx, payload.ty, payload.hue);
            break;

          case 'new_message':
            // payload: ChatMessage
            setMessages(prev => [...prev, payload]);
            break;
            
          default:
            console.log("Unknown event type:", type);
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    return () => {
      socket.close();
    };
  }, [currentUser.name, currentUser.color]); // Re-run if user config changes (unlikely in this session)


  // ----------------------------------------------------------------
  // 交互处理程序 / INTERACTION HANDLERS
  // ----------------------------------------------------------------

  const handleFireworkLaunch = useCallback((sx: number, sy: number, tx: number, ty: number, hue: number) => {
    // Mock Mode 不需要在此处做任何事，因为本地点击事件已经由 Canvas 处理了视觉效果。
    // 我们只需要处理 WebSocket 模式的广播。
    if (!USE_MOCK_DATA && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'firework_launch',
        payload: { sx, sy, tx, ty, hue }
      }));
    }
  }, []);

  const handleExplosion = useCallback(() => {
    // 音效已经在 Canvas 内部处理
  }, []);

  const handleSendMessage = (text: string) => {
    if (USE_MOCK_DATA) {
      // Mock Mode: 直接添加到本地状态
      const newMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        playerId: currentUser.id,
        playerName: currentUser.name,
        text: text,
        timestamp: Date.now(),
        color: currentUser.color,
      };
      setMessages((prev) => [...prev, newMessage]);
    } else {
      // Backend Mode: 发送给服务器
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_send',
          payload: { text }
        }));
      }
    }
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
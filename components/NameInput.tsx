import React, { useState } from 'react';

interface NameInputProps {
  onSubmit: (name: string, color: string) => void;
  defaultName: string;
  defaultColor: string;
}

const COLORS = [
  '#f472b6', '#c084fc', '#818cf8', '#60a5fa', 
  '#34d399', '#facc15', '#fb923c', '#2dd4bf',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export const NameInput: React.FC<NameInputProps> = ({ onSubmit, defaultName, defaultColor }) => {
  const [name, setName] = useState(defaultName);
  const [selectedColor, setSelectedColor] = useState(defaultColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      onSubmit(trimmedName, selectedColor);
    }
  };

  const handleRandomName = () => {
    const prefixes = ['快乐', '忧郁', '飞翔', '神秘', '无敌', '幸运', '追光', '闪亮'];
    const nouns = ['烟花', '熊猫', '宇航员', '旅行者', '星星', '探险家', '梦想家', '极客'];
    const randomName = `${prefixes[Math.floor(Math.random() * prefixes.length)]}的${nouns[Math.floor(Math.random() * nouns.length)]}`;
    setName(randomName);
  };

  const handleRandomColor = () => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setSelectedColor(randomColor);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">欢迎来到烟花房</h1>
          <p className="text-slate-400">选择你的名字和颜色，开始游戏</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              你的名字
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入你的名字"
                className="flex-1 bg-slate-700/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                maxLength={20}
              />
              <button
                type="button"
                onClick={handleRandomName}
                className="px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-white/10 rounded-lg text-slate-300 transition-colors"
                title="随机名字"
              >
                🎲
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              你的颜色
            </label>
            <div className="flex gap-2">
              <div className="flex-1 grid grid-cols-8 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all transform hover:scale-110 ${
                      selectedColor === color 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' 
                        : 'hover:ring-2 hover:ring-white/50'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleRandomColor}
                className="px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-white/10 rounded-lg text-slate-300 transition-colors"
                title="随机颜色"
              >
                🎨
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              开始游戏 🎆
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          你的设置会自动保存，下次访问时自动加载
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, CheckCircle2, Package, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionTaken?: string;
  data?: any;
  timestamp: string;
}

interface AIAssistantWidgetProps {
  onActionSuccess?: () => void;
  onOpenOrders?: () => void;
}

// Helper to format assistant messages with rich typography (bold, bullet points, numbers)
function renderFormattedText(text: string, isUser: boolean) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className="h-1" />;
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || /^\d+\./.test(trimmed);
        const cleanContent = isBullet ? trimmed.replace(/^[•\-\d+\.]\s*/, '') : trimmed;

        // Parse **bold** parts
        const parts = cleanContent.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong
                key={pIdx}
                className={isUser ? 'font-bold text-white' : 'font-bold text-slate-900'}
              >
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start space-x-2 pl-1">
              <span className={`font-bold mt-0.5 shrink-0 ${isUser ? 'text-white' : 'text-emerald-600'}`}>•</span>
              <span className="leading-relaxed flex-1">{parts}</span>
            </div>
          );
        }

        return (
          <p key={lIdx} className="leading-relaxed">
            {parts}
          </p>
        );
      })}
    </div>
  );
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  onActionSuccess,
  onOpenOrders,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Namaste! I am **Bazaar Buddy**, your autonomous AI Assistant & Business Coach for LocalBiz.\n\nI can **place orders**, **track shipments**, **mark orders as shipped**, query **real-time sales analytics**, or explain platform payment and pricing formulas. What would you like to do?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    '🛍️ Order Aaji mango pickle for Anish at Bandra',
    '📦 Track order LB-7482',
    '🚚 Mark order LB-7482 as Shipped',
    '💡 How should I price my pottery?',
    '📊 Show real-time sales and orders',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();
      const aiReply = data.reply || 'I processed your request, but received an empty response.';

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: aiReply,
        actionTaken: data.action_taken,
        data: data.data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If an order was placed or updated, trigger main app refresh
      if (
        data.action_taken === 'AUTONOMOUS_ORDER_PLACED' ||
        data.action_taken === 'UPDATE_ORDER_STATUS'
      ) {
        onActionSuccess?.();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: '⚠️ Unable to process request. Please check that the server is operational.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl glow-emerald transition-all transform hover:scale-105 active:scale-95 cursor-pointer relative"
            aria-label="Open AI Assistant"
            title="Chat with LocalBiz AI Assistant"
          >
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
          </button>
        </div>
      )}

      {/* Floating Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-black/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm tracking-wide">Bazaar Buddy</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>AI Assistant</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Autonomous LocalBiz AI Agent</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      sender: 'assistant',
                      text: "Namaste! I am **Bazaar Buddy**, your autonomous AI Assistant & Business Coach for LocalBiz.\n\nI can **place orders**, **track shipments**, **mark orders as shipped**, query **real-time sales analytics**, or explain platform payment and pricing formulas. What would you like to do?",
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ])
                }
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
                aria-label="Close assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2.5 bg-[#FAFAF9] border-b border-slate-100 flex items-center space-x-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 transition font-medium shrink-0 disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 space-y-2 leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-black/[0.06] rounded-bl-xs'
                  }`}
                >
                  {/* Action Badge */}
                  {m.actionTaken && (
                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{m.actionTaken.replace(/_/g, ' ')}</span>
                    </div>
                  )}

                  {/* Message Content rendered with rich markdown formatting */}
                  <div>
                    {renderFormattedText(m.text, m.sender === 'user')}
                  </div>

                  {/* Contextual Link Button */}
                  {m.actionTaken === 'AUTONOMOUS_ORDER_PLACED' && (
                    <button
                      onClick={onOpenOrders}
                      className="mt-2 w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>View in My Orders</span>
                    </button>
                  )}
                </div>

                <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 bg-white px-3.5 py-2.5 rounded-2xl border border-black/[0.05] w-fit shadow-xs animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span className="text-[11px] text-slate-500 font-medium">Bazaar Buddy is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask anything or place an order..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition shadow-sm cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};

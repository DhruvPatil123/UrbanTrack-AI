import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  GeminiModelChoice,
  geminiService
} from '../services/geminiService';
import {
  Bot,
  User,
  Send,
  Sparkles,
  MapPin,
  Globe,
  Trash2,
  ExternalLink,
  Shield,
  Zap,
  BrainCircuit,
  Compass,
  ArrowRight,
  Info
} from 'lucide-react';

interface GeminiChatbotViewProps {
  onHighlightVehicle?: (vehicleId: string) => void;
  onSimulateRoad?: (roadId: string) => void;
}

export const GeminiChatbotView: React.FC<GeminiChatbotViewProps> = ({
  onHighlightVehicle,
  onSimulateRoad
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'model',
      content:
        '👋 Welcome to **URBANTRACK AI Intelligence Copilot**. I am connected to the city spatio-temporal traffic graph, multi-camera ANPR feeds, and real-time Google Maps & Search grounding tools.\n\n' +
        'How can I assist your traffic command operations today? You can inquire about vehicle trajectories, query live road conditions, or execute what-if diversion simulations.',
      timestamp: Date.now(),
      modelUsed: 'gemini-3.5-flash'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelChoice, setModelChoice] = useState<GeminiModelChoice>('gemini-3.5-flash');
  const [enableMaps, setEnableMaps] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [activeRole, setActiveRole] = useState<'commander' | 'investigator' | 'architect'>('commander');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const roleSystemInstructions = {
    commander:
      'You are the URBANTRACK AI Senior Operations Commander. ' +
      'You monitor 8 active municipal CCTV cameras, classify live traffic congestion (FREE FLOW, MODERATE, HEAVY, SEVERE), ' +
      'and issue rapid operational guidance for traffic police marshals, green-wave signal timings, and urgent incident response.',
    investigator:
      'You are the URBANTRACK AI Vehicle Pursuit & ANPR Forensics Specialist. ' +
      'You examine license plate readings (e.g. MH12AB1234), visual Re-ID 512-dim embedding hashes, and multi-camera trajectories. ' +
      'You verify whether vehicle transitions across non-overlapping cameras are physically plausible or suspicious.',
    architect:
      'You are the URBANTRACK AI Urban Mobility & Graph Diversion Architect. ' +
      'You evaluate network-wide Dijkstra shortest paths, what-if road closure simulations, travel-time delay indices, ' +
      'and project volume spillover onto alternate arterial routes when corridors are disabled.'
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      // Default corridor coordinates for Pune/University Circle context
      const latLng = { latitude: 18.5280, longitude: 73.8500 };

      // Model mapping:
      // If Maps or Search is toggled, enforce gemini-3.5-flash as per instructions
      const actualModel = (enableMaps || enableSearch) ? 'gemini-3.5-flash' : modelChoice;

      const response = await geminiService.sendChatMessage({
        messages: newHistory.map((m) => ({
          role: m.role,
          content: m.content
        })),
        model: actualModel,
        systemInstruction: roleSystemInstructions[activeRole],
        enableSearch,
        enableMaps,
        latLng
      });

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        modelUsed: response.model,
        groundingSources: response.groundingSources
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'model',
          content: `⚠️ Failed to receive response from Gemini service: ${err.message}`,
          timestamp: Date.now(),
          modelUsed: modelChoice
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-welcome-reset',
        role: 'model',
        content: 'Session memory reset. Operational command logs initialized. How can I assist you?',
        timestamp: Date.now(),
        modelUsed: modelChoice
      }
    ]);
  };

  return (
    <div className="h-[740px] flex flex-col bg-slate-950 border border-slate-800 rounded overflow-hidden font-mono text-xs select-none">
      {/* Top Configuration & Control Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-600 via-indigo-600 to-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 font-mono">
                GEMINI TRAFFIC COPILOT
              </span>
              <p className="text-[11px] text-slate-400">
                Multi-Turn Intelligence · Maps & Search Grounding
              </p>
            </div>
          </div>

          {/* Model Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded">
            <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1">
              <BrainCircuit className="w-3 h-3 text-cyan-400" />
              Model:
            </span>
            <button
              onClick={() => setModelChoice('gemini-3.5-flash')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                modelChoice === 'gemini-3.5-flash'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              gemini-3.5-flash (General)
            </button>
            <button
              onClick={() => setModelChoice('gemini-3.1-flash-lite')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                modelChoice === 'gemini-3.1-flash-lite'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              gemini-3.1-flash-lite (Fast)
            </button>
            <button
              onClick={() => setModelChoice('gemini-3.1-pro-preview')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                modelChoice === 'gemini-3.1-pro-preview'
                  ? 'bg-purple-950 text-purple-300 border border-purple-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              gemini-3.1-pro-preview (Complex)
            </button>
          </div>

          <button
            onClick={handleClearChat}
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
            title="Reset Chat Session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Roles & Grounding Tools Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Role selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase">System Role:</span>
            <button
              onClick={() => setActiveRole('commander')}
              className={`px-2 py-1 rounded text-[10px] transition ${
                activeRole === 'commander'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Traffic Commander
            </button>
            <button
              onClick={() => setActiveRole('investigator')}
              className={`px-2 py-1 rounded text-[10px] transition ${
                activeRole === 'investigator'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vehicle Forensics
            </button>
            <button
              onClick={() => setActiveRole('architect')}
              className={`px-2 py-1 rounded text-[10px] transition ${
                activeRole === 'architect'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diversion Architect
            </button>
          </div>

          {/* Grounding Tool Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEnableMaps(!enableMaps);
                if (!enableMaps) setEnableSearch(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition text-[11px] ${
                enableMaps
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Maps Data {enableMaps ? '(ON)' : ''}</span>
            </button>

            <button
              onClick={() => {
                setEnableSearch(!enableSearch);
                if (!enableSearch) setEnableMaps(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition text-[11px] ${
                enableSearch
                  ? 'bg-blue-950/90 text-blue-300 border-blue-600 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Search Data {enableSearch ? '(ON)' : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded p-3 space-y-2 ${
                  isUser
                    ? 'bg-cyan-950/70 border border-cyan-800/80 text-cyan-100'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
              >
                {/* Header with Timestamp and Model Badge */}
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 border-b border-slate-800/60 pb-1">
                  <span className="font-bold text-slate-300">
                    {isUser ? 'OPERATOR' : 'URBANTRACK INTELLIGENCE'}
                  </span>
                  <div className="flex items-center gap-2">
                    {msg.modelUsed && (
                      <span className="bg-slate-950 px-1.5 py-0.5 rounded text-[9px] text-cyan-400 border border-slate-800">
                        {msg.modelUsed}
                      </span>
                    )}
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="text-xs font-sans leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Grounding Sources Listing (Required by Maps and Search Grounding specifications) */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Grounded Verification Sources:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700 text-slate-300 hover:text-cyan-300 px-2 py-1 rounded text-[10px] font-mono transition"
                        >
                          {src.type === 'maps' ? (
                            <MapPin className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Globe className="w-3 h-3 text-blue-400" />
                          )}
                          <span className="truncate max-w-[200px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs font-mono animate-pulse">
            <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <span>Evaluating corridor graph & grounding tools with {enableMaps || enableSearch ? 'gemini-3.5-flash' : modelChoice}...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[10px] text-slate-400">
        <span className="shrink-0 font-bold text-cyan-400">Quick Inquiries:</span>
        <button
          onClick={() => handleSendMessage('Investigate target vehicle V000123 (MH12AB1234) trajectory and speeds across CAM01 to CAM08.')}
          className="shrink-0 bg-slate-950 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-800 transition"
        >
          🔍 Investigate V000123 Trajectory
        </button>
        <button
          onClick={() => {
            setEnableMaps(true);
            setEnableSearch(false);
            handleSendMessage('What emergency hospitals, police stations, and key transport junctions are located near University Circle (R102 corridor)?');
          }}
          className="shrink-0 bg-slate-950 hover:bg-slate-800 text-emerald-300 px-2 py-1 rounded border border-emerald-900 transition flex items-center gap-1"
        >
          <MapPin className="w-3 h-3 text-emerald-400" />
          Nearby Hospitals & Police (Maps Grounding)
        </button>
        <button
          onClick={() => {
            setEnableSearch(true);
            setEnableMaps(false);
            handleSendMessage('Search for recent road construction advisories, expressway blockages, and traffic diversions.');
          }}
          className="shrink-0 bg-slate-950 hover:bg-slate-800 text-blue-300 px-2 py-1 rounded border border-blue-900 transition flex items-center gap-1"
        >
          <Globe className="w-3 h-3 text-blue-400" />
          Recent Traffic Advisories (Search Grounding)
        </button>
        <button
          onClick={() => handleSendMessage('Simulate traffic impact and detour paths if Road R102 Central Metro Corridor is closed.')}
          className="shrink-0 bg-slate-950 hover:bg-slate-800 text-rose-300 px-2 py-1 rounded border border-rose-900 transition"
        >
          🚧 Simulate R102 Closure Detours
        </button>
      </div>

      {/* Bottom Message Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            enableMaps
              ? 'Ask for locations, emergency facilities, or landmarks (Google Maps Grounding active)...'
              : enableSearch
              ? 'Search real-time traffic rules, news, or advisories (Google Search Grounding active)...'
              : 'Ask Gemini about cameras, vehicle trajectories, or congestion forecasts...'
          }
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded transition shadow-md shadow-cyan-950/40 disabled:opacity-40 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

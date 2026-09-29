import React, { useState, useEffect, useRef } from 'react';
import { VoiceDispatch, VoiceIntentResult } from '../types';
import { api } from '../services/api';
import { voiceDispatcher } from '../services/voiceDispatcher';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Send,
  X,
  AlertTriangle,
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  Car,
  GitFork,
  Activity,
  Gauge,
  Compass,
  CornerDownRight
} from 'lucide-react';

interface VoiceDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteIntent: (intent: VoiceIntentResult) => void;
}

export const VoiceDispatcherModal: React.FC<VoiceDispatcherModalProps> = ({
  isOpen,
  onClose,
  onExecuteIntent
}) => {
  const [dispatches, setDispatches] = useState<VoiceDispatch[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastIntent, setLastIntent] = useState<VoiceIntentResult | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(voiceDispatcher.getMuted());
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [customBroadcastText, setCustomBroadcastText] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadDispatches();
  }, []);

  const loadDispatches = async () => {
    try {
      const data = await api.getVoiceDispatches();
      setDispatches(data);
    } catch {
      // Data in fallback
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    voiceDispatcher.setMuted(next);
  };

  const handlePlayDispatch = (disp: VoiceDispatch) => {
    setCurrentlyPlayingId(disp.id);
    voiceDispatcher.speakDispatch(disp.text, () => {
      setCurrentlyPlayingId(null);
    });
  };

  const handleStopSpeaking = () => {
    voiceDispatcher.stopSpeaking();
    setCurrentlyPlayingId(null);
  };

  // Web Speech Recognition
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('Speech Recognition is not supported by your browser. Please type your command below.');
      return;
    }

    try {
      recognitionRef.current = new SpeechRec();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognitionRef.current.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognitionRef.current.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          processTranscript(transcript);
        }
      };

      recognitionRef.current.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const intentRes = await api.parseVoiceIntent(text);
      setLastIntent(intentRes);

      // Speak confirmation reply back
      voiceDispatcher.speakDispatch(intentRes.reply);

      // Execute action
      onExecuteIntent(intentRes);
    } catch {
      // Handled
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processTranscript(manualInput);
    setManualInput('');
  };

  const handleBroadcastCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBroadcastText.trim()) return;
    const newDisp: VoiceDispatch = {
      id: `DISP-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      severity: 'HIGH',
      text: customBroadcastText,
      category: 'MANUAL_DISPATCH'
    };
    setDispatches([newDisp, ...dispatches]);
    handlePlayDispatch(newDisp);
    setCustomBroadcastText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-mono text-xs">
      <div className="bg-slate-900 border-2 border-cyan-500/80 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                  Gemini Live Voice Dispatcher & Incident Audio Console
                </h3>
                <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                  TAC-RADIO CHANNEL 1
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                PTP Radio Walkie Chimes · Hands-Free ANPR Voice Search · Motor Vehicles Act Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Loudspeaker Mute Toggle */}
            <button
              onClick={handleToggleMute}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition font-bold ${
                isMuted
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isMuted ? 'LOUDSPEAKER MUTED' : 'SPEAKER ACTIVE'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left = Voice-Activated Search / Intent; Right = Live Dispatch Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-y-auto">
          {/* Left Column: Voice Search & Intent Execution */}
          <div className="p-5 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Voice-Activated Command Center
                </span>
                <span className="text-[10px] text-slate-400">Web Speech + Gemini NLU</span>
              </div>

              {/* Big Push-To-Talk Microphone Button */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded border border-slate-800 space-y-3">
                <div className="relative">
                  {isListening && (
                    <span className="absolute -inset-3 rounded-full bg-cyan-500/30 animate-ping" />
                  )}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition shadow-2xl relative z-10 ${
                      isListening
                        ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <span className="font-bold text-xs uppercase text-slate-200 block">
                    {isListening ? 'LISTENING... SPEAK COMMAND' : 'CLICK TO SPEAK COMMAND'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isListening
                      ? 'Say: "Track plate MH12AB1234" or "Simulate closing University Circle"'
                      : 'Hands-free operator microphone'}
                  </p>
                </div>

                {/* Real-time speech transcript buffer */}
                {(transcript || isListening) && (
                  <div className="w-full bg-slate-900 border border-cyan-800 p-2.5 rounded text-center text-cyan-300 font-bold min-h-[36px]">
                    "{transcript || 'Waiting for speech input...'}"
                  </div>
                )}
              </div>

              {/* Quick Preset Voice Queries */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Quick Voice Command Simulation:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Track plate MH12AB1234', icon: Car },
                    { label: 'Simulate closing University Circle', icon: GitFork },
                    { label: 'Activate Green Wave Corridor', icon: Activity },
                    { label: 'Show Speed Violations', icon: Gauge },
                    { label: 'Inspect Commuter Flows', icon: Compass }
                  ].map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => processTranscript(cmd.label)}
                      className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2 rounded text-left transition flex items-center gap-2 group"
                    >
                      <cmd.icon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
                      <span className="truncate">{cmd.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Fallback */}
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Type voice query (e.g., Track plate MH12AB1234)..."
                    className="flex-1 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-3 py-1.5 rounded font-bold transition flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Run</span>
                  </button>
                </div>
              </form>

              {/* Last Executed Intent Confirmation Card */}
              {lastIntent && (
                <div className="bg-slate-950 p-3 rounded border border-emerald-800 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="uppercase">EXECUTED INTENT: {lastIntent.intent}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{lastIntent.reply}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Audio Incident Dispatch & Broadcast Feed */}
          <div className="p-5 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  Tactical Control Room Announcements
                </span>
                <span className="text-[10px] text-slate-400">Dual-Chirp Walkie Audio</span>
              </div>

              {/* Active Announcements List */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {dispatches.map((disp) => {
                  const isPlaying = currentlyPlayingId === disp.id;
                  return (
                    <div
                      key={disp.id}
                      className={`p-3 rounded border transition ${
                        isPlaying
                          ? 'bg-amber-950/60 border-amber-500 shadow-lg'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] pb-1 border-b border-slate-800/80 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                              disp.severity === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : disp.severity === 'HIGH'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            }`}
                          >
                            {disp.severity}
                          </span>
                          <span className="text-slate-400">{disp.category}</span>
                        </div>
                        <span className="text-slate-500">{disp.timestamp} UTC</span>
                      </div>

                      <p className="text-[11px] text-slate-200 mb-2 leading-relaxed">
                        "{disp.text}"
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-cyan-400" />
                          <span>PTP 880Hz / 1174Hz Chime</span>
                        </span>

                        {isPlaying ? (
                          <button
                            onClick={handleStopSpeaking}
                            className="bg-rose-600 text-white px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 text-[10px]"
                          >
                            <Square className="w-3 h-3 fill-current" />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePlayDispatch(disp)}
                            className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-700/80 px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 text-[10px]"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Play Audio</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Dispatch Broadcaster */}
              <form onSubmit={handleBroadcastCustom} className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Broadcast Custom Dispatch Over Tactical Audio:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customBroadcastText}
                    onChange={(e) => setCustomBroadcastText(e.target.value)}
                    placeholder="Enter dispatch text to broadcast aloud..."
                    className="flex-1 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 py-1.5 rounded font-bold transition flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Broadcast</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>URBANTRACK Municipal Cyber Command · Tactical Radio Relay</span>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 font-bold"
          >
            Close Audio Console (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

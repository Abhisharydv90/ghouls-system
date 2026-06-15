"use client";

import { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, ShieldAlert, Activity, Send, AlertTriangle, CheckCircle, XCircle, Eye, MonitorPlay } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [directive, setDirective] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAwaitingAuth, setIsAwaitingAuth] = useState(false);
  
  // View Toggle State (Terminal vs Preview)
  const [viewMode, setViewMode] = useState('terminal'); // 'terminal' | 'preview'
  const [previewHtml, setPreviewHtml] = useState(''); // Stores the raw code to render
  
  // Telemetry & Log State
  const [logs, setLogs] = useState([
    { id: 1, type: 'info', text: 'Initializing WebSockets... searching for Ghouls Engine on Port 4000.' }
  ]);
  const [activeNodes, setActiveNodes] = useState([]);
  const [pipelineSteps, setPipelineSteps] = useState([]);
  
  const terminalEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, viewMode]);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
    socketRef.current = io(backendUrl);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setLogs(prev => [...prev, { id: Date.now(), type: 'system', text: `[SECURE CONNECTION ESTABLISHED // ${backendUrl}]` }]);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      setLogs(prev => [...prev, { id: Date.now(), type: 'warning', text: 'WARNING: Connection to Engine lost. Attempting to reconnect...' }]);
    });

    socketRef.current.on('agent:thought', (data) => {
      setLogs(prev => [...prev, { id: Date.now() + Math.random(), type: 'info', text: `[${data.agent}]: ${data.message}` }]);
      if (data.message.includes('requires manual authorization')) setIsAwaitingAuth(true);
    });

    socketRef.current.on('agent:log', (data) => {
      setLogs(prev => [...prev, { id: Date.now() + Math.random(), type: 'success', text: `[${data.agent}]: ${data.message}` }]);
      if (data.message.includes('requires manual authorization')) setIsAwaitingAuth(true);
    });

    socketRef.current.on('telemetry:node_spawned', (data) => {
      setActiveNodes(prev => {
        if (!prev.find(n => n.agent === data.agent)) return [...prev, data];
        return prev;
      });
    });

    socketRef.current.on('telemetry:pipeline_update', (data) => {
      setPipelineSteps(prev => [data, ...prev]);
      setActiveNodes(prevNodes => 
        prevNodes.map(node => node.agent === data.agent ? { ...node, status: data.status } : node)
      );

      // --- THE PREVIEW CAPTURE LOGIC ---
      if (data.agent === 'Dev_Agent' && data.stdout && data.stdout.includes('<html')) {
        setPreviewHtml(data.stdout);
        setViewMode('preview'); 
      }
    });

    return () => socketRef.current.disconnect();
  }, []);

  const handleExecute = () => {
    if (!directive.trim() || !isConnected) return;
    setLogs(prev => [...prev, { id: Date.now(), type: 'user', text: `guest@ghouls-os:~$ ${directive}` }]);
    socketRef.current.emit('command:execute', { command: directive });
    setDirective('');
    setPipelineSteps([]); 
    setPreviewHtml(''); 
    setViewMode('terminal'); 
  };

  const handleAuthorize = () => {
    setLogs(prev => [...prev, { id: Date.now(), type: 'user', text: `[SYSTEM OVERRIDE]: Payload Authorized by Human.` }]);
    socketRef.current.emit('command:authorize', { auth: 'yes' });
    setIsAwaitingAuth(false);
  };

  return (
    // RESPONSIVE FIX: Changed 'h-screen overflow-hidden' to 'min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden'
    <div className="flex flex-col min-h-screen lg:h-screen w-full p-4 sm:p-6 bg-black font-mono selection:bg-green-500/30 selection:text-green-300 overflow-y-auto lg:overflow-hidden">
      
      {/* Upper Status Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-green-900/30 pb-4 gap-4 shrink-0 mt-2 lg:mt-0">
        <div>
          <h2 className="text-xl font-bold text-green-500 tracking-wider flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500 animate-pulse" />
            Neural Bridge Interface
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Cloud Core Loop Runtime v6.0.0</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center px-3 py-1.5 rounded text-xs font-semibold tracking-widest border ${isConnected ? 'bg-green-950/30 border-green-500/30 text-green-400' : 'bg-red-950/30 border-red-500/30 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'SYS_ONLINE' : 'SYS_OFFLINE'}
          </div>
        </div>
      </div>

      {/* Metrics Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="border border-gray-800 bg-gray-950/40 p-4 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active Employees</p>
            <p className="text-lg font-bold text-gray-200">{activeNodes.length > 0 ? activeNodes.length : 'Standby'}</p>
          </div>
          <Cpu className="w-8 h-8 text-green-600/60" />
        </div>
        
        <div className={`border p-4 rounded-lg flex items-center justify-between transition-all ${isAwaitingAuth ? 'bg-red-950/40 border-red-900/50' : 'bg-gray-950/40 border-gray-800'}`}>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Security Layer</p>
            <p className={`text-lg font-bold ${isAwaitingAuth ? 'text-red-500 animate-pulse' : 'text-gray-200'}`}>
              {isAwaitingAuth ? 'AUTHORIZATION REQ' : 'Killswitch Disarmed'}
            </p>
          </div>
          <ShieldAlert className={`w-8 h-8 ${isAwaitingAuth ? 'text-red-500' : 'text-yellow-600/60'}`} />
        </div>
      </div>

      {/* MAIN 3-PANEL COMMAND CENTER */}
      {/* RESPONSIVE FIX: Used 'flex flex-col lg:grid' to force vertical stacking safely on mobile */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 mb-6 lg:min-h-0 lg:overflow-hidden">
        
        {/* PANEL 1: ACTIVE SWARM GRAPH */}
        {/* RESPONSIVE FIX: Fixed height of h-[300px] on mobile so it doesn't crush */}
        <div className="lg:col-span-3 border border-green-900/20 bg-gray-950/20 rounded-xl overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm flex flex-col h-[300px] lg:h-auto">
          <div className="bg-gray-950 px-4 py-2.5 border-b border-gray-900 flex items-center text-xs text-green-500 font-bold uppercase tracking-widest shrink-0">
            <Activity className="w-4 h-4 mr-2" /> Swarm Nodes
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
            <AnimatePresence>
              {activeNodes.map((node, idx) => (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={idx} className="bg-black border border-green-900/40 p-3 rounded flex justify-between items-center">
                  <span className="text-green-400 font-semibold text-xs tracking-wider">{node.agent}</span>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-widest ${
                    node.status === 'PROCESSING' ? 'bg-blue-900/40 text-blue-400 animate-pulse border border-blue-500/30' :
                    node.status === 'CRASHED' ? 'bg-red-900/40 text-red-400 border border-red-500/30' : 
                    node.status === 'COMPLETED' ? 'bg-green-900/40 text-green-400 border border-green-500/30' :
                    'bg-gray-900 text-gray-500 border border-gray-800'
                  }`}>
                    {node.status || 'STANDBY'}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {activeNodes.length === 0 && <p className="text-gray-600 text-xs italic mt-2">Awaiting Architect assignment...</p>}
          </div>
        </div>

        {/* PANEL 2: RAW TERMINAL STREAM OR LIVE PREVIEW */}
        {/* RESPONSIVE FIX: Taller h-[400px] on mobile to read logs easily */}
        <div className="lg:col-span-6 border border-green-900/20 bg-gray-950/20 rounded-xl overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm flex flex-col relative h-[400px] lg:h-auto">
          
          <div className="bg-gray-950 px-4 py-2 border-b border-gray-900 flex flex-wrap gap-2 items-center justify-between text-xs text-gray-400 shrink-0 z-10">
            <div className="flex items-center gap-2">
              {viewMode === 'terminal' ? <Terminal className="w-4 h-4 text-green-500" /> : <MonitorPlay className="w-4 h-4 text-blue-400" />}
              <span className="truncate max-w-[150px] sm:max-w-none">{viewMode === 'terminal' ? 'ghouls_runtime_console.sh' : 'live_render_preview.jsx'}</span>
            </div>
            
            <div className="flex bg-black rounded border border-gray-800 p-0.5 shrink-0">
              <button 
                onClick={() => setViewMode('terminal')}
                className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider transition-colors ${viewMode === 'terminal' ? 'bg-green-900/50 text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                LOGS
              </button>
              <button 
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider transition-colors ${viewMode === 'preview' ? 'bg-blue-900/50 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                PREVIEW
              </button>
            </div>
          </div>

          {viewMode === 'terminal' ? (
            <div className="flex-1 p-4 sm:p-6 space-y-2 overflow-y-auto text-[11px] sm:text-sm scrollbar-thin">
              {logs.map((log) => (
                <div key={log.id} className="leading-relaxed break-all">
                  {log.type === 'system' && <span className="text-blue-400 font-semibold">{log.text}</span>}
                  {log.type === 'info' && <span className="text-gray-400">{log.text}</span>}
                  {log.type === 'success' && <span className="text-green-400">✓ {log.text}</span>}
                  {log.type === 'warning' && <span className="text-red-400 font-medium">⚠️ {log.text}</span>}
                  {log.type === 'user' && <span className="text-purple-400 font-bold">{log.text}</span>}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          ) : (
            <div className="flex-1 w-full h-full bg-white relative">
               {previewHtml ? (
                 <iframe 
                   srcDoc={previewHtml} 
                   title="Live Preview" 
                   className="w-full h-full border-none absolute inset-0"
                   sandbox="allow-scripts allow-same-origin"
                 />
               ) : (
                 <div className="flex h-full items-center justify-center bg-gray-900 text-gray-500 text-xs sm:text-sm italic">
                   Awaiting frontend components to render...
                 </div>
               )}
            </div>
          )}
        </div>

        {/* PANEL 3: PIPELINE HISTORY */}
        {/* RESPONSIVE FIX: Fixed height of h-[300px] on mobile */}
        <div className="lg:col-span-3 border border-green-900/20 bg-gray-950/20 rounded-xl overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm flex flex-col h-[300px] lg:h-auto">
          <div className="bg-gray-950 px-4 py-2.5 border-b border-gray-900 flex items-center text-xs text-blue-400 font-bold uppercase tracking-widest shrink-0">
            <Eye className="w-4 h-4 mr-2" /> Pipeline
          </div>
          <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
            <div className="space-y-4 border-l border-gray-800 ml-2 pl-4 mt-2">
              <AnimatePresence>
                {pipelineSteps.map((step, idx) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className="relative">
                    <div className={`absolute -left-[21px] top-0 rounded-full bg-black ${
                      step.status === 'COMPLETED' ? 'text-green-500' : 
                      step.status === 'CRASHED' ? 'text-red-500' : 'text-blue-500'
                    }`}>
                      {step.status === 'COMPLETED' ? <CheckCircle size={14}/> : step.status === 'CRASHED' ? <XCircle size={14}/> : <Activity size={14}/>}
                    </div>
                    <h3 className="text-xs font-bold text-gray-200 mb-1">{step.agent} <span className="text-gray-600 text-[10px]">| STEP {step.step || '*'}</span></h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{step.description || step.explanation}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      {/* Command Input & Visual Killswitch Panel */}
      {/* RESPONSIVE FIX: Added pb-8 on mobile to avoid the iOS swipe bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center shrink-0 pb-8 lg:pb-0">
        {isAwaitingAuth ? (
          <button 
            onClick={handleAuthorize}
            className="w-full bg-red-950/60 text-red-500 border border-red-500/50 py-4 rounded-xl hover:bg-red-900/60 hover:text-red-300 font-bold tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-3"
          >
            <AlertTriangle className="w-5 h-5" />
            AUTHORIZE PAYLOAD
          </button>
        ) : (
          <>
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold text-base select-none">$</span>
              <input 
                type="text" 
                value={directive}
                onChange={(e) => setDirective(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                disabled={!isConnected}
                placeholder={isConnected ? "Enter directive..." : "Awaiting connection..."} 
                className="w-full bg-gray-950/60 border border-green-900/40 text-green-400 pl-9 pr-4 py-4 rounded-xl focus:outline-none focus:border-green-500/80 focus:ring-1 focus:ring-green-500/30 font-mono transition-all placeholder:text-gray-700 text-sm disabled:opacity-50"
              />
            </div>
            <button 
              onClick={handleExecute}
              disabled={!isConnected}
              className="w-full sm:w-auto bg-green-950/40 text-green-400 border border-green-500/40 px-6 sm:px-10 h-[54px] rounded-xl hover:bg-green-900/40 hover:text-green-200 active:scale-[0.98] font-bold tracking-widest transition-all text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 group disabled:opacity-50 disabled:hover:bg-green-950/40"
            >
              EXECUTE
              <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
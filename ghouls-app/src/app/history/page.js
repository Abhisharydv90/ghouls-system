"use client";

import { useState, useEffect, useRef } from 'react';
import { Database, Search, TerminalSquare, AlertTriangle, BrainCircuit, Activity, Server, Clock, Coins, Play, ChevronRight, Code } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryLogs() {
  const [isConnected, setIsConnected] = useState(false);
  const [historyData, setHistoryData] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [playbackStep, setPlaybackStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const socketRef = useRef(null);

  useEffect(() => {
    // CLOUD DEPLOYMENT FIX: Dynamic Environment Variable Routing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
    socketRef.current = io(backendUrl);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('history:fetch');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    // Receive the JSON database array and Group it by Project
    socketRef.current.on('history:data', (data) => {
      const grouped = data.reduce((acc, log) => {
        // Group by project name, fallback to 'System Operations' if none
        const projName = log.project || 'System Operations';
        if (!acc[projName]) acc[projName] = [];
        acc[projName].push(log);
        return acc;
      }, {});
      setHistoryData(grouped);
    });

    // Listen for live updates
    socketRef.current.on('agent:thought', () => socketRef.current.emit('history:fetch'));
    socketRef.current.on('agent:log', () => socketRef.current.emit('history:fetch'));
    socketRef.current.on('telemetry:pipeline_update', () => socketRef.current.emit('history:fetch'));

    return () => socketRef.current.disconnect();
  }, []);

  // --- PLAYBACK ENGINE LOGIC ---
  useEffect(() => {
    let interval;
    if (isPlaying && selectedProject && playbackStep < historyData[selectedProject].length - 1) {
      interval = setInterval(() => {
        setPlaybackStep(prev => prev + 1);
      }, 800); // Speed of the playback animation (800ms per node)
    } else if (playbackStep >= (selectedProject ? historyData[selectedProject].length - 1 : 0)) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackStep, selectedProject, historyData]);

  const handleSelectProject = (projectName) => {
    // Sort chronologically (oldest to newest) for playback
    const sortedLogs = [...historyData[projectName]].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setHistoryData(prev => ({ ...prev, [projectName]: sortedLogs }));
    setSelectedProject(projectName);
    setPlaybackStep(0);
    setIsPlaying(false);
  };

  const filteredProjects = Object.keys(historyData).filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to color-code log types (Your original design!)
  const getLogStyle = (type, status) => {
    if (status === 'CRASHED') return { icon: <AlertTriangle className="w-4 h-4 text-red-500" />, border: 'border-red-900/50', bg: 'bg-red-950/20' };
    if (status === 'COMPLETED') return { icon: <Activity className="w-4 h-4 text-green-500" />, border: 'border-green-900/30', bg: 'bg-green-950/10' };
    
    switch(type) {
      case 'system': return { icon: <AlertTriangle className="w-4 h-4 text-red-500" />, border: 'border-red-900/50', bg: 'bg-red-950/20' };
      case 'thought': return { icon: <BrainCircuit className="w-4 h-4 text-blue-400" />, border: 'border-blue-900/30', bg: 'bg-blue-950/10' };
      case 'log': return { icon: <TerminalSquare className="w-4 h-4 text-green-500" />, border: 'border-green-900/30', bg: 'bg-green-950/10' };
      case 'telemetry': return { icon: <Code className="w-4 h-4 text-purple-400" />, border: 'border-purple-900/30', bg: 'bg-purple-950/10' };
      default: return { icon: <Activity className="w-4 h-4 text-gray-500" />, border: 'border-gray-800', bg: 'bg-gray-900/20' };
    }
  };

  return (
    <div className="flex flex-col h-screen w-full p-6 bg-black font-mono selection:bg-green-500/30 selection:text-green-300 overflow-hidden">
      
      {/* Top Banner Ribbon (Your original design preserved) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-green-900/30 pb-4 gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-green-500 tracking-wider flex items-center gap-2">
            <Database className="w-5 h-5 text-green-500" />
            System Event Matrix
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Immutable Playback Engine // Ghouls OS</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`flex items-center px-3 py-1.5 rounded text-xs font-semibold tracking-widest border whitespace-nowrap ${isConnected ? 'bg-green-950/30 border-green-500/30 text-green-400' : 'bg-red-950/30 border-red-500/30 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'DB_ONLINE' : 'DB_OFFLINE'}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT PANEL: PROJECT DIRECTORY */}
        <div className="lg:col-span-4 flex flex-col border border-green-900/20 bg-gray-950/20 rounded-xl overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          <div className="p-4 border-b border-gray-900">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Query matrix logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-green-400 text-xs rounded py-2 pl-9 pr-3 focus:outline-none focus:border-green-500/50 transition-colors placeholder-gray-700"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {filteredProjects.map((projectName) => (
              <button 
                key={projectName}
                onClick={() => handleSelectProject(projectName)}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all ${
                  selectedProject === projectName 
                  ? 'bg-green-900/30 border border-green-500/40 text-green-400' 
                  : 'bg-black border border-gray-900 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TerminalSquare className="w-4 h-4" />
                  <span className="font-bold text-sm tracking-wide">{projectName}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            ))}
            {filteredProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50">
                <Server className="w-8 h-8 mb-2" />
                <p className="text-xs">No records found.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: PLAYBACK VIEWER */}
        <div className="lg:col-span-8 flex flex-col border border-green-900/20 bg-gray-950/20 rounded-xl overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm relative">
          
          {selectedProject ? (
            <>
              {/* Playback Controls */}
              <div className="bg-gray-950 px-4 py-3 border-b border-gray-900 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Reconstructing: {selectedProject}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setPlaybackStep(0); setIsPlaying(false); }}
                    className="px-3 py-1 bg-gray-900 text-gray-400 border border-gray-800 rounded text-xs hover:bg-gray-800 transition-colors"
                  >
                    RESET
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-4 py-1 bg-green-900/40 text-green-400 border border-green-500/40 rounded text-xs font-bold flex items-center gap-2 hover:bg-green-800/60 transition-colors"
                  >
                    {isPlaying ? 'PAUSE' : <><Play className="w-3 h-3"/> PLAY SEQUENCE</>}
                  </button>
                </div>
              </div>

              {/* Step Visualizer Canvas */}
              <div className="flex-1 p-6 overflow-y-auto bg-black relative scrollbar-thin pb-20">
                <div className="max-w-3xl mx-auto border-l-2 border-gray-800 pl-6 ml-4 space-y-6">
                  <AnimatePresence>
                    {historyData[selectedProject].slice(0, playbackStep + 1).map((log, idx) => {
                      const style = getLogStyle(log.type, log.status);
                      const date = new Date(log.timestamp);
                      const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;

                      return (
                        <motion.div 
                          initial={{ opacity: 0, x: -20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          key={log.id} 
                          className={`relative border rounded-lg p-4 shadow-lg ${style.bg} ${style.border}`}
                        >
                          {/* Timeline Node Connector */}
                          <div className={`absolute -left-[35px] top-4 w-4 h-4 rounded-full border-4 border-black ${
                            log.status === 'CRASHED' || log.type === 'system' ? 'bg-red-500' : 'bg-green-500'
                          }`} />
                          
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {style.icon}
                              <h3 className="text-sm font-bold text-gray-200 tracking-widest uppercase">{log.agent}</h3>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">{formattedTime}</span>
                          </div>

                          {/* Your Custom Metrics Overlay */}
                          {log.metrics && (
                            <div className="flex items-center gap-2 mb-3 mt-1">
                              {log.metrics.latency && (
                                <span className="flex items-center gap-1 text-[10px] text-yellow-500/80 bg-yellow-950/30 px-2 py-0.5 rounded border border-yellow-900/30">
                                  <Clock className="w-3 h-3" /> {log.metrics.latency}
                                </span>
                              )}
                              {log.metrics.cost && (
                                <span className="flex items-center gap-1 text-[10px] text-green-500/80 bg-green-950/30 px-2 py-0.5 rounded border border-green-900/30">
                                  <Coins className="w-3 h-3" /> {log.metrics.cost}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-300 font-mono leading-relaxed break-words">
                            {log.description || log.message}
                          </p>

                          {/* Error or Action Details */}
                          {(log.stderr || log.action) && (
                            <div className="mt-3 bg-black border border-gray-800 rounded p-3 font-mono text-[10px] overflow-x-auto">
                              {log.action && <div className="text-blue-400 mb-1">Action: {log.action}</div>}
                              {log.stderr && <div className="text-red-400 mt-2">Error Trace: {log.stderr}</div>}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-gray-950/30">
              <Database className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-gray-400 font-bold tracking-widest mb-2">NO MATRIX SELECTED</h3>
              <p className="text-xs">Select a project directory from the left to engage the playback engine.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
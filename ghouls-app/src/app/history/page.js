"use client";

import { useState, useEffect, useRef } from 'react';
import { Database, Search, TerminalSquare, AlertTriangle, BrainCircuit, Activity, Server, Clock, Coins } from 'lucide-react';
import { io } from 'socket.io-client';

export default function HistoryLogs() {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    // CLOUD DEPLOYMENT FIX: Dynamic Environment Variable Routing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
    socketRef.current = io(backendUrl);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      // Request the full database payload on connection
      socketRef.current.emit('history:fetch');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    // Receive the JSON database array
    socketRef.current.on('history:data', (data) => {
      setLogs(data);
    });

    // Listen for live updates so the page updates in real-time
    socketRef.current.on('agent:thought', () => socketRef.current.emit('history:fetch'));
    socketRef.current.on('agent:log', () => socketRef.current.emit('history:fetch'));

    return () => socketRef.current.disconnect();
  }, []);

  // Filter logic for the search bar
  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.agent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to color-code log types
  const getLogStyle = (type) => {
    switch(type) {
      case 'system': return { icon: <AlertTriangle className="w-4 h-4 text-red-500" />, border: 'border-red-900/50', bg: 'bg-red-950/20' };
      case 'thought': return { icon: <BrainCircuit className="w-4 h-4 text-blue-400" />, border: 'border-blue-900/30', bg: 'bg-blue-950/10' };
      case 'log': return { icon: <TerminalSquare className="w-4 h-4 text-green-500" />, border: 'border-green-900/30', bg: 'bg-green-950/10' };
      default: return { icon: <Activity className="w-4 h-4 text-gray-500" />, border: 'border-gray-800', bg: 'bg-gray-900/20' };
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-6 bg-black font-mono selection:bg-green-500/30 selection:text-green-300 overflow-y-auto">
      
      {/* Top Banner Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-green-900/30 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-green-500 tracking-wider flex items-center gap-2">
            <Database className="w-5 h-5 text-green-500" />
            System Event Matrix
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Immutable Runtime Ledger // Ghouls OS</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Query matrix..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-green-400 text-xs rounded py-1.5 pl-9 pr-3 focus:outline-none focus:border-green-500/50 transition-colors placeholder-gray-700"
            />
          </div>
          <div className={`flex items-center px-3 py-1.5 rounded text-xs font-semibold tracking-widest border whitespace-nowrap ${isConnected ? 'bg-green-950/30 border-green-500/30 text-green-400' : 'bg-red-950/30 border-red-500/30 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'DB_ONLINE' : 'DB_OFFLINE'}
          </div>
        </div>
      </div>

      {/* Empty State Fallback */}
      {logs.length === 0 && isConnected && (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-xl bg-gray-950/20 p-8 text-center my-auto min-h-[300px]">
          <Server className="w-12 h-12 text-gray-700 mb-4" />
          <h3 className="text-gray-400 font-bold tracking-widest mb-2">NO RECORDS FOUND</h3>
          <p className="text-xs text-gray-600 max-w-md">
            The immutable ledger is empty. Execute a directive in the Dashboard terminal to begin logging telemetry.
          </p>
        </div>
      )}

      {/* The Ledger Feed */}
      <div className="flex flex-col gap-3 pb-10">
        {filteredLogs.map((log) => {
          const style = getLogStyle(log.type);
          const date = new Date(log.timestamp);
          const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;

          return (
            <div key={log.id} className={`flex items-start gap-4 p-3 border rounded-lg ${style.border} ${style.bg} hover:bg-opacity-50 transition-colors`}>
              {/* Icon Status */}
              <div className="mt-0.5 p-1.5 bg-black/40 rounded border border-gray-800/50 flex-shrink-0">
                {style.icon}
              </div>
              
              {/* Log Data */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1 justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{log.agent}</span>
                    <span className="text-[10px] text-gray-600 font-mono">{formattedTime}</span>
                  </div>
                  
                  {/* METRICS DISPLAY: Latency and Cost */}
                  {log.metrics && (
                    <div className="flex items-center gap-2">
                      {log.metrics.latency && (
                        <span className="flex items-center gap-1 text-[10px] text-yellow-500/80 bg-yellow-950/30 px-1.5 py-0.5 rounded border border-yellow-900/30">
                          <Clock className="w-3 h-3" /> {log.metrics.latency}
                        </span>
                      )}
                      {log.metrics.cost && (
                        <span className="flex items-center gap-1 text-[10px] text-green-500/80 bg-green-950/30 px-1.5 py-0.5 rounded border border-green-900/30">
                          <Coins className="w-3 h-3" /> {log.metrics.cost}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed break-words">
                  {log.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from 'react';
import { CalendarClock, Plus, Trash2, Clock, TerminalSquare } from 'lucide-react';
import { io } from 'socket.io-client';

export default function DailyRoutines() {
  const [isConnected, setIsConnected] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [newRoutine, setNewRoutine] = useState({ name: '', cron: '0 9 * * *', command: '' });
  const socketRef = useRef(null);

  useEffect(() => {
    // CLOUD DEPLOYMENT FIX: Dynamic Environment Variable Routing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
    socketRef.current = io(backendUrl);
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('routine:fetch');
    });
    
    socketRef.current.on('routine:list', (data) => setRoutines(data));
    return () => socketRef.current.disconnect();
  }, []);

  const addRoutine = () => {
    if (newRoutine.name && newRoutine.command) {
      socketRef.current.emit('routine:add', newRoutine);
      setNewRoutine({ name: '', cron: '0 9 * * *', command: '' });
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-6 bg-black font-mono text-green-400">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-green-900 pb-4">
        <CalendarClock className="text-green-500" /> Daily Routines
      </h2>

      {/* Routine Input Form */}
      <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] text-gray-500 uppercase">Routine Name</label>
          <input className="w-full bg-black border border-gray-700 p-2 rounded text-xs mt-1" placeholder="Morning Scrape" value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})} />
        </div>
        <div className="w-32">
          <label className="text-[10px] text-gray-500 uppercase">Cron (m h d m dw)</label>
          <input className="w-full bg-black border border-gray-700 p-2 rounded text-xs mt-1" value={newRoutine.cron} onChange={e => setNewRoutine({...newRoutine, cron: e.target.value})} />
        </div>
        <div className="flex-[2] min-w-[250px]">
          <label className="text-[10px] text-gray-500 uppercase">Directive</label>
          <input className="w-full bg-black border border-gray-700 p-2 rounded text-xs mt-1" placeholder="Search for new AI trends..." value={newRoutine.command} onChange={e => setNewRoutine({...newRoutine, command: e.target.value})} />
        </div>
        <button onClick={addRoutine} className="bg-green-950 text-green-400 px-4 py-2 rounded text-xs font-bold hover:bg-green-900 transition-all flex items-center gap-2 border border-green-500/50">
          <Plus className="w-4 h-4" /> ACTIVATE
        </button>
      </div>

      {/* Active Routines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routines.map((r, i) => (
          <div key={i} className="bg-gray-900/40 p-4 rounded border border-gray-800 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm tracking-widest">{r.name}</h4>
              <p className="text-[10px] text-gray-500 mt-1 font-mono">CRON: {r.cron}</p>
            </div>
            <Clock className="text-green-500/30 w-8 h-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from 'react';
import { FolderGit2, Activity, Server, Plus, ChevronRight, TerminalSquare, Cpu, X, FileText } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Workflows() {
  const [isConnected, setIsConnected] = useState(false);
  const [projects, setProjects] = useState([]);
  
  // New state for the Matrix Viewer Overlay
  const [activeMatrix, setActiveMatrix] = useState(null);
  const [selectedFileContent, setSelectedFileContent] = useState("");
  
  const socketRef = useRef(null);

  useEffect(() => {
    // CLOUD DEPLOYMENT FIX: Dynamic Environment Variable Routing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
    socketRef.current = io(backendUrl);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('workspace:fetch');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('workspace:list', (data) => {
      setProjects(data);
    });

    // Listen for the file payload requested from the backend
    socketRef.current.on('workspace:project_data', (data) => {
      setActiveMatrix(data);
      // Automatically select the first file in the array to view
      if (data.files && data.files.length > 0) {
          setSelectedFileContent(data.files[0].content);
      } else {
          setSelectedFileContent("// No compiled files found in this workspace buffer.");
      }
    });

    return () => socketRef.current.disconnect();
  }, []);

  const openMatrix = (projectName) => {
      socketRef.current.emit('workspace:read_project', projectName);
  };

  const closeMatrix = () => {
      setActiveMatrix(null);
      setSelectedFileContent("");
  };

  return (
    <div className="flex flex-col h-full w-full p-6 bg-black font-mono selection:bg-green-500/30 selection:text-green-300 overflow-y-auto relative">
      
      {/* Top Banner Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-green-900/30 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-green-500 tracking-wider flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-green-500" />
            Project Workflows
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Active Workspace Matrix // Ghouls OS</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center px-3 py-1.5 rounded text-xs font-semibold tracking-widest border ${isConnected ? 'bg-green-950/30 border-green-500/30 text-green-400' : 'bg-red-950/30 border-red-500/30 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'SYS_ONLINE' : 'SYS_OFFLINE'}
          </div>
          <button className="bg-green-950/40 text-green-400 border border-green-500/40 px-4 py-1.5 rounded hover:bg-green-900/40 transition-all text-xs font-bold flex items-center gap-2 group">
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            NEW DIRECTIVE
          </button>
        </div>
      </div>

      {projects.length === 0 && isConnected && (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-xl bg-gray-950/20 p-8 text-center my-auto min-h-[300px]">
          <Server className="w-12 h-12 text-gray-700 mb-4" />
          <h3 className="text-gray-400 font-bold tracking-widest mb-2">NO ACTIVE WORKSPACES</h3>
          <p className="text-xs text-gray-600 max-w-md">
            The workspace directory is currently empty. Initialize a folder inside your directory or issue a script command to populate.
          </p>
        </div>
      )}

      {/* Primary Projects Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, idx) => (
          <div 
            key={idx} 
            onClick={() => openMatrix(project.name)}
            className="group relative border border-gray-800 bg-gray-950/40 rounded-xl p-5 hover:border-green-500/50 hover:bg-gray-900/60 transition-all cursor-pointer overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-900 border border-gray-700 p-2 rounded-lg group-hover:border-green-500/40 group-hover:text-green-400 transition-colors">
                    <TerminalSquare className="w-5 h-5 text-gray-400 group-hover:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-200 tracking-wider group-hover:text-green-300 transition-colors truncate max-w-[160px]">
                      {project.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{project.path}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Agent Status</span>
                  <div className="flex items-center gap-1.5 text-yellow-500">
                    <Activity className="w-3 h-3" />
                    <span className="font-semibold tracking-widest">{project.status}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Allocated Cores</span>
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Cpu className="w-3 h-3" />
                    <span className="font-semibold tracking-widest">AUTO</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800/60 pt-4 flex justify-between items-center">
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">Memory Indexed</span>
                <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-green-400 transition-colors font-bold">
                  ACCESS Matrix <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- THE MATRIX VIEWER OVERLAY --- */}
      {activeMatrix && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-5xl h-[80vh] bg-gray-950 border border-green-500/40 rounded-xl flex flex-col shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-black">
                    <div className="flex items-center gap-3">
                        <TerminalSquare className="w-5 h-5 text-green-500" />
                        <div>
                            <h3 className="font-bold text-gray-200 tracking-wider">PROJECT: {activeMatrix.projectName.toUpperCase()}</h3>
                            <p className="text-[10px] text-gray-500 font-mono">/workspace/{activeMatrix.projectName}</p>
                        </div>
                    </div>
                    <button onClick={closeMatrix} className="text-gray-500 hover:text-red-500 transition-colors bg-gray-900 p-1.5 rounded hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body: Two Columns */}
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* Left Sidebar: File List */}
                    <div className="w-64 border-r border-gray-800 bg-black/50 p-4 flex flex-col gap-2 overflow-y-auto">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Compiled Assets</span>
                        {activeMatrix.files && activeMatrix.files.length > 0 ? (
                            activeMatrix.files.map((file, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setSelectedFileContent(file.content)}
                                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-green-400 cursor-pointer p-2 rounded hover:bg-gray-900 border border-transparent hover:border-gray-800 transition-all"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span className="truncate">{file.name}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-gray-600 italic px-2">No files initialized.</div>
                        )}
                    </div>

                    {/* Right Panel: Code/Text Viewer */}
                    <div className="flex-1 bg-gray-950 p-6 overflow-y-auto custom-scrollbar">
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                            {selectedFileContent}
                        </pre>
                    </div>

                </div>
            </div>
        </div>
      )}

    </div>
  );
}"use client";

import { useState, useEffect, useRef } from 'react';
import { FolderGit2, Activity, Server, Plus, ChevronRight, TerminalSquare, Cpu, X, FileText } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Workflows() {
  const [isConnected, setIsConnected] = useState(false);
  const [projects, setProjects] = useState([]);
  
  // New state for the Matrix Viewer Overlay
  const [activeMatrix, setActiveMatrix] = useState(null);
  const [selectedFileContent, setSelectedFileContent] = useState("");
  
  const socketRef = useRef(null);

  useEffect(() => {
    // CLOUD DEPLOYMENT FIX: Dynamic Environment Variable Routing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
    socketRef.current = io(backendUrl);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('workspace:fetch');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('workspace:list', (data) => {
      setProjects(data);
    });

    // Listen for the file payload requested from the backend
    socketRef.current.on('workspace:project_data', (data) => {
      setActiveMatrix(data);
      // Automatically select the first file in the array to view
      if (data.files && data.files.length > 0) {
          setSelectedFileContent(data.files[0].content);
      } else {
          setSelectedFileContent("// No compiled files found in this workspace buffer.");
      }
    });

    return () => socketRef.current.disconnect();
  }, []);

  const openMatrix = (projectName) => {
      socketRef.current.emit('workspace:read_project', projectName);
  };

  const closeMatrix = () => {
      setActiveMatrix(null);
      setSelectedFileContent("");
  };

  return (
    <div className="flex flex-col h-full w-full p-6 bg-black font-mono selection:bg-green-500/30 selection:text-green-300 overflow-y-auto relative">
      
      {/* Top Banner Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-green-900/30 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-green-500 tracking-wider flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-green-500" />
            Project Workflows
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Active Workspace Matrix // Ghouls OS</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center px-3 py-1.5 rounded text-xs font-semibold tracking-widest border ${isConnected ? 'bg-green-950/30 border-green-500/30 text-green-400' : 'bg-red-950/30 border-red-500/30 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'SYS_ONLINE' : 'SYS_OFFLINE'}
          </div>
          <button className="bg-green-950/40 text-green-400 border border-green-500/40 px-4 py-1.5 rounded hover:bg-green-900/40 transition-all text-xs font-bold flex items-center gap-2 group">
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            NEW DIRECTIVE
          </button>
        </div>
      </div>

      {projects.length === 0 && isConnected && (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-xl bg-gray-950/20 p-8 text-center my-auto min-h-[300px]">
          <Server className="w-12 h-12 text-gray-700 mb-4" />
          <h3 className="text-gray-400 font-bold tracking-widest mb-2">NO ACTIVE WORKSPACES</h3>
          <p className="text-xs text-gray-600 max-w-md">
            The workspace directory is currently empty. Initialize a folder inside your directory or issue a script command to populate.
          </p>
        </div>
      )}

      {/* Primary Projects Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, idx) => (
          <div 
            key={idx} 
            onClick={() => openMatrix(project.name)}
            className="group relative border border-gray-800 bg-gray-950/40 rounded-xl p-5 hover:border-green-500/50 hover:bg-gray-900/60 transition-all cursor-pointer overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-900 border border-gray-700 p-2 rounded-lg group-hover:border-green-500/40 group-hover:text-green-400 transition-colors">
                    <TerminalSquare className="w-5 h-5 text-gray-400 group-hover:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-200 tracking-wider group-hover:text-green-300 transition-colors truncate max-w-[160px]">
                      {project.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{project.path}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Agent Status</span>
                  <div className="flex items-center gap-1.5 text-yellow-500">
                    <Activity className="w-3 h-3" />
                    <span className="font-semibold tracking-widest">{project.status}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Allocated Cores</span>
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Cpu className="w-3 h-3" />
                    <span className="font-semibold tracking-widest">AUTO</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800/60 pt-4 flex justify-between items-center">
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">Memory Indexed</span>
                <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-green-400 transition-colors font-bold">
                  ACCESS Matrix <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- THE MATRIX VIEWER OVERLAY --- */}
      {activeMatrix && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-5xl h-[80vh] bg-gray-950 border border-green-500/40 rounded-xl flex flex-col shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-black">
                    <div className="flex items-center gap-3">
                        <TerminalSquare className="w-5 h-5 text-green-500" />
                        <div>
                            <h3 className="font-bold text-gray-200 tracking-wider">PROJECT: {activeMatrix.projectName.toUpperCase()}</h3>
                            <p className="text-[10px] text-gray-500 font-mono">/workspace/{activeMatrix.projectName}</p>
                        </div>
                    </div>
                    <button onClick={closeMatrix} className="text-gray-500 hover:text-red-500 transition-colors bg-gray-900 p-1.5 rounded hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body: Two Columns */}
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* Left Sidebar: File List */}
                    <div className="w-64 border-r border-gray-800 bg-black/50 p-4 flex flex-col gap-2 overflow-y-auto">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Compiled Assets</span>
                        {activeMatrix.files && activeMatrix.files.length > 0 ? (
                            activeMatrix.files.map((file, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setSelectedFileContent(file.content)}
                                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-green-400 cursor-pointer p-2 rounded hover:bg-gray-900 border border-transparent hover:border-gray-800 transition-all"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span className="truncate">{file.name}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-gray-600 italic px-2">No files initialized.</div>
                        )}
                    </div>

                    {/* Right Panel: Code/Text Viewer */}
                    <div className="flex-1 bg-gray-950 p-6 overflow-y-auto custom-scrollbar">
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                            {selectedFileContent}
                        </pre>
                    </div>

                </div>
            </div>
        </div>
      )}

    </div>
  );
}
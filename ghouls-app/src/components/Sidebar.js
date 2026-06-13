"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Network, 
  Activity, 
  CalendarClock, 
  History, 
  Settings,
  TerminalSquare
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: TerminalSquare },
    { name: 'Workflows', path: '/workflows', icon: Network },
    { name: 'Daily Routines', path: '/routines', icon: CalendarClock },
    { name: 'History Logs', path: '/history', icon: History },
  ];

  return (
    <div className="w-64 h-screen bg-gray-950 border-r border-green-900/30 text-gray-300 flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-green-900/30">
          <h1 className="text-xl font-bold text-green-500 tracking-widest drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
            GHOULS OS
          </h1>
          <p className="text-xs text-gray-500 mt-1">Phase 4: Autonomy</p>
        </div>

        {/* Live Swarm Status */}
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Swarm Status</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>CEO_Agent</span>
              <span className="flex items-center text-green-400 text-xs"><span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>ACTIVE</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Dev_Agent</span>
              <span className="flex items-center text-yellow-500 text-xs"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>STANDBY</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path}>
                <div className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-green-900/20 text-green-400 border border-green-500/20' 
                    : 'hover:bg-gray-900 hover:text-white'
                }`}>
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Settings */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-900 hover:text-white transition-all cursor-pointer">
          <Settings className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">System Config</span>
        </div>
      </div>
    </div>
  );
}
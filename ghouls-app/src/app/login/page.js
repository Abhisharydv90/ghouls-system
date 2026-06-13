"use client";
import Link from 'next/link';

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#030712]">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-md">
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">System Access</h2>
          <p className="text-sm text-gray-400">Authenticate to control the Ghouls Swarm</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Access Key ID</label>
            <input type="text" placeholder="ghouls_root_user" className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Master Password</label>
            <input type="password" placeholder="••••••••••••" className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          <Link href="/chat" className="w-full block text-center py-3 mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            Verify & Initialize
          </Link>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">← Return to Terminal Hub</Link>
        </div>
      </div>
    </main>
  );
}
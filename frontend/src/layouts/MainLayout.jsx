import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col relative w-full font-sans text-slate-100">
      <Navbar />
      <div className="flex flex-1 overflow-hidden max-w-[1600px] w-full mx-auto pb-6">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="glass h-full p-8 rounded-2xl shadow-xl w-full border border-white/5 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Decorative background blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none -z-10 animate-pulse delay-1000"></div>
    </div>
  );
};

export default MainLayout;

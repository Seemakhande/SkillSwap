import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Calendar, MessageSquare, User, Wallet } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/app', label: 'Dashboard', icon: Home },
    { path: '/app/marketplace', label: 'Marketplace', icon: Compass },
    { path: '/app/bookings', label: 'Bookings', icon: Calendar },
    { path: '/app/chat', label: 'Chat', icon: MessageSquare },
    { path: '/app/credits', label: 'Credits', icon: Wallet },
    { path: '/app/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="glass w-64 shrink-0 flex flex-col p-4 rounded-xl shadow-lg border border-white/10 ml-6 mb-6">
      <div className="flex flex-col gap-2 relative z-10 w-full h-full">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;

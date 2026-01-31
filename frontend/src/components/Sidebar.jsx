import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Search, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();

    const links = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/scraper', icon: Search, label: 'Lead Scraper' },
        { to: '/leads', icon: Database, label: 'My Leads' },
        { to: '/pricing', icon: CreditCard, label: 'Pricing' },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white fixed left-0 top-0 flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    LeadGen Pro
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <link.icon size={20} />
                        <span className="font-medium">{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

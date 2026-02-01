import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Search, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { logout } = useAuth();

    const links = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/scraper', icon: Search, label: 'Lead Scraper' },
        { to: '/leads', icon: Database, label: 'My Leads' },
        { to: '/pricing', icon: CreditCard, label: 'Pricing' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`fixed left-0 top-0 h-full w-64 bg-slate-900 text-white z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        LeadGen Pro
                    </h1>
                    {/* Close button on mobile */}
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                        <LogOut size={20} className="rotate-180" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => onClose && onClose()} // Close on navigate
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
        </>
    );
};

export default Sidebar;

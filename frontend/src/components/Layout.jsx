import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white p-4 z-40 flex justify-between items-center shadow-md">
                <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    LeadGen Pro
                </span>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-1 hover:bg-slate-800 rounded"
                >
                    <Menu size={24} />
                </button>
            </div>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 min-h-screen w-full md:pl-64 pt-16 md:pt-0 transition-all duration-300">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;

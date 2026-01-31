import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Users, Search, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
                    {trend && (
                        <p className="text-xs text-green-600 mt-1 flex items-center">
                            <TrendingUp size={12} className="mr-1" /> {trend}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-opacity-10 ${color}`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
            </div>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/analytics/dashboard');
                if (data.success) {
                    setStats(data.stats);
                    setRecentScans(data.recentScans);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
                <p className="text-gray-500 mt-2">Here's what's happening with your leads today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Leads"
                    value={stats?.totalLeads || 0}
                    icon={Users}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="Scans Running"
                    value={stats?.scansRunning || 0}
                    icon={Search}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Hot Leads"
                    value={stats?.hotLeads || 0}
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Scans Remaining"
                    value={stats?.scansRemaining || 0}
                    icon={AlertCircle}
                    color="bg-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-96">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-gray-500 py-20">
                            Activity Chart Coming Soon
                        </div>
                    </CardContent>
                </Card>
                <Card className="h-96 overflow-hidden">
                    <CardHeader>
                        <CardTitle>Recent Scans</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentScans.length === 0 ? (
                            <div className="text-center text-gray-500 py-20">No recent scans</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {recentScans.map(scan => (
                                    <div key={scan._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium text-gray-900">{scan.category} in {scan.city}</p>
                                            <p className="text-xs text-gray-500">{new Date(scan.startedAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${scan.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                scan.status === 'running' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {scan.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;

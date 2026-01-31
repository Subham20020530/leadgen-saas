import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import { Download, Filter, Phone, Mail, Globe, MapPin } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LeadList = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await api.get('/leads', {
                params: { userId: user.firebaseUid || 'demo-user' }
            });
            setLeads(res.data.leads || []);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads/export/csv?userId=${user.firebaseUid || 'demo-user'}`, '_blank');
    };

    const Badge = ({ children, color = 'blue' }) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-700',
            green: 'bg-green-100 text-green-700',
            orange: 'bg-orange-100 text-orange-700',
            red: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
                {children}
            </span>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Leads</h1>
                    <p className="text-gray-500 mt-2">Manage and export your collected business leads.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="secondary">
                        <Filter className="mr-2" size={16} /> Filter
                    </Button>
                    <Button onClick={handleExport}>
                        <Download className="mr-2" size={16} /> Export CSV
                    </Button>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-900">Business Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Contact</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Location</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Score</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading leads...</td></tr>
                            ) : leads.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No leads found. Start a scan!</td></tr>
                            ) : leads.map((lead) => (
                                <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{lead.name}</div>
                                        <div className="text-gray-500 text-xs mt-1">{lead.category}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {lead.phone && (
                                                <div className="flex items-center text-gray-600">
                                                    <Phone size={12} className="mr-1.5" /> {lead.phone}
                                                </div>
                                            )}
                                            {lead.email && (
                                                <div className="flex items-center text-gray-600">
                                                    <Mail size={12} className="mr-1.5" /> {lead.email}
                                                </div>
                                            )}
                                            {lead.website && (
                                                <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center text-indigo-600 hover:underline">
                                                    <Globe size={12} className="mr-1.5" /> Visit Website
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-start text-gray-600 max-w-xs">
                                            <MapPin size={14} className="mr-1.5 mt-0.5 shrink-0" />
                                            <span className="truncate">{lead.address || lead.city}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className={`h-2 w-2 rounded-full mr-2 ${lead.leadScore > 70 ? 'bg-green-500' :
                                                    lead.leadScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`} />
                                            <span className="font-medium">{lead.leadScore}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge color={lead.leadType === 'HOT' ? 'green' : lead.leadType === 'WARM' ? 'orange' : 'blue'}>
                                            {lead.leadType}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default LeadList;

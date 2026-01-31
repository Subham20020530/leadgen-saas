import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Search, MapPin, Briefcase } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Scraper = () => {
    const { user } = useAuth();
    const [city, setCity] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeJob, setActiveJob] = useState(null);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!city || !category) return;

        setLoading(true);
        try {
            // In a real app implementation, verify endpoints and request bodies
            const res = await api.post('/scan', {
                userId: user.firebaseUid || 'demo-user', // Fallback for dev
                city,
                category
            });

            setActiveJob(res.data.jobId);
            // Start polling for status here if needed
        } catch (error) {
            console.error("Scan failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Lead Scraper</h1>
                <p className="text-gray-500 mt-2">Find local businesses in seconds.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Search</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleScan} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-9 text-gray-400" size={18} />
                                        <Input
                                            label="City / Location"
                                            placeholder="e.g. New York, Mumbai"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-9 text-gray-400" size={18} />
                                        <Input
                                            label="Business Category"
                                            placeholder="e.g. Dentists, Gyms"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        isLoading={loading}
                                        disabled={!city || !category}
                                    >
                                        <Search className="mr-2" size={18} />
                                        Start Scanning
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Results Section Placeholder */}
                    {activeJob && (
                        <Card className="mt-8 border-indigo-100 bg-indigo-50/50">
                            <CardContent className="p-8 text-center">
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className="h-12 w-12 bg-indigo-200 rounded-full mb-4"></div>
                                    <h3 className="text-lg font-semibold text-indigo-900">Scan in progress...</h3>
                                    <p className="text-indigo-600">Finding best leads for {category} in {city}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scan History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 text-center py-4">
                                No recent scans found.
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-2">Pro Tip 💡</h3>
                            <p className="text-slate-300 text-sm">
                                Be specific with locations (e.g. "Lower Manhattan" instead of "New York") for better results.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Scraper;

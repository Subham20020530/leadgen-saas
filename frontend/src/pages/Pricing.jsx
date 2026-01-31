import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import { Check, Loader2 } from 'lucide-react';
import api from '../services/api';

const PricingOption = ({ title, price, features, recommended = false, planId, onCheckout, loading }) => (
    <Card className={`relative flex flex-col ${recommended ? 'border-2 border-indigo-500 shadow-xl scale-105 z-10' : 'border border-gray-200'}`}>
        {recommended && (
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Popular
                </span>
            </div>
        )}
        <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">${price}</span>
                <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
            </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <Check className="flex-shrink-0 h-5 w-5 text-green-500 mr-2" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                ))}
            </ul>
            <Button
                variant={recommended ? 'primary' : 'secondary'}
                className="w-full"
                onClick={() => onCheckout(planId)}
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : `Choose ${title}`}
            </Button>
        </CardContent>
    </Card>
);

const Pricing = () => {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async (planId) => {
        setLoading(true);
        try {
            const { data } = await api.post('/create-checkout-session', { planId });
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-12 px-4 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                    Pricing Plans
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                    Choose the perfect plan for your lead generation needs.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PricingOption
                    title="Starter"
                    price="29"
                    planId="starter"
                    onCheckout={handleCheckout}
                    loading={loading}
                    features={[
                        "100 Leads / month",
                        "Basic Search Categories",
                        "Standard Support",
                        "CSV Export"
                    ]}
                />
                <PricingOption
                    title="Pro"
                    price="79"
                    recommended={true}
                    planId="pro"
                    onCheckout={handleCheckout}
                    loading={loading}
                    features={[
                        "500 Leads / month",
                        "Advanced SEO Scoring",
                        "Email Extraction",
                        "Priority Support",
                        "API Access"
                    ]}
                />
                <PricingOption
                    title="Enterprise"
                    price="199"
                    planId="enterprise"
                    onCheckout={handleCheckout}
                    loading={loading}
                    features={[
                        "Unlimited Leads",
                        "Dedicated Account Manager",
                        "Custom Integrations",
                        "White Label Reports",
                        "24/7 Phone Support"
                    ]}
                />
            </div>

            <div className="mt-16 bg-indigo-50 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-indigo-900 mb-4">Need a custom solution?</h3>
                <p className="text-indigo-700 mb-6">
                    We offer tailored scraping solutions for large agencies and enterprises.
                </p>
                <Button variant="primary" size="lg">
                    Contact Sales
                </Button>
            </div>
        </div>
    );
};

export default Pricing;

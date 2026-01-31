import React, { useState } from 'react';
import { Search, TrendingUp, Zap } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/clerk-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-white space-y-8 hidden md:block">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              LeadGen Pro
            </h1>
            <p className="text-xl text-gray-300">
              Find Perfect SEO Clients with AI-Powered Lead Generation
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Search className="text-blue-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold mb-1">Real-Time Scraping</h3>
                <p className="text-sm text-gray-400">
                  Scrape live data from Justdial and Google Maps
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <TrendingUp className="text-purple-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold mb-1">Smart Lead Scoring</h3>
                <p className="text-sm text-gray-400">
                  AI-powered scoring identifies the hottest prospects
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Zap className="text-green-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold mb-1">Instant Contact Info</h3>
                <p className="text-sm text-gray-400">
                  Get phone, email, and website details instantly
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-blue-400">500+</div>
              <div className="text-xs text-gray-400">Leads/Scan</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-purple-400">95%</div>
              <div className="text-xs text-gray-400">Accuracy</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-green-400">24/7</div>
              <div className="text-xs text-gray-400">Support</div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Toggle Header */}
          <div className="flex space-x-4 bg-gray-800 p-1 rounded-lg mb-4">
            <button
              onClick={() => setIsLogin(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Clerk Component */}
          <div className="w-full flex justify-center">
            {isLogin ? (
              <SignIn appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "w-full shadow-xl border border-gray-700 bg-gray-900/90 text-white",
                  headerTitle: "text-white",
                  headerSubtitle: "text-gray-400",
                  socialButtonsBlockButton: "text-white border-gray-600 hover:bg-gray-800",
                  formFieldLabel: "text-gray-300",
                  formFieldInput: "bg-gray-800 border-gray-700 text-white",
                  footerActionText: "text-gray-400",
                  footerActionLink: "text-blue-400 hover:text-blue-300"
                }
              }} />
            ) : (
              <SignUp appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "w-full shadow-xl border border-gray-700 bg-gray-900/90 text-white",
                  headerTitle: "text-white",
                  headerSubtitle: "text-gray-400",
                  socialButtonsBlockButton: "text-white border-gray-600 hover:bg-gray-800",
                  formFieldLabel: "text-gray-300",
                  formFieldInput: "bg-gray-800 border-gray-700 text-white",
                  footerActionText: "text-gray-400",
                  footerActionLink: "text-blue-400 hover:text-blue-300"
                }
              }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
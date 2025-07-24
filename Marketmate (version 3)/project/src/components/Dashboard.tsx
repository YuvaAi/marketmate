import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, BarChart3, Settings, Bell, Facebook, Instagram, Linkedin, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../firebase/auth';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await logOut();
    if (!error) {
      navigate('/login');
    }
  };

  const handleFacebookClick = () => {
    navigate('/facebook-content');
  };

  const handleCredentialsClick = () => {
    navigate('/credential-vault');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">MarketMate</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {currentUser?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to your Dashboard</h2>
          <p className="text-gray-600">Here's what's happening with your MarketMate account today.</p>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Section - Social Media Platforms */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Social Media Platforms</h3>
            <div className="space-y-4">
              <button
                onClick={handleFacebookClick}
                className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <Facebook className="w-6 h-6" />
                <span>Facebook</span>
              </button>
              
              <button
                disabled
                className="w-full flex items-center justify-center space-x-3 bg-gray-300 text-gray-500 py-4 px-6 rounded-lg font-semibold cursor-not-allowed opacity-60"
              >
                <Instagram className="w-6 h-6" />
                <span>Instagram</span>
                <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full ml-2">Coming Soon</span>
              </button>
              
              <button
                disabled
                className="w-full flex items-center justify-center space-x-3 bg-gray-300 text-gray-500 py-4 px-6 rounded-lg font-semibold cursor-not-allowed opacity-60"
              >
                <Linkedin className="w-6 h-6" />
                <span>LinkedIn</span>
                <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full ml-2">Coming Soon</span>
              </button>
            </div>
          </div>

          {/* Right Section - Credential Management */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Account Management</h3>
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-600 mb-6">
                  Securely manage your social media credentials and API keys in one centralized location.
                </p>
              </div>
              
              <button
                onClick={handleCredentialsClick}
                className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <Shield className="w-6 h-6" />
                <span>Manage Credentials</span>
              </button>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 text-sm font-medium">Secure & Encrypted</span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  All credentials are encrypted and stored securely
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Key, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveCredential } from '../firebase/firestore';

const CredentialVault: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken || !pageId || !expiryDate) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (!currentUser) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const credentialData = {
        platform: 'Facebook',
        accessToken,
        pageId,
        expiryDate,
        type: 'access_token'
      };

      const { success, error } = await saveCredential(currentUser.uid, credentialData);

      if (success) {
        setMessage({ type: 'success', text: 'Facebook Access Token saved successfully!' });
        setAccessToken('');
        setPageId('');
        setExpiryDate('');
      } else {
        setMessage({ type: 'error', text: error || 'Failed to save credential' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Credential Vault</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Credential Management</h2>
          <p className="text-gray-600">Safely store your Facebook Access Token with expiry tracking.</p>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <h3 className="text-green-800 font-semibold mb-1">Bank-Level Security</h3>
              <p className="text-green-700 text-sm">
                All credentials are encrypted and stored securely in Firebase Firestore. 
                Only you have access to your sensitive information.
              </p>
            </div>
          </div>
        </div>

        {/* Credential Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Facebook Access Token</h3>
              <p className="text-gray-600 text-sm">Store your Facebook API credentials securely</p>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-2">
                Facebook Access Token
              </label>
              <input
                id="accessToken"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your Facebook Access Token"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Your token will be encrypted and stored securely
              </p>
            </div>

            <div>
              <label htmlFor="pageId" className="block text-sm font-medium text-gray-700 mb-2">
                Facebook Page ID
              </label>
              <input
                id="pageId"
                type="text"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your Facebook Page ID"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Page ID will be stored securely with your credentials
              </p>
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Token Expiry Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set when your access token expires for automatic reminders
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Save Credential</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Key className="w-6 h-6 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Access Token Security</h4>
            </div>
            <p className="text-blue-800 text-sm">
              Your Facebook Access Token is encrypted using industry-standard AES-256 encryption 
              before being stored in Firebase Firestore.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="w-6 h-6 text-amber-600" />
              <h4 className="font-semibold text-amber-900">Expiry Tracking</h4>
            </div>
            <p className="text-amber-800 text-sm">
              We'll track your token's expiry date and notify you before it expires 
              to ensure uninterrupted service.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CredentialVault;
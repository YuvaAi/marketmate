import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { validateFacebookCredentials, getFacebookPages } from '../api/facebook';
import { saveCredential, getCredentials } from '../firebase/firestore';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Calendar, ArrowLeft } from 'lucide-react';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

const CredentialVault: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [savedCredentials, setSavedCredentials] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadSavedCredentials();
    }
  }, [currentUser]);

  const loadSavedCredentials = async () => {
    if (!currentUser) return;
    
    try {
      const result = await getCredentials(currentUser.uid);
      const credentials = result.data || [];
      setSavedCredentials(credentials);
      
      // Auto-load Facebook credentials if they exist
      const facebookCred = credentials.find(cred => cred.type === 'facebook');
      if (facebookCred) {
        setAccessToken(facebookCred.accessToken || '');
        setPageId(facebookCred.pageId || '');
        setExpiryDate(facebookCred.expiryDate || '');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const validateCredentials = async () => {
    if (!accessToken.trim()) {
      setValidationStatus('invalid');
      setValidationMessage('Please enter a Facebook Access Token');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    setValidationMessage('');

    try {
      const validation = await validateFacebookCredentials(accessToken);
      
      if (validation.isValid) {
        setValidationStatus('valid');
        setValidationMessage('✅ Valid credentials! All required permissions found.');
        
        // Load available pages
        const pages = await getFacebookPages(accessToken);
        setAvailablePages(pages);
        
        if (pages.length > 0 && !pageId) {
          setPageId(pages[0].id);
        }
      } else {
        setValidationStatus('invalid');
        setValidationMessage(`❌ ${validation.error}`);
        setAvailablePages([]);
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationMessage(`❌ Error validating credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailablePages([]);
    } finally {
      setIsValidating(false);
    }
  };

  const saveCredentials = async () => {
    if (!currentUser) return;
    
    if (!accessToken.trim() || !pageId.trim()) {
      setValidationMessage('❌ Please enter both Access Token and Page ID');
      return;
    }

    setIsSaving(true);

    try {
      const credentialData = {
        type: 'facebook',
        accessToken: accessToken.trim(),
        pageId: pageId.trim(),
        expiryDate: expiryDate || '',
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      };

      await saveCredential(currentUser.uid, credentialData);
      setValidationMessage('✅ Credentials saved successfully!');
      await loadSavedCredentials();
    } catch (error) {
      setValidationMessage(`❌ Error saving credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <div className="flex items-center mb-8">
            <Key className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Credential Vault</h1>
          </div>

          {/* Facebook Credentials Section */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded mr-3"></div>
              Facebook Page Credentials
            </h2>

            <div className="space-y-6">
              {/* Access Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook Access Token *
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Enter your Facebook Page Access Token"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Page Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook Page
                </label>
                {availablePages.length > 0 ? (
                  <select
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {availablePages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name} ({page.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="Enter your Facebook Page ID or validate token to load pages"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Expiry Date (Optional)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              {/* Validation Status */}
              {validationMessage && (
                <div className={`p-4 rounded-lg flex items-center ${
                  validationStatus === 'valid' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {validationStatus === 'valid' ? (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2" />
                  )}
                  <span className="text-sm">{validationMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={validateCredentials}
                  disabled={isValidating || !accessToken.trim()}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isValidating ? 'Validating...' : 'Validate Credentials'}
                </button>
                
                <button
                  onClick={saveCredentials}
                  disabled={isSaving || !accessToken.trim() || !pageId.trim()}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSaving ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </div>
          </div>

          {/* Required Permissions Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Required Facebook Permissions</h3>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <code className="bg-yellow-100 px-2 py-1 rounded">pages_manage_posts</code> - To post content to your page
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <code className="bg-yellow-100 px-2 py-1 rounded">pages_read_engagement</code> - To read engagement metrics
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <code className="bg-yellow-100 px-2 py-1 rounded">pages_show_list</code> - To access your page list
              </li>
            </ul>
            <p className="text-sm text-yellow-600 mt-4">
              💡 Generate your access token at <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-800">Facebook Graph API Explorer</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialVault;
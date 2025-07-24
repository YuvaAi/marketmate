import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Facebook, Wand2, Send, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { generatePost, generateImage, publishToFacebook, generateAndPublish } from '../api/openai';
import { useAuth } from '../contexts/AuthContext';
import { getCredential } from '../firebase/firestore';

const FacebookContent: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Facebook');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [storedPageId, setStoredPageId] = useState('');
  const [storedAccessToken, setStoredAccessToken] = useState('');

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const loadCredentials = async () => {
    if (!currentUser) return;
    
    try {
      const { success, data } = await getCredential(currentUser.uid, 'facebook');
      if (success && data) {
        setStoredPageId(data.pageId || '');
        setStoredAccessToken(data.accessToken || '');
        setCredentialsLoaded(true);
      } else {
        setMessage({ type: 'error', text: 'No Facebook credentials found. Please add them in the Credential Vault first.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load credentials' });
    }
  };

  React.useEffect(() => {
    loadCredentials();
  }, [currentUser]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt to generate content' });
      return;
    }

    setIsGenerating(true);
    setMessage(null);
    try {
      const content = await generatePost(prompt);
      setGeneratedContent(content);
      // Only generate image if needed (optional for now)
      // const image = await generateImage(prompt);
      // setGeneratedImage(image);
      setMessage({ type: 'success', text: 'Content generated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
    setIsGenerating(false);
  };

  const handlePublish = async () => {
    if (!generatedContent.trim()) {
      setMessage({ type: 'error', text: 'No content to publish. Please generate content first.' });
      return;
    }

    if (selectedPlatform === 'Facebook' && !storedPageId.trim()) {
      setMessage({ type: 'error', text: 'No Facebook Page ID found. Please add your credentials in the Credential Vault first.' });
      return;
    }

    if (selectedPlatform === 'Facebook' && !storedAccessToken.trim()) {
      setMessage({ type: 'error', text: 'No Facebook Access Token found. Please add your credentials in the Credential Vault first.' });
      return;
    }

    setIsPublishing(true);
    setMessage(null);
    
    try {
      if (selectedPlatform === 'Facebook') {
        const result = await publishToFacebook(generatedContent, storedPageId, storedAccessToken);
        if (result.success) {
          setPublishedPostId(result.postId || '');
          setMessage({ type: 'success', text: `Content published successfully to Facebook! Post ID: ${result.postId}` });
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to publish to Facebook' });
        }
      } else {
        // Mock publishing for other platforms
        await new Promise(resolve => setTimeout(resolve, 1500));
        setMessage({ type: 'success', text: `Content published successfully to ${selectedPlatform}! (Mock)` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to publish content' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerateAndPublish = async () => {
    if (!prompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt to generate content' });
      return;
    }

    if (selectedPlatform === 'Facebook' && !storedPageId.trim()) {
      setMessage({ type: 'error', text: 'No Facebook Page ID found. Please add your credentials in the Credential Vault first.' });
      return;
    }

    if (selectedPlatform === 'Facebook' && !storedAccessToken.trim()) {
      setMessage({ type: 'error', text: 'No Facebook Access Token found. Please add your credentials in the Credential Vault first.' });
      return;
    }

    setIsGenerating(true);
    setIsPublishing(true);
    setMessage(null);

    try {
      if (selectedPlatform === 'Facebook') {
        const result = await generateAndPublish(prompt, storedPageId, storedAccessToken);
        if (result.success) {
          setGeneratedContent(result.content || '');
          setPublishedPostId(result.postId || '');
          setMessage({ type: 'success', text: `Content generated and published successfully! Post ID: ${result.postId}` });
        } else {
          setGeneratedContent(result.content || '');
          setMessage({ type: 'error', text: result.error || 'Failed to publish content' });
        }
      } else {
        // For other platforms, just generate content
        const content = await generatePost(prompt);
        setGeneratedContent(content);
        setMessage({ type: 'success', text: 'Content generated successfully! Publishing to other platforms is not yet available.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsGenerating(false);
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Facebook className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI Content Generator</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Engaging Content</h2>
          <p className="text-gray-600">Use AI to generate compelling social media posts for your audience.</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{message.text}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">AI Content Generator</h3>
              <p className="text-gray-600 text-sm">Describe what you want to post and let AI create engaging content</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">Select Platform</label>
              <select
                id="platform"
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>

            {selectedPlatform === 'Facebook' && storedPageId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Facebook Page ID Loaded</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Using Page ID: {storedPageId}
                </p>
              </div>
            )}

            {selectedPlatform === 'Facebook' && !storedPageId && credentialsLoaded && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-800 font-medium">No Facebook Credentials Found</span>
                </div>
                <p className="text-amber-700 text-sm mt-1">
                  Please add your Facebook Page ID and Access Token in the Credential Vault first.
                </p>
                <button
                  onClick={() => navigate('/credential-vault')}
                  className="mt-2 text-amber-800 hover:text-amber-900 underline text-sm"
                >
                  Go to Credential Vault
                </button>
              </div>
            )}

            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">Enter Prompt</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Describe the content you want to create..."
              />
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate Content</span>
                  </>
                )}
              </button>
              
              {selectedPlatform === 'Facebook' && (
                <button
                  onClick={handleGenerateAndPublish}
                  disabled={isGenerating || isPublishing}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {(isGenerating || isPublishing) ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Generate & Publish</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {generatedContent && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Generated Content</h3>
                  <p className="text-gray-600 text-sm">Review and publish your AI-generated content</p>
                </div>
              </div>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Platform: {selectedPlatform}</div>
            </div>

            <div className="mb-6">
              <label htmlFor="generatedContent" className="block text-sm font-medium text-gray-700 mb-2">Generated Text</label>
              <textarea
                id="generatedContent"
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can edit the generated content before publishing
              </p>
            </div>

            {publishedPostId && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Successfully Published!</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Post ID: {publishedPostId}
                </p>
              </div>
            )}

            {!publishedPostId && (
              <div className="flex justify-center">
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isPublishing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Publish to {selectedPlatform}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instructions for Facebook Page ID */}
        {selectedPlatform === 'Facebook' && !storedPageId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <div className="flex items-start space-x-3">
              <Facebook className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-blue-900 font-semibold mb-2">Add your Facebook credentials:</h4>
                <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                  <li>Go to the Credential Vault</li>
                  <li>Add your Facebook Access Token and Page ID</li>
                  <li>Return here to generate and publish content</li>
                </ol>
                <button
                  onClick={() => navigate('/credential-vault')}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Go to Credential Vault
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Information */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-amber-900 font-semibold mb-2">API Integration Active</h4>
              <p className="text-amber-800 text-sm">
                This application is now using Google Gemini AI for content generation and Facebook Graph API for publishing. 
                Make sure your Facebook Page Access Token has the necessary permissions to post content.
              </p>
            </div>
          </div>
        </div>
        </>
      </main>
    </div>
  );
};

export default FacebookContent;

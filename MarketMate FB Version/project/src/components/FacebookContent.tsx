import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Facebook, Wand2, Send, Sparkles, CheckCircle, AlertCircle, Clock, Image } from 'lucide-react';
import { generatePostContent, generateImageDescription, generateImageUrl, publishToFacebookWithImage, generateAndPublishComplete, CONTENT_CATEGORIES } from '../api/gemini';
import { validateFacebookCredentials } from '../api/facebook';
import { useAuth } from '../Contexts/AuthContext';
import { getCredential } from '../firebase/firestore';
import { saveGeneratedContent, getUserContentHistory, updateContentStatus } from '../firebase/content';
import { ContentPost } from '../firebase/types';

const FacebookContent: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [storedPageId, setStoredPageId] = useState('');
  const [storedAccessToken, setStoredAccessToken] = useState('');
  const [contentHistory, setContentHistory] = useState<ContentPost[]>([]);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);

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
        
        // Validate credentials on load
        if (data.accessToken && data.pageId) {
          const validation = await validateFacebookCredentials(data.accessToken, data.pageId);
          if (!validation.success) {
            setMessage({ 
              type: 'error', 
              text: `Credential validation failed: ${validation.error}. Please update your credentials.` 
            });
          }
        }
      } else {
        setMessage({ type: 'error', text: 'No Facebook credentials found. Please add them in the Credential Vault first.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load credentials' });
    }
  };

  const loadContentHistory = async () => {
    if (!currentUser?.uid) {
      console.log('No authenticated user found for content history');
      return;
    }
    
    try {
      const { success, content } = await getUserContentHistory(currentUser.uid, 5);
      if (success) {
        setContentHistory(content);
      } else {
        console.log('Content history unavailable - this may be due to Firebase security rules not being configured');
        setContentHistory([]);
      }
    } catch (error) {
      console.error('Failed to load content history:', error);
      // Set empty array to prevent UI issues
      setContentHistory([]);
    }
  };

  useEffect(() => {
    loadCredentials();
    loadContentHistory();
  }, [currentUser]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt to generate content' });
      return;
    }

    setIsGenerating(true);
    setMessage(null);
    setPublishedPostId('');
    setCurrentContentId(null);
    
    try {
      // Generate content
      const content = await generatePostContent(prompt, selectedCategory);
      setGeneratedContent(content);

      // Generate image description
      const imgDescription = await generateImageDescription(prompt, selectedCategory);
      setImageDescription(imgDescription);

      // Generate image URL
      const imageUrl = await generateImageUrl(imgDescription);
      setGeneratedImageUrl(imageUrl);

      // Save to Firebase
      if (currentUser) {
        const contentPost: ContentPost = {
          generatedContent: content,
          generatedImageUrl: imageUrl,
          imageDescription: imgDescription,
          category: selectedCategory,
          prompt: prompt,
          status: 'draft',
          platform: 'Facebook'
        };

        const { success, contentId } = await saveGeneratedContent(currentUser.uid, contentPost);
        if (success && contentId) {
          setCurrentContentId(contentId);
          loadContentHistory(); // Refresh history
        }
      }

      setMessage({ type: 'success', text: 'Content and image generated successfully!' });
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedContent.trim() || !generatedImageUrl.trim()) {
      setMessage({ type: 'error', text: 'No content to publish. Please generate content first.' });
      return;
    }

    if (!storedPageId.trim()) {
      setMessage({ type: 'error', text: 'No Facebook Page ID found. Please add your credentials in the Credential Vault first.' });
      return;
    }

    if (!storedAccessToken.trim()) {
      setMessage({ type: 'error', text: 'No Facebook Access Token found. Please add your credentials in the Credential Vault first.' });
      return;
    }

    setIsPublishing(true);
    setMessage(null);
    
    try {
      const result = await publishToFacebookWithImage(generatedContent, generatedImageUrl, storedPageId, storedAccessToken);
      
      if (result.success) {
        setPublishedPostId(result.postId || '');
        setMessage({ type: 'success', text: `Content published successfully to Facebook! Post ID: ${result.postId}` });
        
        // Update status in Firebase
        if (currentUser && currentContentId) {
          await updateContentStatus(currentUser.uid, currentContentId, 'published', result.postId);
          loadContentHistory(); // Refresh history
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to publish to Facebook' });
        
        // Update status in Firebase
        if (currentUser && currentContentId) {
          await updateContentStatus(currentUser.uid, currentContentId, 'failed');
          loadContentHistory(); // Refresh history
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to publish content' });
      
      // Update status in Firebase
      if (currentUser && currentContentId) {
        await updateContentStatus(currentUser.uid, currentContentId, 'failed');
        loadContentHistory(); // Refresh history
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerateAndPublish = async () => {
    if (!prompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt to generate content' });
      return;
    }

    if (!storedPageId.trim()) {
      setMessage({ type: 'error', text: 'No Facebook Page ID found. Please add your credentials in the Credential Vault first.' });
      return;
    }

    if (!storedAccessToken.trim()) {
      setMessage({ type: 'error', text: 'No Facebook Access Token found. Please add your credentials in the Credential Vault first.' });
      return;
    }

    setIsGenerating(true);
    setIsPublishing(true);
    setMessage(null);
    setPublishedPostId('');
    setCurrentContentId(null);

    try {
      const result = await generateAndPublishComplete(prompt, selectedCategory, storedPageId, storedAccessToken);
      
      if (result.content) setGeneratedContent(result.content);
      if (result.imageUrl) setGeneratedImageUrl(result.imageUrl);
      if (result.imageDescription) setImageDescription(result.imageDescription);

      // Save to Firebase
      if (currentUser) {
        const contentPost: ContentPost = {
          generatedContent: result.content || '',
          generatedImageUrl: result.imageUrl || '',
          imageDescription: result.imageDescription || '',
          category: selectedCategory,
          prompt: prompt,
          status: result.success ? 'published' : 'failed',
          platform: 'Facebook',
          postId: result.postId
        };

        const { success, contentId } = await saveGeneratedContent(currentUser.uid, contentPost);
        if (success && contentId) {
          setCurrentContentId(contentId);
          loadContentHistory(); // Refresh history
        }
      }
      
      if (result.success) {
        setPublishedPostId(result.postId || '');
        setMessage({ type: 'success', text: `Content generated and published successfully! Post ID: ${result.postId}` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to publish content' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsGenerating(false);
      setIsPublishing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Engaging Facebook Content</h2>
          <p className="text-gray-600">Use AI to generate compelling social media posts with images for your audience.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Generation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">AI Content Generator</h3>
                  <p className="text-gray-600 text-sm">Create engaging Facebook posts with AI-generated content and images</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Content Category</label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {CONTENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {storedPageId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Facebook Page Connected</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      Page ID: {storedPageId.substring(0, 20)}...
                    </p>
                    <button
                      onClick={() => navigate('/credential-vault')}
                      className="mt-2 text-green-800 hover:text-green-900 underline text-sm"
                    >
                      Update Credentials
                    </button>
                  </div>
                )}

                {!storedPageId && credentialsLoaded && (
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
                    <div className="mt-3 text-xs text-amber-600">
                      <p><strong>Required permissions:</strong></p>
                      <p>• pages_manage_posts • pages_read_engagement • pages_show_list</p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">Content Prompt</label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe what you want to post about. For example: 'Share tips about healthy eating habits' or 'Promote our new product launch'"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  
                  {storedPageId && (
                    <button
                      onClick={handleGenerateAndPublish}
                      disabled={isGenerating || isPublishing}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

            {/* Generated Content Preview */}
            {(generatedContent || generatedImageUrl) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Generated Content</h3>
                      <p className="text-gray-600 text-sm">Review your AI-generated Facebook post</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Category: {selectedCategory}
                  </div>
                </div>

                {generatedContent && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Post Content</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{generatedContent}</p>
                    </div>
                  </div>
                )}

                {generatedImageUrl && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generated Image</label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <img 
                        src={generatedImageUrl} 
                        alt="AI Generated Content" 
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Generated+Image';
                        }}
                      />
                    </div>
                    {imageDescription && (
                      <p className="text-xs text-gray-500 mt-2">
                        Image description: {imageDescription}
                      </p>
                    )}
                  </div>
                )}

                {publishedPostId && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Successfully Published!</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      Facebook Post ID: {publishedPostId}
                    </p>
                  </div>
                )}

                {!publishedPostId && generatedContent && generatedImageUrl && storedPageId && (
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
                          <span>Publish to Facebook</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Recent Content</h3>
                  <p className="text-gray-600 text-sm">Your latest generated posts</p>
                </div>
              </div>

              <div className="space-y-4">
                {contentHistory.length > 0 ? (
                  contentHistory.map((content, index) => (
                    <div key={content.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(content.status || 'draft')}`}>
                          {content.status || 'draft'}
                        </span>
                        {getStatusIcon(content.status || 'draft')}
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2 line-clamp-3">
                        {content.generatedContent?.substring(0, 100)}...
                      </p>
                      
                      {content.generatedImageUrl && (
                        <div className="mb-2">
                          <img 
                            src={content.generatedImageUrl} 
                            alt="Generated content" 
                            className="w-full h-20 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/100x80/4F46E5/FFFFFF?text=Image';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{content.category}</span>
                        {content.postId && (
                          <span className="text-green-600">Published</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No content generated yet</p>
                    <p className="text-gray-400 text-xs">Start creating your first post!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            {!storedPageId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                <div className="flex items-start space-x-3">
                  <Facebook className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-blue-900 font-semibold mb-2">Setup Facebook Publishing:</h4>
                    <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                      <li>Go to the Credential Vault</li>
                      <li>Add your Facebook Access Token and Page ID</li>
                      <li>Return here to generate and publish content</li>
                    </ol>
                    <button
                      onClick={() => navigate('/credential-vault')}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Setup Credentials
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Information */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mt-8">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-6 h-6 text-purple-600 mt-0.5" />
            <div>
              <h4 className="text-purple-900 font-semibold mb-2">AI-Powered Content Creation</h4>
              <p className="text-purple-800 text-sm">
                MarketMate uses Google Gemini AI for intelligent content generation, creates engaging images, 
                and automatically publishes to your Facebook Page using the Graph API. All content is saved 
                to your secure Firebase database for tracking and analytics.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FacebookContent;
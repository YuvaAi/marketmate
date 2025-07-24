import { GoogleGenerativeAI } from '@google/generative-ai';

// TODO: Move this to environment variables for security
const GEMINI_API_KEY = 'AIzaSyAVz6teqGhtIx8Bz8f2YGCQ3Q-GFHHgaec';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 🔹 1. Text Generation using Gemini
export async function generatePost(prompt: string): Promise<string> {
  try {
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const enhancedPrompt = `You are a social media content creator. Generate an engaging, professional Facebook post based on the following prompt. Keep the content appropriate, engaging, and suitable for Facebook. Make it conversational and include relevant hashtags if appropriate. Prompt: ${prompt}`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const generatedContent = response.text();

    if (!generatedContent) {
      throw new Error('No content generated from Gemini');
    }

    return generatedContent.trim();

  } catch (error: any) {
    console.error('Gemini API Error:', error);

    if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      throw new Error('The Gemini API is currently overloaded. Please try again in a few moments.');
    } else if (error.message?.includes('API key')) {
      throw new Error('Invalid Gemini API key. Please check your configuration.');
    } else if (error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please check your billing.');
    } else if (error.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`Failed to generate content: ${error.message || 'Unknown error'}`);
    }
  }
}

// 🔹 2. Image Generation (placeholder for future implementation)
export async function generateImage(prompt: string): Promise<string> {
  try {
    // Gemini doesn't have image generation in the same way as DALL-E
    // For now, return a placeholder or use a different service
    console.log('Image generation requested for:', prompt);
    
    // Return a placeholder image URL for now
    return 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=AI+Generated+Image';
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    throw new Error("Image generation not available with Gemini API");
  }
}

// 🔹 3. Facebook Graph API Publishing
export async function publishToFacebook(content: string, pageId: string, accessToken: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!content.trim()) {
      throw new Error('Content cannot be empty');
    }

    if (!pageId.trim()) {
      throw new Error('Page ID is required');
    }

    if (!accessToken.trim()) {
      throw new Error('Access token is required');
    }

    const graphApiUrl = `https://graph.facebook.com/${pageId}/feed`;
    
    const response = await fetch(graphApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: content,
        access_token: accessToken
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to publish to Facebook');
    }

    return {
      success: true,
      postId: result.id
    };

  } catch (error: any) {
    console.error('Facebook Publishing Error:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to publish to Facebook'
    };
  }
}

// 🔹 4. Combined function to generate and publish
export async function generateAndPublish(prompt: string, pageId: string, accessToken: string): Promise<{ success: boolean; content?: string; postId?: string; error?: string }> {
  try {
    // First generate content
    const content = await generatePost(prompt);
    
    // Then publish to Facebook
    const publishResult = await publishToFacebook(content, pageId, accessToken);
    
    if (publishResult.success) {
      return {
        success: true,
        content,
        postId: publishResult.postId
      };
    } else {
      return {
        success: false,
        content,
        error: publishResult.error
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate and publish content'
    };
  }
}
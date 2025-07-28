import { GoogleGenerativeAI } from '@google/generative-ai';

// Your Gemini API key
const GEMINI_API_KEY = 'AIzaSyBk1rO6GpDbRAxuFQTEI2H1RlR6snBbCFg';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Content categories for better AI generation
export const CONTENT_CATEGORIES = [
  'Business & Marketing',
  'Technology & Innovation',
  'Health & Wellness',
  'Lifestyle & Travel',
  'Food & Cooking',
  'Education & Learning',
  'Entertainment & Fun',
  'Sports & Fitness',
  'Fashion & Beauty',
  'General'
];

// Enhanced Text Generation using Gemini
export async function generatePostContent(prompt: string, category?: string): Promise<string> {
  try {
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const enhancedPrompt = `You are a professional social media content creator. Generate an engaging Facebook post based on the following:

Category: ${category || 'General'}
Prompt: ${prompt}

Requirements:
- Keep it conversational and engaging
- Make it suitable for Facebook audience
- Include relevant hashtags if appropriate
- Do NOT use asterisks (*) or special formatting characters
- Keep it concise but compelling (150-300 words)
- Make it sound natural and human-like
- Focus on value and engagement

Generate only the post content, nothing else:`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const generatedContent = response.text();

    if (!generatedContent) {
      throw new Error('No content generated from Gemini');
    }

    // Remove any asterisks or special formatting characters
    const cleanContent = generatedContent
      .replace(/\*/g, '')
      .replace(/#{2,}/g, '#')
      .trim();

    return cleanContent;

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to generate content: ${error.message || 'Unknown error'}`);
  }
}

// Image Description Generation for Facebook
export async function generateImageDescription(prompt: string, category?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imagePrompt = `Create a detailed description for an AI image generator based on this social media post idea:

Category: ${category || 'General'}
Post Idea: ${prompt}

Generate a clear, detailed image description that EXACTLY matches the content. Requirements:
- Facebook post image
- Professional and engaging visual
- MUST be directly relevant to the specific subject mentioned in the post
- If animals are mentioned, describe that exact animal
- If food items are mentioned, describe that exact food
- If objects are mentioned, describe those exact objects
- Suitable for business/marketing context
- High quality and visually appealing
- Be very specific about the main subject/object that should be in the image

Focus on the main subject and provide only the image description (30-80 words), no additional text:`;

    const result = await model.generateContent(imagePrompt);
    const response = await result.response;
    const imageDescription = response.text();

    if (!imageDescription) {
      throw new Error('No image description generated');
    }

    return imageDescription.trim();

  } catch (error: any) {
    console.error('Gemini Image Description Error:', error);
    throw new Error(`Failed to generate image description: ${error.message || 'Unknown error'}`);
  }
}

// Generate placeholder image URL (using a more sophisticated placeholder service)
export async function generateImageUrl(description: string): Promise<string> {
  try {
    // Extract key visual elements from the description for better image matching
    const cleanDescription = description.toLowerCase();
    
    // Define specific image mappings for better accuracy
    let imageQuery = 'business'; // default fallback
    
    // Animals
    if (cleanDescription.includes('camel')) {
      imageQuery = 'camel';
    } else if (cleanDescription.includes('horse')) {
      imageQuery = 'horse';
    } else if (cleanDescription.includes('dog')) {
      imageQuery = 'dog';
    } else if (cleanDescription.includes('cat')) {
      imageQuery = 'cat';
    } else if (cleanDescription.includes('elephant')) {
      imageQuery = 'elephant';
    } else if (cleanDescription.includes('lion')) {
      imageQuery = 'lion';
    }
    // Food
    else if (cleanDescription.includes('ice cream') || cleanDescription.includes('icecream')) {
      imageQuery = 'ice-cream';
    } else if (cleanDescription.includes('pizza')) {
      imageQuery = 'pizza';
    } else if (cleanDescription.includes('burger')) {
      imageQuery = 'burger';
    } else if (cleanDescription.includes('cake')) {
      imageQuery = 'cake';
    } else if (cleanDescription.includes('coffee')) {
      imageQuery = 'coffee';
    } else if (cleanDescription.includes('food')) {
      imageQuery = 'food';
    }
    // Business & Technology
    else if (cleanDescription.includes('business') || cleanDescription.includes('office')) {
      imageQuery = 'business';
    } else if (cleanDescription.includes('technology') || cleanDescription.includes('tech')) {
      imageQuery = 'technology';
    } else if (cleanDescription.includes('computer') || cleanDescription.includes('laptop')) {
      imageQuery = 'computer';
    } else if (cleanDescription.includes('phone') || cleanDescription.includes('mobile')) {
      imageQuery = 'smartphone';
    }
    // Nature & Travel
    else if (cleanDescription.includes('nature') || cleanDescription.includes('forest')) {
      imageQuery = 'nature';
    } else if (cleanDescription.includes('beach') || cleanDescription.includes('ocean')) {
      imageQuery = 'beach';
    } else if (cleanDescription.includes('mountain')) {
      imageQuery = 'mountain';
    } else if (cleanDescription.includes('travel')) {
      imageQuery = 'travel';
    } else if (cleanDescription.includes('sunset') || cleanDescription.includes('sunrise')) {
      imageQuery = 'sunset';
    }
    // Health & Fitness
    else if (cleanDescription.includes('fitness') || cleanDescription.includes('gym')) {
      imageQuery = 'fitness';
    } else if (cleanDescription.includes('yoga')) {
      imageQuery = 'yoga';
    } else if (cleanDescription.includes('health')) {
      imageQuery = 'health';
    }
    
    // Use reliable Pexels stock photos with known working URLs
    const imageMap: { [key: string]: string } = {
      'camel': 'https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'horse': 'https://images.pexels.com/photos/635499/pexels-photo-635499.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'dog': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'cat': 'https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'elephant': 'https://images.pexels.com/photos/66898/elephant-cub-tsavo-kenya-66898.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'lion': 'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'ice-cream': 'https://images.pexels.com/photos/1352278/pexels-photo-1352278.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'pizza': 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'burger': 'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'cake': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'coffee': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'food': 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'business': 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'technology': 'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'computer': 'https://images.pexels.com/photos/205316/pexels-photo-205316.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'smartphone': 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'nature': 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'beach': 'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'mountain': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'travel': 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'sunset': 'https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'fitness': 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'yoga': 'https://images.pexels.com/photos/317157/pexels-photo-317157.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
      'health': 'https://images.pexels.com/photos/40751/doctor-medical-medicine-health-40751.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
    };
    
    // Return the specific image URL or fallback to business image
    return imageMap[imageQuery] || imageMap['business'];
    
  } catch (error: any) {
    console.error('Image Generation Error:', error);
    // Return a reliable fallback image from Pexels
    return 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600';
  }
}

// Facebook Graph API Publishing with Image
import { publishToFacebook } from './facebook';

export const publishToFacebookWithImage = publishToFacebook;

// Combined function to generate content, image, and publish
export async function generateAndPublishComplete(
  prompt: string, 
  category: string,
  pageId: string, 
  accessToken: string
): Promise<{ 
  success: boolean; 
  content?: string; 
  imageUrl?: string;
  imageDescription?: string;
  postId?: string; 
  error?: string 
}> {
  try {
    // Step 1: Generate post content
    const content = await generatePostContent(prompt, category);
    
    // Step 2: Generate image description
    const imageDescription = await generateImageDescription(prompt, category);
    
    // Step 3: Generate image URL
    const imageUrl = await generateImageUrl(imageDescription);
    
    // Step 4: Publish to Facebook with image
    const publishResult = await publishToFacebook(content, imageUrl, pageId, accessToken);
    
    if (publishResult.success) {
      return {
        success: true,
        content,
        imageUrl,
        imageDescription,
        postId: publishResult.postId
      };
    } else {
      return {
        success: false,
        content,
        imageUrl,
        imageDescription,
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
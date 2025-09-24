import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API_KEY is not set in environment variables.' }),
    };
  }
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const { imageData, prompt, config } = JSON.parse(event.body || '{}');
    
    if (!imageData || !prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing imageData or prompt in request body.' }),
      };
    }

    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
        model,
        // FIX: The 'contents' property for multipart requests should be a single Content object.
        contents: {
            parts: [
            {
                inlineData: {
                data: imageData,
                mimeType: 'image/png',
                },
            },
            { text: prompt },
            ],
        },
        config,
    });

    return {
      statusCode: 200,
      body: response.text,
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to call Gemini API.', details: error.message }),
    };
  }
};

export { handler };

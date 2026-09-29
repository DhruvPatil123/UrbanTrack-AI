import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK with server-side environment key
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to sanitize and get client model
function resolveModel(requestedModel?: string): string {
  if (requestedModel === 'gemini-3.1-pro-preview') return 'gemini-3.1-pro-preview';
  if (requestedModel === 'gemini-3.1-flash-lite') return 'gemini-3.1-flash-lite';
  return 'gemini-3.5-flash'; // Default recommended general model
}

// 1. Multi-turn Chat Endpoint with System Instructions and Grounding Tools
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      model: reqModel,
      systemInstruction,
      enableSearch = false,
      enableMaps = false,
      latLng
    } = req.body;

    if (!apiKey) {
      return res.status(200).json({
        text: '⚠️ [SYSTEM NOTICE: GEMINI_API_KEY is not configured in environment secrets. Displaying operational simulation response.]\n\n' +
          'URBANTRACK AI Operations Command: Received your query. In active deployment with Gemini, this module will execute live neural reasoning over multi-camera tracking graphs.',
        groundingChunks: [],
        model: resolveModel(reqModel)
      });
    }

    // Determine model
    let modelToUse = resolveModel(reqModel);
    // If maps or search grounding is requested, force gemini-3.5-flash as specified by user instructions
    if (enableMaps || enableSearch) {
      modelToUse = 'gemini-3.5-flash';
    }

    // Configure tools
    const tools: any[] = [];
    let toolConfig: any = undefined;

    if (enableMaps) {
      tools.push({ googleMaps: {} });
      if (latLng && latLng.latitude && latLng.longitude) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: Number(latLng.latitude),
              longitude: Number(latLng.longitude)
            }
          }
        };
      }
    } else if (enableSearch) {
      tools.push({ googleSearch: {} });
    }

    // Format contents from multi-turn message history
    // messages: Array of { role: 'user' | 'model', content: string }
    const contents: any[] = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }]
    }));

    if (contents.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const config: any = {
      systemInstruction: systemInstruction ||
        'You are the URBANTRACK AI Command Operator & Traffic Intelligence Officer. ' +
        'You assist traffic authorities, municipal incident dispatchers, and police in monitoring multi-camera CCTV corridors, ' +
        'investigating vehicle trajectories (e.g. target vehicle V000123 with plate MH12AB1234), evaluating GNN association probabilities, ' +
        'identifying abnormal events (wrong-way movement, stopped vehicle), forecasting bottlenecks, and recommending road closure detours.',
    };

    if (tools.length > 0) {
      config.tools = tools;
    }
    if (toolConfig) {
      config.toolConfig = toolConfig;
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents,
      config
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return res.json({
      text,
      groundingChunks,
      model: modelToUse
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/chat:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate chat response',
      text: `Error communicating with Gemini service: ${err.message}`
    });
  }
});

// 2. Dedicated Google Maps Grounding Endpoint (gemini-3.5-flash with googleMaps tool)
app.post('/api/gemini/maps-grounding', async (req: Request, res: Response) => {
  try {
    const { prompt, latLng } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!apiKey) {
      return res.status(200).json({
        text: '⚠️ [SYSTEM NOTICE: GEMINI_API_KEY is not configured in environment secrets.]\n\n' +
          'Google Maps Grounding simulation: Near University Circle (R102 corridor), critical facilities include Central Traffic Command Headquarters, Emergency General Hospital (1.4 km), and South Riverfront Police Station.',
        mapsSources: [
          { uri: 'https://maps.google.com/?q=University+Circle+Pune', title: 'University Circle Junction' },
          { uri: 'https://maps.google.com/?q=Central+Traffic+Police+Pune', title: 'Central Traffic Control Room' }
        ]
      });
    }

    const config: any = {
      tools: [{ googleMaps: {} }],
      systemInstruction:
        'You are an urban geography and emergency transit officer using Google Maps data. ' +
        'Provide accurate real-world geographic context, nearby emergency facilities, hospitals, detours, and road landmarks.'
    };

    if (latLng && latLng.latitude && latLng.longitude) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: Number(latLng.latitude),
            longitude: Number(latLng.longitude)
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config
    });

    const text = response.text || '';
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract place URLs from groundingChunks
    const mapsSources: Array<{ uri: string; title: string }> = [];
    for (const chunk of rawChunks) {
      if (chunk.maps) {
        mapsSources.push({
          uri: chunk.maps.uri || '',
          title: chunk.maps.title || 'Google Maps Landmark'
        });
      }
    }

    return res.json({
      text,
      mapsSources,
      rawChunks
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/maps-grounding:', err);
    return res.status(500).json({
      error: err.message,
      text: `Maps Grounding Error: ${err.message}`
    });
  }
});

// 3. Dedicated Google Search Grounding Endpoint (gemini-3.5-flash with googleSearch tool)
app.post('/api/gemini/search-grounding', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!apiKey) {
      return res.status(200).json({
        text: '⚠️ [SYSTEM NOTICE: GEMINI_API_KEY is not configured in environment secrets.]\n\n' +
          'Google Search Grounding simulation: Current regional traffic advisories report ongoing high-speed metro corridor construction and peak hour diversions on major municipal expressways.',
        searchSources: [
          { uri: 'https://news.google.com/search?q=traffic+advisory+expressway', title: 'Regional Traffic Authority Advisory' }
        ]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'You are a traffic policy and real-time public advisory specialist using Google Search data. ' +
          'Provide up-to-date facts, official traffic news, safety advisories, and road construction notices.'
      }
    });

    const text = response.text || '';
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract web search sources
    const searchSources: Array<{ uri: string; title: string }> = [];
    for (const chunk of rawChunks) {
      if (chunk.web) {
        searchSources.push({
          uri: chunk.web.uri || '',
          title: chunk.web.title || 'Google Search Reference'
        });
      }
    }

    return res.json({
      text,
      searchSources,
      rawChunks
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/search-grounding:', err);
    return res.status(500).json({
      error: err.message,
      text: `Search Grounding Error: ${err.message}`
    });
  }
});

// Setup Vite in middleware mode for dev or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`URBANTRACK AI Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

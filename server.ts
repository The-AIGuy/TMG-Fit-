import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SAFETY_SYSTEM_INSTRUCTION = `You are the supportive, practical, non-judgmental AI companion inside TMG-Fit ("Fitness that adapts to you").
CRITICAL PHILOSOPHY & SAFETY RULES:
1. NEVER shame the user for resting, missing a workout, being tired, having low energy, changing plans, or having health conditions.
2. NEVER use toxic fitness phrases ("no excuses", "burn off what you ate", "don't break your streak", "work harder").
3. Use calm, reassuring language ("Rest is part of training", "No problem, let's adjust", "You don't need a perfect day to make progress").
4. NEVER diagnose medical conditions, prescribe medication, or tell users to stop or alter prescribed medication doses.
5. NEVER advise exercising through chest pain, severe breathlessness, dizziness, or acute injury. Always prioritize safety over optimization.
6. Clearly distinguish between known user preferences, estimates, and general health information.`;

// 1. Conversational AI Coach & Real-Life Plan Adapter
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, userContext, history } = req.body;
    const ai = getGeminiClient();

    const contextPrompt = `User Profile & Current Context:
${JSON.stringify(userContext || {}, null, 2)}

Recent Conversation:
${(history || []).map((m: { role: string; text: string }) => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}

User Message: ${message}

Respond helpfully, concisely, and supportively. If the user expresses a new preference or dislike (e.g. "I hate squats" or "I only have 8 minutes"), acknowledge it warmly and explain how you've adapted their plan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: SAFETY_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || "No problem. Let's adjust your plan so it works for you today.",
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('AI Chat Error:', errMsg);
    res.status(500).json({ error: errMsg });
  }
});

// 2. Google Maps Grounding — Local Activity & Adventure Mode Discovery
app.post('/api/ai/explore-maps', async (req, res) => {
  try {
    const { query, lat, lng, userContext } = req.body;
    const ai = getGeminiClient();

    const prompt = `User is looking for local accessible or enjoyable movement options: "${query}".
User preferences: ${JSON.stringify(userContext || {})}
Recommend realistic, supportive local places (parks, walking paths, pools, community clubs, or interesting Adventure Mode walk destinations). Include practical details like typical accessibility, vibe, and why it fits their energy/time. Never fabricate opening hours if uncertain.`;

    const toolConfig: Record<string, unknown> = {};
    if (typeof lat === 'number' && typeof lng === 'number') {
      toolConfig.retrievalConfig = {
        latLng: {
          latitude: lat,
          longitude: lng,
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SAFETY_SYSTEM_INSTRUCTION,
        tools: [{ googleMaps: {} }],
        ...(Object.keys(toolConfig).length > 0 ? { toolConfig } : {}),
      },
    });

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const places = rawChunks
      .filter((c: Record<string, unknown>) => c.maps)
      .map((c: { maps?: { uri?: string; title?: string; placeAnswerSources?: { reviewSnippets?: unknown[] } } }) => ({
        title: c.maps?.title || 'Local Google Maps Place',
        uri: c.maps?.uri || 'https://www.google.com/maps',
        reviewSnippets: c.maps?.placeAnswerSources?.reviewSnippets || [],
      }));

    res.json({
      text: response.text || 'Here are some nearby activity options tailored to your pace.',
      places,
      lastChecked: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Maps Grounding Error:', errMsg);
    res.status(500).json({ error: errMsg });
  }
});

// 3. Google Search Grounding — Health & Activity Research with Authoritative Sources
app.post('/api/ai/research', async (req, res) => {
  try {
    const { query, healthConsiderations } = req.body;
    const ai = getGeminiClient();

    const prompt = `Research the following health-aware activity or nutrition question using reliable, authoritative sources (such as government health organisations, recognised hospitals, or peer-reviewed medical bodies):
Question: "${query}"
User's noted considerations: ${JSON.stringify(healthConsiderations || [])}

Provide a clear, cautious, practical summary. Explicitly remind the user that this is informational and not a medical diagnosis or a replacement for professional medical advice.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SAFETY_SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = rawChunks
      .filter((c: Record<string, unknown>) => c.web)
      .map((c: { web?: { uri?: string; title?: string } }) => ({
        title: c.web?.title || 'Verified Web Source',
        uri: c.web?.uri || '#',
      }));

    res.json({
      text: response.text || 'Unable to retrieve search summary right now.',
      sources,
      lastChecked: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Search Grounding Error:', errMsg);
    res.status(500).json({ error: errMsg });
  }
});

// 4. Multimodal Vision — Equipment Identification & Supportive Food Photo/Text Logging
app.post('/api/ai/vision', async (req, res) => {
  try {
    const { mode, textInput, imageBase64, mimeType } = req.body;
    const ai = getGeminiClient();

    const parts: Array<Record<string, unknown>> = [];
    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      });
    }

    if (mode === 'equipment') {
      parts.push({
        text: `Identify the exercise or household equipment shown or described ("${textInput || 'See image'}"). Explain in plain, beginner-friendly language:
1. What this equipment is.
2. 3 gentle-to-moderate exercises you can do with it (including low-impact options).
3. Safe setup tips. Do not make medical claims.`,
      });
    } else {
      parts.push({
        text: `Parse this meal description or food photo ("${textInput || 'See food photo'}") into a supportive, non-judgmental food log entry.
Never shame food choices or use restrictive diet language. Return a friendly summary of the meal components and balanced nourishment notes (recognizing image/text parsing is an estimate that the user can edit).`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: SAFETY_SYSTEM_INSTRUCTION,
      },
    });

    res.json({
      analysis: response.text || 'Analysis complete. You can review and edit the details below.',
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Vision Error:', errMsg);
    res.status(500).json({ error: errMsg });
  }
});

// 5. Structured Meal Planner & Grocery List Generator
app.post('/api/ai/meal-plan', async (req, res) => {
  try {
    const { budget, allergies, dislikedFoods, householdSize, prepTimeMinutes } = req.body;
    const ai = getGeminiClient();

    const prompt = `Create a practical, balanced 3-day meal & snack plan with a consolidated grocery list for:
- Budget: ${budget || 'moderate'}
- Allergies/Intolerances: ${(allergies || []).join(', ') || 'None specified'}
- Disliked Foods: ${(dislikedFoods || []).join(', ') || 'None'}
- Household Size: ${householdSize || 2} people
- Max Prep Time: ${prepTimeMinutes || 25} minutes

Focus on realistic, affordable, everyday ingredients and steady energy. Never suggest extreme calorie restriction.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SAFETY_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayName: { type: Type.STRING },
                  breakfast: { type: Type.STRING },
                  lunch: { type: Type.STRING },
                  dinner: { type: Type.STRING },
                  snack: { type: Type.STRING },
                  prepNote: { type: Type.STRING },
                },
                required: ['dayName', 'breakfast', 'lunch', 'dinner', 'snack', 'prepNote'],
              },
            },
            groceryList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  category: { type: Type.STRING },
                  estimatedCostNote: { type: Type.STRING },
                },
                required: ['item', 'category', 'estimatedCostNote'],
              },
            },
          },
          required: ['days', 'groceryList'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{"days":[],"groceryList":[]}');
    res.json(parsed);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Meal Plan Error:', errMsg);
    res.status(500).json({ error: errMsg });
  }
});

// 6. Voice Companion TTS (Gemini 3.8 Flash Lite TTS)
app.post('/api/ai/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text || "Take your time today. Even five minutes of gentle movement counts.",
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from TTS model.' });
    }
    res.json({ audioWavBase64: base64Audio });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('TTS Error:', errMsg);
    res.status(500).json({ error: errMsg });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Google Fit Adapt server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

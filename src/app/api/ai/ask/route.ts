/**
 * Secure AI API Endpoint
 * POST /api/ai/ask
 * 
 * SECURITY: API key stored in environment variable only
 * Never expose GROQ_API_KEY to frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIContextSummary } from '@/lib/aiContentIndex';

interface AIRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface AIResponse {
  response: string;
  actions?: Array<{
    type: string;
    label: string;
    url?: string;
  }>;
  error?: string;
}

/**
 * Sanitize AI response to remove internal reasoning/thinking blocks AND meta/checklist output
 * CRITICAL: Prevents <think>, <analysis>, <reasoning> tags and checklist phrases from reaching the user
 */
function sanitizeAIResponse(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // Remove complete reasoning blocks (multiline, with any content inside)
  sanitized = sanitized.replace(/<think>[\s\S]*?<\/think>/gi, '');
  sanitized = sanitized.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '');
  sanitized = sanitized.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  
  // Handle unclosed tags - remove everything from the opening tag onward
  if (sanitized.includes('<think>')) {
    sanitized = sanitized.split('<think>')[0];
  }
  if (sanitized.includes('<analysis>')) {
    sanitized = sanitized.split('<analysis>')[0];
  }
  if (sanitized.includes('<reasoning>')) {
    sanitized = sanitized.split('<reasoning>')[0];
  }

  // Remove any leftover closing tags
  sanitized = sanitized.replace(/<\/think>/gi, '');
  sanitized = sanitized.replace(/<\/analysis>/gi, '');
  sanitized = sanitized.replace(/<\/reasoning>/gi, '');

  // Remove meta/checklist output lines (lines that are obviously internal checks)
  const metaPatterns = [
    /^\s*[-•]?\s*(checked\.?|✓|✔)\s*$/gim,
    /^\s*[-•]?\s*(checklist:?|internal reasoning:?|response check:?|compliance check:?|self-check:?|validation:?)\s*$/gim,
    /^\s*[-•]?\s*no internal reasoning\?\s*checked\.?\s*$/gim,
    /^\s*[-•]?\s*starts directly with answer\?\s*checked\.?\s*$/gim,
    /^\s*[-•]?\s*islamic tone.*?\s*checked\.?\s*$/gim,
    /^\s*[-•]?\s*follows.*?\s*checked\.?\s*$/gim,
    /^\s*[-•]?\s*requirements satisfied\.?\s*$/gim,
    /^\s*[-•]?\s*draft:?\s*$/gim,
    /^\s*[-•]?\s*final:?\s*$/gim,
  ];

  for (const pattern of metaPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove lines starting with "tags? Checked" or similar checklist items
  sanitized = sanitized.replace(/^.+\?\s*checked\.?\s*$/gim, '');

  // Clean up multiple consecutive newlines left by removal
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  return sanitized.trim();
}

/**
 * POST /api/ai/ask
 * Secure endpoint for AI queries
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request
    const body: AIRequest = await request.json();
    const { message, conversationHistory = [] } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Get API key from environment (NEVER from request)
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('GROQ_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    console.log('API Key present:', apiKey ? 'Yes' : 'No');
    console.log('API Key length:', apiKey?.length);
    console.log('User message:', message);

    // Build context with website content
    const websiteContext = getAIContextSummary();

    // Prepare messages for Groq API
    const messages = [
      {
        role: 'system',
        content: `You are a helpful Islamic Knowledge Assistant for the Sle Qelbachin website.

🔒 CRITICAL OUTPUT RULES - READ CAREFULLY:
- You MUST always provide a helpful response
- Return ONLY the final visitor-facing answer
- NEVER use <think>, <analysis>, <reasoning> tags
- NEVER show internal reasoning or step-by-step analysis  
- NEVER show checklists or validation notes
- NEVER explain how you generated the answer
- Start your response immediately with the helpful answer

RESPONSE REQUIREMENTS:
- ALWAYS respond, even for simple questions like "who is you?" or "what new?"
- Be warm, friendly, and respectful
- Use Islamic greetings (Wa alaykumussalam)
- Keep responses concise but helpful
- Sound natural, not robotic

EXAMPLES:
Q: "who is you?"
A: "Wa alaykumussalam wa rahmatullahi wa barakatuh 🌙

I am the **Sle Qelbachin** Islamic Knowledge Assistant.

My purpose is to help you find spiritual resources to purify your heart and gain beneficial knowledge. I can guide you to:

📖 **Kitabs**: 7 collections of audio lessons and PDFs
🎧 **Audio Lectures**: Spiritual talks and teachings
🎙️ **Muhadara**: Islamic discourses
💭 **Reminders & Knowledge**: Daily wisdom

How can I help you today?"

Q: "so that what new?"
A: "Welcome back! I'm here to help you navigate Sle Qelbachin's Islamic resources.

What would you like to explore today?

📖 Browse our Kitabs
🎧 Listen to audio lectures  
🎙️ Explore Muhadara
💭 Read daily reminders

Just ask me anything about Islamic knowledge available on this site!"

AVAILABLE WEBSITE CONTENT:

${websiteContext}

CONTENT RULES:
1. Only discuss content that EXISTS on this website
2. NEVER invent Qur'an verses, Hadith, or Islamic rulings
3. If content is not on the website, say: "I don't have a verified source for that on Sle Qelbachin."
4. Provide direct links when helpful (/kitab/[slug], /audio-lecture, /muhadara, /videos)

VERIFIED CONTACT INFO:
- Telegram: @Sle_qelbachn1 (https://t.me/Sle_qelbachn1)
- TikTok: @sle_qelbachn1 (https://www.tiktok.com/@sle_qelbachn1)
- YouTube: @sle_qelbachn1 (https://youtube.com/@sle_qelbachn1)

Remember: ALWAYS provide a helpful response. Never say you cannot respond.`
      },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      {
        role: 'user',
        content: message
      }
    ];

    // Call Groq API
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-27b',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Groq API error details:');
      console.error('Status:', aiResponse.status);
      console.error('Status Text:', aiResponse.statusText);
      console.error('Response:', errorText);
      console.error('Headers:', Object.fromEntries(aiResponse.headers.entries()));
      
      return NextResponse.json(
        { error: `AI service error (${aiResponse.status}): ${errorText.substring(0, 100)}` },
        { status: 503 }
      );
    }

    const aiData = await aiResponse.json();
    let aiMessage = aiData.choices?.[0]?.message?.content;

    if (!aiMessage) {
      return NextResponse.json(
        { error: 'No response from AI service' },
        { status: 500 }
      );
    }

    // CRITICAL: Sanitize response to remove thinking/reasoning blocks
    aiMessage = sanitizeAIResponse(aiMessage);

    // If sanitization removed everything or response is too short, use fallback
    if (!aiMessage || aiMessage.length < 10) {
      console.warn('AI response was empty or too short after sanitization. Original:', aiData.choices?.[0]?.message?.content);
      aiMessage = 'Wa alaykumussalam wa rahmatullahi wa barakatuh 🌙\n\nI\'m here to help you explore Sle Qelbachin\'s Islamic knowledge resources. Please ask me about:\n\n📖 Kitabs and lessons\n🎧 Audio lectures\n🎙️ Muhadara\n💭 Reminders\n\nHow can I assist you today?';
    }

    // Extract actions from response (if AI suggests navigation)
    const actions = extractActionsFromResponse(aiMessage, message);

    // Return response
    const response: AIResponse = {
      response: aiMessage,
      actions: actions.length > 0 ? actions : undefined,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Extract navigation actions from AI response
 */
function extractActionsFromResponse(response: string, query: string): Array<{
  type: string;
  label: string;
  url?: string;
}> {
  const actions: Array<{ type: string; label: string; url?: string }> = [];
  const lowerResponse = response.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Check for Kitab mentions
  const kitabKeywords = ['intebih', 'ad-da', 'dawa', 'fatihu', 'awliya', 'alkesidu', 'teshilu', 'yekelb', 'betewbet'];
  const mentionedKitab = kitabKeywords.find(keyword => 
    lowerResponse.includes(keyword) || lowerQuery.includes(keyword)
  );

  if (mentionedKitab || lowerQuery.includes('kitab')) {
    actions.push({
      type: 'navigate',
      label: '📖 View All Kitabs',
      url: '/kitab'
    });
  }

  // Check for audio mentions
  if (lowerQuery.includes('audio') || lowerQuery.includes('lecture') || lowerQuery.includes('ders')) {
    actions.push({
      type: 'navigate',
      label: '🎧 Browse Audio Lectures',
      url: '/audio-lecture'
    });
  }

  // Check for Muhadara mentions
  if (lowerQuery.includes('muhadara') || lowerQuery.includes('discourse')) {
    actions.push({
      type: 'navigate',
      label: '🎙️ Open Muhadara',
      url: '/muhadara'
    });
  }

  // Check for video mentions
  if (lowerQuery.includes('video')) {
    actions.push({
      type: 'navigate',
      label: '🎥 Watch Videos',
      url: '/videos'
    });
  }

  // Check for reminder mentions
  if (lowerQuery.includes('reminder')) {
    actions.push({
      type: 'navigate',
      label: '💭 Read Reminders',
      url: '/reminders'
    });
  }

  // Check for Qur'an/Hadith mentions
  if (lowerQuery.includes('quran') || lowerQuery.includes('hadith') || lowerQuery.includes('knowledge')) {
    actions.push({
      type: 'navigate',
      label: '📜 Qur\'an & Hadith',
      url: '/knowledge'
    });
  }

  // Check for Sahabah mentions
  if (lowerQuery.includes('sahabah') || lowerQuery.includes('companion')) {
    actions.push({
      type: 'navigate',
      label: '🕌 Learn About Sahabah',
      url: '/sahabah'
    });
  }

  return actions.slice(0, 2); // Maximum 2 actions per response
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

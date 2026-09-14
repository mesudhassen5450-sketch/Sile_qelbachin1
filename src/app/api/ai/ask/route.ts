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

    const websiteContext = getAIContextSummary();

    // Prepare messages for Groq API
    const messages = [
      {
        role: 'system',
        content: `You are the Sle Qelbachin site assistant. Your job is to HELP users do things on this website — not to introduce yourself with a menu.

CRITICAL OUTPUT RULES:
- Return ONLY the final visitor-facing answer
- NEVER use <think>, <analysis>, <reasoning> tags or checklists
- Do NOT answer every message with "Wa alaykumussalam" — only if the user greeted with salam
- Do NOT reply with a generic "I'm here to help / please ask about Kitabs" menu unless the user only said hello
- Give a concrete answer: name real kitabs/ders, suggest an exact page path, or say what action to take

HOW TO HELP:
- "what's new" / "new ders" → mention newest ders from the content index and give the route (e.g. /kitab/intebih-ante-murakeb?ders=5)
- "change language" → tell them to use Amharic / Arabic / English (site supports am, ar, en)
- "go to X" → give the exact route and describe what is there
- Keep answers short and actionable (2–6 sentences)

EXAMPLES:
Q: "what new there"
A: "Newest on the site: Intebih Ante Murakeb Ders 5, plus other kitab latest lessons. Open /kitab/intebih-ante-murakeb?ders=5 or say ‘go to new ders’."

Q: "change language"
A: "I can switch the site language. Say ‘change language to Amharic’, ‘to Arabic’, or ‘to English’."

Q: "who are you?"
A: "I’m the Sle Qelbachin assistant. I open kitabs, ders, muhadara, videos, reminders, and can switch language. What do you need?"

AVAILABLE WEBSITE CONTENT:
${websiteContext}

CONTENT RULES:
1. Only discuss content that EXISTS in the index above
2. NEVER invent Qur'an verses, Hadith, or rulings
3. If missing, say it is not on Sle Qelbachin
4. Prefer real routes: /kitab/..., /audio-lecture, /muhadara, /video-lecture, /reminders

VERIFIED CONTACT:
- Telegram: https://t.me/Sle_qelbachn1
- TikTok: https://www.tiktok.com/@sle_qelbachn1
- YouTube: https://youtube.com/@sle_qelbachn1`
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
      console.error('Groq API error', aiResponse.status);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
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

    // If sanitization removed everything, give a concrete local-style assist — never a greeting menu
    if (!aiMessage || aiMessage.length < 10) {
      console.warn('AI response empty after sanitization. Original:', aiData.choices?.[0]?.message?.content);
      aiMessage =
        'I can help with real actions on this site. Try: “go to new ders”, “what’s new”, “open intebih”, “change language to English”, or “open muhadara”.';
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
      url: '/video-lecture'
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

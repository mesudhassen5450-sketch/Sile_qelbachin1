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

    console.log('AI ask request received');

    // Build context with website content
    const websiteContext = getAIContextSummary();

    // Prepare messages for Groq API
    const messages = [
      {
        role: 'system',
        content: `You are the Sile Qelbachin content-navigation assistant.

OUTPUT RULES:
- Return ONLY the final visitor-facing answer
- Never use <think>, <analysis>, or reasoning tags
- Never show checklists, tools, or internal process

ROLE:
- Help users Find → Navigate → Play → Read available website content
- You are NOT a Mufti. Do not invent Islamic rulings, verses, Hadith, scholars, books, or Ders

CONTENT RULES:
1. Only discuss content in the website index below
2. For exact Ders requests (e.g. "Play Intebih Ante Murakeb Ders 3"), give the exact /ders/... link
3. If missing: say "I couldn't find that information in the available Sile Qelbachin content."
4. Verified socials only: Telegram https://t.me/Sle_qelbachn1 · TikTok https://www.tiktok.com/@sle_qelbachn1 · YouTube https://youtube.com/@sle_qelbachn1

AVAILABLE WEBSITE CONTENT:
${websiteContext}`
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
  const lowerQuery = query.toLowerCase();

  // Prefer exact /ders/ links mentioned in the response
  const dersLink = response.match(/\/ders\/[a-z0-9-]+/i);
  if (dersLink) {
    actions.push({ type: 'navigate', label: 'Open exact Ders', url: dersLink[0] });
    return actions;
  }

  const kitabLink = response.match(/\/kitab\/[a-z0-9-]+/i);
  if (kitabLink) {
    actions.push({ type: 'navigate', label: 'Open Kitab', url: kitabLink[0] });
  }

  if (lowerQuery.includes('kitab') && actions.length === 0) {
    actions.push({ type: 'navigate', label: 'View Kitabs', url: '/kitab' });
  }
  if (/audio|lecture|ders/i.test(lowerQuery) && actions.length === 0) {
    actions.push({ type: 'navigate', label: 'Browse Audio', url: '/audio-lecture' });
  }
  if (/muhadara/i.test(lowerQuery)) {
    actions.push({ type: 'navigate', label: 'Open Muhadara', url: '/muhadara' });
  }
  if (/video/i.test(lowerQuery)) {
    actions.push({ type: 'navigate', label: 'Watch Videos', url: '/videos' });
  }
  if (/reminder/i.test(lowerQuery)) {
    actions.push({ type: 'navigate', label: 'Read Reminders', url: '/reminders' });
  }
  if (/quran|hadith|knowledge/i.test(lowerQuery)) {
    actions.push({ type: 'navigate', label: "Qur'an & Hadith", url: '/knowledge' });
  }
  if (/sahabah|companion/i.test(lowerQuery)) {
    actions.push({ type: 'navigate', label: 'Sahabah', url: '/sahabah' });
  }
  if (/search|find/i.test(lowerQuery)) {
    actions.push({ type: 'navigate', label: 'Open Search', url: '/search' });
  }
  if (/speaker|ustaaz|ustaz/i.test(lowerQuery)) {
    actions.push({ type: 'navigate', label: 'Speakers', url: '/speakers' });
  }

  return actions.slice(0, 2);
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

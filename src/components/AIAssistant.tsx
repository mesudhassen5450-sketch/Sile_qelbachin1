/**
 * AI Assistant Main Controller
 * Intent Detection → Content Search → Action Execution → Navigation / Language
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AIAssistantButtonWithTooltip } from './AIAssistantButton';
import AIChatDrawer, { Message, QuickAction } from './AIChatDrawer';
import { getFeaturedQuickActions } from '@/lib/aiQuickActions';
import { matchIntent } from '@/lib/aiIntentMatcher';
import { executeIntent, getActionButtons, type AIAction } from '@/lib/aiActionHandler';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/types/media';

function sanitizeFrontend(text: string): string {
  if (!text) return '';

  let sanitized = text;

  sanitized = sanitized.replace(/<think>[\s\S]*?<\/think>/gi, '');
  sanitized = sanitized.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '');
  sanitized = sanitized.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

  if (sanitized.includes('<think>')) sanitized = sanitized.split('<think>')[0];
  if (sanitized.includes('<analysis>')) sanitized = sanitized.split('<analysis>')[0];
  if (sanitized.includes('<reasoning>')) sanitized = sanitized.split('<reasoning>')[0];

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

  sanitized = sanitized.replace(/^.+\?\s*checked\.?\s*$/gim, '');
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  return sanitized.trim();
}

function applyActionSideEffects(
  action: AIAction,
  router: ReturnType<typeof useRouter>,
  setLanguage: (lang: Language) => void
) {
  if (action.type === 'set_language' && action.data?.language) {
    setLanguage(action.data.language);
    if (typeof window !== 'undefined' && (window as any).changeLanguage) {
      (window as any).changeLanguage(action.data.language);
    }
  }

  if (
    (action.type === 'navigate' || action.type === 'play_audio') &&
    action.data?.route
  ) {
    setTimeout(() => {
      router.push(action.data!.route!);
    }, 400);
  }
}

export default function AIAssistant() {
  const router = useRouter();
  const { setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = getFeaturedQuickActions();

  const handleSendMessage = useCallback(
    async (userMessage: string) => {
      const trimmed = userMessage.trim();
      if (!trimmed) return;

      // Language quick buttons from chat actions
      if (trimmed.startsWith('#lang-')) {
        const code = trimmed.replace('#lang-', '') as Language;
        if (code === 'am' || code === 'ar' || code === 'en') {
          const action = executeIntent({
            type: 'CHANGE_LANGUAGE',
            confidence: 1,
            params: { language: code },
          });
          applyActionSideEffects(action, router, setLanguage);
          setMessages((prev) => [
            ...prev,
            {
              id: `user-${Date.now()}`,
              role: 'user',
              content: `Change language to ${code.toUpperCase()}`,
              timestamp: new Date(),
            },
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: action.data?.message || 'Language updated.',
              timestamp: new Date(),
              actions: getActionButtons(action),
            },
          ]);
          return;
        }
      }

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const intent = matchIntent(trimmed);

        // Prefer local assistance for any recognized actionable intent
        if (intent.confidence >= 0.8) {
          const action = executeIntent(intent);
          applyActionSideEffects(action, router, setLanguage);

          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: action.data?.message || 'Done!',
              timestamp: new Date(),
              actions: getActionButtons(action),
            },
          ]);
          setIsLoading(false);
          return;
        }

        const conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch('/api/ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            conversationHistory,
          }),
        });

        if (!response.ok) {
          const localAction = executeIntent({
            type: 'UNKNOWN',
            confidence: 0,
            params: { query: trimmed },
          });
          applyActionSideEffects(localAction, router, setLanguage);

          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content:
                localAction.data?.message ||
                'I can still guide you on this site. Try: “go to new ders”, “what’s new”, or “change language to English”.',
              timestamp: new Date(),
              actions: getActionButtons(localAction),
            },
          ]);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const sanitizedResponse = sanitizeFrontend(data.response);

        // If cloud AI returns empty/greeting fluff after sanitize, assist locally instead
        const looksLikeEmptyMenu =
          !sanitizedResponse ||
          sanitizedResponse.length < 12 ||
          (/wa alaykumussalam/i.test(sanitizedResponse) &&
            /please ask me about|how can i assist|i'm here to help you explore/i.test(
              sanitizedResponse
            ));

        if (looksLikeEmptyMenu) {
          const localAction = executeIntent({
            type: 'UNKNOWN',
            confidence: 0,
            params: { query: trimmed },
          });
          applyActionSideEffects(localAction, router, setLanguage);
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: localAction.data?.message || sanitizedResponse,
              timestamp: new Date(),
              actions: getActionButtons(localAction),
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: sanitizedResponse,
            timestamp: new Date(),
            actions: data.actions || [],
          },
        ]);
      } catch (err) {
        console.error('AI Error:', err);
        const localAction = executeIntent({
          type: 'UNKNOWN',
          confidence: 0,
          params: { query: trimmed },
        });
        applyActionSideEffects(localAction, router, setLanguage);

        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content:
              localAction.data?.message ||
              'Cloud assistant is offline, but I can still open pages. Try “go to new ders” or a kitab name.',
            timestamp: new Date(),
            actions: getActionButtons(localAction),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, router, setLanguage]
  );

  const handleQuickAction = useCallback(
    async (action: QuickAction) => {
      await handleSendMessage(action.query);
    },
    [handleSendMessage]
  );

  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const minimizeDrawer = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <AIAssistantButtonWithTooltip onClick={toggleDrawer} isOpen={isOpen} />
      <AIChatDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        onMinimize={minimizeDrawer}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        quickActions={quickActions}
        onQuickAction={handleQuickAction}
      />
    </>
  );
}

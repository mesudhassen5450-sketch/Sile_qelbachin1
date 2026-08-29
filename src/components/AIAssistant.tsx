/**
 * AI Assistant Main Controller
 * Professional navigation system with deterministic intent matching
 * Architecture: Intent Detection → Content Search → Action Execution → Navigation
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AIAssistantButtonWithTooltip } from './AIAssistantButton';
import AIChatDrawer, { Message, QuickAction } from './AIChatDrawer';
import { getFeaturedQuickActions } from '@/lib/aiQuickActions';
import { matchIntent, getIntentResponse } from '@/lib/aiIntentMatcher';
import { executeIntent, getActionButtons } from '@/lib/aiActionHandler';

/**
 * Frontend safety net: Remove thinking/reasoning tags AND meta/checklist output
 * This is a secondary protection layer in case backend sanitization fails
 */
function sanitizeFrontend(text: string): string {
  if (!text) return '';
  
  let sanitized = text;
  
  // Remove reasoning blocks
  sanitized = sanitized.replace(/<think>[\s\S]*?<\/think>/gi, '');
  sanitized = sanitized.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '');
  sanitized = sanitized.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  
  // Handle unclosed tags
  if (sanitized.includes('<think>')) {
    sanitized = sanitized.split('<think>')[0];
  }
  if (sanitized.includes('<analysis>')) {
    sanitized = sanitized.split('<analysis>')[0];
  }
  if (sanitized.includes('<reasoning>')) {
    sanitized = sanitized.split('<reasoning>')[0];
  }

  // Remove meta/checklist output lines
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

  // Remove lines with "tags? Checked" or similar checklist items
  sanitized = sanitized.replace(/^.+\?\s*checked\.?\s*$/gim, '');

  // Clean up multiple consecutive newlines
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  return sanitized.trim();
}

export default function AIAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickActions = getFeaturedQuickActions();

  /**
   * Send message with Intent-Action architecture
   * Step 1: Try deterministic intent matching (no API needed)
   * Step 2: If uncertain, use AI API for complex queries
   */
  const handleSendMessage = useCallback(async (userMessage: string) => {
    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Try deterministic intent matching first
      const intent = matchIntent(userMessage);

      // High confidence intent - handle locally without AI API
      if (intent.confidence >= 0.8) {
        const action = executeIntent(intent);
        
        // Execute navigation if needed
        if (action.type === 'navigate' && action.data?.route) {
          setTimeout(() => {
            router.push(action.data!.route!);
          }, 500);
        }

        // Get action buttons
        const actionButtons = getActionButtons(action);

        // Add AI response
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: action.data?.message || 'Done!',
          timestamp: new Date(),
          actions: actionButtons,
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        return;
      }

      // Step 2: Low confidence or complex query - use AI API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('AI service temporarily unavailable');
      }

      const data = await response.json();

      // Frontend safety net: sanitize response
      const sanitizedResponse = sanitizeFrontend(data.response);

      // Add AI response
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: sanitizedResponse || 'I apologize, but I cannot provide a proper response at this time.',
        timestamp: new Date(),
        actions: data.actions || [],
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Error:', err);
      setError('The assistant is temporarily unavailable. Please try again.');
      
      // Add error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'The assistant is temporarily unavailable. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, router]);

  /**
   * Handle quick action selection
   */
  const handleQuickAction = useCallback(async (action: QuickAction) => {
    await handleSendMessage(action.query);
  }, [handleSendMessage]);

  /**
   * Toggle drawer open/close
   */
  const toggleDrawer = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Close drawer
   */
  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Minimize drawer (same as close for now)
   */
  const minimizeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Clear conversation and reset
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return (
    <>
      {/* Floating Button */}
      <AIAssistantButtonWithTooltip 
        onClick={toggleDrawer} 
        isOpen={isOpen} 
      />

      {/* Chat Drawer */}
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

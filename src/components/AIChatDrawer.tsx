/**
 * AI Chat Drawer - Responsive chat panel
 * Desktop: bottom-right drawer
 * Mobile: bottom sheet
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { X, Minimize2, Send, Loader2 } from 'lucide-react';
import { AILogo } from './AIIcon';
import { useLanguage } from '@/context/LanguageContext';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: MessageAction[];
}

export interface MessageAction {
  type: 'navigate' | 'open-kitab' | 'play-audio';
  label: string;
  url?: string;
  data?: any;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  quickActions: QuickAction[];
  onQuickAction: (action: QuickAction) => void;
}

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  labelAm: string;
  query: string;
}

export default function AIChatDrawer({
  isOpen,
  onClose,
  onMinimize,
  messages,
  onSendMessage,
  isLoading,
  quickActions,
  onQuickAction,
}: AIChatDrawerProps) {
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
          fixed z-50
          bg-white dark:bg-neutral-900
          shadow-2xl
          flex flex-col
          transition-all duration-300 ease-out
          
          /* Mobile: Bottom sheet */
          bottom-0 left-0 right-0
          max-h-[85vh] rounded-t-3xl
          
          /* Desktop: Side drawer */
          lg:bottom-6 lg:right-6 lg:left-auto
          lg:w-[440px] lg:h-[600px] lg:max-h-[calc(100vh-120px)]
          lg:rounded-3xl
          
          border-t-4 border-red-600
          lg:border-t-0 lg:border-l-4
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-black text-white px-6 py-4 rounded-t-3xl lg:rounded-t-3xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <AILogo size={32} />
              <div>
                <h2 className="text-lg font-bold">ስለ ቀልባችን Assistant</h2>
                <p className="text-xs text-neutral-400">Islamic Knowledge Helper</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={onMinimize}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                aria-label="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-xs text-neutral-300">
            Explore the knowledge available on Sle Qelbachin
          </p>
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="flex-shrink-0 p-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-3">
              Quick Actions:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onQuickAction(action)}
                  className="flex items-center space-x-2 p-3 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors text-left border border-neutral-200 dark:border-neutral-700 group"
                >
                  <span className="text-xl flex-shrink-0">{action.icon}</span>
                  <span className="text-xs font-medium text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/10 rounded-full flex items-center justify-center mb-4">
                <AILogo size={48} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                السلام عليكم
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
                Ask me about Kitabs, audio lectures, Muhadara, or any Islamic content on this website!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] rounded-2xl px-4 py-3
                      ${message.role === 'user'
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                      }
                    `}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    
                    {/* Message Actions */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (action.url) {
                                window.location.href = action.url;
                              }
                            }}
                            className="w-full px-4 py-2 bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border border-red-200 dark:border-red-900/30"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about Kitabs, audio, or Islamic content..."
              className="flex-1 px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 text-sm text-neutral-900 dark:text-white placeholder-neutral-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-xl transition-colors disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

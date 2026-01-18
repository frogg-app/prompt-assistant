/**
 * ChatWindow Component
 * Main chat display area with message history
 */

import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ClarificationCard from './ClarificationCard';
import './ChatWindow.css';

// Sparkles icon for empty state
const SparklesIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

// Loading dots animation
function LoadingIndicator() {
  return (
    <div className="chat-loading" aria-label="Loading">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

export default function ChatWindow({
  messages = [],
  isLoading = false,
  onClarificationSubmit
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Find the last clarification message that needs response
  const pendingClarification = messages.find(
    (m, i) => 
      m.type === 'clarification' && 
      m.metadata?.clarifications?.length > 0 &&
      i === messages.length - 1
  );

  const isEmpty = messages.length === 0;

  return (
    <div 
      className="chat-window"
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-label="Chat conversation"
    >
      {isEmpty ? (
        <div className="chat-empty">
          <div className="chat-empty__icon">
            <SparklesIcon />
          </div>
          <h2 className="chat-empty__title">Ready to refine your prompts</h2>
          <p className="chat-empty__description">
            Enter your rough prompt below and I&apos;ll help transform it into 
            a polished, production-ready version optimized for your chosen model.
          </p>
          <div className="chat-empty__tips">
            <h3>Tips for better prompts:</h3>
            <ul>
              <li>Be specific about what you want to achieve</li>
              <li>Include relevant context and constraints</li>
              <li>Specify the desired output format</li>
              <li>Use the options panel to add structured constraints</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="chat-messages">
          {messages.map((message) => {
            // Render clarification card for clarification messages
            if (
              message.type === 'clarification' && 
              message.metadata?.clarifications &&
              message === pendingClarification
            ) {
              return (
                <div key={message.id} className="chat-message-wrapper">
                  <ChatMessage message={{ ...message, content: message.content }} />
                  <ClarificationCard
                    clarifications={message.metadata.clarifications}
                    onSubmit={onClarificationSubmit}
                    isLoading={isLoading}
                  />
                </div>
              );
            }
            
            return <ChatMessage key={message.id} message={message} />;
          })}
          
          {isLoading && !pendingClarification && (
            <div className="chat-message chat-message--assistant">
              <div className="chat-message__avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />
                  <path d="M15 13v2" />
                  <path d="M9 13v2" />
                </svg>
              </div>
              <div className="chat-message__content">
                <div className="chat-message__header">
                  <span className="chat-message__role">Assistant</span>
                </div>
                <LoadingIndicator />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}

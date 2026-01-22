/**
 * ChatMessage Component
 * Individual message display in the chat window
 */

import { useState } from 'react';
import { Button } from '../ui';
import './ChatMessage.css';

// Icon components
const UserIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </svg>
);

const BotIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const CopyIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const StarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

function getScoreClass(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

function formatCategoryName(key) {
  const names = {
    clarity_specificity: 'Clarity & Specificity',
    context_completeness: 'Context',
    constraints_success_criteria: 'Constraints',
    input_output_definition: 'Input/Output',
    ambiguity_assumptions: 'Clarity',
    testability: 'Testability'
  };
  return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.type === 'error';
  const isImprovedPrompt = message.type === 'improved-prompt';
  const isExcellentPrompt = message.type === 'excellent-prompt';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy errors
    }
  };

  // System/Error messages
  if (isSystem) {
    return (
      <div className={`chat-message chat-message--system ${isError ? 'chat-message--error' : ''}`}>
        {isError && <AlertIcon size={16} />}
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{message.content}</pre>
      </div>
    );
  }

  return (
    <article
      className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}
      aria-label={`${isUser ? 'You' : 'Assistant'} said`}
    >
      <div className="chat-message__avatar">
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>
      
      <div className="chat-message__content">
        <div className="chat-message__header">
          <span className="chat-message__role">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <time className="chat-message__time" dateTime={message.timestamp?.toISOString()}>
            {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
          </time>
        </div>
        
        <div className={`chat-message__body ${isImprovedPrompt ? 'chat-message__body--improved' : ''} ${isExcellentPrompt ? 'chat-message__body--excellent' : ''}`}>
          {isExcellentPrompt && (
            <div className="chat-message__excellent-badge">
              <StarIcon size={16} />
              <span>Your prompt is already excellent!</span>
            </div>
          )}
          {isImprovedPrompt || isExcellentPrompt ? (
            <pre className="chat-message__prompt">{message.content}</pre>
          ) : (
            <p>{message.content}</p>
          )}
        </div>

        {/* Excellence explanation */}
        {message.metadata?.excellenceReason && (
          <div className="chat-message__excellence-reason">
            <strong>Why it&apos;s great:</strong> {message.metadata.excellenceReason}
          </div>
        )}

        {/* Assumptions */}
        {message.metadata?.assumptions?.length > 0 && (
          <div className="chat-message__assumptions">
            <strong>Assumptions made:</strong>
            <ul>
              {message.metadata.assumptions.map((assumption, i) => (
                <li key={i}>{assumption}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Learning Report */}
        {message.metadata?.learningReport && (
          <div className="chat-message__report">
            <div className="chat-message__report-header">
              <strong>Learning Report</strong>
              <span className={`chat-message__score chat-message__score--${getScoreClass(message.metadata.learningReport.overall_score)}`}>
                {message.metadata.learningReport.overall_score}/100
              </span>
            </div>
            <p className="chat-message__justification">
              {message.metadata.learningReport.overall_justification}
            </p>
            
            {/* Score breakdown */}
            {message.metadata.learningReport.category_scores && (
              <div className="chat-message__score-breakdown">
                <strong>Score Breakdown:</strong>
                <div className="chat-message__scores-grid">
                  {Object.entries(message.metadata.learningReport.category_scores).map(([key, value]) => (
                    <div key={key} className="chat-message__score-item">
                      <span className="chat-message__score-label">{formatCategoryName(key)}</span>
                      <div className="chat-message__score-bar">
                        <div 
                          className={`chat-message__score-fill chat-message__score-fill--${getScoreClass(value)}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="chat-message__score-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {message.metadata.learningReport.strengths?.length > 0 && (
              <div className="chat-message__strengths">
                <strong>Strengths:</strong>
                <ul>
                  {message.metadata.learningReport.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {message.metadata.learningReport.top_weaknesses?.length > 0 && (
              <div className="chat-message__weaknesses">
                <strong>Areas for improvement:</strong>
                <ul>
                  {message.metadata.learningReport.top_weaknesses.map((w, i) => (
                    <li key={i}>
                      <strong>{w.issue}:</strong> {w.example} → {w.fix}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Copy button for assistant messages */}
        {!isUser && message.content && (
          <div className="chat-message__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

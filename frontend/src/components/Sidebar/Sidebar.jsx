/**
 * Sidebar Component
 * Permanent left sidebar for chat history and navigation
 */

import { useState } from 'react';
import { Button } from '../ui';
import './Sidebar.css';

// Icons
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString();
}

/**
 * Generate a title from the first message
 */
function generateTitle(firstMessage) {
  if (!firstMessage) return 'New Chat';
  const content = firstMessage.content || '';
  // Truncate to ~50 chars
  if (content.length <= 50) return content;
  return content.substring(0, 47) + '...';
}

export default function Sidebar({
  chatSessions = [],
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  user,
  onSignIn,
  onSignOut,
  onOpenSettings
}) {
  const [hoveredSession, setHoveredSession] = useState(null);

  return (
    <aside className="sidebar">
      {/* Header with New Chat button */}
      <div className="sidebar__header">
        <Button
          variant="primary"
          className="sidebar__new-chat"
          onClick={onNewChat}
        >
          <PlusIcon />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Chat history list */}
      <div className="sidebar__content">
        <div className="sidebar__section">
          <h3 className="sidebar__section-title">Recent Chats</h3>
              
          {chatSessions.length === 0 ? (
            <p className="sidebar__empty">No chat history yet</p>
          ) : (
            <ul className="sidebar__list">
              {chatSessions.map((session) => (
                <li 
                  key={session.id}
                  className={`sidebar__item ${session.id === currentSessionId ? 'sidebar__item--active' : ''}`}
                  onMouseEnter={() => setHoveredSession(session.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                >
                  <button
                    className="sidebar__item-button"
                    onClick={() => onSelectSession(session.id)}
                  >
                    <ChatIcon />
                    <div className="sidebar__item-content">
                      <span className="sidebar__item-title">
                        {session.title || generateTitle(session.messages?.[0])}
                      </span>
                      <span className="sidebar__item-time">
                        {formatRelativeTime(session.updatedAt || session.createdAt)}
                      </span>
                    </div>
                  </button>
                  
                  {hoveredSession === session.id && (
                    <button
                      className="sidebar__item-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      aria-label="Delete chat"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer with user info */}
      <div className="sidebar__footer">
        {user ? (
          <div className="sidebar__user">
            <button 
              className="sidebar__user-button"
              onClick={onOpenSettings}
              title={user.displayName || user.email}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="sidebar__user-avatar" />
              ) : (
                <div className="sidebar__user-avatar sidebar__user-avatar--placeholder">
                  <UserIcon />
                </div>
              )}
              <span className="sidebar__user-name">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </button>
            
            <button
              className="sidebar__settings-button"
              onClick={onOpenSettings}
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="sidebar__signin"
            onClick={onSignIn}
          >
            Sign In
          </Button>
        )}
      </div>
    </aside>
  );
}

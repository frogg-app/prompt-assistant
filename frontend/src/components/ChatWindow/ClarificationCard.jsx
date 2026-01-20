/**
 * ClarificationCard Component
 * Interactive card for answering clarification questions
 */

import { useState, useEffect } from 'react';
import { Button } from '../ui';
import './ClarificationCard.css';

export default function ClarificationCard({ clarifications, onSubmit, isLoading }) {
  const [answers, setAnswers] = useState({});

  // Initialize answers with defaults
  useEffect(() => {
    const initial = {};
    clarifications.forEach((item) => {
      if (item.default !== undefined && item.default !== null) {
        initial[item.id] = item.default;
      } else if (item.type === 'multi_select') {
        initial[item.id] = [];
      } else if (item.type === 'boolean') {
        initial[item.id] = false;
      } else {
        initial[item.id] = '';
      }
    });
    setAnswers(initial);
  }, [clarifications]);

  const updateAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const isMissingRequired = (item) => {
    const value = answers[item.id];
    const required = item.validation?.required;
    
    if (!required) return false;
    
    if (item.type === 'multi_select') {
      return !Array.isArray(value) || value.length === 0;
    }
    if (item.type === 'boolean') {
      return false; // boolean always has a value
    }
    if (item.type === 'number') {
      return value === '' || value === null;
    }
    return !value || String(value).trim() === '';
  };

  const hasAllRequired = clarifications.every(item => !isMissingRequired(item));

  return (
    <div className="clarification-card">
      <div className="clarification-card__header">
        <h3>Clarifying the Objective</h3>
        <p>Answer these questions to help refine your prompt better.</p>
      </div>

      <div className="clarification-card__items">
        {clarifications.map((item) => (
          <div key={item.id} className="clarification-item">
            <label className="clarification-item__question">
              {item.question}
              {item.validation?.required && <span className="required">*</span>}
            </label>
            <p className="clarification-item__reason">{item.why_required}</p>
            
            {renderInput(item, answers[item.id], updateAnswer)}
          </div>
        ))}
      </div>

      <div className="clarification-card__actions">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isLoading || !hasAllRequired}
          loading={isLoading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function renderInput(item, value, onChange) {
  const validation = item.validation || {};

  if (item.type === 'single_select') {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(item.id, e.target.value)}
        className="clarification-input"
      >
        {!validation.required && <option value="">Select an option</option>}
        {(item.options || []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (item.type === 'multi_select') {
    const selections = Array.isArray(value) ? value : [];
    return (
      <div className="clarification-checkboxes">
        {(item.options || []).map((opt) => (
          <label key={opt} className="clarification-checkbox">
            <input
              type="checkbox"
              checked={selections.includes(opt)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange(item.id, [...selections, opt]);
                } else {
                  onChange(item.id, selections.filter(s => s !== opt));
                }
              }}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (item.type === 'long_text') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(item.id, e.target.value)}
        placeholder={validation.regex ? `Expected format: ${validation.regex}` : ''}
        rows={3}
        className="clarification-input"
      />
    );
  }

  if (item.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(item.id, e.target.value)}
        min={validation.min}
        max={validation.max}
        className="clarification-input"
      />
    );
  }

  if (item.type === 'boolean') {
    return (
      <label className="clarification-checkbox">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(item.id, e.target.checked)}
        />
        <span>Yes</span>
      </label>
    );
  }

  // Default: short_text
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(item.id, e.target.value)}
      placeholder={validation.regex ? `Expected format: ${validation.regex}` : ''}
      className="clarification-input"
    />
  );
}

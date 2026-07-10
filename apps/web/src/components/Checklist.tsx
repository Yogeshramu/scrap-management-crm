'use client';
import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';

interface ChecklistItem {
  label: string;
  checked: boolean;
  custom?: boolean;
}

interface ChecklistProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  disabled?: boolean;
}

export default function Checklist({ items, onChange, disabled }: ChecklistProps) {
  const [input, setInput] = useState('');

  const toggle = (index: number) => {
    if (disabled) return;
    onChange(items.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  };

  const add = () => {
    const label = input.trim();
    if (!label || disabled) return;
    onChange([...items, { label, checked: true, custom: true }]);
    setInput('');
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '8px', userSelect: 'none',
              border: `1px solid ${item.checked ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
              background: item.checked ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              onClick={() => toggle(i)}
              style={{
                width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                border: `1.5px solid ${item.checked ? '#c9a84c' : 'rgba(255,255,255,0.2)'}`,
                background: item.checked ? '#c9a84c' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: disabled ? 'default' : 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {item.checked && <Check size={11} color="#000" strokeWidth={3} />}
            </div>
            <span
              onClick={() => toggle(i)}
              style={{ fontSize: '0.9rem', color: item.checked ? '#e2c97e' : '#94a3b8', cursor: disabled ? 'default' : 'pointer' }}
            >
              {item.label}
            </span>
            {item.custom && !disabled && (
              <button
                type="button"
                onClick={() => remove(i)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Add custom component..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={add}
            className="btn-outline"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      )}
    </div>
  );
}

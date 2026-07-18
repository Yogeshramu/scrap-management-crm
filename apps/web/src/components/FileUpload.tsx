'use client';

import { useRef } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';

type AcceptType = 'images' | 'pdf' | 'both';

interface FileUploadProps {
  label: string;
  value: string;           // file name or object URL
  onChange: (value: string, file?: File) => void;
  accept?: AcceptType;
  compact?: boolean;       // smaller inline style
}

const ACCEPT_MAP: Record<AcceptType, string> = {
  images: 'image/jpeg,image/png,image/webp',
  pdf:    'application/pdf',
  both:   'image/jpeg,image/png,image/webp,application/pdf',
};

const LABEL_MAP: Record<AcceptType, string> = {
  images: 'JPG, PNG, WEBP',
  pdf:    'PDF only',
  both:   'JPG, PNG, WEBP or PDF',
};

function isImage(val: string) {
  return /\.(jpg|jpeg|png|webp)$/i.test(val) || val.startsWith('blob:');
}

export default function FileUpload({ label, value, onChange, accept = 'both', compact = false }: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange(url, file);
    e.target.value = '';
  };

  const fileName = value ? value.split('/').pop() || value : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', margin: 0 }}>{label}</p>

      {value ? (
        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.05)' }}>
          {isImage(value) ? (
            <img src={value} alt={label} style={{ width: '100%', maxHeight: compact ? '80px' : '120px', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
              <FileText size={20} style={{ color: '#c9a84c', flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <X size={12} />
          </button>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(201,168,76,0.85)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#0e0c09', fontSize: '0.72rem', fontWeight: 700 }}
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: compact ? '14px' : '20px', borderRadius: '10px', border: '1.5px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'border-color 0.15s', minHeight: compact ? '70px' : '100px' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
        >
          {accept === 'pdf' ? <FileText size={20} style={{ color: '#64748b' }} /> : <Image size={20} style={{ color: '#64748b' }} />}
          <span style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
            Click to upload<br />
            <span style={{ color: '#475569', fontSize: '0.72rem' }}>{LABEL_MAP[accept]}</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <Upload size={12} style={{ color: '#c9a84c' }} />
            <span style={{ fontSize: '0.75rem', color: '#c9a84c', fontWeight: 600 }}>Browse File</span>
          </div>
        </div>
      )}

      <input ref={ref} type="file" accept={ACCEPT_MAP[accept]} style={{ display: 'none' }} onChange={handleChange} />
    </div>
  );
}

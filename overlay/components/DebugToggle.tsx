import { useState, type CSSProperties } from 'react';

type DebugToggleProps = {
  initialEnabled: boolean;
  onChange: (enabled: boolean) => Promise<void>;
};

const buttonStyle = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  zIndex: 2147483647,
  border: 0,
  borderRadius: 6,
  padding: '8px 10px',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
  font: '12px/1.2 system-ui, sans-serif',
} satisfies CSSProperties;

export function DebugToggle({ initialEnabled, onChange }: DebugToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);

  const toggle = async () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    await onChange(nextEnabled);
  };

  return (
    <button type="button" aria-pressed={enabled} onClick={() => void toggle()} style={buttonStyle}>
      Debug: {enabled ? 'on' : 'off'}
    </button>
  );
}

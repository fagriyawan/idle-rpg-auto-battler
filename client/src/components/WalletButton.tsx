import type { CSSProperties } from 'react';

interface WalletButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function WalletButton({
  label,
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary',
}: WalletButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyles: CSSProperties =
    variant === 'primary'
      ? { backgroundColor: '#6c63ff', color: '#fff' }
      : { backgroundColor: '#333', color: '#ccc' };

  const disabledStyles: CSSProperties = isDisabled
    ? { opacity: 0.5, cursor: 'not-allowed' }
    : {};

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{ ...baseStyle, ...variantStyles, ...disabledStyles }}
    >
      {loading ? (
        <span style={loadingContainerStyle}>
          <span style={spinnerStyle} />
          <span>Loading...</span>
        </span>
      ) : (
        label
      )}
    </button>
  );
}

const baseStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  border: 'none',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  minWidth: '220px',
  transition: 'opacity 0.2s ease',
};

const loadingContainerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const spinnerStyle: CSSProperties = {
  display: 'inline-block',
  width: '1rem',
  height: '1rem',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid #fff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

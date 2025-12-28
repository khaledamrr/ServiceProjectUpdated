import React from 'react';

interface Props {
    strength: number;
}

const PasswordStrengthIndicator: React.FC<Props> = ({ strength }) => {
    const getColor = () => {
        switch (strength) {
            case 0: return '#e5e7eb';
            case 1: return '#ef4444'; // Red
            case 2: return '#f59e0b'; // Orange
            case 3: return '#3b82f6'; // Blue
            case 4: return '#22c55e'; // Green
            case 5: return '#15803d'; // Dark Green
            default: return '#e5e7eb';
        }
    };

    const getLabel = () => {
        switch (strength) {
            case 0: return '';
            case 1: return 'Weak';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Strong';
            case 5: return 'Very Strong';
            default: return '';
        }
    };

    return (
        <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
                {[1, 2, 3, 4, 5].map((level) => (
                    <div
                        key={level}
                        style={{
                            flex: 1,
                            backgroundColor: level <= strength ? getColor() : '#e5e7eb',
                            borderRadius: '2px',
                            transition: 'background-color 0.3s',
                        }}
                    />
                ))}
            </div>
            <div style={{
                textAlign: 'right',
                fontSize: '0.75rem',
                color: getColor(),
                marginTop: '0.25rem',
                height: '1rem'
            }}>
                {getLabel()}
            </div>
        </div>
    );
};

export default PasswordStrengthIndicator;

import { useState, useEffect } from 'react';

export const usePasswordStrength = (password: string) => {
    const [strength, setStrength] = useState(0);

    useEffect(() => {
        let score = 0;
        if (!password) {
            setStrength(0);
            return;
        }

        if (password.length > 8) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*]/.test(password)) score += 1;

        setStrength(score);
    }, [password]);

    return strength;
};

'use client';

import { useMemo } from 'react';

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  feedback: string[];
}

// Common weak passwords to check against
const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'monkey',
  '1234567',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'shadow',
  '123123',
  '654321',
  'superman',
  'qazwsx',
  'michael',
  'football',
  'password1',
  'password123',
  'welcome',
  'welcome1',
  'admin',
  'login',
  'princess',
  'starwars',
  'passw0rd',
  'hello',
  'charlie',
]);

// Common keyboard patterns
const KEYBOARD_PATTERNS = [
  'qwerty',
  'asdf',
  'zxcv',
  'qazwsx',
  '1qaz',
  '2wsx',
  '1234',
  '4321',
  'abcd',
  'dcba',
  'aaaa',
  '1111',
  '0000',
];

/**
 * Check password strength and provide feedback
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      label: 'Too weak',
      color: 'bg-destructive',
      feedback: ['Enter a password'],
    };
  }

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  }

  // Character variety checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

  const varietyCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  if (varietyCount >= 3) score++;
  if (varietyCount === 4) score++;

  if (!hasLower) feedback.push('Add lowercase letters');
  if (!hasUpper) feedback.push('Add uppercase letters');
  if (!hasDigit) feedback.push('Add numbers');
  if (!hasSpecial) feedback.push('Add special characters');

  // Check for common passwords
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowerPassword)) {
    score = Math.max(0, score - 3);
    feedback.unshift('This is a commonly used password');
  }

  // Check for keyboard patterns
  for (const pattern of KEYBOARD_PATTERNS) {
    if (lowerPassword.includes(pattern)) {
      score = Math.max(0, score - 1);
      feedback.push('Avoid keyboard patterns');
      break;
    }
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeated characters');
  }

  // Check for sequential numbers or letters
  if (/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential characters');
  }

  // Normalize score to 0-4
  score = Math.min(4, Math.max(0, score));

  const labels: Record<number, { label: string; color: string }> = {
    0: { label: 'Too weak', color: 'bg-destructive' },
    1: { label: 'Weak', color: 'bg-orange-500' },
    2: { label: 'Fair', color: 'bg-yellow-500' },
    3: { label: 'Good', color: 'bg-lime-500' },
    4: { label: 'Strong', color: 'bg-green-500' },
  };

  return {
    score,
    ...labels[score],
    feedback: feedback.length > 0 ? feedback : ['Great password!'],
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  showFeedback?: boolean;
}

/**
 * Visual password strength meter component
 */
export function PasswordStrengthMeter({ password, showFeedback = true }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => checkPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength.score ? strength.color : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength:</span>
        <span
          className={`font-medium ${
            strength.score <= 1 ? 'text-destructive' : strength.score === 2 ? 'text-yellow-500' : 'text-green-500'
          }`}
        >
          {strength.label}
        </span>
      </div>

      {/* Feedback */}
      {showFeedback && strength.score < 3 && (
        <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
          {strength.feedback.slice(0, 3).map((tip, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className="text-muted-foreground">•</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Hook to use password strength checking
 */
export function usePasswordStrength(password: string): PasswordStrength {
  return useMemo(() => checkPasswordStrength(password), [password]);
}

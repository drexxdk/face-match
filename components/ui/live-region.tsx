import { useEffect, useRef, useState } from 'react';

/**
 * A component that announces messages to screen readers using ARIA live regions
 * Useful for dynamic content updates that need to be communicated to assistive technologies
 */
export function LiveRegion({
  message,
  politeness = 'polite',
  clearOnUnmount = true,
}: {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearOnUnmount?: boolean;
}) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = regionRef.current;
    return () => {
      if (clearOnUnmount && element) {
        element.textContent = '';
      }
    };
  }, [clearOnUnmount]);

  if (!message) return null;

  return (
    <div ref={regionRef} role="status" aria-live={politeness} aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

/**
 * Hook to manage live region announcements
 * Returns a function to announce messages and the LiveRegion component
 */
export function useLiveRegion(politeness: 'polite' | 'assertive' = 'polite') {
  const [message, setMessage] = useState('');

  const announce = (newMessage: string) => {
    // Clear first to ensure the announcement is made even if the message is the same
    setMessage('');
    setTimeout(() => setMessage(newMessage), 100);
  };

  return {
    announce,
    LiveRegion: () => <LiveRegion message={message} politeness={politeness} />,
  };
}

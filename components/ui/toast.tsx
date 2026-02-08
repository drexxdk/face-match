'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'hsl(240 10% 4%)',
          color: 'hsl(0 0% 98%)',
          border: '1px solid hsl(240 3.8% 46.1% / 0.2)',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: 'hsl(142 76% 36%)',
            secondary: 'hsl(0 0% 98%)',
          },
          style: {
            border: '1px solid hsl(142 76% 36% / 0.3)',
          },
        },
        error: {
          iconTheme: {
            primary: 'hsl(0 84.2% 60.2%)',
            secondary: 'hsl(0 0% 98%)',
          },
          style: {
            border: '1px solid hsl(0 84.2% 60.2% / 0.3)',
          },
        },
      }}
    />
  );
}

'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register in production or when sw.js exists
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          if (reg.installing) {
            console.log('Service worker installing');
          } else if (reg.active) {
            console.log('Service worker active');
          }
        })
        .catch(() => {
          // SW might not exist in local development mode when disabled
        });
    }
  }, []);

  return null;
}

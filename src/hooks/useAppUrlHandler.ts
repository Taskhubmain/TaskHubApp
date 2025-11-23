import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';

export function useAppUrlHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (data: { url: string }) => {
      try {
        const url = new URL(data.url);

        // Обработка custom scheme
        if (url.protocol === 'com.taskhub.app:' && url.pathname === '/oauth-callback') {
          const params = new URLSearchParams(url.search);
          const code = params.get('code');
          const state = params.get('state');
          navigate(`/oauth-callback?code=${code ?? ''}${state ? `&state=${state}` : ''}`);
        } else {
          const path = url.pathname + url.search + url.hash;
          navigate(path);
        }
      } catch (e) {
        console.error('App URL handler error:', e);
      }
    };

    const listener = App.addListener('appUrlOpen', (event) => handler(event));
    return () => listener.remove();
  }, [navigate]);
}

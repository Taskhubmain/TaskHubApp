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
        if (url.protocol === 'com.taskhub.app:') {
          if (url.pathname === '/oauth-callback') {
            const params = new URLSearchParams(url.search);
            const code = params.get('code');
            const state = params.get('state');
            navigate(`/oauth-callback?code=${code ?? ''}${state ? `&state=${state}` : ''}`);
          } else if (url.pathname === '/payment-callback') {
            const params = new URLSearchParams(url.search);
            const type = params.get('type');
            const status = params.get('status');

            if (type === 'wallet') {
              if (status === 'success') {
                navigate(`/wallet?deposit=success`);
              } else if (status === 'cancelled') {
                navigate(`/wallet?deposit=cancelled`);
              } else {
                navigate('/wallet');
              }
            } else {
              navigate('/wallet');
            }
          } else if (url.pathname === '/stripe-callback') {
            const params = new URLSearchParams(url.search);
            const type = params.get('type');
            const status = params.get('status');

            if (type === 'onboarding') {
              if (status === 'return') {
                navigate(`/wallet?stripe=onboarding_return`);
              } else if (status === 'refresh') {
                navigate(`/wallet?stripe=onboarding_refresh`);
              } else {
                navigate('/wallet');
              }
            } else {
              navigate('/wallet');
            }
          } else {
            const path = url.pathname + url.search + url.hash;
            navigate(path);
          }
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

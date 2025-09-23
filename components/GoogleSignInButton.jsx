import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let googleScriptPromise = null;

function loadGoogleScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google && window.google.accounts && window.google.accounts.id) {
    return Promise.resolve(true);
  }
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = (error) => {
        googleScriptPromise = null;
        reject(error);
      };
      document.head.appendChild(script);
    });
  }
  return googleScriptPromise;
}

function useGoogleIdentity(onCredential) {
  React.useEffect(() => {
    let cancelled = false;
    if (!CLIENT_ID) return;
    loadGoogleScript()
      .then(() => {
        if (cancelled) return;
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
          throw new Error('Google Identity script unavailable.');
        }
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (cancelled) return;
            onCredential?.(response);
          },
          ux_mode: 'popup',
        });
      })
      .catch((error) => {
        console.error('Failed to load Google Identity Services:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [onCredential]);
}

export default function GoogleSignInButton({ mode = 'signin', onError, onSuccess }) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = React.useRef(null);
  const [scriptReady, setScriptReady] = React.useState(false);
  const [localError, setLocalError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleCredential = React.useCallback(
    async (response) => {
      if (!response?.credential) {
        const msg = 'Google 登录失败，请重试。';
        setLocalError(msg);
        onError?.(msg);
        return;
      }
      setLocalError('');
      onError?.('');
      setSubmitting(true);
      try {
        await loginWithGoogle({ credential: response.credential });
        onSuccess?.();
      } catch (error) {
        const message = error?.message || 'Google 登录失败，请稍后再试。';
        setLocalError(message);
        onError?.(message);
      } finally {
        setSubmitting(false);
      }
    },
    [loginWithGoogle, onError, onSuccess],
  );

  useGoogleIdentity(handleCredential);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let mounted = true;
    if (!CLIENT_ID) {
      setScriptReady(false);
      return undefined;
    }
    loadGoogleScript()
      .then(() => {
        if (!mounted) return;
        setScriptReady(true);
        if (window.google && window.google.accounts && window.google.accounts.id && buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            shape: 'rectangular',
            theme: 'filled_blue',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            logo_alignment: 'left',
          });
        }
      })
      .catch((error) => {
        console.error('Failed to initialise Google button:', error);
        setScriptReady(false);
        const msg = '无法加载 Google 登录组件。';
        setLocalError(msg);
        onError?.(msg);
      });

    return () => {
      mounted = false;
    };
  }, [mode, onError]);

  if (!CLIENT_ID) {
    return (
      <div style={{
        marginTop: 12,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(248, 250, 252, 0.9)',
        color: '#94a3b8',
        fontSize: 13,
        textAlign: 'center',
      }}>
        管理员尚未配置 Google 登录。
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div ref={buttonRef} style={{ display: scriptReady ? 'inline-flex' : 'none' }} />
      {(!scriptReady || submitting) && (
        <button
          type="button"
          disabled
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#e2e8f0',
            color: '#475569',
            borderRadius: 10,
            border: 'none',
            fontSize: 15,
            fontWeight: 600,
            marginTop: scriptReady ? 8 : 0,
          }}
        >
          {submitting ? 'Google 登录中…' : '正在加载 Google 登录…'}
        </button>
      )}
      {localError ? (
        <div style={{
          marginTop: 12,
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#b91c1c',
          borderRadius: 8,
          padding: '8px 10px',
          fontSize: 13,
        }}>
          {localError}
        </div>
      ) : null}
    </div>
  );
}

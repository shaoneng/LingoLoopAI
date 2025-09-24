# Frontend Auth Integration

This project now exposes a shared React context for client-side authentication state. Wrap pages in the provider (already done in `pages/_app.jsx`) and consume auth data/functions via the `useAuth` hook.

## Key pieces
- `contexts/AuthContext.jsx`
  - Stores `{ user, accessToken, refreshToken }` plus expiry info in `localStorage`.
  - Automatically refreshes access tokens before they expire (uses `/api/auth/refresh`).
  - Exposes `login`, `register`, `logout`, `refresh`, `setUser` helpers.
- `pages/login.jsx`, `pages/register.jsx`, `pages/forgot-password.jsx`
  - Simple forms that call the context helpers / auth APIs.
  - Use query param `?next=/some/path` on `/login` to redirect after login.
- `pages/index.jsx`
  - Shows auth status in the top-right and allows quick logout.
- `pages/reset-password.jsx`
  - Accepts `token` from the email link and posts to `/api/auth/reset-password`.
- `components/GoogleSignInButton.jsx`
  - Loads Google Identity Services and pipes the credential to `/api/auth/google`.

## Usage pattern
```jsx
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  if (!user) return <LoginPrompt />;
  return (
    <div>
      <h2>Hello, {user.displayName || user.email}</h2>
      <button onClick={logout}>退出</button>
    </div>
  );
}
```

## Environment
- Set `NEXT_PUBLIC_API_BASE` if the frontend is hosted separately from the Next.js API routes; otherwise defaults to same-origin.
- Requires backend env var `AUTH_JWT_SECRET` so auth routes can mint tokens.
- Password reset email sends require:
  - `APP_BASE_URL` (or `NEXT_PUBLIC_APP_BASE_URL`) to construct the reset link.
  - `SENDGRID_API_KEY` + `MAIL_FROM` to deliver mail via SendGrid. Without these, the mailer logs to console (set `MAIL_FALLBACK_MODE=console`).
  - Optional `AUTH_PASSWORD_RESET_TTL_MIN` to adjust token expiry (default 30 minutes).
- Google OAuth:
  - `GOOGLE_OAUTH_CLIENT_ID` (and matching `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID`) must list the OAuth client ID(s).
  - Configure the OAuth consent screen + Authorized origins for the domains serving this app.

Update this document as additional auth flows (Google OAuth, password reset, profile update) go live.

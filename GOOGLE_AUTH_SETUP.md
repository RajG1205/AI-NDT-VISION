# Google Authentication

AI-NDT Vision uses Supabase Auth for Google OAuth.

## 1. Google Cloud

Create an OAuth Client ID for a **Web application** in Google Cloud.

Authorized JavaScript origins:
- `http://localhost:5173`

Add your production origin later.

Authorized redirect URI:

```text
https://imtujarnhlrcjenhtlge.supabase.co/auth/v1/callback
```

## 2. Supabase

In Supabase:

**Authentication → Providers → Google**

Enable Google and paste the Google Client ID and Client Secret.

## 3. Supabase redirect allow list

Add:

```text
http://localhost:5173/auth
```

and your production callback/return URL when deployed.

## 4. Application

The app calls:

```ts
supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth`,
  },
});
```

Supabase handles the OAuth redirect and session persistence.

Never put the Google client secret or Supabase service-role/secret key in frontend code.

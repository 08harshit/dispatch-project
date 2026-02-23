# Authentication Flow

## Overview

Auth is handled entirely by **Supabase Auth** (email + password). No custom backend. The frontend talks directly to Supabase via `@supabase/supabase-js`.

## Key Files

| File | Role |
|---|---|
| `src/integrations/supabase/client.ts` | Initializes the Supabase client |
| `src/contexts/AuthContext.tsx` | Provides auth state to the entire app |
| `src/components/auth/ProtectedRoute.tsx` | Guards dashboard routes |
| `src/pages/Auth.tsx` | Login / Sign-up UI |
| `src/pages/Landing.tsx` | Public landing page |
| `supabase/migrations/..._7bff0305.sql` | Creates `profiles` table + auto-profile trigger |

## Flow Diagram

```
 User visits /
      │
      ▼
  Landing Page (public)
      │
      ├── clicks "Get Started" / "Sign In"
      ▼
  /auth page
      │
      ├── Sign Up ──► supabase.auth.signUp({ email, password })
      │                   │
      │                   ├── Supabase creates row in auth.users
      │                   ├── DB trigger: handle_new_user() fires
      │                   │     └── INSERT into profiles (user_id, display_name)
      │                   └── Returns session
      │
      ├── Login ──► supabase.auth.signInWithPassword({ email, password })
      │                   └── Returns session
      ▼
  Session stored in localStorage
      │
      ▼
  AuthContext picks up session via onAuthStateChange()
      │
      ▼
  Navigate to /dashboard
      │
      ▼
  ProtectedRoute checks session
      ├── session exists  → render page
      └── no session      → redirect to /auth
```

## How It Works

### 1. Supabase Client (`client.ts`)

```ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

Session is persisted in `localStorage` and tokens are auto-refreshed.

### 2. AuthContext (`AuthContext.tsx`)

Wraps the entire app. Provides `{ session, user, loading, signOut }`.

- On mount: calls `supabase.auth.getSession()` for initial state
- Subscribes to `supabase.auth.onAuthStateChange()` for real-time auth events (login, logout, token refresh)
- Exposes `signOut()` which calls `supabase.auth.signOut()`

### 3. ProtectedRoute (`ProtectedRoute.tsx`)

```
if loading  → show spinner
if !session → redirect to /auth
else        → render children
```

All dashboard routes (`/dashboard`, `/couriers`, `/shippers`, `/loads`, `/accounting`, `/analytics`, `/tickets`, `/settings`) are wrapped with `<ProtectedRoute>`.

### 4. Auth Page (`Auth.tsx`)

- Toggles between **Login** and **Sign Up** modes
- Login: `supabase.auth.signInWithPassword({ email, password })`
- Sign Up: `supabase.auth.signUp({ email, password, options: { data: { display_name } } })`
- If already authenticated: auto-redirects to `/dashboard`

### 5. Auto Profile Creation (DB Trigger)

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

`handle_new_user()` inserts a row into `profiles` with `user_id` and `display_name` (from signup metadata or email fallback).

### 6. Logout

Sidebar "Log out" button → `signOut()` from AuthContext → `supabase.auth.signOut()` → session cleared → `onAuthStateChange` fires → `ProtectedRoute` redirects to `/auth`.

## Route Map

| Route | Access | Guard |
|---|---|---|
| `/` | Public | None |
| `/auth` | Public | Auto-redirects to `/dashboard` if logged in |
| `/dashboard` | Private | `<ProtectedRoute>` |
| `/couriers` | Private | `<ProtectedRoute>` |
| `/shippers` | Private | `<ProtectedRoute>` |
| `/loads` | Private | `<ProtectedRoute>` |
| `/accounting` | Private | `<ProtectedRoute>` |
| `/analytics` | Private | `<ProtectedRoute>` |
| `/tickets` | Private | `<ProtectedRoute>` |
| `/settings` | Private | `<ProtectedRoute>` |
| `*` | Public | 404 page |

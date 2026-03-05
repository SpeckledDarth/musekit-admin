# Fix: verifyAdmin() Cookie Authentication (CRITICAL)

## Problem

The `verifyAdmin()` function in `src/lib/admin-auth.ts` breaks all admin API routes for browser-based users. Every route returns **401 Unauthorized** because the cookie-based authentication path looks for a cookie named `sb-access-token`, which does not exist.

Supabase SSR (`@supabase/ssr`) stores session tokens in cookies named `sb-<project-ref>-auth-token`, split into chunks (`.0`, `.1`, etc.). The hardcoded name never matches, so authentication always fails for browser requests.

## Scope

- **1 file changed**: `src/lib/admin-auth.ts`
- **1 dependency added**: `@supabase/ssr`
- **0 API route changes** — all 13 routes call `verifyAdmin()` and will work once the function is fixed

## Current Code Issues

1. **Wrong cookie name**: `extractCookieValue(cookieHeader, "sb-access-token")` — this cookie doesn't exist in Supabase SSR
2. **Duplicated logic**: The admin role check (profiles table lookup) is copy-pasted in both the cookie and Bearer token branches
3. **Unnecessary helper**: `extractCookieValue()` manually parses cookies when `@supabase/ssr` handles this automatically

## Fix

Replace the cookie-based auth path with `createServerClient` from `@supabase/ssr`, which:
- Automatically finds and reconstructs chunked Supabase auth cookies regardless of project ref
- Uses `getUser()` without a token argument — the SSR client resolves the session internally
- Is the officially supported approach for Next.js Pages Router API routes

### Before (broken)

```typescript
if (!token) {
  const sbAccessToken = extractCookieValue(cookieHeader, "sb-access-token");
  if (!sbAccessToken) {
    res.status(401).json({ error: "Unauthorized" });
    return null; // <-- always hits this
  }
  // ... never reached
}
```

### After (fixed)

```typescript
if (token) {
  // Bearer token path (programmatic API calls)
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) { res.status(401)...; return null; }
  user = data.user;
} else {
  // Cookie path (browser requests) — @supabase/ssr handles chunked cookies
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { /* parse req.headers.cookie */ },
      setAll() { /* read-only, no-op */ },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) { res.status(401)...; return null; }
  user = data.user;
}

// Single admin role check (deduplicated)
const { data: profile } = await adminClient
  .from("profiles").select("role, email").eq("id", user.id).single();
```

## Auth Flow After Fix

```
Browser request --> verifyAdmin()
  |-- Authorization header present? --> Bearer token path (createClient + getUser(token))
  '-- No header? --> Cookie path (createServerClient + getUser())
       |
  Authenticated user obtained
       |
  Lookup profiles table via service-role client
       |
  role = admin or super_admin? --> Return { userId, email, role }
  Otherwise --> 403 Forbidden
```

## Implementation Steps

1. Install `@supabase/ssr` package
2. Rewrite `src/lib/admin-auth.ts`:
   - Import `createServerClient` from `@supabase/ssr`
   - Replace cookie path with SSR client approach
   - Deduplicate admin role check
   - Remove `extractCookieValue` helper
3. Verify TypeScript build passes
4. Restart dev server and confirm no regressions

## Acceptance Criteria

- `@supabase/ssr` added as dependency
- `verifyAdmin()` authenticates via Supabase SSR cookies (chunked `sb-*-auth-token*` format)
- Bearer token path still works for programmatic access
- Admin users get 200 from all admin API routes
- Non-admin users get 403 Forbidden
- Unauthenticated requests get 401 Unauthorized
- TypeScript compiles with zero errors
- No changes to any API route files
- `extractCookieValue` helper removed
- Admin role check deduplicated (single code path)

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Risk

**Low**. This is a targeted fix to a single utility function. The function signature and return type remain identical, so all 13 API routes continue to work without modification.

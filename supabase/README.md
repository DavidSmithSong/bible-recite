# Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Add these Vercel environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy the Vercel project.

The app uses name-only profiles. This separates practice data by name, but it is not secure authentication.

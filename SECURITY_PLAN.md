# Securing Your Attendance Database (RLS & Server Actions)

Currently, your Next.js application interacts with Supabase directly from the browser (Client Components) using the `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Because this key is public, anyone can theoretically read or wipe your `employees` and `attendance` tables.

Since we implemented a "Simple PIN" login instead of Supabase's built-in Email/Password Auth, Supabase doesn't natively know if a user is an "Admin" or an "Attacker" via the RLS. To lock down the tables securely, we must shift the database logic to the server.

## Phase 1: Enable Row Level Security (RLS)
You will need to run the following SQL commands in your **Supabase Dashboard -> SQL Editor**:

```sql
-- 1. Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- 2. Allow PUBLIC READ ONLY for scan page operations
-- (Employees need to see their names to check in, and scan needs school_settings)
CREATE POLICY "Allow public read access to active employees" 
ON employees FOR SELECT USING (active = true);

CREATE POLICY "Allow public read access to school settings" 
ON school_settings FOR SELECT USING (true);

-- 3. We DO NOT allow public INSERTS, UPDATES, or DELETES.
-- This effectively blocks attackers from modifying data using the public anon key.
```

## Phase 2: Migrate to Next.js Server Actions
Because we blocked public writes in Phase 1, `app/admin/page.tsx` and `app/scan/page.tsx` will no longer be able to add employees or submit attendance directly from the browser. 

We must create a new file `app/actions.ts` (Next.js Server Actions) that uses your securely hidden `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS safely on the backend:

```typescript
'use server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// High-privilege client that bypasses RLS securely on the server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Example Server Action to Add an Employee securely
export async function addEmployee(data) {
  // 1. Verify custom Admin PIN session cookie safely (so no attacker can call this)
  const session = cookies().get('admin_session');
  if (session?.value !== 'authenticated') throw new Error('Unauthorized');

  // 2. Insert into Supabase
  await supabaseAdmin.from('employees').insert([data]);
}
```

Then, in your `app/admin/page.tsx`, we replace `supabase.from('employees').insert(...)` with `await addEmployee(...)`. 

### Summary
By moving database writes exclusively to secure server actions, we keep the simple frontend PIN login you wanted, but fully protect the database against public manipulation.

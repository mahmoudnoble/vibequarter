"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function syncUser() {
  const { userId } = await auth();
  if (!userId) return;

  const user = await currentUser();
  if (!user) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  const supabase = createClient(url, serviceKey);

  await supabase.from("users").upsert(
    {
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      image_url: user.imageUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clerk_id" },
  );
}

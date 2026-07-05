import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";
import ShoppingList from "@/components/ShoppingList";
import type { Profile } from "@/lib/types";

export default async function Home({
  searchParams,
}: {
  searchParams: { join?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <LoginForm />;

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();

  // Safety net: creates the profile (and, if needed, a first list) for
  // accounts that existed before the linking system was introduced.
  if (!profile) {
    const { data: created, error } = await supabase
      .rpc("ensure_profile")
      .single<Profile>();

    if (error || !created) {
      throw new Error(
        `Impossible de préparer votre profil : ${error?.message ?? "réponse vide du serveur"}`
      );
    }
    profile = created;
  }

  return (
    <main>
      <ShoppingList
        activeListId={profile.active_list_id}
        ownListId={profile.own_list_id}
        currentUserId={user.id}
        prefillJoinId={searchParams.join}
      />
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";
import ShoppingList from "@/components/ShoppingList";
import type { ListInfo, Profile } from "@/lib/types";

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

  const { data: activeList, error: activeListError } = await supabase
    .from("lists")
    .select("*")
    .eq("id", profile.active_list_id)
    .single<ListInfo>();

  if (activeListError || !activeList) {
    throw new Error(
      `Impossible de charger la liste active : ${activeListError?.message ?? "réponse vide du serveur"}`
    );
  }

  return (
    <main>
      <ShoppingList
        activeList={activeList}
        ownListId={profile.own_list_id}
        currentUserId={user.id}
        prefillJoinId={searchParams.join}
      />
    </main>
  );
}


import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";
import ShoppingList from "@/components/ShoppingList";

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

  // Joining a partner's list via a shared invite link (?join=<list_id>)
  if (searchParams.join) {
    await supabase
      .from("list_members")
      .upsert({ list_id: searchParams.join, user_id: user.id }, { onConflict: "list_id,user_id" });
  }

  const { data: membership } = await supabase
    .from("list_members")
    .select("list_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let listId = membership?.list_id as string | undefined;

  // First time here: create a personal list and default categories
  if (!listId) {
    const { data: newList } = await supabase
      .from("lists")
      .insert({ name: "Courses" })
      .select()
      .single();

    listId = newList!.id;
    await supabase.from("list_members").insert({ list_id: listId, user_id: user.id });

    const defaults = [
      { emoji: "🥩", name: "Viandes", position: 0 },
      { emoji: "🍎", name: "Fruits", position: 1 },
      { emoji: "🥫", name: "Conserves", position: 2 },
    ];
    await supabase.from("categories").insert(defaults.map((d) => ({ ...d, list_id: listId })));
  }

  return (
    <main>
      <div className="mx-auto max-w-lg px-4 pt-3">
        <p className="text-center text-xs text-ink/40">
          Invitez votre moitié en partageant :{" "}
          <span className="font-medium text-violet">
            {process.env.NEXT_PUBLIC_SITE_URL ?? ""}?join={listId}
          </span>
        </p>
      </div>
      <ShoppingList listId={listId!} />
    </main>
  );
}

export type Profile = {
  user_id: string;
  own_list_id: string;
  active_list_id: string;
  created_at: string;
};

export type Category = {
  id: string;
  list_id: string;
  name: string;
  emoji: string;
  position: number;
  is_collapsed: boolean;
  created_at: string;
};

export type Item = {
  id: string;
  category_id: string;
  list_id: string;
  name: string;
  is_checked: boolean;
  position: number;
  created_at: string;
};

export type CategoryWithItems = Category & { items: Item[] };

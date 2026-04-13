create table if not exists ingredients (
  id serial primary key,
  name text not null,
  category text not null default '기타',
  quantity text not null default '',
  created_at timestamptz default now()
);

create table if not exists recipes (
  id serial primary key,
  title text not null,
  ingredients_text text not null,
  instructions_text text not null,
  source text not null default 'ai',
  created_at timestamptz default now()
);

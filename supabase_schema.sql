
create table if not exists inscriptions (
 id bigint generated always as identity primary key,
 created_at timestamptz default now(),
 accompagnateur text not null,
 enfant text not null,
 seance text not null,
 statut text default 'Inscrit'
);

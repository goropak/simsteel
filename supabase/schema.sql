-- simsteel 서버 저장 스키마 — v0.5.2
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행.
-- 개인 계정(RLS로 사용자별 격리) + 이미지 Storage.

-- ── 1. 프로젝트 테이블 (사용자당 1 row = 전체 번들) ─────────────────────────
create table if not exists public.projects (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  bundle     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── 2. RLS: 본인 row만 접근 (#supabase 함정 3) ─────────────────────────────
alter table public.projects enable row level security;

drop policy if exists "projects own select" on public.projects;
drop policy if exists "projects own insert" on public.projects;
drop policy if exists "projects own update" on public.projects;
drop policy if exists "projects own delete" on public.projects;

create policy "projects own select" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects own insert" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects own update" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects own delete" on public.projects
  for delete using (auth.uid() = user_id);

-- ── 3. 이미지 Storage 버킷 (#supabase 함정 5·6) ────────────────────────────
-- public-read(보안 자료 없음 — 단순화), 쓰기는 본인 폴더만.
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

drop policy if exists "imgs public read"  on storage.objects;
drop policy if exists "imgs own write"    on storage.objects;
drop policy if exists "imgs own update"   on storage.objects;
drop policy if exists "imgs own delete"   on storage.objects;

-- 읽기: 공개 (URL 아는 사람 열람 가능)
create policy "imgs public read" on storage.objects
  for select using (bucket_id = 'project-images');

-- 쓰기/수정/삭제: 경로 첫 폴더가 본인 uid 인 것만 ({userId}/{key}.png)
create policy "imgs own write" on storage.objects
  for insert with check (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "imgs own update" on storage.objects
  for update using (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "imgs own delete" on storage.objects
  for delete using (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── 4. (대시보드 설정) 이메일 확인 끄기 ────────────────────────────────────
--  Authentication → Providers → Email → "Confirm email" 토글 OFF (#supabase 함정 4).
--  "아이디/비밀번호 즉시 로그인"을 위해 필요. SQL로는 설정 불가 → 대시보드에서.

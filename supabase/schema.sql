-- ============================================================
-- SIROH PARTNER — SUPABASE SCHEMA
-- Program Afiliasi Tiket Museum Siroh
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TIERS (Bronze, Silver, Gold, Platinum)
-- ============================================================
create table public.tiers (
  id            smallint primary key,
  name          text not null,            -- 'Bronze', 'Silver', 'Gold', 'Platinum'
  min_conversions integer not null,       -- syarat jumlah konversi utk naik tier
  commission_rate numeric(5,2) not null,  -- persen, misal 10.00
  badge_color   text not null,
  perks         text[] default '{}'
);

insert into public.tiers (id, name, min_conversions, commission_rate, badge_color, perks) values
  (1, 'Bronze',   0,  10.00, '#A97142', array['Komisi 10%','Akses toolbox dasar']),
  (2, 'Silver',   10, 13.00, '#C0C0C0', array['Komisi 13%','Toolbox lengkap','Badge Silver']),
  (3, 'Gold',     30, 16.00, '#C9A84C', array['Komisi 16%','Priority payout','Sertifikat digital']),
  (4, 'Platinum', 75, 20.00, '#1B4D3E', array['Komisi 20%','Custom QR offline','Manager khusus']);

-- ============================================================
-- 2. AFFILIATES (profil mitra, 1:1 dengan auth.users)
-- ============================================================
create table public.affiliates (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  full_name       text not null,
  email           text not null,
  phone           text,
  ref_code        text not null unique,        -- kode unik utk ?ref=
  tier_id         smallint not null default 1 references public.tiers(id),
  status          text not null default 'pending'
                    check (status in ('pending','approved','suspended')),
  bank_name       text,
  bank_account_no text,
  bank_account_name text,
  total_clicks    integer not null default 0,
  total_conversions integer not null default 0,
  total_commission numeric(12,2) not null default 0,
  created_at      timestamptz not null default now(),
  approved_at     timestamptz
);

create index idx_affiliates_user_id on public.affiliates(user_id);
create index idx_affiliates_ref_code on public.affiliates(ref_code);

-- ============================================================
-- 3. CLICKS (tracking tiap klik link referral)
-- ============================================================
create table public.clicks (
  id            bigint generated always as identity primary key,
  affiliate_id  uuid not null references public.affiliates(id) on delete cascade,
  ip_hash       text,            -- hash IP, bukan IP mentah (privasi)
  user_agent    text,
  source        text,            -- misal 'whatsapp','instagram','offline-qr'
  clicked_at    timestamptz not null default now()
);

create index idx_clicks_affiliate_id on public.clicks(affiliate_id);
create index idx_clicks_clicked_at on public.clicks(clicked_at);

-- ============================================================
-- 4. CONVERSIONS (transaksi tiket yang berhasil via referral)
-- ============================================================
create table public.conversions (
  id              bigint generated always as identity primary key,
  affiliate_id    uuid not null references public.affiliates(id) on delete cascade,
  order_id        text not null unique,      -- order id dari museumsiroh.online
  ticket_amount   numeric(12,2) not null,    -- total harga tiket
  commission_amount numeric(12,2) not null,  -- nominal komisi affiliate
  commission_rate numeric(5,2) not null,     -- rate yang dipakai saat itu
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','cancelled')),
  converted_at    timestamptz not null default now(),
  confirmed_at    timestamptz
);

create index idx_conversions_affiliate_id on public.conversions(affiliate_id);
create index idx_conversions_status on public.conversions(status);

-- ============================================================
-- 5. WITHDRAWALS (pengajuan penarikan komisi)
-- ============================================================
create table public.withdrawals (
  id              bigint generated always as identity primary key,
  affiliate_id    uuid not null references public.affiliates(id) on delete cascade,
  amount          numeric(12,2) not null,
  bank_name       text not null,
  bank_account_no text not null,
  bank_account_name text not null,
  status          text not null default 'pending'
                    check (status in ('pending','approved','paid','rejected')),
  requested_at    timestamptz not null default now(),
  processed_at    timestamptz,
  notes           text
);

create index idx_withdrawals_affiliate_id on public.withdrawals(affiliate_id);

-- ============================================================
-- 6. ADMIN ROLES (siapa yang boleh akses admin dashboard)
-- ============================================================
create table public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 6b. API KEYS (untuk integrasi server-to-server dgn museumsiroh.online)
-- ============================================================
create table public.api_keys (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,              -- misal 'museumsiroh-production'
  key_hash      text not null unique,       -- SHA-256 hash dari key (key asli tidak disimpan)
  key_prefix    text not null,              -- 8 karakter awal, utk identifikasi di UI tanpa expose full key
  is_active     boolean not null default true,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id)
);

alter table public.api_keys enable row level security;

create policy "api_keys_admin_only" on public.api_keys
  for all using (public.is_admin());

-- ============================================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================================

-- Generate ref_code otomatis (6 karakter alfanumerik unik)
create or replace function public.generate_ref_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$ language plpgsql;

-- Auto-assign ref_code saat affiliate baru dibuat
create or replace function public.set_ref_code()
returns trigger as $$
declare
  new_code text;
  exists_already boolean;
begin
  loop
    new_code := public.generate_ref_code();
    select exists(select 1 from public.affiliates where ref_code = new_code) into exists_already;
    if not exists_already then
      exit;
    end if;
  end loop;
  new.ref_code := new_code;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_ref_code
  before insert on public.affiliates
  for each row
  when (new.ref_code is null)
  execute function public.set_ref_code();

-- Update statistik affiliate saat ada click baru
create or replace function public.increment_click_count()
returns trigger as $$
begin
  update public.affiliates
    set total_clicks = total_clicks + 1
    where id = new.affiliate_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_increment_click
  after insert on public.clicks
  for each row
  execute function public.increment_click_count();

-- Update statistik affiliate + auto tier-up saat konversi dikonfirmasi
create or replace function public.handle_conversion_confirmed()
returns trigger as $$
declare
  v_total_conversions integer;
  v_new_tier smallint;
begin
  if new.status = 'confirmed' and (old.status is distinct from 'confirmed') then
    update public.affiliates
      set total_conversions = total_conversions + 1,
          total_commission  = total_commission + new.commission_amount
      where id = new.affiliate_id
      returning total_conversions into v_total_conversions;

    select id into v_new_tier
      from public.tiers
      where min_conversions <= v_total_conversions
      order by min_conversions desc
      limit 1;

    update public.affiliates
      set tier_id = v_new_tier
      where id = new.affiliate_id and tier_id <> v_new_tier;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_conversion_confirmed
  after insert or update on public.conversions
  for each row
  execute function public.handle_conversion_confirmed();

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
alter table public.affiliates enable row level security;
alter table public.clicks enable row level security;
alter table public.conversions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.admins enable row level security;
alter table public.tiers enable row level security;

-- Helper: cek apakah user saat ini admin
create or replace function public.is_admin()
returns boolean as $$
  select exists(select 1 from public.admins where user_id = auth.uid());
$$ language sql security definer stable;

-- TIERS: semua orang boleh baca (publik, utk landing page)
create policy "tiers_select_all" on public.tiers
  for select using (true);

-- AFFILIATES: affiliate boleh lihat & update data sendiri; admin boleh semua
create policy "affiliates_select_own_or_admin" on public.affiliates
  for select using (auth.uid() = user_id or public.is_admin());

create policy "affiliates_insert_own" on public.affiliates
  for insert with check (auth.uid() = user_id);

create policy "affiliates_update_own_or_admin" on public.affiliates
  for update using (auth.uid() = user_id or public.is_admin());

-- CLICKS: insert bebas (dari edge function/public tracking), select hanya punya sendiri/admin
create policy "clicks_insert_any" on public.clicks
  for insert with check (true);

create policy "clicks_select_own_or_admin" on public.clicks
  for select using (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
    or public.is_admin()
  );

-- CONVERSIONS: select punya sendiri/admin; insert hanya via service role (webhook), jadi tanpa policy insert publik
create policy "conversions_select_own_or_admin" on public.conversions
  for select using (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
    or public.is_admin()
  );

-- WITHDRAWALS: affiliate ajukan & lihat punya sendiri; admin kelola semua
create policy "withdrawals_select_own_or_admin" on public.withdrawals
  for select using (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
    or public.is_admin()
  );

create policy "withdrawals_insert_own" on public.withdrawals
  for insert with check (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
  );

create policy "withdrawals_update_admin_only" on public.withdrawals
  for update using (public.is_admin());

-- ADMINS: hanya admin yang bisa lihat tabel admin
create policy "admins_select_admin_only" on public.admins
  for select using (public.is_admin());

-- ============================================================
-- 9. VIEW: leaderboard publik (opsional, utk landing page)
-- ============================================================
create view public.leaderboard as
  select full_name, tier_id, total_conversions
  from public.affiliates
  where status = 'approved'
  order by total_conversions desc
  limit 10;

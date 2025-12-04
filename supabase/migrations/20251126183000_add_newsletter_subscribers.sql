-- Migration: add newsletter_subscribers table
-- Generated: 2025-11-26

-- Up: create table
create table if not exists newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamptz default now()
);

-- Add index on email for faster lookups (unique constraint already enforces uniqueness)
create unique index if not exists idx_newsletter_subscribers_email on newsletter_subscribers (email);

-- Down: drop table
-- (Uncomment to rollback if running manually)
-- drop table if exists newsletter_subscribers;

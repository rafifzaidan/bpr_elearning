-- Migration: Add duration_minutes to exams table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.exams.duration_minutes IS 'Durasi pengerjaan kuis dalam menit. NULL berarti sampai end_date.';

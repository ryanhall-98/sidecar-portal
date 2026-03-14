import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://duyvxdctgutfjtqsampu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eXZ4ZGN0Z3V0Zmp0cXNhbXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMjE3NDcsImV4cCI6MjA4Nzg5Nzc0N30.DntNKVHR3EvQrJrLKlReFKOj2Sde4lXGsJ49LG1yCAc'
);

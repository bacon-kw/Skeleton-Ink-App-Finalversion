import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://noxajglingsghrvydbwy.supabase.co';
// Trage hier deinen ANON-Key von Supabase ein:
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5veGFqZ2xpbmdzZ2hydnlkYnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMDQ4ODQsImV4cCI6MjA2NzY4MDg4NH0.rpjUarse1Ugpa9lRsdVE57WnHonFIXY-9wZprC3dMzU';

export const supabase = createClient(supabaseUrl, supabaseKey);

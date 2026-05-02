import { createClient } from '@supabase/supabase-js';

// In a real environment, these would be actual environment variables.
// We use dummy values here. The hooks will handle the inevitable fetch errors 
// and fallback to LocalStorage so the sandbox remains fully functional and "alive".
const supabaseUrl = 'https://mock-spa-glow-kitty.supabase.co';
const supabaseKey = 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

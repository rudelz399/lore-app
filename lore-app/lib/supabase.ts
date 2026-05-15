import { createClient } from '@supabase/supabase-js';

// You will get these two strings from your Supabase Dashboard later
const supabaseUrl = 'https://kguojvzrqfzubjilcitv.supabase.co';
const supabaseAnonKey = 'sb_publishable_hu56KFLAfVx44cExyrJgVg_Wt5vhAo8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
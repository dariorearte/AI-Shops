import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uhceapplbgalrdbwzhhc.supabase.co'
const supabaseAnonKey = 'sb_publishable_FZXwCCdhEetPa1ubmlnfaA_CpyNxl-O'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

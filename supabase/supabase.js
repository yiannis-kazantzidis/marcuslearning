import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqouyqkdkkihmwezwjxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3V5cWtka2tpaG13ZXp3anh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE0ODY5OTYsImV4cCI6MjAyNzA2Mjk5Nn0.WDF-iVip5Ze2aZOim-uahKxvYmp7PRjtReu9N1cHi3s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
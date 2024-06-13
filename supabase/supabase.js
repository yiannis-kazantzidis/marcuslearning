import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqouyqkdkkihmwezwjxy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3V5cWtka2tpaG13ZXp3anh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTQ4Njk5NiwiZXhwIjoyMDI3MDYyOTk2fQ.BW2ykC9ZFmxEgck3kuRvJt-qThOAAkK-LWKhY-aXKxo';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
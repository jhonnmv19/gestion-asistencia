import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// @ts-ignore
import ws from 'ws'; // Usamos @ts-ignore para que TypeScript ignore la falta de tipos

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    // Usamos el fetch global nativo de Node, eliminando la necesidad de importar 'node-fetch'
    fetch: globalThis.fetch
  },
  realtime: {
    transport: ws,
  },
});
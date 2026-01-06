import { createClient } from '@supabase/supabase-js';

// Configuration for Supabase
// Since this is a client-side app, we use the Anon Key.
// Security checks should be handled via Row Level Security (RLS) in Supabase.

const supabaseUrl = 'https://meyhyiywbtqsdxbnaaev.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leWh5aXl3YnRxc2R4Ym5hYWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTYxMTcsImV4cCI6MjA4MzEzMjExN30.Bq2-4BovtSWWTX1BS1F2DJiHBBzmH8kd42h4whRykYk';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to check connection
export const checkSupabaseConnection = async () => {
    try {
        const { count, error } = await supabase.from('people').select('*', { count: 'exact', head: true });
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Supabase connection check failed:", e);
        return false;
    }
};

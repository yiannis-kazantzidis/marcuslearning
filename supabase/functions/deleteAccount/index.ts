import { createClient } from "npm:@supabase/supabase-js@2.41.1";


console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const supabaseUrl = "https://kqouyqkdkkihmwezwjxy.supabase.co";
  const supabaseAnonKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { userID } = await req.json()

  const { data, error } = await supabase.auth.admin.deleteUser(userID)

  if (error) {
    console.log(error)
  }

  const response = await supabase
    .from('users')
    .delete()
    .eq('id', userID)

  console.log(response)

  return new Response(JSON.stringify({success: true}))
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/deleteAccount' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

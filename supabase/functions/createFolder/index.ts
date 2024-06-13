// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { createClient } from "npm:@supabase/supabase-js@2.41.1";

Deno.serve(async (req) => {
  const supabaseUrl = "https://kqouyqkdkkihmwezwjxy.supabase.co";
  const supabaseAnonKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { name, parentID, userID } = await req.json();

  if (userID) {
    const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userID)
  
    if (error) {
      console.error("Error checking user row:", userID);
    }
  
    // If no row exists, insert a new one
    if (!data[0]) {
      console.log('checking status.... row exists')
  
      console.log(userID, userID, name)
  
      const { error } = await supabase
        .from("users")
        .insert({ id: userID, email: userID + '@gmail.com', username: 'Jeffrey' });
  
      if (error) {
        console.error("Error inserting user row:", error);
        return;
      }
  
      console.log("New user row inserted successfully");
    } else {
      console.log("User row already exists");
    }

  }



  const { error } = await supabase
    .from("folders")
    .insert({ user_id: userID, name: name, parent_id: parentID });

  const { data } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userID);

  console.log(data);

  if (error) {
    console.log(error);
    return new Response(JSON.stringify({ status: 500 }));
  } else {
    return new Response(JSON.stringify(data));
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/createFolder' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2.41.1";

Deno.serve(async (req) => {
  const supabaseUrl = "https://kqouyqkdkkihmwezwjxy.supabase.co";
  const supabaseAnonKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { noteID, cardID, userID } = await req.json()

  const { data, error } = await supabase
    .from('flashcards')
    .select('flashcards, id')
    .eq('notes_id', noteID)

  if (error) {
    console.log('ERROR UPDATING FLASHCARDS: ' + error)
  }


  const cardsObj = JSON.parse(data[0].flashcards)
  const id = data[0].id
  const flashcards = cardsObj.flashcards
  console.log('id: ' + cardID)

  const filteredArray = flashcards.slice(0, cardID).concat(flashcards.slice(cardID + 1));

  const cardsJSON = JSON.stringify({flashcards: filteredArray})

  console.log(id, cardsJSON)


  const { dta, err } = await supabase
    .from('flashcards')
    .update({ flashcards: cardsJSON })
    .eq('id', id)
    .select()

    if (err) {
      console.log('ERROR UPDATING FLASHCARDS: ' + err)
    }

  return new Response(
    JSON.stringify(dta),
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/deleteFlashcard' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

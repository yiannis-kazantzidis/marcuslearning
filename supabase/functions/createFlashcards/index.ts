// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { createClient } from "npm:@supabase/supabase-js@2.41.1";
import Anthropic from 'npm:@anthropic-ai/sdk@0.20.6';
import { jsonrepair } from 'npm:jsonrepair@3.6.1'

Deno.serve(async (req) => {
  const supabaseUrl = "https://kqouyqkdkkihmwezwjxy.supabase.co";
  const supabaseAnonKey = Deno.env.get('supabaseAnonKey');
  const ANTRHOPIC_API_KEY = Deno.env.get('ANTRHOPIC_API_KEY')
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const anthropic = new Anthropic({
      apiKey: ANTRHOPIC_API_KEY,
  });

  async function extractJSON(text) {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);
  
    try {
      const repaired = jsonrepair(jsonString)
      const jsonObject = repaired;
      return jsonObject;
    } catch (error) {
      extractJSON(await TAEngine(text, error))
      console.error('Invalid JSON:', error);
      return null;
    }
  }
  
  async function TAEngine(output, error) {
    const prompt = 'Your role is to fix outputs that have broken JSON, you will be provided with an Error and the Output, you need to return the fixed version of the JSON output provided.'
    const response = await anthropic.messages.create({
      max_tokens: 4096,
      system: prompt,
      messages: [
        { role: "user", content: `Error: ${error} Output: ${output}` }
      ],
      model: 'claude-3-haiku-20240307'
    });
  
    const text = response.content[0].text
    return text
  }

  const { content, noteID, userID } = await req.json()

  console.log(noteID)
  console.log(userID)

  const prompt = "After reviewing the text given to you, create a set of flashcards based on the important information and key concepts. Determine the number of flashcards based on the amount and complexity of the information. Each flashcard should have 'back' (answer to the description and) 'front' (description of the answer information) properties. As an example the front could be: Finance raised by issuing shares in a business. And the back for that would be: Share Capital. Return the flashcards as a stringified JSON object with a single 'flashcards' property, which is an array of flashcard objects. Example flashcard: {'back': 'The process by which plants convert sunlight into energy', 'front': 'Photosynthesis'}. Ensure the flashcards cover the most important information and facilitate learning and retention. Dont present the question as for example What is the British Parliament made up of? Present it as The 3 Components of the British Parliament (as an example). You MUST Only return the JSON data in your response, nothing else. The text on the front and back should be short and consise." 

  const response = await anthropic.messages.create({
    max_tokens: 4096,
    system: prompt,
    messages: [
      { role: "user", content: content }
    ],
    model: 'claude-3-haiku-20240307'
  });

  const flashcards = response.content[0].text

  const repaired = await  extractJSON(flashcards)

  const { data, error } = await supabase
    .from('flashcards')
    .insert({flashcards: repaired, notes_id: noteID, user_id: userID})

  if (error) {
    console.log(error)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/createFlashcards' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

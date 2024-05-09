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
  
    const repaired = jsonrepair(jsonString)
  
    try {
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

  const { noteID, userID, content } = await req.json()

  console.log(userID)
  console.log(noteID)

  const prompt = "Create a set of multiple choice questions based on the given text, covering the most important information. Each question should have one correct answer and three plausible but incorrect answers that are related to the topic but still wrong. You MUST fact check the correct answers you give and make sure they are correct, no mistakes are allowed. Randomize the answer order. Return your response with the questions as a stringified JSON object with a 'questions' array. Example question format: {'question': 'What is the process by which plants convert sunlight into energy', 'correct_answer': (the unique id (uid) of the answers array that has the correct answer), answers: [{answer: 'Chlorophyll absorption', uid: (a unique id), {answer: 'Photosynthesis', uid: (a unique id)}, {answer: 'Cellular respiration', uid: (a unique id)}, {answer: 'Light refraction', uid: (unqiue id)}]}. Also you should aim to give atleast 5 different questions but do as many as you think is appropriate regarding the length and context of the text given. You also should re-word the correct answer to emphasise understanding over memorisiation. Only return the JSON data, nothing else."


  console.log('here is the content ' + content)


  const response = await anthropic.messages.create({
    max_tokens: 4096,
    system: prompt,
    messages: [
      { role: "user", content: content }
    ],
    model: 'claude-3-haiku-20240307'
  });

  const questions = response.content[0].text
  const repaired = await extractJSON(questions)

  const { data, err } = await supabase
    .from('multiple_choice_questions')
    .insert({questions: repaired, notes_id: noteID, user_id: userID})

  if (err) {
    console.log('there has been an question error ' + err)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/createMultipleChoice' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

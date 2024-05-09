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

  const { content, noteID, userID } = await req.json()

  const prompt = "Please analyze the provided text and create exam-style questions that are each worth 2 marks, suitable for the UK Education System (A Levels / GCSE). The questions should replicate what could come up in an exam. Each rubric you create should account for one mark, so there will be two criteria per question. Generate a JSON object with the following structure: { questions: [{ question: '(2-mark question text)', difficultyLevel: '(easy, medium, or hard)', markScheme: { totalMarks: 2, rubric: [{ criteria: '(criterion for 1 mark, e.g., Identifies one accurate advantage)', marks: 1 }, { criteria: '(criterion for 1 mark, e.g., Provides a relevant example)', marks: 1 }] } }, { question: '(another 2-mark question text)', difficultyLevel: '(easy, medium, or hard)', markScheme: { totalMarks: 2, rubric: [{ criteria: '(criterion for 1 mark)', marks: 1 }, { criteria: '(criterion for 1 mark)', marks: 1 }] } }] }. You may generate as many 2-mark questions as you deem appropriate based on the provided text."

  const response = await anthropic.messages.create({
    max_tokens: 4096,
    system: prompt,
    messages: [
      { role: "user", content: content }
    ],
    model: 'claude-3-haiku-20240307'
  });

  const questions = response.content[0].text

  console.log('questions before repaired: ' + questions)

  const repaired = await extractJSON(questions)

  const { data, err } = await supabase
    .from('two_marker_questions')
    .insert({questions: repaired, notes_id: noteID, user_id: userID})

  console.log('questions repaired: ' + repaired)

  return new Response(
    JSON.stringify(repaired),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/createQuestions' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

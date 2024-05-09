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
      const jsonObject = JSON.parse(repaired);
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
  
  const { id, questionID, userID, answer, noteID } = await req.json()
  const prompt = "Please assess the given answer against each provided rubric. Each rubric is worth 1 mark. For each rubric, determine if the answer meets the specified criteria. After evaluating the answer against all rubrics, sum up the marks for the rubrics that the answer satisfies. Provide your assessment in the following format:{ mark: (total marks awarded based on the number of satisfied rubrics), feedback: '(concise feedback on the answer's strengths and areas for improvement)'}."

  console.log(id, questionID, userID, answer, noteID)

  const { data, error } = await supabase
    .from('two_marker_questions')
    .select('questions')
    .eq('id', questionID)
    .eq('user_id', userID)


  const questions = JSON.parse(data[0].questions)

  console.log(questions)

  const markScheme = questions.questions[id].markScheme

  console.log(markScheme)

  const rubrics = JSON.stringify(markScheme.rubric)

  const response = await anthropic.messages.create({
    max_tokens: 4096,
    system: prompt,
    messages: [
      { role: "user", content: `Question: ${questions.questions[id].question} Rubric: ${rubrics} user Answer: ${answer}` }
    ],
     model: 'claude-3-haiku-20240307'
  });

  const responseMessage = response.content;
  const repaired = await extractJSON(responseMessage[0].text)

  console.log('repaired: ' + repaired)

  return new Response(JSON.stringify({ text: JSON.stringify(repaired) }), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });

})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/markQuestion' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

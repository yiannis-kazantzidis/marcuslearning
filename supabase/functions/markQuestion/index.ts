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
  const prompt = "Please assess the given answer against the marking scheme provided, and also your own access to helpful information on the web that can aid accurate marking. determine if the answer meets the specified criteria. After evaluating the answer against the marking scheme, sum up the marks you award out of the total marks available for the question. Provide your assessment in the following format:{ mark: (total marks awarded based on how well you think the answer satisfies the marking scheme), feedback: '(concise feedback on the answer's strengths and areas for improvement (if any))'}."

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



  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`
    },
    body: JSON.stringify({
      model: 'llama-3-sonar-small-32k-online',
      messages: [
        {role: 'system', content: prompt},
        {role: 'user', content: `Question: ${questions.questions[id].question} Rubric: ${rubrics} user Answer: ${answer}`}
      ]
    })
  };
    
  fetch('https://api.perplexity.ai/chat/completions', options)
    .then(response => response.json())
    .then(async response => {
        const text = response.choices[0].message.content
        
        const repaired = await extractJSON(text)

        return new Response(JSON.stringify({ text: JSON.stringify(repaired) }), {
          headers: { "Content-Type": "application/json" },
          status: 200
        });
    })
    .catch(err => console.error(err));
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/markQuestion' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

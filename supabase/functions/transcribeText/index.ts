// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import Anthropic from 'npm:@anthropic-ai/sdk@0.20.6';
import { jsonrepair } from 'npm:jsonrepair@3.6.1'

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const GoogleKey = Deno.env.get('GoogleAPI_KEY');
  const apiEndpoint = "https://vision.googleapis.com/v1/images:annotate";
  const ANTRHOPIC_API_KEY = Deno.env.get('ANTRHOPIC_API_KEY')
  
  const anthropic = new Anthropic({
      apiKey: ANTRHOPIC_API_KEY,
  });

  async function extractJSON(text) {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);
  
    const repaired = jsonrepair(jsonString)

    console.log(repaired)
  
    try {
      const jsonObject = JSON.parse(repaired);
      console.log('JSON OBJECT: ' + jsonObject)
      console.log('JSON content: ' + jsonObject.content)

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

  async function detectTextFromImage(imageUrl: string) {
    const requestBody = {
        requests: [
            {
                image: { content: imageUrl },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
                imageContext: {
                    "languageHints": ["en-t-i0-handwrit"]
                }
            }
        ]
    };

    try {
        const response = await fetch(`${apiEndpoint}?key=${GoogleKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;
            return fullTextAnnotation ? fullTextAnnotation.text : '';
        } else {
            throw new Error("Google Cloud Vision API request failed: " + response.status);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
  } 

  const { image, userID } = await req.json();

  const base64Image = image
  const prompt = 'You will receive text extracted from an image using OCR. Analyze the text and: 1) Fix spelling mistakes, 2) Repair broken/missing parts, 3) Ensure readability. Return a JSON object: {"content":"(repaired text)"} with JS newlines \\n to preserve formatting. Make corrections based on context, not just individual words/chars. Goal: improve overall readability of extracted text.'
  let text = ''

  for (let i = 0; i < base64Image.length; i++) {
    const detectedText = await detectTextFromImage(base64Image[i]);
    text = text + '\n' + detectedText;
    console.log('updated text:', text);
  }

  const response = await anthropic.messages.create({
    max_tokens: 4096,
    system: prompt,
    messages: [
      { role: "user", content: text }
    ],
    model: 'claude-3-haiku-20240307'
  });

  const responseMessage = response.content;
  const responseObject = await extractJSON(responseMessage[0].text)
  const content = responseObject.content
  console.log('here is the content: ' + content)

  return new Response(
    JSON.stringify({text: content}),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/transcribeText' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

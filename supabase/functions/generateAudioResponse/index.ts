import OpenAI from 'https://deno.land/x/openai@v4.40.2/mod.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.20.6';

Deno.serve(async (req) => {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
  const ANTRHOPIC_API_KEY = Deno.env.get('ANTRHOPIC_API_KEY')
  const openai = new OpenAI({apiKey: OPENAI_API_KEY});
  const anthropic = new Anthropic({
      apiKey: ANTRHOPIC_API_KEY,
  });

  const formData = await req.formData();
  const audioFile = formData.get('file') as File;
  const context = formData.get('context') || null
  const name = formData.get('name') || null
  const messages = formData.get('messages');
  const messagesParsed = JSON.parse(messages);

  console.log('name' + name)
  console.log('context' + context)
  console.log('messages' + messages)
  console.log('messagesParsed' + messagesParsed)

  if (!audioFile) {
    console.log('failed operation')
    return new Response(JSON.stringify({ error: 'Audio file is missing' }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log('audio file ' + audioFile)

  try {
    const wavFile = new File([await audioFile.arrayBuffer()], audioFile.name, { type: 'audio/wav' });

    const transcription = await openai.audio.transcriptions.create({
      file: wavFile,
      model: "whisper-1",
      response_format: "text",
    });

    console.log(transcription)
    console.log(name)
    console.log(context)

    let realtimeMessage = null

    if (context) {
      realtimeMessage = { role: "user", content: `*Context*: ${context} *Persons Name*: ${name} *users Message*: ${transcription}` }
    } else {
      realtimeMessage = { role: "user", content: `${transcription}` }
    }


    const prompt = 'You are Marcus, a revision assistant that has context of a users notes and can answer questions relating to them. The first message you receive will have the notes context, the persons name and the message sent. They will be surrounded by: * *. Initially you must greet the user by their name. Your responses should be short and simple, as if the user is talking to a buddy and not an AI Assistant flooding them with information they didnt ask for.';
    const response = await anthropic.messages.create({
      max_tokens: 4096,
      system: prompt,
      messages: [...messagesParsed, realtimeMessage],
      model: 'claude-3-haiku-20240307',
    });

    const text = response.content[0].text;

    return new Response(JSON.stringify({ text, transcription: realtimeMessage.content }), {
      headers: { "Content-Type": "application/json" },
      status: 200
  });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    return new Response(JSON.stringify({ error: 'Failed to transcribe audio' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }


})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generateAudioResponse' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

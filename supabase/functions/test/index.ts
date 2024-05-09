import { createClient } from "npm:@supabase/supabase-js@2.41.1";
import Anthropic from 'npm:@anthropic-ai/sdk@0.20.6';
import { jsonrepair } from 'npm:jsonrepair@3.6.1'
import { YoutubeTranscript } from 'npm:youtube-transcript@1.2.1';

Deno.serve(async (req) => {
    const GoogleKey = Deno.env.get('GoogleAPI_KEY');
    const apiEndpoint = "https://vision.googleapis.com/v1/images:annotate";
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
    
        console.log(repaired)
      
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
    
    function extractYouTubeVideoId(url) {
        const videoIdRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(videoIdRegex);
        return match && match[7].length === 11 ? match[7] : null;
    }

    const { image, userID, folderID, youtubeURL } = await req.json();

    const prompt = "You will receive text extracted from a YouTube video transcript. Your task is to format the text into a concise and structured note, making it easier to understand and review the key information. Please follow these guidelines:\n\n1. Carefully review the extracted transcript text and correct any spelling errors, typos, or unclear phrases. If a word or sentence doesn't make sense in the context, determine the intended meaning and replace it with the correct spelling or phrasing.\n\n2. Analyze the transcript and identify the main topics, key points, and important information. Condense and rephrase the content to create a structured note that captures the essence of the video.\n\n3. Organize the note into sections or bullet points, using appropriate headings or subheadings to separate different topics or themes. This will make it easier to navigate and review specific parts of the note. Use markdown syntax (e.g., # for headings, - for bullet points) to format the headings and sections, as the note will be displayed using the react-native-markdown-display library.\n\n4. Provide a concise and descriptive title that summarizes the main subject or theme of the video.\n\n5. Format your response as a correctly formatted stringified JSON object (so JSON.parse can be used on it after) with two properties:\n   - 'title': The title of the note.\n   - 'content': The formatted and structured note content, using markdown syntax.\n\n6. Use JavaScript string guidelines (e.g., \\n for line breaks) to format the text within the 'content' property, as your response will be displayed in a React Native app.\n\n7. Fact-check any information or claims made in the video and add clarifying notes or corrections if necessary.\n\n8. If you feel that additional information or context would be helpful for better understanding the topic, you can include relevant supplementary details in the note.\n\nPlease ensure that your final response is well-structured, free of errors, and presented in a clear and concise manner. The formatted note should be easy to comprehend and review, allowing the reader to quickly grasp the key points and information from the video." 
    const newTestPrompt = "You will receive text extracted from an image. Your task is to format the text for easy reading and comprehension, fact-check the text, and add any missing information you think should be there. Please follow these guidelines:\n\n1. Carefully review the extracted text and correct any spelling errors or misspellings. If a word doesn't make sense in the context, determine the intended word and replace it with the correct spelling.\n\n2. Analyze the sentences and phrases to ensure they are grammatically correct and convey clear meaning. If necessary, rephrase or restructure sentences to improve clarity and coherence, while maintaining the intended meaning.\n\n3. Make any other necessary changes to enhance the readability and understanding of the text. This may include adding punctuation, fixing capitalization, and breaking up long sentences.\n\n4. Fact-check the information provided in the text. If you identify any inaccuracies or missing information, correct the errors and add the necessary information to ensure the text is accurate and comprehensive.\n\n5. Critically analyze the text and add any additional relevant information that could help the reader better understand the topic. This may include providing context, explanations, or examples to clarify complex concepts or ideas.\n\n6. Format the text using markdown syntax compatible with react-native-markdown-display. Use headers, italic, bold, lists, blockquotes, and code blocks as appropriate.\n\n7. Provide a concise and descriptive title that summarizes the main topic or subject of the text. If the text already includes a suitable title, use that instead.\n\n8. Format your response as a correctly formatted stringified JSON object with 'title' and 'content' properties. The 'content' property should contain the formatted, corrected, also format the text content using react-native-markdown-display compatible markdown.\n\nPlease ensure that your final response is free of any misspellings, grammatical errors, or confusing sentences. The formatted text should be clear, coherent, easily understandable by the reader, and include any necessary corrections and additional information to provide a comprehensive and accurate representation of the topic. In the JSON string there has to be no bad control characters inside."
    const base64Image = image
    const messages = [
        { role: "system", content: prompt},
    ];

    console.log(youtubeURL)

    try {
        let text = '';

        if (youtubeURL) {
            console.log('calling youtube API');
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(youtubeURL);
                console.log(transcript);
                const transcriptText = transcript.map((item) => item.text).join(" ");
                console.log(transcriptText);
                text = transcriptText;
            } catch (error) {
                console.error('Error fetching transcript:', error);
            }
        } else {
            for (let i = 0; i < base64Image.length; i++) {
                const detectedText = await detectTextFromImage(base64Image[i]);
                text = text + '\n' + detectedText;
                console.log('updated text:', text);
            }
        }

        const systemPrompt = youtubeURL && prompt || newTestPrompt

        console.log('text here: ' + text)

        const response = await anthropic.messages.create({
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
              { role: "user", content: text }
            ],
            model: 'claude-3-haiku-20240307'
        });
        const responseMessage = response.content;

        const jsonObject = await extractJSON(responseMessage[0].text)

        console.log(jsonObject.title)
        
        const note = jsonObject

        const title = note.title
        const content = note.content

        console.log(title, content, folderID, userID)

        const { data, error } = await supabase
            .from('notes')
            .insert({ title, content, folder_id: folderID, user_id: userID })
            .select()
            .single();
      
        if (error) {
            console.error('Error inserting row:', error);
        } else {
            const id = data.id

            const flashcards = await fetch(
                "https://kqouyqkdkkihmwezwjxy.supabase.co/functions/v1/createFlashcards",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ title, content, userID, noteID: id}),
                },
            );

            const multipleChoice = await fetch(
                "https://kqouyqkdkkihmwezwjxy.supabase.co/functions/v1/createMultipleChoice",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userID, noteID: id, content }),
                },
            );

            const examStyleQuestions = await fetch(
                'https://kqouyqkdkkihmwezwjxy.supabase.co/functions/v1/createQuestions',
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userID, noteID: id, content }),
                },
            )
    
            if (flashcards.ok) {
                console.log('flashcards created!')
            }
        }

        return new Response(JSON.stringify({ text: jsonObject }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });
    } catch (error) {
        console.error("Error in server request:", error);
        return new Response("Error processing request", { status: 500 });
    }
});
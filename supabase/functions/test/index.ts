import { createClient } from "npm:@supabase/supabase-js@2.43.1";
import Anthropic from 'npm:@anthropic-ai/sdk@0.20.6';
import { jsonrepair } from 'npm:jsonrepair@3.7.1'
import { YoutubeTranscript } from 'npm:youtube-transcript@1.2.1';
import Perplexity from 'npm:perplexity-sdk@1.0.4';

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

    async function extractJSON(text: string) {
        console.log('extract json function has been called: ' + text);
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonString = text.slice(jsonStart, jsonEnd);
    
        try {
            const repaired = jsonrepair(jsonString);
            const jsonObject = JSON.parse(repaired);
            console.log('JSON OBJECT: ', jsonObject);
            return jsonObject;
        } catch (error) {
            console.error('Invalid JSON:', error);
            try {
                const correctedText = await TAEngine(text, error);
                return extractJSON(correctedText); // Recursive call with the corrected text
            } catch (innerError) {
                console.error('Error while correcting JSON:', innerError);
                return null;
            }
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

    const prompt = "You will receive text extracted from a YouTube video transcript. Your task is to format the text into a concise and structured note, making it easier to understand and review the key information. Please follow these guidelines:\n\n1. Carefully review the extracted transcript text and correct any spelling errors, typos, or unclear phrases. If a word or sentence doesn't make sense in the context, determine the intended meaning and replace it with the correct spelling or phrasing.\n\n2. Analyze the transcript and identify the main topics, key points, and important information. Condense and rephrase the content to create a structured note that captures the essence of the video.\n\n3. Organize the note into sections or bullet points, using appropriate headings or subheadings to separate different topics or themes. This will make it easier to navigate and review specific parts of the note. Use markdown syntax (e.g., # for headings, - for bullet points) to format the headings and sections, as the note will be displayed using the react-native-markdown-display library.\n\n4. Provide a concise and descriptive title that summarizes the main subject or theme of the video.\n\n5. Format your response as a correctly formatted stringified JSON object (so JSON.parse can be used on it after) with two properties:\n   - 'title': The title of the note.\n   - 'content': The formatted and structured note content, using markdown syntax.\n\n6. Use JavaScript string guidelines (e.g., \\n for line breaks) to format the text within the 'content' property, as your response will be displayed in a React Native app.\n\n7. Fact-check any information or claims made in the video and add clarifying notes or corrections if necessary.\n\n8. If you feel that additional information or context would be helpful for better understanding the topic, you can include relevant supplementary details in the note.\n\nPlease ensure that your final response is well-structured, free of errors, and presented in a clear and concise manner. The formatted note should be easy to comprehend and review, allowing the reader to quickly grasp the key points and information from the video. Do not include the title in the content please and make sure the JSON formatting is correct." 
    const newTestPrompt = "You will receive text extracted from an image. Your task is to format the text for easy reading and comprehension, fact-check the text, and add any missing information you think should be there. Please follow these guidelines:\n\n1. Carefully review the extracted text and correct any spelling errors or misspellings. If a word doesn't make sense in the context, determine the intended word and replace it with the correct spelling.\n\n2. Analyze the sentences and phrases to ensure they are grammatically correct and convey clear meaning. If necessary, rephrase or restructure sentences to improve clarity and coherence, while maintaining the intended meaning.\n\n3. Make any other necessary changes to enhance the readability and understanding of the text. This may include adding punctuation, fixing capitalization, and breaking up long sentences.\n\n4. Fact-check the information provided in the text. If you identify any inaccuracies or missing information, correct the errors and add the necessary information to ensure the text is accurate and comprehensive.\n\n5. Critically analyze the text and add any additional relevant information that could help the reader better understand the topic. This may include providing context, explanations, or examples to clarify complex concepts or ideas.\n\n6. Format the text using markdown syntax compatible with react-native-markdown-display. Use headers, italic, bold, lists, blockquotes, and code blocks as appropriate.\n\n7. Provide a concise and descriptive title that summarizes the main topic or subject of the text. If the text already includes a suitable title, use that instead.\n\n8. Format your response as a correctly formatted stringified JSON object with 'title' and 'content' properties. The 'content' property should contain the formatted, corrected, also format the text content using react-native-markdown-display compatible markdown.\n\nPlease ensure that your final response is free of any misspellings, grammatical errors, or confusing sentences. The formatted text should be clear, coherent, easily understandable by the reader, and include any necessary corrections and additional information to provide a comprehensive and accurate representation of the topic. In the JSON string there has to be no bad control characters inside. Do not include the title in the content please."
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

            const createFlashcards = async() => {
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
                  .insert({flashcards: JSON.stringify(repaired), notes_id: id, user_id: userID})
              
                if (error) {
                  console.log(error)
                }
            }



            const createMultipleChoice = async() => {
                const prompt = "Create a set of multiple choice questions based on the given text, covering the most important information. Each question should have one correct answer and three plausible but incorrect answers that are related to the topic but still wrong. You MUST fact check the correct answers you give and make sure they are correct, no mistakes are allowed. Randomize the answer order. Return your response with the questions as a stringified JSON object with a 'questions' array. Example question format: {'question': 'What is the process by which plants convert sunlight into energy', 'correct_answer': (the unique id (uid) of the answers array that has the correct answer), answers: [{answer: 'Chlorophyll absorption', uid: (a unique id), {answer: 'Photosynthesis', uid: (a unique id)}, {answer: 'Cellular respiration', uid: (a unique id)}, {answer: 'Light refraction', uid: (unqiue id)}]}. Also you should aim to give atleast 5 different questions but do as many as you think is appropriate regarding the length and context of the text given. You also should re-word the correct answer to emphasise understanding over memorisiation. Only return the JSON data, nothing else."

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
                    .insert({questions: JSON.stringify(repaired), notes_id: id, user_id: userID})
                
                  if (err) {
                    console.log('there has been an question error ' + err)
                  }
            }

            const createQuestions = async() => {
                const newPrompt = "Please analyze the provided text and create exam-style questions that are each worth 4 marks, suitable for the UK Education System (A Levels / GCSE). The questions should represent what would come up in an actual exam for that topic. Each question should be concise, with the mark scheme criteria narrow in scope and targeted to specific pieces of information or basic concepts covered in the text. Generate a JSON object with the following structure: { 'questions': [{ 'question': '(Concise 4-mark question text focused on definitions, facts or simple applications)', 'difficultyLevel': '(easy, medium, or hard)', 'markScheme': 'A comprenhensive marking scheme you will be able to apply to an answer and give an accurate mark', { 'question': '(Another concise 4-mark question...)', ... }] } You may generate as many appropriate 4-mark questions as the provided text allows. The questions and mark scheme criteria should reflect what is typically seen for questions of this mark allocation on UK exam board assessments."
                const prompt = "Please analyze the provided text and create exam-style questions that are each worth 4 marks, suitable for the UK Education System (A Levels / GCSE). The questions should replicate what could come up in an exam. Each rubric you create should account for one mark, so there will be four criteria per question. Generate a JSON object with the following structure: { questions: [{ question: '(4-mark question text)', difficultyLevel: '(easy, medium, or hard)', markScheme: { totalMarks: 4, rubric: [{ criteria: '(criterion for 1 mark, e.g., Identifies one accurate advantage)', marks: 1 }, { criteria: '(criterion for 1 mark, e.g., Provides a relevant example)', marks: 1 }] } }, { question: '(another 2-mark question text)', difficultyLevel: '(easy, medium, or hard)', markScheme: { totalMarks: 2, rubric: [{ criteria: '(criterion for 1 mark)', marks: 1 }, { criteria: '(criterion for 1 mark)', marks: 1 }] } }] }. You may generate as many 4-mark questions as you deem appropriate based on the provided text."
              
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
                        {role: 'system', content: newPrompt},
                        {role: 'user', content: content}
                      ]
                    })
                  };
                  
                fetch('https://api.perplexity.ai/chat/completions', options)
                .then(response => response.json())
                .then(response => async() => {
                    const questions = response.choices[0].message.content
                    
                    console.log('questions before repaired: ' + questions)
              
                    const repaired = await extractJSON(questions)
                  
                    const { data, err } = await supabase
                      .from('two_marker_questions')
                      .insert({questions: JSON.stringify(repaired), notes_id: id, user_id: userID})
                  
                    console.log('questions repaired: ' + repaired)
                })
                .catch(err => console.error(err));
            }

            await createFlashcards()
            await createMultipleChoice()
            await createQuestions()
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
import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { useRoute } from "@react-navigation/native";
import * as FileSystem from 'expo-file-system';
import OpenAI from "openai";
const openai = new OpenAI({apiKey: "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"});
const Buffer = require('buffer/').Buffer  // note: the trailing slash is important!
import LottieView from 'lottie-react-native';
import { supabase } from '../supabase/supabase';
import userContext from '../components/userContext';
import MarcusTouchable from '../components/MarcusTouchable';
import Voice from '@react-native-voice/voice';

export default function Assistant({navigation}) {
  const route = useRoute();
  const id = route.params?.id
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentRecording = useRef(false)
  const [noteContext, setNoteContext] = useState(null)
  const [userName, setUserName] = useState(null)
  const [messages, setMessages] = useState([])
  const [firstCommunication, setFirstCommunication] = useState(true)
  const { userID } = useContext(userContext);
  const speechGapTimer = useRef(null);
  const recordingRef = useRef(recording);
  const messagesRef = useRef(messages);
  const nameRef = useRef(userName);
  const noteRef = useRef(noteContext)
  const speechStopRef = useRef(false)
  const soundRef = useRef(false)


  useEffect(() => {
    const getName = async() => {
      console.log(userID)
      const { data, err } = await supabase
        .from('users')
        .select('username')
        .eq('id', userID) 

      setUserName(data[0].username)
    }

    const getContext = async() => {
      const { data, error } = await supabase
      .from('notes')
      .select('content')
      .eq('id', id)

      setNoteContext(data[0].content)
    }

    console.log('here is the recording in the update' + recordingRef.current)

    const handleSpeechGap = () => {
      console.log('this is the recording in the func ' + recordingRef.current)
      clearTimeout(speechGapTimer.current);
      speechGapTimer.current = setTimeout(() => {
        if (!speechStopRef.current) {
          onSpeechEnded();
        }

        speechStopRef.current = true
      }, 1500);
    };
  
    const onSpeechStarted = () => {
      console.log('Speech started');
      if (!currentRecording.current) {
        startRecording()
      }
      currentRecording.current = true
      handleSpeechGap();
    };
  
    const onSpeechEnded = () => {
      console.log('Speech ended');
      stopRecording()
    };

    Voice.onSpeechRecognized = onSpeechStarted;
    Voice.start('en-US')


    getName()
    getContext()
    configureAudioMode();

    // Clean up event listeners
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      stopSound()
    };
  }, []);


  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    noteRef.current = noteContext;
  }, [noteContext]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    nameRef.current = userName;
  }, [userName]);

  const toBuffer = async (blob) => {
    const uri = await toDataURI(blob);
    const base64 = uri.replace(/^.*,/g, "");
    return Buffer.from(base64, "base64");
  };

  const stopSound = async(startListening) => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync()
      soundRef.current = null
      currentRecording.current = false
      speechStopRef.current = false

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      setIsPlaying(false)

      if (startListening) {
        Voice.start('en-US')
      }
    }
  }


  const toDataURI = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const uri = reader.result?.toString();
        resolve(uri);
      };
    });

  const constructTempFilePath = async (buffer) => {
    const tempFilePath = FileSystem.cacheDirectory + "speech.mp3";
    await FileSystem.writeAsStringAsync(
      tempFilePath,
      buffer.toString("base64"),
      {
        encoding: FileSystem.EncodingType.Base64,
      }
    );

    return tempFilePath;
  };

  const configureAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        
      });
    } catch (error) {
      console.error('Failed to configure audio mode', error);
    }
  };
  
  const startRecording = async () => {
    if (isPlaying) {
      return ' '
    }

    setIsRecording(true);
    configureAudioMode()
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to record audio denied');
        return;
      }

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
    } catch (error) {
      console.error(error);
    }
  };

  const stopRecording = async () => {
    console.log('here is the recording:' + recordingRef.current)
    setIsRecording(false);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      Voice.stop()
      await sendAudioToServer(uri);
    } catch (error) {
      console.error(error);
    }
  };

  const sendAudioToServer = async (uri) => {
    setIsLoading(true);
    console.log('uri: ' + uri)

    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a', // Update this line
        name: 'audio.m4a', // Update the name as well
      });

      if (firstCommunication) {
        formData.append('context', noteRef.current);
        formData.append('name', nameRef.current);
      }

      formData.append('messages', JSON.stringify(messagesRef.current));


      const response = await fetch('https://kqouyqkdkkihmwezwjxy.supabase.co/functions/v1/generateAudioResponse', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { text, transcription } = await response.json();

      console.log(text)

      setMessages(previous => [...previous, { role: "user", content: transcription }])

      setMessages(previous => [...previous, { role: "assistant", content: text }])

      const apiKey = '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';
      const url = 'https://api.openai.com/v1/audio/speech';

      const data = {
        model: 'tts-1',
        input: text,
        voice: 'onyx',
      };

      const audio = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        body: JSON.stringify(data),
      })

      if (!audio.ok) {
        throw new Error('Failed to fetch audio');
      }
    
      const blob = await audio.blob();
      const buffer = await toBuffer(blob);
      const tempFilePath = await constructTempFilePath(buffer);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      soundRef.current = new Audio.Sound()
      await soundRef.current.loadAsync({
        uri: tempFilePath
      })

      await soundRef.current.playAsync();

      soundRef.current.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          const doJITOperations = async() => {
            console.log('Audio has finished playing');
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
              
            });
  
            currentRecording.current = false
            speechStopRef.current = false
            console.log('voice should start')
            Voice.start('en-US')

          }

          doJITOperations()

        } else if (status.isPlaying) {
          if (status !== isPlaying) {
            setIsPlaying(true);
            currentRecording.current = true
          }
        } else {
          if (status !== isPlaying) {
            setIsPlaying(false);
          }}
      });

    } catch (error) {
      console.error('Error transcribing audio:', error);
    }

    if (firstCommunication) {
      setFirstCommunication(false)
    }
    setIsLoading(false);
  };

  return (
    <View className='flex-1 justify-center items-center'>

      <View>
        {!isLoading && !isPlaying && !isRecording && (
          <LottieView className='w-64 h-64' source={require('../assets/animations/idle.json')} autoPlay loop />
        )}

        {isLoading  && (
          <LottieView className='w-64 h-64' source={require('../assets/animations/loading.json')} autoPlay loop />
        )}

        {isPlaying && (
          <LottieView className='w-64 h-64' source={require('../assets/animations/speaking.json')} speed={2} autoPlay loop />
        )}

        {isRecording && (
          <LottieView className='w-64 h-64' source={require('../assets/animations/userspeaking.json')} speed={0.5} autoPlay loop />
        )}

      </View>

      { isPlaying ? (
          <MarcusTouchable
            className={`inline-flex flex-row my-12 items-center justify-center max-w-[256px] bg-[#007d56] rounded-lg pt-1 px-5 py-2 w-full`}
            onPress={() => stopSound(true)}
          >
            <Text className={"font-montmed text-white text-center text-2xl"}>Interrupt</Text>
          </MarcusTouchable>
        )
      : '' }



    </View>
  );
};

const styles = StyleSheet.create({
  lottie: {
    width: 100,
    height: 100,
    
  },
});
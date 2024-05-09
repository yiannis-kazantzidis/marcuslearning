import { Text, View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useState, useEffect, useContext } from "react";
import userContext from "../components/userContext";
import Markdown from 'react-native-markdown-display';
import { supabase } from "../supabase/supabase";
import ShakeEventExpo from "../components/shakeevent";
import { CommonActions } from '@react-navigation/native';

export default function Note({navigation}) {
    const [showFullText, setShowFullText] = useState(false);
    const route = useRoute();
    const [questions, setQuestions] = useState(null)
    const [questionID, setQuestionID] = useState(null)
    const { userID } = useContext(userContext);
    const noteID = route.params.id;
    const title = route.params.title;
    const content = route.params.content
    console.log(route.params)

    console.log(title)

    const openFlashcards = async() => {
        navigation.navigate('Flashcard', {id: noteID, title: title})
    }

    const openQuestions = async() => {
        navigation.navigate('MultipleChoice', {id: noteID, title: title})
    }

    const toggleShowFullText = () => {
        setShowFullText(!showFullText);
    };

    const deleteNote = async() => {
        const { data, error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteID)

        navigation.dispatch(CommonActions.goBack());
    }

    useEffect(() => {
        const getQuestions = async () => {
            const { data, error } = await supabase
                .from("two_marker_questions")
                .select("questions, id")
                .eq("user_id", userID)
                .eq('notes_id', noteID)

                if (error) {
                    console.log(error)
                }

                const questionData = data[0]
    
                setQuestionID(questionData.id)
                setQuestions(JSON.parse(questionData.questions))
        };

        ShakeEventExpo.addListener(() => {
            navigation.navigate('Assistant', {id: noteID})
        });

        getQuestions()
    }, [])

    return (
        <View className={"bg-[#fefaec] p-4 flex-1"}>
            <Text className='text-green-900 font-recmed text-3xl'>{title}</Text>
            <TouchableOpacity onPress={() => deleteNote()}>
                <Text className='text-red-600 font-recregular underline text-lg mb-2'>Delete Note</Text>
            </TouchableOpacity>
            <View className="flex-row gap-x-4">
                <TouchableOpacity className="w-12 h-12 shadow-xl shadow-black/25 bg-[#fefaec] rounded-xl border-2 border-green-800 p-4" onPress={() => {
                    openFlashcards()
                }}>
                    <View className={"w-24 h-24 flex justify-center items-center p-4 rounded-xl"}>
                        
                    </View>

                    <View className='absolute'> 
                        <Text className='font-montmed text-center text-lg'>{'F'}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity className="w-12 h-12 shadow-xl shadow-black/25 bg-[#fefaec] rounded-xl border-2 border-green-800 p-4" onPress={() => {
                    openQuestions()
                }}>
                    <View className={"w-24 h-24 flex justify-center items-center p-4 rounded-xl"}>

                    </View>

                    <View className='absolute'> 
                        <Text className='font-montmed text-center text-lg'>{'Q'}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity className="w-12 h-12 shadow-xl shadow-black/25 bg-[#fefaec] rounded-xl border-2 border-green-800 p-4" onPress={() => {
                    navigation.navigate('Assistant', {id: noteID})
                }}>
                    <View className={"w-24 h-24 flex justify-center items-center p-4 rounded-xl"}>
                        
                    </View>

                    <View className='absolute'> 
                        <Text className='font-montmed text-center text-lg'>{'A'}</Text>
                    </View>
                </TouchableOpacity>
            </View>
            <ScrollView className='my-4'>
                <Markdown
                    maxTopLevelChildren={showFullText ? undefined : 6} // Limit the number of top-level children
                    style={markdownStyles}>
                    {content}
                </Markdown>

                <TouchableOpacity onPress={toggleShowFullText}>
                    <Text className='font-recmed underline text-green-800 text-center'>{showFullText ? 'Show Less' : 'Show More'}</Text>
                </TouchableOpacity>

                <Text className='font-recmed text-3xl mt-5 text-green-800'>Exam Questions</Text>
                <View className='flex-1 flex-col gap-y-4 py-5'>

                    {
                        questions ? questions.questions.map((v, k) => {

                            return (
                                <TouchableOpacity key={k} className="h-max shadow-md shadow-black/10 bg-[#fefaec] border-2 border-green-800/50 rounded-xl p-4" onPress={() => {
                                    navigation.navigate('ExamQuestion', {data: v, noteID, questionID, id: k})
                                }}>                                
                                    <Text className='font-recmed text-md'>{v.question + ' (' + v.markScheme.totalMarks + ' marker)'}</Text>
                                </TouchableOpacity>

                            )
                        }) : ''
                    }

                </View>
            </ScrollView>
        </View>
    )
}

const markdownStyles = StyleSheet.create({
    heading1: {
      fontSize: 24,
      fontFamily: 'Recoleta-SemiBold',
    },
    heading2: {
      fontSize: 20,
      fontFamily: 'Recoleta-Medium',
    },
    strong: {
      fontFamily: 'Recoleta-Regular',
    },
    em: {
      fontFamily: 'Recoleta-Regular',
    },
    text: {
      fontFamily: 'Recoleta-Regular',
    },
  });
import { Text, View, StyleSheet, Button, SafeAreaView, TouchableOpacity } from "react-native"
import Swiper from 'react-native-deck-swiper'
import FlipCard from 'react-native-flip-card'
import { supabase } from "../supabase/supabase"
import { useEffect, useState, useContext } from "react"
import { useRoute } from "@react-navigation/native";
import userContext from "../components/userContext"
import * as Progress from 'react-native-progress';
import { Audio } from 'expo-av';
import * as Haptics from "expo-haptics";
import CircularProgress from 'react-native-circular-progress-indicator';
import MarcusTouchable from "../components/MarcusTouchable"

export default function MultipleChoice({navigation}) {
    const { userID } = useContext(userContext);
    const [questions, setQuestions] = useState(null)
    const [markedAnswer, setMarkedAnswer] = useState(null)
    const [questionIndex, setQuestionIndex] = useState(0)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [questionsFinished, setQuestionsFinished] = useState(false)
    const [sound, setSound] = useState()
    const route = useRoute();
    const id = route.params.id;
    const title = route.params.title;

    function randomizeQuestions(data) {
        const shuffledQuestions = data.questions.map(question => {
            const shuffledAnswers = shuffleArray(question.answers);
            return { ...question, answers: shuffledAnswers };
        });
        
        return { ...data, questions: shuffleArray(shuffledQuestions) };
        }
        
        function shuffleArray(array) {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
        }

    const nextQuestion = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (questionIndex === questions.length -1) {
            setQuestionIndex(1)
            setQuestionsFinished(true)
            console.log('question finished, index: ' + questionIndex)
        } else {
            setQuestionIndex(previous => previous + 1)
        }

        setMarkedAnswer(null)
    }

    function calculatePercentage(value, maxValue) {
        if (maxValue === 0) {
            throw new Error("Maximum value cannot be zero.");
        }
        let percentage = (value / maxValue) * 100;
        return Math.ceil(percentage);
    }

    const markQuestion = (questionKey) => {
        if (markedAnswer) {
            return ''
        }

        if (questions[questionIndex].correct_answer === questionKey) {
            playSuccess()
            setCorrectAnswers(previous => previous + 1)
            setMarkedAnswer({answer: questions[questionIndex].correct_answer, userCorrect: true})
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            )
        } else {
            playError()
            setMarkedAnswer({answer: questions[questionIndex].correct_answer, userCorrect: false})
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
            )
        }
    }

    async function playSuccess() {

        console.log('Loading Sound');
        const { sound } = await Audio.Sound.createAsync(require('../assets/sound/success.mp3')
        );

        console.log('Playing Sound');

        await sound.playAsync();
      }

    async function playError() {
        console.log('Loading Sound');
        const { sound } = await Audio.Sound.createAsync(require('../assets/sound/error.mp3')
        );

        console.log('Playing Sound');

        await sound.playAsync();
    }

    async function playButton() {
        console.log('Loading Sound');
        const { sound } = await Audio.Sound.createAsync(require('../assets/sound/button.mp3')
        );

        console.log('Playing Sound');

        await sound.playAsync();
    }



    useEffect(() => {
        const getQuestions = async () => {
            const { data, error } = await supabase
                .from("multiple_choice_questions")
                .select("questions")
                .eq("user_id", userID)
                .eq('notes_id', id)


                if (error) {
                    console.log(error)
                }

                const parsedQuestions = JSON.parse(data[0].questions)


                const random = randomizeQuestions(parsedQuestions)
                setQuestions(random.questions)
        };

        getQuestions()
    }, [])

    if (!questions) {
        return <Text>PLEASE WAIT</Text>;
    }

    if (questionsFinished) {
        return (
            <View className='flex-1 items-center justify-center gap-y-2'>
                <View className='flex-1 items-center justify-center'>
                    <CircularProgress inActiveStrokeColor="#FFF" progressValueFontSize={35} value={calculatePercentage(correctAnswers, questions.length)} valueSuffix={'%'} />
                </View>
                <MarcusTouchable onPress={() => {
                    playButton()
                    navigation.goBack()
                }} className={`bg-[#007d56] rounded-lg p-4 mx-2 absolute bottom-8 w-max`}>
                    <Text className={"font-montmed text-white text-center text-2xl"}>
                        {"Continue"}
                    </Text>
                </MarcusTouchable>
            </View>
        )
    }

    return (

        <>
            <View className='bg-[#f2f2f2] flex-1 justify-center items-center'>

                <Text className='font-recmed text-green-800 text-2xl text-center p-4'>{questions[questionIndex].question}</Text>

                <View className='flex flex-col gap-y-4'>
                    {
                        questions[questionIndex].answers.map((v, k) => {

                            return (
                                <MarcusTouchable key={k} disabled={markedAnswer} onPress={() => {
                                    markQuestion(v.uid)
                                }} className={`h-14 shadow-xl shadow-black/5 min-w-[92%] rounded-xl border-2 border-b-4 ${!markedAnswer && 'border-[#989898]/25 bg-[#f2f2f2]' || (markedAnswer && questions[questionIndex].correct_answer === v.uid && 'border-[#007d56]/50 bg-green-500/10' || !markedAnswer.userCorrect && 'border-red-600/50 bg-red-600/10' || 'border-[#989898]/25 bg-[#f2f2f2]')} flex items-center justify-center px-4 mx-2`}>
                                    <Text className='text-black text-center font-montmed'>{v.answer}</Text>
                                </MarcusTouchable>
                            )

                        })
                    }

                    <MarcusTouchable disabled={!markedAnswer} onPress={() => {
                        playButton()
                        nextQuestion()
                        }}  className={`${markedAnswer ? 'bg-[#007d56]' : 'bg-[#007d56]/25'} rounded-lg p-4 mx-2`}>
                        <Text className={"font-montmed text-white text-center text-2xl"}>
                        {"Continue"}
                        </Text>
                    </MarcusTouchable>
                </View>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f2f2f2",
    },
    card: {
      borderRadius: 4,
      borderWidth: 2,
      padding: 5,
      flex: 1,
      borderColor: "#E8E8E8",
      justifyContent: "center",
      backgroundColor: "white"
    },
    text: {
      textAlign: "center",
      fontSize: 50,
      backgroundColor: "transparent"
    }
  });
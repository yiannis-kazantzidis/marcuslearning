import { Text, View, StyleSheet, Button, SafeAreaView } from "react-native"
import Swiper from 'react-native-deck-swiper'
import FlipCard from 'react-native-flip-card'
import { supabase } from "../supabase/supabase"
import { useEffect, useState, useContext } from "react"
import { useRoute } from "@react-navigation/native";
import userContext from "../components/userContext"
import * as Progress from 'react-native-progress';

export default function Flashcard({navigation}) {
    const { userID } = useContext(userContext);
    const [flashCardsData, setFlashCardsData] = useState(null)
    const [flashcards, setFlashcards] = useState(null)
    const [swipeDirection, setSwipeDirection] = useState(0);
    const [cardIndex, setCardIndex] = useState(0)
    const totalFlashcards = flashcards?.length || 0;
    const flashcardsLeft = flashcards ? flashcards.length - cardIndex : totalFlashcards;
    const progress = totalFlashcards === 0 ? 0 : (totalFlashcards - flashcardsLeft) / totalFlashcards;


    const route = useRoute();
    const id = route.params.id;
    const title = route.params.title;


    const handleSwiping = (x, y) => {
        if (Math.abs(y) > 1) {
          if (y < 0) {
            setSwipeDirection(1)
          } else {
            setSwipeDirection(2)
          }
        } else {
          setSwipeDirection(0)
        }
      };

    console.log(userID)
    console.log(id)

    useEffect(() => {
        if (flashCardsData) {
            const flashcardHolder = []
            const flashcards = JSON.parse(flashCardsData[0].flashcards)

            setFlashcards(flashcards.flashcards)
        }

        console.log(progress)
    }, [flashCardsData])

    useEffect(() => {
        const getFlashcards = async () => {
            const { data, error } = await supabase
                .from("flashcards")
                .select("*")
                .eq("user_id", userID)
                .eq('notes_id', id)


                if (error) {
                    console.log(error)
                }
    
                setFlashCardsData(data)
        };

        getFlashcards()
    }, [])

    if (!flashcards) {
        return <Text>PLEASE WAIT</Text>;
    }

    return (

        <>
        <View className='bg-[#fefaec] flex justify-center items-center'>
            <Text>Hello Again</Text>
            <Progress.Bar color="#007d56" progress={progress} width={200} />

        </View>
        <View className='bg-[#fefaec] flex-1'>
            <View className='flex-1 justify-center items-center'>
            <Swiper
                cards={flashcards}
                renderCard={(card) => {
                    let cardColor = 'border-[#E8E8E8]';
                    // if (swipeDirection === 1) {
                    //   cardColor = 'border-red-800';
                    // } else if (swipeDirection === 2) {
                    //   cardColor = 'border-green-800';
                    // } else if (swipeDirection === 0) {
                    //   cardColor = 'border-[#E8E8E8]';
                    // }

                    return (
                        <FlipCard flipHorizontal={true} flipVertical={false}> 
                        {/* Face Side */}
                            <View className={`flex-1 rounded-xl bg-white border-2 ${cardColor} justify-center items-center px-5`}>
                                <Text className='text-center text-2xl font-recmed'>{card.front}</Text>
                            </View>
                            {/* Back Side */}
                            <View className={`flex-1 rounded-xl bg-white border-2 ${cardColor} justify-center items-center px-5`}>
                                <Text className='text-center text-2xl font-recmed'>{card.back}</Text>
                            </View>
                        </FlipCard>
                    )
                }}
                onSwiped={(cardIndex) => {
                  setCardIndex((prevIndex) => prevIndex + 1);
                  setSwipeDirection(0)
                }}
                onSwipedAll={() => {console.log('onSwipedAll')}}
                cardIndex={0}
                onSwiping={handleSwiping}
                backgroundColor={'#fefaec'}
                onSwipedTop={() => console.log('correct')}
                onSwipedBottom={() => console.log('incorrect')}
                onSwipedAborted={() => setSwipeDirection(0)}
                horizontalSwipe={false}
                stackSize= {3}>

                    <Text className='text-center'>Hello World</Text>

            </Swiper>

            </View>
    </View>
    </>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fefaec",
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
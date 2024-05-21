import { Text, View, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions, FlatList, Animated } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import userContext from "../components/userContext";
import Markdown from 'react-native-markdown-display';
import { supabase } from "../supabase/supabase";
import ShakeEventExpo from "../components/shakeevent";
import { CommonActions } from '@react-navigation/native';
import MarcusTouchable from "../components/MarcusTouchable";
import FlipCard from 'react-native-flip-card'
import {
    ScalingDot,
    SlidingBorder,
    ExpandingDot,
    SlidingDot,
} from 'react-native-animated-pagination-dots';
import { ALERT_TYPE, Dialog, AlertNotificationRoot, Toast } from 'react-native-alert-notification';

const INTRO_DATA = [
    {
      key: '1',
      title: 'App showcase ✨',
      description:
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    },
    {
      key: '2',
      title: 'Introduction screen 🎉',
      description:
        "Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. ",
    },
    {
      key: '3',
      title: 'And can be anything 🎈',
      description:
        'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. ',
    },
    {
      key: '4',
      title: 'And can be anything 🎈',
      description:
        'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. ',
    },
    {
      key: '5',
      title: 'And can be anything 🎈',
      description:
        'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. ',
    },
    {
      key: '6',
      title: 'And can be anything 🎈',
      description:
        'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. ',
    },
  ];

export default function Note({navigation}) {
    const [showFullText, setShowFullText] = useState(false);
    const route = useRoute();
    const [questions, setQuestions] = useState(null)
    const [questionID, setQuestionID] = useState(null)
    const [flashcards, setFlashcards] = useState(null)
    const [flashCardsData, setFlashCardsData] = useState(null)
    const { userID } = useContext(userContext);
    const {width} = useWindowDimensions();
    const scrollX = useRef(new Animated.Value(0)).current;
    const renderItem = useCallback(
      (item) => {
        console.log(item)
        return (
          <View style={[styles.itemContainer, { width }]}>
            <FlipCard flipHorizontal={true} flipVertical={false}> 
                <View className='border-2 border-gray-400 text-center' style={styles.innerContainer}>
                  <Text className='font-montmed'>{item.item.front}</Text>
                </View>

                <View className='border-2 border-gray-400 text-center' style={styles.innerContainer}>
                  <Text className='font-montregular'>{item.item.back}</Text>
                </View>
            </FlipCard>

          </View>
        );
      },
      [width],
    );
    const keyExtractor = useCallback((item) => item.key, []);
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
      if (flashCardsData) {
          const flashcardHolder = []
          const flashcards = JSON.parse(flashCardsData[0].flashcards)

          setFlashcards(flashcards.flashcards)
      }
    }, [flashCardsData])


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

        const getFlashcards = async () => {
            const { data, error } = await supabase
              .from("flashcards")
              .select("*")
              .eq("user_id", userID)
              .eq('notes_id', noteID)


              if (error) {
                  console.log(error)
              }
  
            setFlashCardsData(data)
        };

        getFlashcards()
        getQuestions()
    }, [])

    if (!flashcards) {
      return <Text>PLEASE WAIT</Text>;
    }

    return (
      <AlertNotificationRoot>

        <View className={"bg-[#f2f2f2] flex-1"}>
          <View className='p-4'>
            <Text className='text-green-900 font-recmed text-3xl'>{title}</Text>
            <TouchableOpacity onPress={() => deleteNote()}>
                <Text className='text-red-600 font-recregular underline text-lg mb-2'>Delete Note</Text>
            </TouchableOpacity>
            <View className="flex-row gap-x-4">
                <MarcusTouchable className="w-12 h-12 shadow-xl shadow-black/25 bg-red-600 rounded-xl p-4" onPress={() => {
                    deleteNote()
                }}>
                    <View className={"w-24 h-24 flex justify-center items-center p-4 rounded-xl"}>
                        
                    </View>

                    <View className='absolute'> 
                        <Text className='font-montmed text-center text-lg'>{'F'}</Text>
                    </View>
                </MarcusTouchable>

                <MarcusTouchable className="w-12 h-12 shadow-xl shadow-black/25 bg-[#f2f2f2] rounded-xl border-2 border-green-800 p-4" onPress={() => {
                    openQuestions()
                }}>
                    <View className={"w-24 h-24 flex justify-center items-center p-4 rounded-xl"}>

                    </View>

                    <View className='absolute'> 
                        <Text className='font-montmed text-center text-lg'>{'Q'}</Text>
                    </View>
                </MarcusTouchable>

                <MarcusTouchable className="w-12 h-12 shadow-xl shadow-black/25 bg-[#f2f2f2] rounded-xl border-2 border-green-800 p-4" onPress={() => {
                    navigation.navigate('Assistant', {id: noteID})
                }}>
                    <View className={"w-24 h-24 flex justify-center items-center p-4 rounded-xl"}>
                        
                    </View>

                    <View className='absolute'> 
                        <Text className='font-montmed text-center text-lg'>{'A'}</Text>
                    </View>
                </MarcusTouchable>
            </View>
          </View>
            
            <ScrollView className='my-4'>
              <View className='p-4'>
                <Markdown
                    maxTopLevelChildren={showFullText ? undefined : 6} // Limit the number of top-level children
                    style={markdownStyles}>
                    {content}
                </Markdown>
              </View>

              <TouchableOpacity onPress={toggleShowFullText}>
                  <Text className='font-recmed underline text-green-800 text-center'>{showFullText ? 'Show Less' : 'Show More'}</Text>
              </TouchableOpacity>

              <View style={styles.container}>
                <FlatList
                    data={flashcards}
                    keyExtractor={keyExtractor}
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    style={styles.flatList}
                    pagingEnabled
                    horizontal
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    renderItem={renderItem}
                />
                    <View style={styles.dotContainer}>
                        <ExpandingDot
                            data={flashcards}
                            expandingDotWidth={30}
                            scrollX={scrollX}
                            inActiveDotColor={'#22a20e'}
                            activeDotColor={'#1e8311'}
                            inActiveDotOpacity={0.5}
                            dotStyle={styles.dotStyles}
                            containerStyle={styles.containerStyles}
                        />
                    </View>
              </View>
              <MarcusTouchable>


              </MarcusTouchable>

              <View className='flex flex-row mt-5 gap-x-2 items-center'>
                <Text className='font-recmed text-3xl text-green-800 pl-4'>Exam Questions</Text>
                <MarcusTouchable onPress={() => {
                          Dialog.show({
                            type: ALERT_TYPE.WARNING,
                            title: <Text className='font-montsemibold'>This Feature is in Beta</Text>,
                            textBody: <Text className='font-montmed'>Marcus may provide inaccurate marking and feedback on exam questions, its recommended you assess the accuracy of the mark given yourself.</Text>,
                            button: <Text className='font-montmed'>Close</Text>,
                          })
                }} className='bg-green-600/20 rounded-lg px-2 py-1 border-2 border-green-600'>
                  <Text className='font-montmed text-green-800'>BETA</Text>
                </MarcusTouchable>

              </View>

                <View className='flex-1 flex-col gap-y-4 py-5 p-4'>
                    {
                      questions ? questions.questions.map((v, k) => {
                        return (
                            <MarcusTouchable key={k} className="h-max shadow-md shadow-black/10 bg-[#f2f2f2] border-2 border-green-800/50 rounded-xl p-4" onPress={() => {
                                navigation.navigate('ExamQuestion', {data: v, noteID, questionID, id: k})
                            }}>                                
                                <Text className='font-montreg text-md'>{v.question + ' (' + v.markScheme.totalMarks + ' marker)'}</Text>
                            </MarcusTouchable>
                        )
                      }) : ''
                    }
                </View>
            </ScrollView>


        </View>
      </AlertNotificationRoot>

    )
}

const markdownStyles = StyleSheet.create({
    heading1: {
      fontSize: 24,
      fontFamily: 'Montserrat-Bold',
    },
    list_item: {
      paddingVertical: 5,
    },
    heading3: {
      paddingVertical: 10,
    },
    heading2: {
      fontSize: 20,
      paddingVertical: 10,
      fontFamily: 'Montserrat-SemiBold',
    },
    strong: {
      fontWeight: '900',
      fontFamily: 'Montserrat-SemiBold',
    },
    em: {
      fontFamily: 'Montserrat-Regular',
    },
    text: {
      fontFamily: 'Montserrat-Regular',
    },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e7e7e7',
  },
  text: {
    flex: 1,
    justifyContent: 'space-evenly',
    color: 'black',
  },
  flatList: {
    flex: 1,
  },
  dotContainer: {
    justifyContent: 'center',
    alignSelf: 'center',
    height: 20,
    marginBottom: 20,
  },
  dotStyles: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  containerStyles: {
    top: 30,
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
    marginBottom: 5,
    height: 160,
    marginHorizontal: 30,
    borderRadius: 10,
  },
});
  
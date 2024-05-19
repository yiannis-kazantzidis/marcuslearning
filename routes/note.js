import { Text, View, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions, FlatList, Animated } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import userContext from "../components/userContext";
import Markdown from 'react-native-markdown-display';
import { supabase } from "../supabase/supabase";
import ShakeEventExpo from "../components/shakeevent";
import { CommonActions } from '@react-navigation/native';
import TouchableScale from 'react-native-touchable-scale';
import {
    ScalingDot,
    SlidingBorder,
    ExpandingDot,
    SlidingDot,
} from 'react-native-animated-pagination-dots';

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
    const { userID } = useContext(userContext);
    const {width} = useWindowDimensions();
    const scrollX = useRef(new Animated.Value(0)).current;
    const renderItem = useCallback(
      (item) => {
        return (
          <View style={[styles.itemContainer, {width: width - 60}]}>
            <Text>{item.title}</Text>
            <Animated.Text>{item.description}</Animated.Text>
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
        <View className={"bg-[#f2f2f2] p-4 flex-1"}>
            <Text className='text-green-900 font-recmed text-3xl'>{title}</Text>
            <TouchableOpacity onPress={() => deleteNote()}>
                <Text className='text-red-600 font-recregular underline text-lg mb-2'>Delete Note</Text>
            </TouchableOpacity>
            <View className="flex-row gap-x-4">
                <TouchableScale className="w-12 h-12 shadow-xl shadow-black/25 bg-[#f2f2f2] rounded-xl border-2 border-green-800 p-4" onPress={() => {
                    openFlashcards()
                }}>
                    <View className={"w-24 h-24 flex justify-center items-center p-4 rounded-xl"}>
                        
                    </View>

                    <View className='absolute'> 
                        <Text className='font-montmed text-center text-lg'>{'F'}</Text>
                    </View>
                </TouchableScale>

                <TouchableScale className="w-12 h-12 shadow-xl shadow-black/25 bg-[#f2f2f2] rounded-xl border-2 border-green-800 p-4" onPress={() => {
                    openQuestions()
                }}>
                    <View className={"w-24 h-24 flex justify-center items-center p-4 rounded-xl"}>

                    </View>

                    <View className='absolute'> 
                        <Text className='font-montmed text-center text-lg'>{'Q'}</Text>
                    </View>
                </TouchableScale>

                <TouchableScale className="w-12 h-12 shadow-xl shadow-black/25 bg-[#f2f2f2] rounded-xl border-2 border-green-800 p-4" onPress={() => {
                    navigation.navigate('Assistant', {id: noteID})
                }}>
                    <View className={"w-24 h-24 flex justify-center items-center p-4 rounded-xl"}>
                        
                    </View>

                    <View className='absolute'> 
                        <Text className='font-montmed text-center text-lg'>{'A'}</Text>
                    </View>
                </TouchableScale>
            </View>
            <ScrollView className='my-4'>
                    <View style={[styles.container]}>
      <FlatList
        data={INTRO_DATA}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {
            useNativeDriver: false,
          },
        )}
        style={styles.flatList}
        pagingEnabled
        horizontal
        decelerationRate={'normal'}
        scrollEventThrottle={16}
        renderItem={renderItem}
      />
      <View style={styles.text}>
        <View style={styles.dotContainer}>
          <Text>Expanding Dot</Text>
          <ExpandingDot
            data={INTRO_DATA}
            expandingDotWidth={30}
            scrollX={scrollX}
            inActiveDotColor={'#347af0'}
            activeDotColor={'#347af0'}
            inActiveDotOpacity={0.5}
            dotStyle={styles.dotStyles}
            containerStyle={styles.constainerStyles}
          />
        </View>

      </View>
    </View>
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
                                <TouchableScale key={k} className="h-max shadow-md shadow-black/10 bg-[#f2f2f2] border-2 border-green-800/50 rounded-xl p-4" onPress={() => {
                                    navigation.navigate('ExamQuestion', {data: v, noteID, questionID, id: k})
                                }}>                                
                                    <Text className='font-recmed text-md'>{v.question + ' (' + v.markScheme.totalMarks + ' marker)'}</Text>
                                </TouchableScale>

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

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#e7e7e7',
    },
    text: {
      flex: 1,
      justifyContent: 'space-evenly',
      color: 'black'
    },
    flatList: {
      flex: 1,
    },
    dotContainer: {
      justifyContent: 'center',
      alignSelf: 'center',
    },
    dotStyles: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 3,
    },
    constainerStyles: {
      top: 30,
    },
    itemContainer: {
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      marginTop: 40,
      marginHorizontal: 40,
      borderRadius: 20,
    },
});
  
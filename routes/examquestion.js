import { useRoute } from "@react-navigation/native";
import { Text, View, TextInput, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import userContext from "../components/userContext";
import { useState, useContext } from "react";
import AnimatedLoader from 'react-native-animated-loader';


export default function ExamQuestion({navigation}) {
    const [answer, setAnswer] = useState('')
    const route = useRoute()
    const data = route.params?.data
    const noteID = route.params?.noteID
    const questionID = route.params?.questionID
    const id = route.params?.id
    const [loading, setLoading] = useState(false)
    const [markData, setMarkData] = useState(null)
    const { userID } = useContext(userContext);

    console.log(id, questionID, noteID)

    const markQuestion = async() => {
        if (!answer) {
            return
        }

        setLoading(true)

        try {
            const response = await fetch(
                "https://kqouyqkdkkihmwezwjxy.supabase.co/functions/v1/markQuestion",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ id, questionID, userID, answer, noteID }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                setMarkData(data.text)
                console.log(data.text)
            } else {
                throw new Error("Failed to extract text");
            }
        }

        catch (error) {
            console.log(error)
        }

        finally {
            console.log('finished')
            setLoading(false)
        }

    }

    if (loading) {
        return (
            <AnimatedLoader visible={true} overlayColor="rgba(255,255,255,0.75)" animationStyle={styles.lottie} source={require('../assets/animations/loading.json')} speed={1}>
                <Text className='font-recmed text-2xl text-green-800 p-4'>Marking your answer...</Text>
            </AnimatedLoader>
        )

    }

    if (markData !== null) {
        return (
            <View className={"bg-[#fefaec] p-5 flex-1 justify-center items-center"}>
                <Text className='font-recmed text-lg text-center text-black'>
                    {markData.feedback}
                </Text>

                <Text className='font-recbold text-2xl text-center text-green-800'>
                    {'marks: ' + markData.mark}
                </Text>
            </View>
        )

    }


    return (
        <View className={"bg-[#fefaec] p-5 flex-1 justify-center items-center"}>
            <Text className='font-recmed text-2xl text-center text-green-800'>
                {data.question}
            </Text>

            <TextInput placeholder="Enter your answer here" onChangeText={(text) => setAnswer(text)} className='w-full h-48 border-2 text-lg border-green-800 rounded-lg m-5 p-2 font-recmed' />

            <TouchableOpacity
                disabled={loading}
                className={`inline-flex flex-row items-center justify-center max-w-[256px] ${loading ? 'bg-[#007d56]/25' : 'bg-[#007d56]'} rounded-lg pt-1 px-5 py-2 w-full`}
                onPress={() => {
                    markQuestion()
                }}
            >
            <Text className={"font-montmed text-white text-center text-2xl"}>
              {!loading ? "Mark Answer" : 'Marking Answer'}
            </Text>
          </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    lottie: {
      width: 100,
      height: 100,
    },
});

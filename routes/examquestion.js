import { useRoute } from "@react-navigation/native";
import { Text, View, TextInput, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import userContext from "../components/userContext";
import { useState, useContext, useEffect } from "react";
import AnimatedLoader from 'react-native-animated-loader';
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

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
    const [image, setImage] = useState(null)

    const convertImageToBase64 = async (imageUri) => {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: "base64",
        });

        console.log('converting image')
        return base64;
      };
    
      const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
          return;
        }

        console.log('picking image')
    
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
    
        if (!result.canceled) {
          console.log(result.assets[0].uri)
          if (image) {
            setImage([...image, result.assets[0].uri])
          } else {
            setImage([result.assets[0].uri])
          }
        }
      };

      const extractText = async () => {
        if (!image) {
          alert("Please select an image first");
          return;
        }
        
        try {
          const base64Images = []
    
        for (let i = 0; i < image.length; i++) {
            const toBase64 = await convertImageToBase64(image[i])
            base64Images.push(toBase64)
        }
              
          // Send base64 data to backend
          const response = await fetch(
            "https://kqouyqkdkkihmwezwjxy.supabase.co/functions/v1/transcribeText",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({image: base64Images, userID: userID}),
            },
          );
    
          if (response.ok) {
            const data = await response.json();
            console.log(data.text)
            console.log('finished converting')
            setAnswer(data.text)
          } else {
            throw new Error("Failed to extract text");
          }
        } catch (error) {
          console.error("Error extracting text:", error);
          alert("Failed to extract text");
        }
      };


    useEffect(() => {
        if (image) {
            console.log('extracting text')
            extractText()
        }

    }, [image])

    useEffect(() => {
        console.log('answer')

    }, [answer])
    


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

            <TextInput placeholder="Enter your answer here" value={answer} multiline={true} onChangeText={(text) => setAnswer(text)} className='w-full h-48 border-2 text-lg border-green-800 rounded-lg m-5 p-2 font-recmed' />

            <TouchableOpacity onPress={() => pickImage()}>

                <Text>Upload Answer</Text>
            </TouchableOpacity>

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

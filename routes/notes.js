import { Text } from "react-native";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView
} from "react-native";
import folderContext from "../components/folderContext";
import {
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { supabase } from "../supabase/supabase";
import userContext from "../components/userContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import getFolderName from "../components/getFolderName.js";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AnimatedLoader from 'react-native-animated-loader';
import LottieView from 'lottie-react-native';
import * as Clipboard from 'expo-clipboard';
import MarcusTouchable from "../components/MarcusTouchable";
// Requires apple dev account so fucking gay
// import ContextMenu from "react-native-context-menu-view";

export default function Notes({ navigation }) {
  const { id, parent_id } = useContext(folderContext);
  const { userID, folders, setFolders, notes, setNotes } = useContext(userContext);
  const [name, setName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [youtubeURL, setYoutubeURL] = useState('');
  const [uploadChoice, setUploadChoice] = useState(null)
  const [snap, setSnap] = useState('CONTENT_HEIGHT');
  const [sp, setSp] = useState(['CONTENT_HEIGHT']);

  const handleSnapPointChange = (changeVal) => {
    setSnap(changeVal || '35%');
  };

  useEffect(() => {
    const getName = async () => {
      const name = await getFolderName(id);
      setName(name);
    };

    getName();
  }, [id]);
  const filteredNotes =
    notes && notes.filter((obj) => obj.folder_id === id);

  const img = require("../assets/file-new/file-plus-dynamic-color.png");
  const imgage = require("../assets/upload.png");
  const bottomSheetRef = useRef(null);

  const pasteYoutubeLink = async () => {
    const link = await Clipboard.getStringAsync();
    setYoutubeURL(link);
  };


  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const convertImageToBase64 = async (imageUri) => {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: "base64",
    });
    return base64;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

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

  useEffect(() => {
    setSp([snap]);
  }, [snap]);

  useEffect(() => {
    if (image) {
      setSnap('50%')
    }

  }, [image])

  const extractText = async (uploadChoice) => {
    if (!youtubeURL && !image) {
      alert("Please select an image or Youtube Video first");
      return;
    }

    setLoading(true)

    try {
      const base64Images = []

      if (uploadChoice == 1) {
        for (let i = 0; i < image.length; i++) {
          const toBase64 = await convertImageToBase64(image[i])
          base64Images.push(toBase64)
        }
      }

      const dataBody = uploadChoice == 1 && { youtubeURL: null, image: base64Images, userID, folderID: id } || { youtubeURL, userID, folderID: id }
      
      // Send base64 data to backend
      const response = await fetch(
        "https://kqouyqkdkkihmwezwjxy.supabase.co/functions/v1/test",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataBody),
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log(data.text)
      } else {
        throw new Error("Failed to extract text");
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      alert("Failed to extract text");
    }

    finally {
      handleClosePress()
      setLoading(false)
      getNotes()
    }
  };

  const fileImage = require('../assets/file/file-dynamic-color.png')

  // variables
  const snapPoints = useMemo(() => [snap], []);

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  // callbacks
  const handleSheetChanges = useCallback((index) => {
    console.log("handleSheetChanges", index);
  }, []);

  const createSubject = async (name, parentID) => {
    if (!name) {
      return null;
    }

    setLoading(true);

    const response = await fetch(
      "https://kqouyqkdkkihmwezwjxy.supabase.co/functions/v1/createFolder",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, parentID, userID }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      console.log(data);
    } else {
      throw new Error("Error");
    }

    setLoading(false);
    handleClosePress();
    getSubjects();
  };

  const deleteFolder = async () => {
    const { data, error } = await supabase
      .from("folders")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);
    } else {
      if (!parent_id) {
        navigation.navigate("Home", { id: parent_id, name: name });
      } else {
        navigation.navigate("Folder", { id: parent_id, name: name });
      }
    }
  };

  const getNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userID);

    setNotes(data);
  };

  const handleClosePress = () => bottomSheetRef.current?.close();
  const handleOpenPress = () => bottomSheetRef.current?.expand();

  if (loading) {
    return (
        <AnimatedLoader visible={true} overlayColor="rgba(255,255,255,0.75)" animationStyle={styles.lottie} source={require('../assets/animations/loading.json')} speed={1}>
            <Text className='font-recmed text-2xl text-green-800 p-4'>Generating Notes...</Text>
        </AnimatedLoader>
    )
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View className={"bg-[#f2f2f2] flex-1"}>

        {filteredNotes[0] ? (
          <ScrollView bounces={false} className='px-4 my-4'>
            <View className="flex-col gap-y-2">
              {filteredNotes.reverse().map((v, k) => {
                  return (
                    <MarcusTouchable onPress={() =>
                      navigation.navigate("Note", {
                        id: v.id,
                        title: v.title,
                        content: v.content,
                        folder_id: v.folder_id,
                      })
                    } key={k} className="border-2 border-black/5 h-14 rounded-xl flex flex-row gap-x-1 items-center p-1 bg-white/25 px-2 w-full">

                    <View
                      className={
                        "p-4 bg-green-600/70 flex justify-center items-center rounded-lg max-w-max"
                      }
                    >
                    </View>
                        <Text className='font-montmed text-md pl-2 mr-8'>{v.title}</Text>
                    </MarcusTouchable>
                  );
                })
              }
            </View>
        </ScrollView>
        ) : ''}


        {!filteredNotes[0]? (
          <View className={"justify-center items-center flex-1"}>
            <MarcusTouchable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleOpenPress();
              }}
            >
              <View
                className={
                  "shadow-xl shadow-black/25 bg-[#f2f2f2] justify-center items-center p-8 rounded-xl border-2 border-green-800"
                }
              >
                <Image source={img} className={"w-24 h-24"} />
                <Text className={"font-montsemibold text-xl text-black/50"}>
                  You have no notes
                </Text>
                <Text className={"font-montbold text-xl"}>Create One?</Text>
              </View>
            </MarcusTouchable>
          </View>
        ) : (
          ""
        )}

        { filteredNotes[0] ? (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleOpenPress();
              }}
              className='bg-[#f2f2f2] shadow-xl shadow-black/50 justify-center items-center p-8'
            >
                <Text className={"font-montsemibold text-2xl text-green-800"}>
                  Create Note
                </Text>
            </TouchableOpacity>

          ) : ""
        }
      </View>


      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[1]} // ********* HERE, Add a default snapPoint 1
        enableDynamicSizing // ********* HERE Enable to dynamic sizing
        index={-1}
        style={styles.sheetContainer}
        backdropComponent={renderBackdrop}
        onClose={() => {
          setUploadChoice(null)
          setYoutubeURL('')
        }}
        backgroundStyle={{ backgroundColor: "#f2f2f2" }}
      >
        <BottomSheetView style={{ flex: 0, minHeight: 100, padding: 5, justifyContent: 'center', alignItems: 'center' }}>
          <Text className={"text-2xl font-montsemibold"}>
            Create Notes With Marcus
          </Text>

          {uploadChoice == 2 && (
            <View>
              <Text className='font-montsemibold text-xl text-center'>Enter Video URL 🔗</Text>
              <BottomSheetTextInput
                value={youtubeURL}
                style={styles.input}
                placeholder={"🔗 Youtube Video URL"}
                disabled={true}
              />

            </View>

          ) || uploadChoice == 1 && (
            <View className='m-5 w-full'>
              
            
              {/* Context Menu for Later (Requires apple dev account, so fucking gay) */}

              {/* <ContextMenu
                actions={[{ title: "Title 1" }, { title: "Title 2" }]}
                onPress={(e) => {
                  console.warn(
                    `Pressed ${e.nativeEvent.name} at index ${e.nativeEvent.index}`
                  );
                }}
              >
                <View style={styles.yourOwnStyles} />
              </ContextMenu> */}

            <MarcusTouchable onPress={() => pickImage()}
              className={
              `bg-black/5 inline-flex ${!image ? 'h-36' : 'h-max'}  rounded-lg border-2 border-green-800`
              }
            >
              { !(image) ? (
                <View className={'flex-1 justify-center items-center'}>
                  <Text className={"text-center font-montmed text-2xl"}>
                    Upload Notes Here
                  </Text>
                </View>
              ): (
                <View className={'flex flex-row justify-normal items-start gap-2 p-2'}>
                  { image.map((v, k ) => {
                    return (
                      <Image key={k} className={'w-20 h-20 rounded-xl'} source={{ uri: image[k] }}></Image>
                    )
                  })}
                </View>
              )}

            </MarcusTouchable>

              <Text className='font-recregular mt-2 text-md text-green-800 text-center'>You can upload up to 3 images at once</Text>
            </View>

          )|| (
            <View className='flex flex-row w-max'>
              <MarcusTouchable onPress={() => {
                setUploadChoice(1)
              }}
                className={
                `bg-black/5 m-5 w-32 h-32 rounded-lg flex flex-col justify-center items-center border-2 border-green-800`
                }
              >
                <Image source={imgage} className={"w-21 h-21 mb-8"} />
    
                <Text className='font-montbold absolute bottom-1 text-center mb-2'>Upload Image</Text>
    
              </MarcusTouchable>
              
              <MarcusTouchable onPress={() => {
                setUploadChoice(2)
              }}
                className={
                `bg-black/5 m-5 w-32 h-32 rounded-lg border-2 flex flex-col justify-center items-center border-green-800`
                }
              >
                <LottieView className='w-full h-full mb-4' source={require('../assets/animations/youtube.json')} speed={.5} autoPlay loop> 
    
                </LottieView>
    
                <Text className='font-montbold absolute bottom-1 text-center mb-2'>Youtube Video</Text>
    
              </MarcusTouchable>
            </View>
          )}



          <MarcusTouchable
            disabled={loading}
            className={`inline-flex h-14 flex-row items-center justify-center w-full ${loading ? 'bg-[#007d56]/25' : 'bg-[#007d56]'} rounded-lg pt-1 px-5 py-2 max-w-[300] mb-6`}
            onPress={() => {
              if (uploadChoice == 2 && !youtubeURL) {
                pasteYoutubeLink()
              } else {
                extractText(uploadChoice)
              }
            }}
          >
            <Text className={"font-montmed text-white text-center text-2xl"}>
              {(uploadChoice == 2 && !youtubeURL) && 'Paste Link' || !loading && "Create Notes" || 'Creating Notes'}
            </Text>
          </MarcusTouchable>
        </BottomSheetView>
      </BottomSheet>


    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  lottie: {
    width: 300,
    height: 300,
  },
  input: {
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 10,
    fontSize: 16,
    lineHeight: 20,
    padding: 12,
    backgroundColor: "rgba(151, 151, 151, 0.25)",
    fontFamily: "Recoleta-Regular",
  },
  sheetContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

import { Text } from "react-native";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
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
import { useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../supabase/supabase";
import userContext from "../components/userContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import getFolderName from "../components/getFolderName.js";
import MarcusTouchable from "../components/MarcusTouchable";

export default function Files({ navigation }) {
  const { id, parent_id, name } = useContext(folderContext);
  const { userID, folders, setFolders } = useContext(userContext);
  const [files, setFiles] = useState(null);
  const localImage = require("../assets/folder/folder-dynamic-color.png");
  const sheetRef = useRef(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredFolders =
    folders && folders.filter((obj) => obj.parent_id === id);

  const img = require("../assets/folder-new/new-folder-dynamic-color.png");

  const bottomSheetRef = useRef(null);

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

  // variables
  const snapPoints = useMemo(() => ["35%"], []);

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

    if (!response.ok) {
      throw new Error("Error");
    }

    setLoading(false);
    handleClosePress();
  };

  const deleteFolder = async () => {
    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);
    } else {
      if (!parent_id) {
        navigation.navigate("Home", { id: parent_id, name: name });
      } else {
        const { data, error } = await supabase
        .from("folders")
        .select('name')
        .eq("id", parent_id);

        navigation.navigate("Folder", { id: parent_id, name: data[0].name });
      }
    }
  };

  const handleClosePress = () => bottomSheetRef.current?.close();
  const handleOpenPress = () => bottomSheetRef.current?.expand();

  return (
    <GestureHandlerRootView style={styles.container}>
      <View className={"bg-[#f2f2f2] flex-1"}>
        <View className='px-4 mt-4'>
          <Text className={"font-recmed text-3xl text-green-900"}>
            {name}
          </Text>
          <TouchableOpacity onPress={() => deleteFolder()}>
                <Text className='text-red-600 font-recregular underline text-lg mb-2'>Delete Folder</Text>
          </TouchableOpacity>
        </View>

        {filteredFolders[0] ? (
          <ScrollView bounces={false} className='px-4 my-4'>
            <View className="flex-col gap-y-2">
              {filteredFolders.reverse().map((v, k) => {
                  return (
                    <MarcusTouchable
                      key={k}
                      onPress={() =>
                        navigation.navigate("Folder", {
                          id: v.id,
                          name: v.name,
                          parent_id: id,
                        })
                      }
                    >
                      <View
                        className={
                          "border-2 border-black/5 h-14 rounded-xl flex flex-row items-center p-1 bg-white/25"
                        }
                      >
                        <View
                          className={
                            "w-12 h-full bg-green-800/10 flex justify-center items-center p-2 rounded-xl"
                          }
                        >
                          <Image source={localImage} className={"w-full h-full"} />
                        </View>
                        <Text className={"font-montmed text-lg pl-2"}>
                          {v.name}
                        </Text>
                      </View>
                    </MarcusTouchable>
                  );
                })
              }
            </View>
        </ScrollView>
        ) : ''}

        

        {!filteredFolders[0] ? (
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
                  You have no folders
                </Text>
                <Text className={"font-montbold text-xl"}>Create One?</Text>
              </View>
            </MarcusTouchable>
          </View>
        ) : (
          ""
        )}

      </View>

      { filteredFolders[0] ? (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleOpenPress();
            }}
            className='bg-[#f2f2f2] shadow-xl shadow-black/50 justify-center items-center p-8'
          >
              <Text className={"font-montsemibold text-2xl text-green-800"}>
                Create Folder
              </Text>
          </TouchableOpacity>

        ) : ""
      }

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[1]} // ********* HERE, Add a default snapPoint 1
        enableDynamicSizing // ********* HERE Enable to dynamic sizing
        index={-1}
        style={styles.sheetContainer}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#f2f2f2" }}
      >
        <BottomSheetView style={{ flex: 0, minHeight: 100, padding: 5, justifyContent: 'center', alignItems: 'center' }}>
          <Text className={"text-2xl font-montsemibold"}>
            Lets get this started 🎉
          </Text>
          <BottomSheetTextInput
            value={folderName}
            onChangeText={(text) => setFolderName(text)}
            style={styles.input}
            placeholder={"📚 Give your folder a name"}
          />

          <MarcusTouchable
            className={`inline-flex flex-row items-center justify-center max-w-[256px] bg-[#007d56] rounded-lg pt-1 px-5 py-2 w-full mb-6`}
            onPress={async () => {
              createSubject(folderName, id);
            }}
          >
            <Text className={"font-montmed text-white text-center text-2xl"}>
              {"Create Folder"}
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

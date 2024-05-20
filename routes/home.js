import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Button,
  Image,
} from "react-native";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../supabase/supabase.js";
import { useFocusEffect } from "@react-navigation/native";
import localImage from "../assets/chat/chat-dynamic-color.png";
import * as Haptics from "expo-haptics";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import img from "../assets/folder-new/new-folder-dynamic-gradient.png";
import userContext from "../components/userContext.js";
import MarcusTouchable from "../components/MarcusTouchable.js";

export default function Home({ navigation }) {
  const { userID, folders, setFolders } = useContext(userContext);
  const sheetRef = useRef(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjects, setSubjects] = useState(null);
  const [loading, setLoading] = useState(false);
  const filteredFolders =
  folders && folders.filter((obj) => obj.parent_id === null);

  const bottomSheetRef = useRef(null);

  // variables
  const snapPoints = useMemo(() => ["30%"], []);

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
    } else {
      throw new Error("Error");
    }

    setLoading(false);
    handleClosePress();
  };

  useEffect(() => {
    console.log('folders updated')

  }, [folders])



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

  const localImage = require("../assets/folder/folder-dynamic-color.png");
  const img = require("../assets/folder-new/new-folder-dynamic-gradient.png");

  const handleOpenPress = () => bottomSheetRef.current?.expand();
  const handleClosePress = () => bottomSheetRef.current?.close();

  return (
    <GestureHandlerRootView style={styles.container}>
      <View className={"bg-[#f2f2f2] flex-1"}>
        <View className={"w-full h-24 flex justify-center p-5"}>
          <Text
            className={"font-recmed text-green-800 text-5xl text-left"}
          >
            Marcus
          </Text>
        </View>

        <View className={" px-5 flex flex-col gap-y-6"}>
          <View className={"flex flex-col gap-y-2"}>
            <Text className={"font-recregular text-2xl text-[#007d56]"}>
              Your Folders
            </Text>

            {filteredFolders
              ? filteredFolders.map((v, k) => {
                  return (
                    <MarcusTouchable
                      key={k}
                      onPress={() =>
                        navigation.navigate("Folder", {
                          id: v.id,
                          name: v.name,
                          parent_id: null,
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
                          <Image
                            source={localImage}
                            className={"w-full h-full"}
                          />
                        </View>
                        <Text className={"font-montsemibold text-xl px-2"}>
                          {v.name}
                        </Text>
                      </View>
                    </MarcusTouchable>
                  );
                })
              : ""}

            <MarcusTouchable
              onPress={async () => {
                handleOpenPress();
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }}
            >
              <View
                className={
                  "border-2 border-purple-800/5 h-12 w-40 rounded-xl flex flex-row items-center p-1 drop-shadow-2xl shadow-black shadow"
                }
              >
                <View
                  className={
                    "w-10 h-full bg-purple-800/10 flex justify-center items-center p-2 rounded-xl"
                  }
                >
                  <Image source={img} className={"w-full h-full"} />
                </View>
                <Text className={"font-montsemibold text-sm px-2"}>
                  Add Folder
                </Text>
              </View>
            </MarcusTouchable>
          </View>
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={[1]} // ********* HERE, Add a default snapPoint 1
          enableDynamicSizing // ********* HERE Enable to dynamic sizing
          index={-1}
          style={styles.sheetContainer}
          backdropComponent={renderBackdrop}
        >
        <BottomSheetView style={{ flex: 0, minHeight: 100, padding: 5, justifyContent: 'center', alignItems: 'center' }}>
            <Text className={"text-2xl font-montsemibold"}>
              Lets get this started 🎉
            </Text>
            <BottomSheetTextInput
              value={subjectName}
              onChangeText={(text) => setSubjectName(text)}
              style={styles.input}
              placeholder={"📚 Give your subject a name"}
            />

            <MarcusTouchable
              disabled={loading}
              className={`${loading ? "opacity-50" : ""} inline-flex flex-row items-center justify-center max-w-[256px] bg-[#007d56] rounded-lg pt-1 px-5 py-2 mb-6`}
              onPress={async () => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );

                await createSubject(subjectName);
              }}
            >
              <Text className={"font-montmed text-white text-center text-2xl"}>
                {"Create Folder"}
              </Text>
            </MarcusTouchable>
          </BottomSheetView>
        </BottomSheet>
      </View>
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

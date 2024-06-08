import { Button, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { supabase } from "../supabase/supabase";
import userContext from "../components/userContext.js";
import { useContext, useEffect } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Files from "./files";
import Notes from "./notes";
import folderContext from "../components/folderContext";
import NavigationMenu from "../components/navigationMenu";
import MarcusTouchable from "../components/MarcusTouchable";

export default function Folder({ navigation }) {
  const Tab = createMaterialTopTabNavigator();

  const { userID } = useContext(userContext);
  const route = useRoute();
  const id = route.params.id;
  const name = route.params.name;
  const parent_id = route.params?.parent_id || null;

  const deleteFolder = async (id, userID) => {
    const { data, error } = await supabase
      .from("folders")
      .delete()
      .eq("id", id)
      .eq("user_id", userID);
  };

  return (
    <folderContext.Provider value={{ id, name, parent_id }}>
      <NavigationMenu>
        <MarcusTouchable onPress={async () => {
          if (!parent_id) {
            navigation.navigate("Home");
          } else {
            const { data, error } = await supabase
            .from("folders")
            .select('name')
            .eq("id", parent_id);

            navigation.navigate("Folder", { id: parent_id, name: data[0].name });
          }
        }
        } className="border-2 border-black/5 h-10 rounded-xl flex flex-row gap-x-1 items-center p-1 bg-white/25 px-2 w-full">
          <View
            className={
              "p-2 bg-green-600/70 flex justify-center items-center rounded-lg max-w-max"
            }
          >
          </View>
            <Text className='font-montmed text-md pl-2 mr-8'>Back</Text>
        </MarcusTouchable>

                    <MarcusTouchable onPress={async () => {
                        navigation.navigate("Home");
                    }
                  } className="border-2 border-black/5 h-10 rounded-xl flex flex-row gap-x-1 items-center p-1 bg-white/25 px-2 w-full">

                  <View
                    className={
                      "p-2 bg-green-600/70 flex justify-center items-center rounded-lg max-w-max"
                    }
                  >
                  </View>
                      <Text className='font-montmed text-md pl-2 mr-8'>Home</Text>
                  </MarcusTouchable>
                    
      </NavigationMenu>

      
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 18,
            fontFamily: "Montserrat-SemiBold",
            textTransform: "none",
          },
          tabBarIndicatorStyle: { backgroundColor: "#007d56" },
          tabBarStyle: { backgroundColor: "#f2f2f2" },
        }}
      >
        <Tab.Screen name="Files" component={Files} />
        <Tab.Screen name="Notes" component={Notes} />
      </Tab.Navigator>
    </folderContext.Provider>
  );
}

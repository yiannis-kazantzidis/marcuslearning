import { Button, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { supabase } from "../supabase/supabase";
import userContext from "../components/userContext.js";
import { useContext, useEffect } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Files from "./files";
import Notes from "./notes";
import folderContext from "../components/folderContext";

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

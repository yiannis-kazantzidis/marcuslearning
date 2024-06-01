import React, { useState, useEffect, createContext } from "react";
import * as Font from "expo-font";
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { NavigationContainer } from "@react-navigation/native";
import Login from "./routes/login";
import Home from "./routes/home";
import Folder from "./routes/folder";
import Note from "./routes/note";
import { View } from "react-native";
import { supabase } from "./supabase/supabase";
import userContext from "./components/userContext";
import Flashcard from "./routes/flashcard";
import MultipleChoice from "./routes/multiplechoice";
import ExamQuestion from "./routes/examquestion";
import Assistant from "./routes/assistant";
import Onbarding from "./routes/onboarding";

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [userID, setUserID] = useState(null);
  const [folders, setFolders] = useState(null);
  const [notes, setNotes] = useState(null);
  const Stack = createStackNavigator();

  const checkAuth = async() => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('this is the current id ' + userID)

    if (!userID) {
      if (session?.user) {
        setUserID(session.user.id)
        return session.user.id
      } 
    }
  }

  useEffect(() => {
    console.log('userID changed:', userID);
    // Perform any necessary actions or state updates based on the new userID value
  }, [userID]);

  const getFolders = async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", userID);

    setFolders(data);
  };

  const getNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userID);

    setNotes(data);
  };

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        "Recoleta-Medium": require("./assets/fonts/Recoleta-Medium.ttf"),
        "Recoleta-SemiBold": require("./assets/fonts/Recoleta-SemiBold.ttf"),
        "Recoleta-Regular": require("./assets/fonts/Recoleta-Regular.ttf"),
        "Montserrat-Regular": require("./assets/fonts/marlin-sq-regular.ttf"),
        "Montserrat-Medium": require("./assets/fonts/marlin-sq-medium.ttf"),
        "Montserrat-SemiBold": require("./assets/fonts/marlin-sq-bold.ttf"),
        "Montserrat-Bold": require("./assets/fonts/marlin-sq-extrabold.ttf"),
      });
      setFontsLoaded(true);
    };

    loadFonts();

    if (userID) {
      getFolders();
      getNotes();
    }

    console.log('this is the new id' + userID)
  }, [userID]);

  useEffect(() => {
    const initnotes = async (userId) => {
      if (!userId) {
        userId = await checkAuth()
      }

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId);
  
      setNotes(data);
    };


    let channel = supabase
      .channel("notes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${userID}` },
        (payload) => {
          console.log('notes changed ' + userID)
          initnotes(userID);
          console.log("Received update:", payload);
        },
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userID]);
  
  useEffect(() => {
    const initfolders = async (userId) => {
      if (!userId) {
        userId = await checkAuth()
      }
      
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId);
  
      setFolders(data);
    };
  
    let channel = supabase
      .channel("folders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "folders", filter: `user_id=eq.${userID}`},
        (payload) => {
          initfolders(userID);
          console.log('HERE IS THE USER ID:' + userID)
          console.log("Received update:", payload);
        },
      )
      .subscribe();
  
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userID]);

  if (!fontsLoaded) {
    return <View></View>;
  }

  return (
    <userContext.Provider value={{ userID, setUserID, folders, setFolders, notes, setNotes }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Onbarding"
            component={Onbarding}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Folder"
            component={Folder}
            options={{ headerShown: true }}
          />

          <Stack.Screen
            name="Note"
            component={Note}
            options={{ headerShown: true }}
          />      

          <Stack.Screen
            name="Flashcard"
            component={Flashcard}
            options={{ headerShown: true }}
          />      

          <Stack.Group screenOptions={{presentation: 'modal'}}>
            <Stack.Screen
              name="MultipleChoice"
              component={MultipleChoice}
              options={{ headerShown: true }}
            />      
          </Stack.Group>

          <Stack.Group screenOptions={{presentation: 'modal'}}>
            <Stack.Screen
              name="ExamQuestion"
              component={ExamQuestion}
              options={{ headerShown: true }}
            />      
          </Stack.Group>

          <Stack.Group screenOptions={{presentation: 'modal'}}>
            <Stack.Screen
              name="Assistant"
              component={Assistant}
              options={{ headerShown: true }}
            />      
          </Stack.Group>
        
        </Stack.Navigator>
      </NavigationContainer>
    </userContext.Provider>
  );
}
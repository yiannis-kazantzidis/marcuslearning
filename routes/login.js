import { StyleSheet, Text, View, TouchableOpacity, Button, TextInput } from 'react-native';
import { supabase } from "../supabase/supabase";
import * as Haptics from 'expo-haptics';
import {useState, useEffect, useContext} from "react";
import SplashScreen from "../components/splash";
import AsyncStorage from "@react-native-async-storage/async-storage";
import userContext from '../components/userContext';

export default function Login({navigation}) {
    const { setUserID } = useContext(userContext)
    const [authLoading, setAuthLoading] = useState(true)
    const [email, setEmail] = useState(null)
    const [password, setPassword] = useState(null)

    const checkAuth = async() => {
        const { data: { session } } = await supabase.auth.getSession();

        await setAuthLoading(false)

        if (session?.user) {
            setUserID(session.user.id)
            await navigation.navigate("Home");
            return null;
        } else {
            await autoLogin()
        }
    }

    const storeLogin = async (value) => {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem('supagrade_stored_data_login_details', jsonValue);

        } catch (e) {
            console.log(e)
        }
    }

    const handleLogin = async (e, p) => {
        const em = 'yianniskazantzidis@yandex.com'
        const pass = 'Geforze1'
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: e,
                password: p,
            })

            if (error) {
                console.log("error")
            } else {
                await storeLogin({email: e, password: p})
                checkAuth()
            }
        }

        catch (error) {
            console.log(error)
        }

        finally {
            console.log("finished")

        }
    }


    const autoLogin = async () => {
        try {
            const value = await JSON.parse( await AsyncStorage.getItem('supagrade_stored_data_login_details'));

            if (value !== null) {
                await handleLogin(value.email, value.password)
            } else {
                console.log("value null")
            }
        } catch (e) {
            console.log(e)
        }
    };

    useEffect( () => {
        autoLogin()
    }, []);


    return (
        <View className={"bg-[#faf3ea] flex-1 justify-center items-center"}>
            <Text className={"text-5xl text-[#0d3c26] font-recbold p-4"}>Marcus - Beta</Text>

            <View className={"flex flex-col gap-y-2 items-center"}>
                <TextInput className='bg-green-800/30 text-2xl p-2 w-max' onChangeText={(text) => setEmail(text)} placeholder='Email' />
                <TextInput className='bg-green-800/30 text-2xl p-2 w-max' onChangeText={(text) => setPassword(text)} placeholder='Password' />




                <TouchableOpacity
                    className={"inline-flex flex-row items-center justify-center text-center max-w-[256px] bg-[#0d3c26] rounded-lg pt-2 py-2 px-5 w-screen"}
                    onPress={() => handleLogin(email, password)}
                >
                    <Text
                        className={"font-recregular text-white text-3xl"}

                    >
                        {"Login"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
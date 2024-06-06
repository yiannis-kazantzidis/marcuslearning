import { StyleSheet, Text, View, TouchableOpacity, Button, TextInput } from 'react-native';
import { supabase } from "../supabase/supabase";
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useContext } from "react";
import SplashScreen from "../components/splash";
import AsyncStorage from "@react-native-async-storage/async-storage";
import userContext from '../components/userContext';
import * as AppleAuthentication from 'expo-apple-authentication';
import AnimatedLoader from 'react-native-animated-loader';

export default function Login({ navigation }) {
    const { setUserID } = useContext(userContext);
    const [authLoading, setAuthLoading] = useState(false);
    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);

    const checkAndCreateUserRow = async (userId, email, name) => {
        console.log('checking status')
        const usn = name || ''
        try {
          // Check if a row exists with the user's ID
          console.log('checking status....')

          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
      
          if (error) {
            console.error("Error checking user row:", error);
          }
      
          // If no row exists, insert a new one
          if (!data[0]) {
            console.log('checking status.... row exists')

            console.log(userId, email, name)

            const { error } = await supabase
              .from("users")
              .insert({ id: userId, email: email, username: usn });
      
            if (error) {
              console.error("Error inserting user row:", usn);
              return;
            }
      
            console.log("New user row inserted successfully");
          } else {
            console.log("User row already exists");
          }
        } catch (error) {
          console.error("Error checking/creating user row:", error);
        }
    };

    const checkAuth = async () => {
        setAuthLoading(true)

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            setUserID(session.user.id);
            const value = JSON.parse(await AsyncStorage.getItem('onboarding_finished'));
            if (value?.completed) {
                console.log(value);
                setAuthLoading(false)
                await navigation.navigate("Home");
            } else {
                const jsonValue = JSON.stringify({ completed: true });
                await AsyncStorage.setItem('onboarding_finished', jsonValue);
                setAuthLoading(false)
                await navigation.navigate("Onbarding");
            }

            return null;
        } else {
            setAuthLoading(false)
        }

    };

    const handleAppleSignIn = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            setAuthLoading(true)

            console.log('id token ' + credential.identityToken)
            console.log(credential.fullName)
            console.log('this is the full name: ' + credential.fullName.givenName + credential.fullName.familyName + credential.fullName.nickname)

            if (credential.identityToken) {
                console.log('id token valid')
                await AsyncStorage.setItem('appleIdentityToken', credential.identityToken);

                const { error, data } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken
                });

                if (error) {
                    console.log(error)
                }

                if (!error) {
                    console.log('there is no error')
                    const userEmail = data.user.user_metadata.email;
                    const userID = data.user.id
                    const name = credential.givenName || ''
                    console.log(`User's email: ${userEmail}`); // You can use the email here
                    console.log(`User's ID: ${data.user.id}`); // You can use the email here




                    await checkAndCreateUserRow(userID, userEmail, name)
              


                    console.log('user is signed in');
                    await AsyncStorage.setItem('supabaseSession', JSON.stringify(data.session));

                    console.log('authchecked')
                    checkAuth();
                }
            } else {
                throw new Error('No identityToken.');
            }
        } catch (e) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
                // handle that the user canceled the sign-in flow
            } else {
                // handle other errors
            }
        }
    };

    const refreshAppleTokenSilently = async () => {
        try {
            const storedIdentityToken = await AsyncStorage.getItem('appleIdentityToken');
            const storedSession = await AsyncStorage.getItem('supabaseSession');
    
            if (storedIdentityToken && storedSession) {
                const session = JSON.parse(storedSession);
                const expiresAt = session.expires_at;
                const now = new Date().getTime() / 1000; // Get current time in seconds
    
                if (expiresAt < now) {
                    const newCredential = await AppleAuthentication.refreshAsync({
                        requestedOperation: AppleAuthentication.AppleAuthenticationOperation.REFRESH
                    });
    
                    if (newCredential.identityToken) {
                        await AsyncStorage.setItem('appleIdentityToken', newCredential.identityToken);
    
                        const { data, error } = await supabase.auth.signInWithIdToken({
                            provider: 'apple',
                            token: newCredential.identityToken
                        });
    
                        if (!error) {
                            await AsyncStorage.setItem('supabaseSession', JSON.stringify(data.session));
                        }
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        const initApp = async () => {
            const storedSession = await AsyncStorage.getItem('supabaseSession');
            const storedIdentityToken = await AsyncStorage.getItem('appleIdentityToken');

            if (storedSession && storedIdentityToken) {
                await refreshAppleTokenSilently()
                await checkAuth()
            }
        };

        initApp();
    }, []);

    if (authLoading) {
        return (
          <AnimatedLoader visible={true} overlayColor="rgba(255,255,255,0.75)" animationStyle={styles.lottie} source={require('../assets/animations/loading.json')} speed={1}>
            
          </AnimatedLoader>
        )
    }

    return (
        <View className={"bg-[#f2f2f2] flex-1 justify-center items-center"}>
            <Text className={"text-7xl text-green-900 font-recmed p-4"}>Marcus</Text>

            <View className={"flex flex-col gap-y-2 items-center"}>


                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                    cornerRadius={5}
                    style={styles.button}
                    onPress={() => handleAppleSignIn()}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lottie: {
        width: 200,
        height: 200,
    },
    button: {
        width: 220,
        height: 64,
    },
});


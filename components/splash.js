import { StyleSheet, Text, View, TouchableOpacity, Button } from 'react-native';

export default function SplashScreen() {
    return (
        <View className={"w-screen bg-[#0d3c26] h-screen flex justify-center items-center"}>
            <Text className={"text-6xl text-white p-3"}>Supagrade</Text>
        </View>
    )
}
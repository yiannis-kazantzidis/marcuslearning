import { View } from "react-native";

export default function NavigationMenu({children}) {
    return (
        <View className='flex-row justify-between px-4 h-32 w-full items-end pb-4 bg-[#f2f2f2] border-gray-300/25 border-b border-1'>
            {children}
        </View>
    )
}
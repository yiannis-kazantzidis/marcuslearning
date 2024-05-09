import {TouchableOpacity, View} from 'react-native';

export default function Pressable({onPress, children}) {
    return (
        <View>
            <TouchableOpacity onPress={onPress}>
                {children}
            </TouchableOpacity>
        </View>
    )
}
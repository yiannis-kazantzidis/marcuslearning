import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import TouchableScale from 'react-native-touchable-scale';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

const MarcusTouchable = ({ children, onPress, style, loading, ...props }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress && onPress();
  };

  return (
    <TouchableScale
      activeOpacity={0.7}
      tension={100}
      friction={10}
      useNativeDriver
      onPress={handlePress}
      {...props}
    >
      <View style={style}>
        {children}
        { loading ? <LottieView className='w-full h-full mb-4' source={require('../assets/animations/youtube.json')} speed={.5} autoPlay loop> </LottieView> : '' }
      </View>
    </TouchableScale>
  );
};

export default MarcusTouchable;
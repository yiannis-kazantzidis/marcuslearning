import OnboardingScreen from 'simple-react-native-onboarding';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

export default function Onbarding({navigation}) {
    const data = [
        {
            _id: '1',
            title: <Text className='font-recregular text-green-900'>Create Revision Material in Seconds</Text>,
            description: 'Marcus allows you to turn images of your notes or youtube videos directly into flashcards, exam style questions, and multiple choice questions.',
        },
        {
            _id : '2',
            title: <Text className='font-recregular text-green-900'>Youtube to Notes, in Seconds</Text>,
            description: 'Turn a youtube video of a lesson strait into revision material, its just that easy.',
            image: <LottieView autoPlay speed={.5} style={styles.lottie} source={require('../assets/animations/youtube.json')} />

        },
        {
            _id : '3',
            title: <Text className='font-recregular text-green-900'>Mark my exam questions, say that again please.</Text>,
            description: 'Marcus can create exam questions relating to your notes and mark them using its extensive marking training from over 500+ past A Level and GCSE Papers.',

        },
        {
            _id : '4',
            title: <Text className='font-recregular text-green-900'>Hi Marcus, can you give an example of the third point.</Text>,
            description: 'With Marcus, you can communicate with your notes through speech. Marcus can test you, answer questions and explain anything relating to your notes.',
            image: <LottieView autoPlay style={styles.lottie} source={require('../assets/animations/speaking.json')} />

        },
    ]

    return (
        <OnboardingScreen 
            data={data} 
            dotBackgroundColor='green' 
            buttonBackgroundColor='green'
            style={styles.onboarding}
            onFinish={() => navigation.navigate('Home')} 
            buttonIconColor='white'
        />
    )

}

const styles = StyleSheet.create({
    onboarding: {
      fontFamily: 'Recoleta-Regular',
    },
    lottie: {
        height: 150,
        width: 150,
    }

  });
  

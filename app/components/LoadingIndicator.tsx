import { StyleProp, View, ViewStyle } from "react-native";
import LottieView from 'lottie-react-native';

export function LoadingIndicator(props: { style?: StyleProp<ViewStyle> | undefined; }) {
    return (
        <View style={props.style}>
            <LottieView
                source={require('../../assets/animations/clock.json')}
                style={{ width: 100, height: 100 }}
                autoPlay={true}
            />
        </View>
    );
}
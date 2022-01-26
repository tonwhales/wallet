import { ActivityIndicator, StyleProp, View, ViewStyle } from "react-native";
import LottieView from 'lottie-react-native';
import { Theme } from "../Theme";

export function LoadingIndicator(props: { simple?: boolean, style?: StyleProp<ViewStyle> | undefined; }) {
    if (props.simple) {
        return <ActivityIndicator style={props.style} color={Theme.accent} />
    }
    return (
        <View style={props.style}>
            <LottieView
                source={require('../../assets/animations/clock.json')}
                style={{ width: 140, height: 140 }}
                autoPlay={true}
            />
        </View>
    );
}
import { ActivityIndicator, StyleProp, View, ViewStyle } from "react-native";
import LottieView from 'lottie-react-native';
import { useTheme } from '../engine/hooks';

export function LoadingIndicator(props: { simple?: boolean, style?: StyleProp<ViewStyle> | undefined; }) {
    const theme = useTheme();
    if (props.simple) {
        return <ActivityIndicator style={props.style} color={theme.accent} />
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
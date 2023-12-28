import React from "react";
import LottieView, { LottieViewProps } from 'lottie-react-native';
import { Platform } from "react-native";

export const LottieAnimView = React.memo((props: LottieViewProps & { autoPlayIos?: boolean }) => {
    const anim = React.useRef<LottieView>(null);

    React.useLayoutEffect(() => {
        if (props.autoPlayIos && Platform.OS === 'ios') {
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, []);

    return (
        <LottieView
            ref={anim}
            source={props.source}
            style={props.style}
            autoPlay={props.autoPlay}
            loop={props.loop}
        />
    )
});
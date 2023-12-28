import React, { Fragment, PureComponent } from 'react';
import { View, Animated, StyleSheet, Easing, StyleProp, ViewStyle } from 'react-native';

export const easeOutQuart = Easing.bezier(0.25, 1, 0.5, 1);
export const defaultDuration = 7.5 * 1000;

export type CircularProgressProps = {
    color: string,
    backgroundColor: string,
    size: number,
    width: number,
    progress: number,
    duration: number,
    animateFromValue: number,
    fullColor: string | null,
    onAnimationComplete?: (finished: boolean) => void,
    loop?: boolean,
    containerColor: string,
    style?: StyleProp<ViewStyle>
}

type styleType = {
    container?: {
        width: number,
        height: number,
        borderRadius: number,
        overflow: "hidden",
    }; background: any;
    cutOff: any,
    secondHalfContainer: any,
    halfCircle: any,
    circleArc?: {
        width: any,
        height: any,
        borderColor: any,
        borderRadius: number,
        borderWidth: any,
    }
}

class CircularProgress extends PureComponent<CircularProgressProps> {
    state = { animatedVal: new Animated.Value(0) };

    componentDidMount() {
        const { animateFromValue, progress, duration } = this.props;
        const { animatedVal } = this.state;

        if (animateFromValue >= 0) {
            animatedVal.setValue(animateFromValue);
            this.animateTo(progress, duration, easeOutQuart);
        } else {
            animatedVal.setValue(progress);
        }
    }

    componentDidUpdate(prevProps: { progress: number; }) {
        if (prevProps.progress !== this.props.progress) {
            this.state.animatedVal.setValue(this.props.progress);
        }
    }

    interpolateAnimVal = (inputRange: number[], outputRange: number[] | string[]) =>
        this.state.animatedVal.interpolate({
            inputRange,
            outputRange,
            extrapolate: 'clamp',
        });

    interpolateRotation = (isSecondHalf?: boolean) => this.interpolateAnimVal(isSecondHalf ? [50, 100] : [0, 50], [
        '0deg',
        '180deg',
    ]);

    interpolateRotationTwoOpacity = () => this.interpolateAnimVal([50, 50.01], [0, 1]);

    interpolateColorOpacity = () => this.interpolateAnimVal([0, 100], [0, 1]);

    animateTo = (
        toValue: number,
        duration = this.props.duration,
        easing: (params: any) => number,
    ) => {
        this.state.animatedVal.setValue(0);
        if (this.props.loop) {
            Animated.loop(
                Animated.timing(this.state.animatedVal, {
                    toValue,
                    duration,
                    easing,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            Animated.timing(this.state.animatedVal, {
                toValue,
                duration,
                easing,
                useNativeDriver: true,
            }).start((status) => {
                if (this.props.onAnimationComplete) this.props.onAnimationComplete(status.finished);
            });
        }
    };

    resetAnimation = (progress = this.props.progress) => this.state.animatedVal.setValue(progress);

    circleHalf = (
        styles: styleType,
        isSecondHalf: boolean,
        color: string
    ) => (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: isSecondHalf ? this.interpolateRotationTwoOpacity() : 1,
                    transform: [{ rotate: this.interpolateRotation(isSecondHalf) }],
                },
            ]}>
            <View
                style={[
                    styles.halfCircle,
                    isSecondHalf && {
                        bottom: 0,
                        transform: [{ rotate: '180deg' }],
                    },
                ]}>
                <View style={[styles.circleArc, { borderColor: color }]} />
            </View>
        </Animated.View>
    );

    renderLoader = (styles: styleType, color = this.props.color) => (
        <Fragment>
            <View style={styles.background} />
            {this.circleHalf(styles, false, color)}
            <View style={styles.halfCircle}>
                <View style={styles.cutOff} />
            </View>
            <View style={styles.secondHalfContainer}>
                {this.circleHalf(styles, true, color)}
            </View>
        </Fragment>
    );

    render() {
        const styles = generateStyles(this.props);
        const { fullColor } = this.props;

        return (
            <View style={[styles.container, this.props.style]}>
                {this.renderLoader(styles)}
                {fullColor && (
                    <Animated.View
                        style={{
                            position: 'absolute',
                            opacity: this.interpolateColorOpacity(),
                        }}>
                        {this.renderLoader(styles, fullColor)}
                    </Animated.View>
                )}
            </View>
        );
    }
}

const generateStyles = ({
    size,
    width,
    color,
    backgroundColor,
    containerColor = 'transparent',
}: {
    size: number,
    width: number,
    color: string,
    backgroundColor: string,
    containerColor: string,
}) =>
    StyleSheet.create({
        container: {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
        },
        background: {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: width,
            borderColor: backgroundColor,
            position: 'absolute',
        },
        cutOff: {
            backgroundColor: containerColor,
            width: size,
            height: size,
            borderWidth: width,
            borderColor: backgroundColor,
            borderRadius: size / 2,
        },
        secondHalfContainer: {
            position: 'absolute',
        },
        halfCircle: {
            width: size,
            height: size / 2,
            overflow: 'hidden',
            position: 'absolute',
        },
        circleArc: {
            width: size,
            height: size,
            borderColor: color,
            borderRadius: size / 2,
            borderWidth: width
        },
    });

export default CircularProgress;
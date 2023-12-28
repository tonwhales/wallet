import React from "react";
import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { useCopilot, walkthroughable } from "react-native-copilot";
import { RoundButton } from "../RoundButton";
import { t } from "../../i18n/t";
import { sharedStoragePersistence } from "../../storage/storage";
import { useTheme } from "../../engine/hooks";

import IcClose from '@assets/ic-close.svg';

export const OnboadingView = walkthroughable(View) as any;
export const onboardingFinishedKey = 'onboardingFinished';
const onboardingSteps = 3;

export const defaultCopilotSvgPath = (
    {
        size,
        position,
        canvasSize
    }: any
) => {
    const positionX = position.x._value;
    const positionY = position.y._value;
    const sizeX = size.x._value;
    const sizeY = size.y._value;
    const borderRadius = 16;
    return `M${borderRadius},0H${canvasSize.x - borderRadius}Q${canvasSize.x},0 ${canvasSize.x},${borderRadius}V${canvasSize.y - borderRadius}Q${canvasSize.x},${canvasSize.y} ${canvasSize.x - borderRadius},${canvasSize.y}H${borderRadius}Q0,${canvasSize.y} 0,${canvasSize.y - borderRadius}V${borderRadius}Q0,0 ${borderRadius},0Z M${positionX + borderRadius},${positionY}H${positionX + sizeX - borderRadius}Q${positionX + sizeX},${positionY} ${positionX + sizeX},${positionY + borderRadius}V${positionY + sizeY - borderRadius}Q${positionX + sizeX},${positionY + sizeY} ${positionX + sizeX - borderRadius},${positionY + sizeY}H${positionX + borderRadius}Q${positionX},${positionY + sizeY} ${positionX},${positionY + sizeY - borderRadius}V${positionY + borderRadius}Q${positionX},${positionY} ${positionX + borderRadius},${positionY}Z`;
};

export const CopilotTooltip = memo(() => {
    const  theme = useTheme();
    const {
        goToNext, stop,
        currentStep, isLastStep, currentStepNumber
    } = useCopilot();

    const handleStop = () => {
        sharedStoragePersistence.set(onboardingFinishedKey, true);
        stop();
    };
    const handleNext = () => {
        goToNext();
    };

    return (
        <View>
            <View>
                <Text style={{
                    color: theme.white,
                    fontSize: 17, fontWeight: '600',
                    lineHeight: 24
                }}>
                    {`${currentStepNumber}/${onboardingSteps}`}
                </Text>
                <Text style={{
                    color: theme.white,
                    fontSize: 15, fontWeight: '400',
                    lineHeight: 20, marginTop: 2
                }}>
                    {currentStep?.text}
                </Text>
            </View>
            <View style={{
                marginTop: 12,
                flexDirection: 'row',
                width: '100%',
            }}>
                {!isLastStep ? (
                    <RoundButton
                        style={{
                            width: '100%',
                        }}
                        title={t('common.continue')}
                        onPress={handleNext}
                    />
                ) : (
                    <RoundButton
                        style={{
                            width: '100%',
                        }}
                        title={t('common.done')}
                        onPress={handleStop}
                    />
                )}
            </View>
            <Pressable
                style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.5 : 1,
                        position: 'absolute',
                        top: -6, right: -6,
                    }
                }}
                onPress={handleStop}
            >
                <IcClose />
            </Pressable>
        </View>
    );
});
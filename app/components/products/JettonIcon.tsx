import { memo } from "react";
import { View } from "react-native";
import { WImage } from "../WImage";
import { ThemeType } from "../../engine/state/theme";
import { useKnownJettons } from "../../engine/hooks";
import { JettonMasterState } from "../../engine/metadata/fetchJettonMasterContent";
import { Image } from "expo-image";

export const JettonIcon = memo(({
    size,
    jetton,
    theme,
    isTestnet,
    backgroundColor,
    isSCAM
}: {
    size: number,
    jetton: JettonMasterState & { address: string },
    theme: ThemeType,
    isTestnet: boolean,
    backgroundColor?: string,
    isSCAM?: boolean
}) => {
    const knownJettons = useKnownJettons(isTestnet);
    const knownJettonMasters = knownJettons?.masters ?? {};

    if (jetton.assets) {
        const isKnown0 = jetton.assets[0].type === 'jetton' ? !!knownJettonMasters[jetton.assets[0].address] : true;
        const isKnown1 = jetton.assets[1].type === 'jetton' ? !!knownJettonMasters[jetton.assets[1].address] : true;

        return (
            <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 0, backgroundColor, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', left: '10%', top: '10%' }}>
                    {jetton.assets[0].type === 'jetton' ? (
                        <WImage
                            src={jetton.assets[0].metadata.image?.preview256}
                            width={size * 0.5}
                            height={size * 0.5}
                            borderRadius={size * 0.5}
                        />
                    ) : (
                        <Image
                            source={require('@assets/ic-ton-acc.png')}
                            style={{
                                borderRadius: 23,
                                height: size * 0.5,
                                width: size * 0.5
                            }}
                        />
                    )}
                    {isKnown0 && (
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            height: 10, width: 10, borderRadius: 5,
                            position: 'absolute', left: -2, bottom: -2,
                            backgroundColor: theme.surfaceOnBg
                        }}>
                            <Image
                                source={require('@assets/ic-verified.png')}
                                style={{ height: 10, width: 10 }}
                            />
                        </View>
                    )}
                </View>
                <View style={{ position: 'absolute', right: '15%', bottom: '15%' }}>
                    {jetton.assets[1].type === 'jetton' ? (
                        <WImage
                            src={jetton.assets[1].metadata.image?.preview256}
                            width={size * 0.5}
                            height={size * 0.5}
                            borderRadius={size * 0.5}
                        />
                    ) : (
                        <Image
                            source={require('@assets/ic-ton-acc.png')}
                            style={{
                                borderRadius: 23,
                                height: size * 0.5,
                                width: size * 0.5
                            }}
                        />
                    )}
                    {isKnown1 && (
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            height: 10, width: 10, borderRadius: 5,
                            position: 'absolute', right: -2, bottom: -2,
                            backgroundColor: theme.surfaceOnBg
                        }}>
                            <Image
                                source={require('@assets/ic-verified.png')}
                                style={{ height: 10, width: 10 }}
                            />
                        </View>
                    )}
                </View>
            </View>
        );
    }

    const isKnown = !!knownJettonMasters[jetton.address];

    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 0 }}>
            <WImage
                src={jetton.image?.preview256 ?? undefined}
                width={size}
                height={size}
                borderRadius={size}
            />
            {isKnown ? (
                <View style={{
                    justifyContent: 'center', alignItems: 'center',
                    height: 20, width: 20, borderRadius: 10,
                    position: 'absolute', right: -2, bottom: -2,
                    backgroundColor: theme.surfaceOnBg
                }}>
                    <Image
                        source={require('@assets/ic-verified.png')}
                        style={{ height: 20, width: 20 }}
                    />
                </View>
            ) : (
                isSCAM && (
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 20, width: 20, borderRadius: 10,
                        position: 'absolute', right: -2, bottom: -2,
                        backgroundColor: theme.surfaceOnBg
                    }}>
                        <Image
                            source={require('@assets/ic-jetton-scam.png')}
                            style={{ height: 20, width: 20 }}
                        />
                    </View>
                )
            )}
        </View>
    );
});

JettonIcon.displayName = 'JettonIcon';
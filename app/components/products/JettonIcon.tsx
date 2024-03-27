import { memo } from "react";
import { Jetton } from "../../engine/types";
import { View, Image } from "react-native";
import { WImage } from "../WImage";
import { ThemeType } from "../../engine/state/theme";
import { KnownJettonMasters } from "../../secure/KnownWallets";

import IcTonIcon from '@assets/ic-ton-acc.svg';

export const JettonIcon = memo(({
    size,
    jetton,
    theme,
    isTestnet,
    backgroundColor
}: {
    size: number,
    jetton: Jetton,
    theme: ThemeType,
    isTestnet: boolean,
    backgroundColor?: string
}) => {
    if (jetton.assets) {
        const isKnown0 = jetton.assets[0].type === 'jetton' ? !!KnownJettonMasters(isTestnet)[jetton.assets[0].address] : true;
        const isKnown1 = jetton.assets[1].type === 'jetton' ? !!KnownJettonMasters(isTestnet)[jetton.assets[1].address] : true;

        return (
            <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 0, backgroundColor, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', left: '10%', top: '10%' }}>
                    {jetton.assets[0].type === 'jetton' ? (
                        <WImage
                            src={jetton.assets[0].metadata.image?.preview256}
                            width={size * 0.5}
                            heigh={size * 0.5}
                            borderRadius={size * 0.5}
                        />
                    ) : (
                        <IcTonIcon
                            width={size * 0.5}
                            height={size * 0.5}
                            style={{ width: size * 0.5, height: size * 0.5 }}
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
                            heigh={size * 0.5}
                            borderRadius={size * 0.5}
                        />
                    ) : (
                        <IcTonIcon
                            width={size * 0.5}
                            height={size * 0.5}
                            style={{ width: size * 0.5, height: size * 0.5 }}
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

    const isKnown = !!KnownJettonMasters(isTestnet)[jetton.master.toString({ testOnly: isTestnet })];

    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 0 }}>
            <WImage
                src={jetton.icon ? jetton.icon : undefined}
                width={size}
                heigh={size}
                borderRadius={size}
            />
            {isKnown && (
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
            )}
        </View>
    );
});
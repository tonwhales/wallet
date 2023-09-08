import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { View, Text, Pressable, useWindowDimensions, ScrollView } from "react-native";
import { t } from "../../i18n/t";
import { QRCode } from "../../components/QRCode/QRCode";
import { useParams } from "../../utils/useParams";
import { CopyButton } from "../../components/CopyButton";
import { ShareButton } from "../../components/ShareButton";
import { JettonMasterState } from "../../engine/sync/startJettonMasterSync";
import { Address } from "ton";
import { useEngine } from "../../engine/Engine";
import { WImage } from "../../components/WImage";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Canvas, LinearGradient, Rect, useImage, vec } from "@shopify/react-native-skia";
import { getMostPrevalentColorFromBytes } from "../../utils/image/getMostPrevalentColorFromBytes";
import { KnownJettonMasters } from "../../secure/KnownWallets";
import { captureRef } from 'react-native-view-shot';
import { Avatar } from "../../components/Avatar";

import Verified from '../../../assets/ic-verified.svg';
import TonIcon from '../../../assets/ic_ton_account.svg';
import Chevron from '../../../assets/ic_chevron_forward.svg';

export const ReceiveFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const dimentions = useWindowDimensions();
    const qrSize = Math.floor((dimentions.width - 80 - 56 + 16));
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const imageRef = useRef<View>(null);
    const engine = useEngine();
    const params = useParams<{ addr?: string, ledger?: boolean }>();

    const [isSharing, setIsSharing] = useState(false);

    const address = useMemo(() => {
        if (params.addr) {
            return Address.parse(params.addr);
        }
        return getCurrentAddress().address;
    }, [params]);
    const friendly = address.toFriendly({ testOnly: AppConfig.isTestnet });
    const [jetton, setJetton] = useState<{ master: Address, data: JettonMasterState } | null>(null);

    const isVerified = useMemo(() => {
        if (!jetton) {
            return true;
        }
        return !!KnownJettonMasters(AppConfig.isTestnet)[jetton?.master.toFriendly({ testOnly: AppConfig.isTestnet })];
    }, [jetton]);

    const onAssetSelected = useCallback((selected?: { master: Address, wallet: Address }) => {
        console.log({ master: selected?.master.toFriendly({ testOnly: AppConfig.isTestnet }), wallet: selected?.wallet.toFriendly({ testOnly: AppConfig.isTestnet }) });
        if (selected) {
            const data = engine.persistence.jettonMasters.item(selected.master).value;
            if (data) {
                setJetton({ master: selected.master, data });
                return;
            }
        }
        setJetton(null);
    }, []);

    const link = useMemo(() => {
        if (jetton) {
            return `https://${AppConfig.isTestnet ? 'test.' : ''}tonhub.com/transfer`
                + `/${address.toFriendly({ testOnly: AppConfig.isTestnet })}`
                + `?jetton=${jetton.master.toFriendly({ testOnly: AppConfig.isTestnet })}`
        }
        return `https://${AppConfig.isTestnet ? 'test.' : ''}tonhub.com/transfer`
            + `/${address.toFriendly({ testOnly: AppConfig.isTestnet })}`
    }, [jetton]);

    const [mainColor, setMainColor] = useState('#0098EA');
    const isDark = useMemo(() => {
        if (mainColor === '#0098EA') {
            return true;
        }
        const [r, g, b] = mainColor.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        console.log({ luminance });
        return luminance < 0.5;
    }, [mainColor]);

    const image = useImage(jetton?.data?.image?.preview256);

    useEffect(() => {
        if (image) {
            const bytes = image.encodeToBytes();
            const color = getMostPrevalentColorFromBytes(bytes);
            setMainColor(color);
            return;
        }
        setMainColor('#0098EA');
    }, [image]);

    return (
        <View
            ref={imageRef}
            style={{
                flexGrow: 1,
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: mainColor,
            }}
            collapsable={false}>
            <ScreenHeader
                style={{ opacity: isSharing ? 0 : 1, flex: 1, minHeight: safeArea.bottom === 0 ? 60 : undefined }}
                title={t('receive.title')}
                onClosePressed={navigation.goBack}
                textColor={isDark ? '#fff' : '#000'}
                tintColor={isDark ? '#fff' : '#000'}
            />
            <View style={{ position: 'absolute', top: 60, bottom: 0, left: 0, right: 0 }}>
                <Canvas style={{ flex: 1 }}>
                    <Rect x={0} y={0} width={dimentions.width} height={dimentions.height - (safeArea.top + 60)}>
                        <LinearGradient
                            start={vec(0, (dimentions.height + 100 - (safeArea.top + 60)) / 2)}
                            end={vec(0, dimentions.height - (safeArea.top + 60))}
                            colors={[mainColor, "rgba(256, 256, 256, 0.1)"]}
                        />
                    </Rect>
                </Canvas>
            </View>
            <ScrollView style={{ flexGrow: 1, width: '100%' }}>
                <View style={{ paddingHorizontal: 28, width: '100%' }}>
                    <View style={{
                        justifyContent: 'center',
                        backgroundColor: Theme.surfaceSecondary,
                        borderRadius: 20,
                        padding: 32,
                        paddingTop: 52,
                        marginTop: 81,
                        marginBottom: 16
                    }}>
                        <View style={{
                            height: 87, width: 87, borderRadius: 44,
                            position: 'absolute', top: -49,
                            alignSelf: 'center',
                            backgroundColor: mainColor,
                            justifyContent: 'center', alignItems: 'center',
                        }}>
                            <Avatar
                                id={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                size={77}
                                borderWith={0}
                            />
                        </View>
                        <View style={{ height: qrSize, justifyContent: 'center', alignItems: 'center' }}>
                            <QRCode
                                data={link}
                                size={qrSize}
                                icon={jetton?.data.image}
                                color={isDark && Theme.style === 'dark' ? Theme.textPrimary : mainColor}
                            />
                        </View>
                    </View>
                    <View style={{ backgroundColor: Theme.surfaceSecondary, borderRadius: 20, padding: 20 }}>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1,
                                }
                            }}
                            onPress={() => {
                                if (params.ledger) {
                                    navigation.navigate('LedgerAssets', { callback: onAssetSelected, selectedJetton: jetton?.master });
                                    return;
                                }
                                navigation.navigate('Assets', { callback: onAssetSelected, selectedJetton: jetton?.master });
                            }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <View style={{ height: 46, width: 46, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                        {!!jetton && (
                                            <WImage
                                                src={jetton.data.image?.preview256}
                                                blurhash={jetton.data.image?.blurhash}
                                                width={46}
                                                heigh={46}
                                                borderRadius={23}
                                                lockLoading
                                            />
                                        )}
                                        {!jetton && (
                                            <TonIcon width={46} height={46} style={{ height: 46, width: 46 }} />
                                        )}
                                        {isVerified && (
                                            <Verified
                                                height={16} width={16}
                                                style={{
                                                    height: 16, width: 16,
                                                    position: 'absolute', right: -2, bottom: -2,
                                                }}
                                            />
                                        )}
                                    </View>
                                    <View style={{ justifyContent: 'space-between' }}>
                                        <Text style={{
                                            fontSize: 17,
                                            color: Theme.textPrimary,
                                            fontWeight: '600',
                                            lineHeight: 24
                                        }}>
                                            {`${jetton?.data.symbol ?? `TON ${t('common.wallet')}`}`}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontWeight: '400',
                                                lineHeight: 20,
                                                color: Theme.textSecondary,
                                            }}
                                            selectable={false}
                                            ellipsizeMode={'middle'}
                                        >
                                            {
                                                friendly.slice(0, 6)
                                                + '...'
                                                + friendly.slice(friendly.length - 6)
                                            }
                                        </Text>
                                    </View>
                                </View>
                                <Chevron style={{ height: 16, width: 16 }} height={16} width={16} />
                            </View>
                        </Pressable>
                    </View>
                </View>
                <View style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    opacity: isSharing ? 0 : 1,
                    marginTop: 16, paddingHorizontal: 28,
                }}>
                    <CopyButton
                        style={{
                            marginRight: 16,
                            backgroundColor: Theme.surfaceSecondary,
                            borderWidth: 0,
                            height: 56,
                        }}
                        body={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        textStyle={{
                            color: (isDark && Theme.style === 'dark') ? Theme.textPrimary : mainColor,
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '600',
                        }}
                    />
                    <ShareButton
                        style={{
                            marginRight: 8,
                            backgroundColor: Theme.surfaceSecondary,
                            borderWidth: 0,
                            height: 56,
                        }}
                        body={link}
                        textStyle={{
                            color: (isDark && Theme.style === 'dark') ? Theme.textPrimary : mainColor,
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '600',
                        }}
                        onScreenCapture={() => {
                            return new Promise((resolve, reject) => {
                                setIsSharing(true);
                                (async () => {
                                    setTimeout(async () => {
                                        try {
                                            const localUri = await captureRef(imageRef, {
                                                height: 440,
                                                quality: 1,
                                            });
                                            setIsSharing(false);
                                            resolve({ uri: localUri });
                                        } catch {
                                            setIsSharing(false);
                                            reject();
                                        }
                                    }, 150);
                                })();
                            })
                        }}
                    />
                </View>
            </ScrollView>
            <View style={{ flexGrow: 1 }} />
        </View>
    );
});
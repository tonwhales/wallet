import { useCallback, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEngine } from "../../engine/Engine";
import { JettonState } from "../../engine/products/WalletProduct";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Address } from "ton";
import { SelectableButton } from "../../components/SelectableButton";
import { useAppConfig } from "../../utils/AppConfigContext";
import { WImage } from "../../components/WImage";
import { KnownJettonMasters } from "../../secure/KnownWallets";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRoute } from "@react-navigation/native";
import { useLedgerTransport } from "../ledger/components/LedgerTransportProvider";

import Verified from '@assets/ic-verified.svg';
import TonIcon from '@assets/ic_ton_account.svg';

export const AssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const { Theme, AppConfig } = useAppConfig();
    const { target, callback, selectedJetton } = useParams<{
        target: string,
        callback?: (selected?: { wallet: Address, master: Address }) => void,
        selectedJetton?: Address
    }>();

    const route = useRoute();
    const isLedgerScreen = route.name === 'LedgerAssets';

    const ledgerTransport = useLedgerTransport();
    const address = useMemo(() => {
        if (isLedgerScreen && !!ledgerTransport?.addr) {
            return Address.parse(ledgerTransport.addr.address);
        }
    }, [ledgerTransport, isLedgerScreen]);

    const ledgerJettons = engine.products.ledger.useJettons(address)?.jettons ?? [];
    const jettons = engine.products.main.useJettons();

    const onSelected = useCallback((jetton: JettonState) => {
        if (callback) {
            onCallback({ wallet: jetton.wallet, master: jetton.master });
            return;
        }
        if (isLedgerScreen) {
            navigation.replace('LedgerSimpleTransfer', {
                amount: null,
                target: target,
                comment: null,
                jetton: jetton.wallet,
                stateInit: null,
                job: null,
                callback: null
            });
            return;
        }
        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            comment: null,
            jetton: jetton.wallet,
            stateInit: null,
            job: null,
            callback: null
        });
    }, []);

    const onTonSelected = useCallback(() => {
        if (callback) {
            onCallback();
            return;
        }
        if (isLedgerScreen) {
            navigation.replace('LedgerSimpleTransfer', {
                amount: null,
                target: target,
                stateInit: null,
                job: null,
                comment: null,
                jetton: null,
                callback: null
            });
            return;
        }
        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            stateInit: null,
            job: null,
            comment: null,
            jetton: null,
            callback: null
        });
    }, [isLedgerScreen, callback]);

    const onCallback = useCallback((selected?: { wallet: Address, master: Address }) => {
        if (callback) {
            setTimeout(() => {
                navigation.goBack();
                callback(selected);
            }, 10);
        }
    }, [callback]);

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: Theme.background
        }}>
            <ScreenHeader
                onClosePressed={navigation.goBack}
                title={t('products.accounts')}
            />
            <ScrollView
                style={{ flexGrow: 1, marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                contentInset={{ bottom: safeArea.bottom + 32 + 44 }}
            >
                <View style={{
                    borderRadius: 14,
                }}>
                    <SelectableButton
                        key={'assets-ton'}
                        title={'TON'}
                        subtitle={t('common.balance')}
                        onSelect={onTonSelected}
                        icon={
                            <View style={{ width: 46, height: 46 }}>
                                <TonIcon width={46} height={46} />
                                <Verified
                                    height={16} width={16}
                                    style={{
                                        height: 16, width: 16,
                                        position: 'absolute', right: -2, bottom: -2,
                                    }}
                                />
                            </View>
                        }
                        selected={!selectedJetton}
                        hideSelection={!callback}
                    />
                    {(isLedgerScreen ? ledgerJettons : jettons).map((j) => {
                        const verified = KnownJettonMasters(AppConfig.isTestnet)[j.master.toString()];
                        const selected = selectedJetton && j.master.equals(selectedJetton);
                        return (
                            <SelectableButton
                                key={'jt' + j.wallet.toFriendly()}
                                title={j.name}
                                subtitle={j.description}
                                onSelect={() => onSelected(j)}
                                icon={
                                    <View style={{ width: 46, height: 46 }}>
                                        <WImage
                                            src={j.icon ? j.icon : undefined}
                                            width={46}
                                            heigh={46}
                                            borderRadius={23}
                                        />
                                        {verified && (
                                            <Verified
                                                height={16} width={16}
                                                style={{
                                                    height: 16, width: 16,
                                                    position: 'absolute', right: -2, bottom: -2,
                                                }}
                                            />
                                        )}
                                    </View>
                                }
                                hideSelection={!callback}
                                selected={selected}
                            />
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
});
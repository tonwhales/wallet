import React from "react"
import { Address, fromNano } from "ton"
import { LockupWalletState } from "../../engine/sync/startLockupWalletSync"
import { ItemButton } from "../ItemButton"
import { ItemGroup } from "../ItemGroup"
import { Text } from "react-native"
import { t } from "../../i18n/t"
import { ItemDivider } from "../ItemDivider"
import Chevron from '../../../assets/ic_ios_chevron_right.svg';
import BN from "bn.js"
import { AppConfig } from "../../AppConfig"
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import { openWithInApp } from "../../utils/openWithInApp"

export const LockupInfo = React.memo(({ address, lockup }: { address: Address, lockup: LockupWalletState }) => {
    const navigation = useTypedNavigation();
    const locked = React.useMemo(() => {
        let locked = new BN(0);
        if (lockup.wallet?.locked) {
            Array.from(lockup.wallet.locked).forEach(([key, value]) => {
                const until = parseInt(key);
                if (until > Date.now() / 1000) {
                    locked = locked.add(new BN(value));
                }
            });
        }

        return locked
    }, [lockup]);

    return (
        <>
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: '700',
                    marginHorizontal: 16,
                    marginVertical: 8
                }}
            >
                {t('products.lockups.otherInfo')}
            </Text>
            <ItemGroup style={{ marginHorizontal: 16 }}>
                <ItemButton
                    title={t('products.lockups.lockupSmartContract')}
                    rightIcon={{
                        icon: Chevron,
                        color: '#000000',
                        height: 12,
                        width: 7,
                        style: { marginLeft: 16 }
                    }}
                    hint={'GitHub'}
                    onPress={() => {
                        openWithInApp('https://github.com/ton-blockchain/lockup-wallet-contract/tree/main/universal')
                    }}
                />
                <ItemDivider />
                <ItemButton
                    title={t('products.lockups.verifier')}
                    rightIcon={{
                        icon: Chevron,
                        color: '#000000',
                        height: 12,
                        width: 7,
                        style: { marginLeft: 16 }
                    }}
                    onPress={() => {
                        openWithInApp(`https://tonwhales.com/explorer/address/${address.toFriendly({ testOnly: AppConfig.isTestnet })}/code`)
                    }}
                />
                <ItemDivider />
                <ItemButton
                    title={t('products.lockups.integrityCheck')}
                    rightIcon={{
                        icon: Chevron,
                        color: '#000000',
                        height: 12,
                        width: 7,
                        style: { marginLeft: 16 }
                    }}
                    hint="✅"
                    onPress={() => navigation.navigate('IntegrityCheck', { address: address.toFriendly({ testOnly: AppConfig.isTestnet }) })}
                />
                <ItemDivider />
                <ItemButton
                    title={t('products.lockups.lockedBalance')}
                    rightIcon={{
                        icon: Chevron,
                        color: '#000000',
                        height: 12,
                        width: 7,
                        style: { marginLeft: 16 }
                    }}
                    hint={fromNano(locked) + ' TON'}
                    onPress={() => navigation.navigate('LockupLocked', { address: address.toFriendly({ testOnly: AppConfig.isTestnet }) })}
                />
                <ItemDivider />
                <ItemButton
                    title={t('products.lockups.otcDeskSupport')}
                    rightIcon={{
                        icon: Chevron,
                        color: '#000000',
                        height: 12,
                        width: 7,
                        style: { marginLeft: 16 }
                    }}
                    hint={'Telegram'}
                />
                <ItemDivider />
                {/* TODO: Add config backup */}
                {/* <ItemButton
                    title="Your config backup"
                    rightIcon={{
                        icon: Chevron,
                        color: '#000000',
                        height: 12,
                        width: 7,
                        style: { marginLeft: 16 }
                    }}
                    hint={'Telegram'}
                /> */}
            </ItemGroup>
        </>
    )
})
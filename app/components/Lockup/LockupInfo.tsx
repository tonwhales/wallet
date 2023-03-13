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
                    title="Lockup Smart Contract"
                    rightIcon={{
                        icon: Chevron,
                        color: '#000000',
                        height: 12,
                        width: 7,
                        style: { marginLeft: 16 }
                    }}
                    hint={'GitHub'}
                />
                <ItemDivider />
                <ItemButton
                    title="Smart Contract Verifier"
                    rightIcon={{
                        icon: Chevron,
                        color: '#000000',
                        height: 12,
                        width: 7,
                        style: { marginLeft: 16 }
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
                    title="OTC Desk Support"
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
                <ItemButton
                    title="Your config backup"
                    rightIcon={{
                        icon: Chevron,
                        color: '#000000',
                        height: 12,
                        width: 7,
                        style: { marginLeft: 16 }
                    }}
                    hint={'Telegram'}
                />
            </ItemGroup>
        </>
    )
})
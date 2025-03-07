import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { avatarColors } from "../avatar/Avatar";
import { ATextInputRef } from "../ATextInput";
import { useTheme } from "../../engine/hooks";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { t } from "../../i18n/t";
import { PerfText } from "../basic/PerfText";
import { avatarHash } from "../../utils/avatarHash";
import { AddressInputAvatar } from "./AddressInputAvatar";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { Typography } from "../styles";
import { SolanaAddressInput, SolanaAddressInputRef, SolanaAddressInputState } from "./SolanaAddressInput";
import { isSolanaAddress, solanaAddressFromString } from "../../utils/solana/core";

import IcChevron from '@assets/ic_chevron_forward.svg';

type SolanaTransferAddressInputProps = {
    index: number,
    initTarget: string,
    onFocus: (index: number) => void,
    onSubmit: (index: number) => void,
    onQRCodeRead: (value: string) => void,
    isSelected?: boolean,
    onNext?: () => void,
    navigation: TypedNavigation,
    setAddressInputState: (state: SolanaAddressInputState) => void,
    autoFocus?: boolean
}

export const SolanaTransferAddressInput = memo(forwardRef((props: SolanaTransferAddressInputProps, ref: ForwardedRef<SolanaAddressInputRef>) => {
    const { index, initTarget, onFocus, onSubmit, onQRCodeRead, isSelected, navigation, setAddressInputState, autoFocus } = props;
    const theme = useTheme();

    const [state, setState] = useState<SolanaAddressInputState>({
        input: initTarget,
        target: initTarget,
        suffix: ''
    });

    useEffect(() => {
        setAddressInputState(state);
    }, [state]);

    const { input, target } = state;

    const [validAddress, isInvalid] = useMemo(() => {
        if (state.target.length < 44) {
            return [null, false];
        }
        if (!isSolanaAddress(state.target)) {
            return [null, true];
        }
        try {
            return [solanaAddressFromString(state.target), false]
        } catch {
            return [null, true];
        }
    }, [target]);

    // const holdersAccounts = useHoldersAccounts(account).data?.accounts ?? [];
    // const isTargetHolders = holdersAccounts.find((acc) => !!acc.address && validAddress?.equals(Address.parse(acc.address)));

    const avatarColorHash = avatarHash(validAddress ?? '', avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    // TODO map other wallets to solana addresses
    // const myWallets = useMemo(() => {
    //     return appState.addresses
    //         .map((acc, index) => ({
    //             address: acc.address,
    //             addressString: acc.address.toString({ testOnly: isTestnet }),
    //             index: index
    //         }))
    //         .filter((acc) => !acc.address.equals(account))
    // }, [appState.addresses]);

    // const own = !!myWallets.find((acc) => {
    //     if (validAddress) {
    //         return acc.address.equals(validAddress);
    //     }
    // });

    const onFocusCallback = useCallback(() => onFocus(index), [index]);

    const select = useCallback(() => {
        (ref as RefObject<ATextInputRef>)?.current?.focus();
        onFocus(index);
    }, [onFocus, index]);

    useEffect(() => {
        if (isSelected) {
            select();
        }
    }, [select, isSelected]);

    const shortTarget = target.slice(0, 4) + '...' + target.slice(-4);

    return (
        <View>
            <View
                style={[isSelected ? { opacity: 0, height: 0, width: 0 } : undefined]}
                pointerEvents={!isSelected ? undefined : 'none'}
            >
                <Pressable
                    style={{
                        backgroundColor: theme.surfaceOnElevation,
                        padding: 20,
                        width: '100%', borderRadius: 20,
                        flexDirection: 'row', alignItems: 'center',
                    }}
                    onPress={select}
                >
                    <AddressInputAvatar
                        size={46}
                        theme={theme}
                        isOwn={false}
                        markContact={false}
                        // hash={walletSettings?.avatar}
                        friendly={input}
                        avatarColor={avatarColor}
                        knownWallets={{}}
                        hash={null}
                        // forceAvatar={!!isTargetHolders ? 'holders' : undefined}
                    />
                    <View style={{ paddingHorizontal: 12, flexGrow: 1 }}>
                        <PerfText style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('common.recipient')}
                        </PerfText>
                        <PerfText style={[{ color: theme.textPrimary, marginTop: 2 }, Typography.regular17_24]}>
                            {shortTarget}
                        </PerfText>
                    </View>
                    <IcChevron style={{ height: 12, width: 12 }} height={12} width={12} />
                </Pressable>
            </View>
            <View
                style={
                    !isSelected
                        ? Platform.select({
                            ios: { width: 0, height: 0, opacity: 0 },
                            android: { height: 1, opacity: 0 } // to account for wierd android behavior (not focusing on input when it's height/width is 0)
                        })
                        : { height: 'auto', width: '100%', opacity: 1 }
                }
                pointerEvents={isSelected ? undefined : 'none'}
            >
                <View
                    style={{
                        backgroundColor: theme.surfaceOnElevation,
                        paddingVertical: 20,
                        paddingHorizontal: 20,
                        width: '100%', borderRadius: 20,
                        flexDirection: 'row', alignItems: 'center',
                        gap: 16
                    }}
                >
                    <View style={{ height: '100%' }}>
                        <AddressInputAvatar
                            size={46}
                            theme={theme}
                            isOwn={false}
                            markContact={false}
                            // hash={walletSettings?.avatar}
                            friendly={input}
                            avatarColor={avatarColor}
                            knownWallets={{}} hash={null}
                            // forceAvatar={isTargetHolders ? 'holders' : undefined}
                        />
                    </View>
                    <SolanaAddressInput
                        onStateChange={setState}
                        index={index}
                        ref={ref}
                        initTarget={initTarget}
                        autoFocus={autoFocus}
                        onFocus={onFocusCallback}
                        onSubmit={onSubmit}
                        onQRCodeRead={onQRCodeRead}
                        navigation={navigation}
                        theme={theme}
                    />
                </View>
                {isInvalid && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <PerfText style={[{
                            color: theme.accentRed,
                            marginTop: 4,
                            marginLeft: 16,
                        }, Typography.regular13_18]}>
                            {t('transfer.error.invalidAddress')}
                        </PerfText>
                    </Animated.View>
                )}
                {/* <HoldersAccountsSearch
                    theme={theme}
                    onSelect={onAddressSearchItemSelected}
                    query={query}
                    holdersAccounts={holdersAccounts}
                    owner={account}
                    isLedger={isLedger}
                /> */}
            </View>
        </View>
    );
}));

SolanaTransferAddressInput.displayName = 'SolanaTransferAddressInput';

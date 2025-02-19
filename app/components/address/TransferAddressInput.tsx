import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { Address } from "@ton/core";
import { avatarColors } from "../avatar/Avatar";
import { AddressDomainInput, AddressDomainInputRef, AddressInputState, InputActionType } from "./AddressDomainInput";
import { ATextInputRef } from "../ATextInput";
import { KnownWallet } from "../../secure/KnownWallets";
import { useAppState, useBounceableWalletFormat, useHoldersAccounts, useTheme, useWalletSettings } from "../../engine/hooks";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { AddressSearchItem } from "./AddressSearch";
import { t } from "../../i18n/t";
import { PerfText } from "../basic/PerfText";
import { avatarHash } from "../../utils/avatarHash";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { AddressInputAvatar } from "./AddressInputAvatar";
import { useDimensions } from "@react-native-community/hooks";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { useAddressBookContext } from "../../engine/AddressBookContext";
import { Typography } from "../styles";
import { HoldersAccountsSearch } from "./HoldersAccountsSearch";

import IcChevron from '@assets/ic_chevron_forward.svg';

type TransferAddressInputProps = {
    acc: Address,
    isTestnet: boolean,
    index: number,
    initTarget: string,
    domain?: string,
    onFocus: (index: number) => void,
    onSubmit: (index: number) => void,
    onQRCodeRead: (value: string) => void,
    isSelected?: boolean,
    onNext?: () => void,
    onSearchItemSelected: (item: AddressSearchItem) => void,
    knownWallets: { [key: string]: KnownWallet },
    navigation: TypedNavigation,
    setAddressDomainInputState: (state: AddressInputState) => void,
    autoFocus?: boolean,
    isLedger?: boolean
}

export const TransferAddressInput = memo(forwardRef((props: TransferAddressInputProps, ref: ForwardedRef<AddressDomainInputRef>) => {
    const { acc: account, isTestnet, index, initTarget, onFocus, onSubmit, onQRCodeRead, isSelected, onSearchItemSelected, knownWallets, navigation, setAddressDomainInputState, autoFocus, isLedger } = props;
    const theme = useTheme();

    const [state, setState] = useState<AddressInputState>({
        input: initTarget,
        target: initTarget,
        suffix: '',
        domain: undefined
    });

    useEffect(() => {
        setAddressDomainInputState(state);
    }, [state]);

    const { input: query, target } = state;

    const [validAddress, isInvalid] = useMemo(() => {
        if (target.length < 48) {
            return [null, false];
        }
        try {
            return [Address.parse(target), false]
        } catch {
            return [null, true];
        }
    }, [target]);

    const isKnown: boolean = !!knownWallets[initTarget];
    const addressBookContext = useAddressBookContext();
    const contact = addressBookContext.asContact(initTarget);
    const appState = useAppState();
    const dimentions = useDimensions();
    const screenWidth = dimentions.screen.width;
    const validAddressFriendly = validAddress?.toString({ testOnly: isTestnet });
    const [walletSettings] = useWalletSettings(validAddressFriendly);
    const [bounceableFormat] = useBounceableWalletFormat();
    const ledgerTransport = useLedgerTransport();

    const holdersAccounts = useHoldersAccounts(account).data?.accounts ?? [];
    const isTargetHolders = holdersAccounts.find((acc) => !!acc.address && validAddress?.equals(Address.parse(acc.address)));

    const avatarColorHash = walletSettings?.color ?? avatarHash(validAddressFriendly ?? '', avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const isSelectedLedger = useMemo(() => {
        try {
            if (!!ledgerTransport?.addr?.address && !!validAddress) {
                return Address.parse(ledgerTransport.addr.address).equals(validAddress);
            }
            return false
        } catch {
            return false;
        }
    }, [ledgerTransport.addr?.address, validAddress]);

    const myWallets = useMemo(() => {
        return appState.addresses
            .map((acc, index) => ({
                address: acc.address,
                addressString: acc.address.toString({ testOnly: isTestnet }),
                index: index
            }))
            .concat(ledgerTransport.addr ? [
                {
                    address: Address.parse(ledgerTransport.addr.address),
                    addressString: Address.parse(ledgerTransport.addr.address).toString({ testOnly: isTestnet }),
                    index: -2
                }
            ] : [])
            .filter((acc) => !acc.address.equals(account))
    }, [appState.addresses, ledgerTransport.addr?.address]);

    const own = !!myWallets.find((acc) => {
        if (validAddress) {
            return acc.address.equals(validAddress);
        }
    });

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

    const onAddressSearchItemSelected = useCallback((item: AddressSearchItem) => {
        const friendly = item.addr.address.toString({
            testOnly: isTestnet,
            bounceable: item.known ? true : item.addr.isBounceable
        });

        let name = item.type !== 'unknown' ? item.title : friendly;

        if (item.isLedger) {
            name = 'Ledger';
        }

        const suff = friendly.slice(0, 4) + '...' + friendly.slice(friendly.length - 4);

        (ref as RefObject<AddressDomainInputRef> | undefined)?.current?.inputAction({
            type: InputActionType.InputTarget,
            input: name.trim(),
            target: friendly,
            suffix: suff
        });

        if (onSearchItemSelected) {
            onSearchItemSelected(item);
        }
    }, [onSearchItemSelected]);

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
                        justifyContent: 'space-between'
                    }}
                    onPress={select}
                >
                    <AddressInputAvatar
                        size={46}
                        theme={theme}
                        isOwn={own}
                        markContact={!!contact}
                        hash={walletSettings?.avatar}
                        isLedger={isSelectedLedger}
                        friendly={validAddressFriendly}
                        avatarColor={avatarColor}
                        knownWallets={knownWallets}
                        forceAvatar={!!isTargetHolders ? 'holders' : undefined}
                    />
                    <View style={{ paddingHorizontal: 12, flexGrow: 1 }}>
                        <PerfText style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('common.recipient')}
                        </PerfText>
                        <PerfText style={[{ color: state.input !== state.target ? theme.textSecondary : theme.textPrimary, marginTop: 2, marginRight: 56 }, Typography.regular17_24]}>
                            {(state.input !== state.target) && <PerfText style={[{ color: theme.textPrimary}, Typography.regular17_24]}>{state.input}</PerfText>}
                            {target.slice(0, 4) + '...' + target.slice(-4)}
                        </PerfText>
                    </View>
                    <IcChevron style={{ height: 12, width: 12}} height={12} width={12} />
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
                            isOwn={own}
                            markContact={!!contact}
                            hash={walletSettings?.avatar}
                            isLedger={isSelectedLedger}
                            friendly={validAddressFriendly}
                            avatarColor={avatarColor}
                            knownWallets={knownWallets}
                            forceAvatar={isTargetHolders ? 'holders' : undefined}
                        />
                    </View>
                    <AddressDomainInput
                        onStateChange={setState}
                        index={index}
                        ref={ref}
                        initTarget={initTarget}
                        autoFocus={autoFocus}
                        onFocus={onFocusCallback}
                        isKnown={isKnown}
                        onSubmit={onSubmit}
                        contact={contact}
                        onQRCodeRead={onQRCodeRead}
                        screenWidth={screenWidth * 0.75}
                        bounceableFormat={bounceableFormat}
                        knownWallets={knownWallets}
                        navigation={navigation}
                        theme={theme}
                        isTestnet={isTestnet}
                        acc={account}
                        onSearchItemSelected={onAddressSearchItemSelected}
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
                <HoldersAccountsSearch
                    theme={theme}
                    onSelect={onAddressSearchItemSelected}
                    query={query}
                    holdersAccounts={holdersAccounts}
                    owner={account}
                    isLedger={isLedger}
                />
            </View>
        </View>
    );
}));

TransferAddressInput.displayName = 'TransferAddressInput';
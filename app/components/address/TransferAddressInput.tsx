import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { Address } from "@ton/core";
import { avatarColors } from "../avatar/Avatar";
import { AddressDomainInput, AddressDomainInputRef, AddressInputState, InputAction } from "./AddressDomainInput";
import { ATextInputRef } from "../ATextInput";
import { KnownWallet } from "../../secure/KnownWallets";
import { useAppState, useBounceableWalletFormat, useContractInfo, useHoldersAccounts, useTheme, useWalletSettings } from "../../engine/hooks";
import { AddressSearchItem, SolanaAddressSearchItem } from "./AddressSearch";
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
import { hasDirectTonDeposit } from "../../utils/holders/hasDirectDeposit";

import IcChevron from '@assets/ic_chevron_forward.svg';
import { AddressConfirmationRequest } from "../../fragments/secure/simpleTransfer/components/AddressConfirmationRequest";
import { isSolanaAddress } from "../../utils/solana/address";

type TransferAddressInputProps = {
    acc: Address,
    solanaAddress?: string,
    isTestnet: boolean,
    index: number,
    initTarget: string,
    domain?: string,
    onFocus: (index: number) => void,
    onSubmit: (index: number) => void,
    onQRCodeRead: (value: string) => void,
    isSelected?: boolean,
    onNext?: () => void,
    onSearchItemSelected: (item: AddressSearchItem | SolanaAddressSearchItem) => void,
    knownWallets: { [key: string]: KnownWallet },
    navigation: TypedNavigation,
    setAddressDomainInputState: (state: AddressInputState) => void,
    autoFocus?: boolean,
    isLedger?: boolean
    initialBlockchain?: 'ton' | 'solana';
}

export const TransferAddressInput = memo(forwardRef((props: TransferAddressInputProps, ref: ForwardedRef<AddressDomainInputRef>) => {
    const { acc: account, solanaAddress, isTestnet, index, initTarget, onFocus, onSubmit, onQRCodeRead, isSelected, onSearchItemSelected, knownWallets, navigation, setAddressDomainInputState, autoFocus, isLedger, domain, initialBlockchain } = props;
    const theme = useTheme();

    const [state, setState] = useState<AddressInputState>({
        input: initTarget,
        target: initTarget,
        suffix: '',
        domain: domain,
        addressType: isSolanaAddress(initTarget) ? 'solana' : 'ton'
    });

    useEffect(() => {
        setAddressDomainInputState(state);
    }, [state]);

    const [validTonAddress, validSolanaAddress] = useMemo(() => {
        if (isSolanaAddress(state.target)) {
            return [null, state.target];
        } else {
            try {
                return [Address.parse(state.target), null];
            } catch {
                return [null, null];
            }
        }
    }, [state.target]);

    const { input: query, target } = state;
    const isKnown: boolean = !!knownWallets[initTarget];
    const addressBookContext = useAddressBookContext();
    const contact = addressBookContext.asContact(initTarget);
    const appState = useAppState();
    const dimentions = useDimensions();
    const screenWidth = dimentions.screen.width;
    const addressType = state.addressType || 'ton';
    const validTonAddressFriendly = validTonAddress?.toString({ testOnly: isTestnet });
    const [walletSettings] = useWalletSettings(validTonAddressFriendly);
    const [bounceableFormat] = useBounceableWalletFormat();
    const ledgerTransport = useLedgerTransport();
    const allHoldersAccounts = useHoldersAccounts(
        account,
        isLedger ? undefined : solanaAddress
    ).data?.accounts ?? [];
    
    // filtration depends on the wallet from which this screen was opened
    // for example: if we open simple transfer from usdc wallet, we show only solana chain holders accounts
    let holdersAccounts: typeof allHoldersAccounts = [];
    if (initialBlockchain === 'ton') {
        holdersAccounts = allHoldersAccounts.filter(acc => hasDirectTonDeposit(acc) && acc.network !== 'solana');
    } else if (initialBlockchain === 'solana') {
        holdersAccounts = allHoldersAccounts.filter(acc => acc.network === 'solana');
    } else {
        holdersAccounts = allHoldersAccounts.filter(
            acc => hasDirectTonDeposit(acc) || acc.network === 'solana'
        );
    }
    const targetContract = useContractInfo(validTonAddressFriendly || '');
    const isTargetHolders = addressType === 'ton' ? (
        holdersAccounts.find((acc) => !!acc.address && acc.cryptoCurrency.ticker !== 'USDC' && validTonAddress?.equals(Address.parse(acc.address))) ||
        targetContract?.kind === 'card' ||
        targetContract?.kind === 'jetton-card'
    ) : false;

    const displayAddress = validSolanaAddress || validTonAddressFriendly;
    const avatarColorHash = walletSettings?.color ?? avatarHash(displayAddress ?? '', avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const isSelectedLedger = useMemo(() => {
        try {
            if (ledgerTransport.wallets.length > 0 && validTonAddress) {
                return ledgerTransport.wallets.some(wallet => {
                    return Address.parse(wallet.address).equals(validTonAddress);
                });
            }
            return false;
        } catch {
            return false;
        }
    }, [ledgerTransport.wallets, validTonAddress]);

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

    const own = useMemo(() => {
        if (validTonAddress) {
            return !!myWallets.find((acc) => acc.address.equals(validTonAddress));
        }
        return false;
    }, [validTonAddress, myWallets]);

    const addressInputAvatar = useMemo(() => (
        <AddressInputAvatar
            size={46}
            theme={theme}
            isOwn={own}
            markContact={addressType === 'ton' ? !!contact : false}
            hash={addressType === 'ton' ? walletSettings?.avatar : undefined}
            isLedger={addressType === 'ton' ? isSelectedLedger : false}
            friendly={displayAddress}
            avatarColor={avatarColor}
            knownWallets={addressType === 'ton' ? knownWallets : {}}
            forceAvatar={isTargetHolders ? 'holders' : undefined}
        />
    ), [theme, own, addressType, contact, walletSettings?.avatar, isSelectedLedger, displayAddress, avatarColor, knownWallets, isTargetHolders]);

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

        if (item.isLedger && !item.title) {
            name = 'Ledger';
        }

        const suff = friendly.slice(0, 4) + '...' + friendly.slice(friendly.length - 4);

        (ref as RefObject<AddressDomainInputRef> | undefined)?.current?.inputAction({
            type: InputAction.InputTarget,
            input: name.trim(),
            target: friendly,
            suffix: suff,
            addressType: 'ton'
        });

        if (onSearchItemSelected) {
            onSearchItemSelected(item);
        }
    }, [onSearchItemSelected]);

    const onSolanaAddressSearchItemSelected = useCallback((item: SolanaAddressSearchItem) => {
        const friendly = item.address;
        const name = item.title;
        const suff = friendly.slice(0, 4) + '...' + friendly.slice(-4);

        (ref as RefObject<AddressDomainInputRef> | undefined)?.current?.inputAction({
            type: InputAction.InputTarget,
            input: name.trim(),
            target: friendly,
            suffix: suff,
            addressType: 'solana'
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
                    }}
                    onPress={select}
                >
                    {addressInputAvatar}
                    <View style={{ paddingHorizontal: 12, flexGrow: 1 }}>
                        <PerfText style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('common.recipient')}
                        </PerfText>
                        <PerfText style={[{ color: theme.textPrimary, marginTop: 2 }, Typography.regular17_24]}>
                            {target.slice(0, 4) + '...' + target.slice(-4)}
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
                        {addressInputAvatar}
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
                        solanaAddress={solanaAddress}
                        initDomain={domain}
                    />
                </View>
                {__DEV__ && addressType === 'ton' && ( // TODO: return when wallet confirmation design is refined
                    <AddressConfirmationRequest address={validTonAddress ? state.target : undefined} />
                )}
                <HoldersAccountsSearch
                    theme={theme}
                    onSelect={onAddressSearchItemSelected}
                    onSolanaSelect={onSolanaAddressSearchItemSelected}
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
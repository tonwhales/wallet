import { forwardRef, memo, useImperativeHandle, useRef } from 'react';
import { useTypedNavigation } from '../../../../utils/useTypedNavigation';
import { useCurrentAddress, useNetwork } from '../../../../engine/hooks';
import { TransferAddressInput } from '../../../../components/address/TransferAddressInput';
import { Address } from '@ton/core';
import { SimpleTransferParams } from '../SimpleTransferFragment';
import { AddressInputState } from '../../../../components/address/AddressDomainInput';
import { AddressSearchItem } from '../../../../components/address/AddressSearch';
import { KnownWallet } from '../../../../secure/KnownWallets';

type Props = {
    ledgerAddress?: Address;
    params: SimpleTransferParams;
    domain?: string;
    onInputFocus: (index: number) => void
    setAddressDomainInputState: (state: AddressInputState) => void
    onInputSubmit: () => void
    onQRCodeRead: (src: string) => void;
    isActive: boolean;
    onSearchItemSelected: (item: AddressSearchItem) => void
    knownWallets: {
        [key: string]: KnownWallet;
    };
}

export const SimpleTransferAddress = memo(forwardRef(({
    ledgerAddress,
    params,
    domain,
    onInputFocus,
    setAddressDomainInputState,
    onInputSubmit,
    onQRCodeRead,
    isActive,
    onSearchItemSelected,
    knownWallets,
}: Props, ref) => {
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const { tonAddress, solanaAddress } = useCurrentAddress();
    const innerRef = useRef(null)
    useImperativeHandle(ref, () => innerRef.current)

    return (
        <TransferAddressInput
            index={0}
            ref={innerRef}
            acc={ledgerAddress ?? tonAddress}
            solanaAddress={solanaAddress}
            initTarget={params?.target || ''}
            domain={domain}
            isTestnet={network.isTestnet}
            onFocus={onInputFocus}
            setAddressDomainInputState={setAddressDomainInputState}
            onSubmit={onInputSubmit}
            onQRCodeRead={onQRCodeRead}
            isSelected={isActive}
            onSearchItemSelected={onSearchItemSelected}
            knownWallets={knownWallets}
            navigation={navigation}
            autoFocus={isActive}
        />
    )
}))

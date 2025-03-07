import { Dispatch, forwardRef, memo, SetStateAction, useImperativeHandle, useRef } from "react";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { SolanaTransferAddressInput } from "../../../../components/address/SolanaTransferAddressInput";
import { SolanaAddressInputState } from "../../../../components/address/SolanaAddressInput";

type Props = {
    initTarget?: string | null;
    onInputFocus: (index: number) => void
    setAddressInputState: Dispatch<SetStateAction<SolanaAddressInputState>>;
    onInputSubmit: () => void
    onQRCodeRead: (src: string) => void;
    isActive: boolean;
}

export const SolanaSimpleTransferAddress = memo(forwardRef(({
    initTarget,
    onInputFocus,
    setAddressInputState,
    onInputSubmit,
    onQRCodeRead,
    isActive
}: Props, ref) => {
    const navigation = useTypedNavigation();
    const innerRef = useRef(null);
    useImperativeHandle(ref, () => innerRef.current);

    return (
        <SolanaTransferAddressInput
            index={0}
            ref={innerRef}
            initTarget={initTarget || ''}
            onFocus={onInputFocus}
            setAddressInputState={setAddressInputState}
            onSubmit={onInputSubmit}
            onQRCodeRead={onQRCodeRead}
            isSelected={isActive}
            navigation={navigation}
            autoFocus={isActive}
        />
    )
}))

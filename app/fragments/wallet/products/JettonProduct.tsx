import BN from 'bn.js';
import * as React from 'react';
import { Address } from 'ton';
import { Engine } from '../../../engine/Engine';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { ProductButton } from './ProductButton';
import OldWalletIcon from '../../../../assets/ic_old_wallet.svg';

export const JettonProdcut = React.memo((props: {
    navigation: TypedNavigation,
    engine: Engine,
    jetton: {
        master: Address;
        wallet: Address;
        name: string;
        description: string;
        symbol: string;
        balance: BN;
        icon: string | null;
    },
    onLongPress?: () => void
}) => {
    return (
        <ProductButton
            key={props.jetton.master.toFriendly()}
            name={props.jetton.name}
            subtitle={props.jetton.description}
            // icon={OldWalletIcon}
            image={props.jetton.icon ? props.jetton.icon : undefined}
            value={props.jetton.balance}
            symbol={props.jetton.symbol}
            onPress={() => props.navigation.navigateSimpleTransfer({ amount: null, target: null, comment: null, jetton: props.jetton.wallet, stateInit: null, job: null, callback: null })}
            onLongPress={props.onLongPress}
            style={{ marginVertical: 4 }}
        />
    );
});
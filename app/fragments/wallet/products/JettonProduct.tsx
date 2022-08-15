import BN from 'bn.js';
import * as React from 'react';
import { Address } from 'ton';
import { Engine } from '../../../engine/Engine';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { ProductButton } from './ProductButton';

export const JettonProduct = React.memo((props: {
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
        decimals: number | null;
    },
    onPress?: () => void
    onLongPress?: () => void
}) => {
    let balance = props.jetton.balance;

    return (
        <ProductButton
            key={props.jetton.master.toFriendly()}
            name={props.jetton.name}
            subtitle={props.jetton.description}
            image={props.jetton.icon ? props.jetton.icon : undefined}
            value={balance}
            decimals={props.jetton.decimals}
            symbol={props.jetton.symbol}
            onPress={() => {
                if (props.onPress) {
                    props.onPress();
                    return;
                }
                props.navigation.navigateSimpleTransfer({ amount: null, target: null, comment: null, jetton: props.jetton.wallet, stateInit: null, job: null, callback: null })
            }}
            onLongPress={props.onLongPress}
            style={{ marginVertical: 4 }}
        />
    );
});
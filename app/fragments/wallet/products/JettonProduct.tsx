import BN from 'bn.js';
import * as React from 'react';
import { Address, fromNano, toNano } from 'ton';
import { Engine } from '../../../engine/Engine';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { ProductButton } from './ProductButton';
import OldWalletIcon from '../../../../assets/ic_old_wallet.svg';
import { warn } from '../../../utils/log';

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
        decimals: number | null;
    }
}) => {

    let balance = props.jetton.balance;
    const decimals = props.jetton.decimals ? props.jetton.decimals : undefined;
    try {
        balance = toNano(parseFloat(fromNano(balance)).toFixed(decimals));
    } catch (e) {
        warn(e);
    }

    return (
        <ProductButton
            key={props.jetton.master.toFriendly()}
            name={props.jetton.name}
            subtitle={props.jetton.description}
            // icon={OldWalletIcon}
            image={props.jetton.icon ? props.jetton.icon : undefined}
            value={balance}
            symbol={props.jetton.symbol}
            onPress={() => props.navigation.navigateSimpleTransfer({ amount: null, target: null, comment: null, jetton: props.jetton.wallet, stateInit: null, job: null, callback: null })}
            style={{ marginVertical: 4 }}
        />
    );
});
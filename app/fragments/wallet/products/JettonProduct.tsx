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
        master: string;
        wallet: string;
        name: string;
        description: string;
        symbol: string;
        balance: BN;
        image: string | null;
    }
}) => {

    // Downloaded
    let downloaded: string | null = null;
    if (props.jetton.image && props.jetton.image) {
        downloaded = props.engine.downloads.use(props.jetton.image);
    } else {
        downloaded = props.engine.downloads.use('');
    }

    return (
        <ProductButton
            key={props.jetton.master}
            name={props.jetton.name}
            subtitle={props.jetton.description}
            icon={OldWalletIcon}
            image={downloaded ? downloaded : undefined}
            value={props.jetton.balance}
            symbol={props.jetton.symbol}
            onPress={() => props.navigation.navigateSimpleTransfer({ amount: null, target: null, comment: null, jetton: Address.parse(props.jetton.wallet), stateInit: null, job: null })}
            style={{ marginVertical: 4 }}
        />
    );
});
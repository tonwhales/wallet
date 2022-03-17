import React from "react";
import { useTranslation } from "react-i18next";
import { AppConfig } from "../AppConfig";
import { ProductButton } from "../fragments/wallet/products/ProductButton";
import { getCurrentAddress } from "../storage/appState";
import { useAccount } from "../sync/Engine";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import OldWalletIcon from '../../assets/ic_old_wallet.svg';
import { Theme } from "../Theme";
import { fromNano } from "ton";

export const StakingProductComponent = React.memo(() => {
    const { t } = useTranslation();
    const [account, engine] = useAccount();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const pool = engine.products.stakingPool.useState();
    const navigation = useTypedNavigation();

    if (!pool) {
        return <></>;
    }

    const member = pool
        .members
        .find((m) => {
            return m.address
                .toFriendly({ testOnly: AppConfig.isTestnet }) === address
                    .toFriendly({ testOnly: AppConfig.isTestnet })
        });

    console.log({ member })

    return (
        <ProductButton
            name={t('products.stake.title')}
            subtitle={member
                ? parseFloat(fromNano(member.withdraw)) > 0
                    ? `${t('products.stake.withdrawStatus.ready')}: ${fromNano(member.withdraw)}`
                    : parseFloat(fromNano(member.pendingWithdraw)) > 0
                        ? `${t('products.stake.withdrawStatus.pending')}: ${fromNano(member.pendingWithdraw)}`
                        : undefined
                : t("products.stake.subtitle.join")}
            icon={OldWalletIcon}
            value={member?.balance}
            // graph={
            //     member
            //         ? {
            //             full: member.balance
            //                 .add(member.pendingDeposit)
            //                 .add(member.withdraw),
            //             values: [
            //                 {
            //                     amount: member.balance,
            //                     color: '#47A9F1'
            //                 },
            //                 {
            //                     amount: member.pendingDeposit,
            //                     color: '#F3A203'
            //                 },
            //                 {
            //                     amount: member.withdraw,
            //                     color: '#4FAE42'
            //                 },
            //             ]
            //         }
            //         : undefined
            // }
            onPress={() => navigation.navigate('Staking')}
        />
    )
})
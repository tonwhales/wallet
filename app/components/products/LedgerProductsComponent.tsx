import React, { memo } from "react"
import { View } from "react-native"
import { StakingProductComponent } from "./StakingProductComponent";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";
import { useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { PendingTransactions } from "../../fragments/wallet/views/PendingTransactions";
import { SavingsProduct } from "./SavingsProduct";

export const LedgerProductsComponent = memo(({ addr, testOnly }: { addr: string, testOnly: boolean }) => {
    const theme = useTheme();
    const address = Address.parse(addr);

    return (
        <View>
            <View style={{ backgroundColor: theme.backgroundPrimary }}>
                <PendingTransactions address={address.toString({ testOnly })} />

                <SavingsProduct
                    address={address}
                    isLedger={true}
                />

                <View style={{ marginTop: 4 }}>
                    <StakingProductComponent
                        isLedger
                        key={'pool'}
                        address={address}
                    />
                </View>
                <LedgerJettonsProductComponent
                    address={address}
                    testOnly={testOnly}
                    key={'jettons'}
                />
            </View>
        </View>
    );
});
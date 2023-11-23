import React, { memo } from "react";
import { View } from "react-native";
import { JettonProductItem } from "./JettonProductItem";
import { useMarkJettonDisabled } from "../../engine/hooks/jettons/useMarkJettonDisabled";
import { useJettons, useSelectedAccount } from "../../engine/hooks";

import IcHide from '@assets/ic-hide.svg';

export const JettonsProductComponent = memo(() => {
    const markJettonDisabled = useMarkJettonDisabled();
    const selected = useSelectedAccount();

    const jettons = useJettons(selected!.addressString);
    const visibleList = jettons.filter((j) => !j.disabled);

    return (
        <View style={{ marginBottom: visibleList.length > 0 ? 16 : 0 }}>
            {visibleList.map((j, index) => {
                return (
                    <JettonProductItem
                        key={'jt' + j.wallet.toString()}
                        jetton={j}
                        first={index === 0}
                        last={index === visibleList.length - 1}
                        rightAction={() => markJettonDisabled(j.master)}
                        rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                        single={visibleList.length === 1}
                    />
                )
            })}
        </View>
    );
});
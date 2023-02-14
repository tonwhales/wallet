import React from "react";
import { fromNano } from "ton";
import { Lockup } from "../../engine/metadata/Metadata";
import { formatDate } from "../../utils/dates";
import { ItemDivider } from "../ItemDivider";
import { ItemGroup } from "../ItemGroup";
import { ItemLarge } from "../ItemLarge";

export const RestrictedComponent = React.memo(({ lockup }: { lockup: Lockup }) => {
    const restricted = React.useMemo(() => {
        return lockup.restricted ? Array.from(lockup.restricted, ([key, value]) => {
            return {
                key,
                value
            }
        }).map((item, index, it) => {
            return (
                <>
                    <ItemLarge
                        key={item.key + item.value}
                        title={'Restricted until: ' + formatDate(parseInt(item.key))}
                        text={`${fromNano(item.value)} TON`}
                    />
                    {index < it.length - 1 && <ItemDivider />}
                </>
            )
        }) : [];
    }, [lockup]);

    return (
        <>
            <ItemGroup style={{ marginVertical: 8, marginHorizontal: 16 }}>
                {restricted}
            </ItemGroup>
        </>
    );
});
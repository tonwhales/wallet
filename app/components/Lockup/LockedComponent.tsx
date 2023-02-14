import React from "react";
import { fromNano } from "ton";
import { Lockup } from "../../engine/metadata/Metadata";
import { formatDate } from "../../utils/dates";
import { ItemDivider } from "../ItemDivider";
import { ItemGroup } from "../ItemGroup";
import { ItemLarge } from "../ItemLarge";

export const LockedComponent = React.memo(({ lockup }: { lockup: Lockup }) => {
    const locked = React.useMemo(() => {
        return lockup.locked ? Array.from(lockup.locked, ([key, value]) => {
            return {
                key,
                value
            }
        }).map((item, index, it) => {
            return (
                <>
                    <ItemLarge
                        key={item.key + item.value}
                        title={'Locked until: ' + formatDate(parseInt(item.key))}
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
                {locked}
            </ItemGroup>
        </>
    );
});
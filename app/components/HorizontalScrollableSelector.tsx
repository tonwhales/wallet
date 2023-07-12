import React, { useEffect, useRef } from "react"
import { ScrollView } from "react-native"
import { useAppConfig } from "../utils/AppConfigContext"
import { PressableChip } from "../PressableChip";

export const HorizontalScrollableSelector = React.memo(({ items, current, onSeleted }: { items: { title: string }[], current: number, onSeleted: (index: number) => void }) => {
    const { Theme } = useAppConfig();
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ x: current * 100, animated: true });
        }
    }, [current]);

    return (
        <ScrollView
            ref={scrollRef}
            style={{ width: '100%', height: 28 }}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingLeft: 16 }}
        >
            {items.map((item, index) => {
                return (
                    <PressableChip
                        key={`selector-item-${index}`}
                        onPress={() => onSeleted(index)}
                        style={{ backgroundColor: current === index ? Theme.accent : Theme.lightGrey, }}
                        textStyle={{ color: current === index ? 'white' : Theme.textColor, }}
                        text={item.title}
                    />
                )
            })}
        </ScrollView>
    )
})
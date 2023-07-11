import React, { useEffect, useRef } from "react"
import { Pressable, ScrollView, Text } from "react-native"
import { useAppConfig } from "../utils/AppConfigContext"

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
                    <Pressable
                        key={`selector-item-${index}`}
                        style={{
                            backgroundColor: current === index ? Theme.accent : Theme.lightGrey,
                            marginRight: 8,
                            paddingHorizontal: 17, paddingVertical: 4,
                            borderRadius: 20,
                            height: 28
                        }}
                        onPress={() => onSeleted(index)}
                    >
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 15, lineHeight: 20,
                            textAlign: 'center', textAlignVertical: 'center',
                            color: current === index ? 'white' : Theme.textColor,
                        }}>
                            {item.title}
                        </Text>
                    </Pressable>
                )
            })}
        </ScrollView>
    )
})
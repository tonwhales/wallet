import React from "react"
import { Pressable, ScrollView, Text } from "react-native"
import { useAppConfig } from "../utils/AppConfigContext"

export const HorizontalScrollableSelector = React.memo(({ items, current, onSeleted }: { items: { title: string }[], current: number, onSeleted: (index: number) => void }) => {
    const { Theme } = useAppConfig();

    return (
        <ScrollView
            style={{ width: '100%', marginLeft: 16, height: 28 }}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', height: 28 }}
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
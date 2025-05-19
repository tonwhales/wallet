import { useTheme } from "../engine/hooks/theme";
import { PerfText } from "./basic/PerfText"
import { PerfView } from "./basic/PerfView"
import { Typography } from "./styles"

export const SpamLabel = () => {
    const theme = useTheme();
    return (
        <PerfView style={{
            backgroundColor: theme.backgroundPrimaryInverted,
            justifyContent: 'center',
            borderRadius: 100,
            paddingHorizontal: 5,
            marginLeft: 10,
            height: 15,
        }}>
            <PerfText
                style={[
                    { color: theme.textPrimaryInverted },
                    Typography.medium10_12
                ]}
            >
                {'SPAM'}
            </PerfText>
        </PerfView>
    )
}
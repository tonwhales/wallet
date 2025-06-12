# Open the deeplinks in simulators
urls=(
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&bin=te6ccgEBAQEANwAAaV0r640BleSq4Ql3m5OrdlSApYTNRMdDGUFXwTpwZ1oe1G8cPlS_Zym8CwoAdO4mWSned-Fg"
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&exp=174000000"
    "ton://transfer/subbotin.ton?amount=1"
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&bin=te6ccgEBAQEANwAAaV0r640BleSq4Ql3m5OrdlSApYTNRMdDGUFXwTpwZ1oe1G8cPlS_Zym8CwoAdO4mWSned-Fg"
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&exp=1796015245"
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w\=\="
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&text=test"
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&text=test"
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w\=\=&bin=te6ccgEBAQEANwAAaV0r640BleSq4Ql3m5OrdlSApYTNRMdDGUFXwTpwZ1oe1G8cPlS_Zym8CwoAdO4mWSned-Fg"
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w\=\=&text=test"
    "ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&text=test&bin=te6ccgEBAQEANwAAaV0r640BleSq4Ql3m5OrdlSApYTNRMdDGUFXwTpwZ1oe1G8cPlS_Zym8CwoAdO4mWSned-Fg"
)

expcted=(
    "transfer goes through. opcode 0x5d2beb8d visible in tonviewer"
    "transfer doesn't go through and throws an error"
    "sends 1 nanotone"
    "sends micro usdt to subbotin"
    "sends 1 micro usdt and transfer has Call: 0x5d2beb8d"
    "sends 1 nanotone to subbotin"
    "message with non-empty init (init field: b5ee9c....)"
    "1 micro usdt to subbotin with text comment test"
    "message with comment test"
    "message with opcode 0x5d2beb8d and non-empty init (init field: b5ee9c....)"
    "message with comment test and non-empty init (init field: b5ee9c....)"
    "should throw an error"
)

link_number=$1
platform=$2

# Validate parameters
if [ -z "$link_number" ] || [ -z "$platform" ]; then
    echo "Usage: $0 <link_number> <platform>"
    echo "  link_number: Index of URL to test (1-${#urls[@]})"
    echo "  platform: ios or android"
    exit 1
fi

# Validate link number
if [ "$link_number" -lt 1 ] || [ "$link_number" -gt ${#urls[@]} ]; then
    echo "Error: link_number must be between 1 and ${#urls[@]}"
    exit 1
fi

# Validate platform
if [ "$platform" != "ios" ] && [ "$platform" != "android" ]; then
    echo "Error: platform must be 'ios' or 'android'"
    exit 1
fi

# Get the URL (arrays are 0-indexed, so subtract 1)
url_index=$((link_number - 1))
selected_url="${urls[$url_index]}"

echo "Testing URL $link_number on $platform:"
echo "$selected_url"
echo "Expected: ${expcted[$url_index]}"

# Open URL based on platform
if [ "$platform" = "ios" ]; then
    xcrun simctl openurl booted "$selected_url"
elif [ "$platform" = "android" ]; then
    adb shell am start -W -a android.intent.action.VIEW -d "$selected_url"
fi
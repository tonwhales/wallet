#!/bin/sh

set -e

echo "===== Passing down env variables ====="

# for future reference
# https://developer.apple.com/documentation/xcode/environment-variable-reference

cd ../wallet

# Ensure the AppsFlyer Key environment variable is set
if [ -z "$APPSFLYER_KEY" ]; then
    echo "Error: APPSFLYER_KEY environment variable is not set."
    exit 1
fi

# Replace the AppsFlyer key in the keys.json file
line="YOUR_APPSFLYER_KEY"
rep="$APPSFLYER_KEY"

cd ../../../repository

sed -i '' "s/$line/$rep/g" assets/keys.json

# go back to the ios folder
cd ios/wallet

echo "===== Evn variables replaced ====="

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
export HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK=TRUE
# brew install cocoapods
# CocoaPods 1.15.0 is unstable, so we have to use 1.14.3 as prev stable
# brew doesn't have version pinning for cocoapods, so we have to install it manually from the commit
echo "===== Uninstalling prev cocoapods ====="
brew uninstall --ignore-dependencies cocoapods || true
# echo "===== Downloading formula ====="
# curl https://raw.githubusercontent.com/Homebrew/homebrew-core/1364b74ebeedb2eab300d62c99e12f2a6f344277/Formula/c/cocoapods.rb > cocoapods.rb
# echo "===== Installing formula ====="
# brew install cocoapods.rb
echo "===== Installing  cocoapods====="
brew install cocoapods

echo "===== Installing node ====="
# have to add node yourself
brew install node@18
# link it to the path
echo "===== Linking node ====="
brew link node@18

echo "===== Installing Yarn ====="
brew install yarn

# Install dependencies you manage with CocoaPods.
echo "===== Generating node_modules ====="
yarn
echo "===== Installing pods ====="
PRODUCTION=1 pod install
# the sed command from RN cant find the file... so we have to run it ourselves
sed -i -e  $'s/ && (__IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_10_0)//' /Volumes/workspace/repository/ios/Pods/RCT-Folly/folly/portability/Time.h
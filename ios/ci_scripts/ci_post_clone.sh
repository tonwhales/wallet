#!/bin/sh

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
# brew install cocoapods
# CocoaPods 1.15.0 is unstable, so we have to use 1.14.3 as prev stable
# brew doesn't have version pinning for cocoapods, so we have to install it manually from the commit
curl https://raw.githubusercontent.com/Homebrew/homebrew-core/1364b74ebeedb2eab300d62c99e12f2a6f344277/Formula/c/cocoapods.rb > cocoapods.rb
brew install cocoapods.rb
# have to add node yourself
brew install node@18
# link it to the path
brew link node@18

brew install yarn

# Install dependencies you manage with CocoaPods.
yarn
pod install
# the sed command from RN cant find the file... so we have to run it ourselves
sed -i -e  $'s/ && (__IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_10_0)//' /Volumes/workspace/repository/ios/Pods/RCT-Folly/folly/portability/Time.h
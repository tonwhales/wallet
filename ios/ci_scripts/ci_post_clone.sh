#!/bin/sh

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
# brew install cocoapods
# CocoaPods 1.15.0 is unstable, so we have to use 1.14.3 as prev stable
gem install cocoapods -v 1.14.3
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
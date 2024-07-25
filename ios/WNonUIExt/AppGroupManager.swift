//
//  AppGroupManager.swift
//  WNonUIExt
//
//  Created by VZ on 25/7/24.
//

import Foundation

let appGroupID: String = "group.com.tonhub.extensionsappgroup"
let appGroupSharedContainerDirectory: URL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID)!
let appGroupSharedDefaults: UserDefaults = UserDefaults(suiteName: appGroupID)!

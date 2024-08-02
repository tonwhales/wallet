//
//  AddCardRequestHandler.swift
//  WhalesApp
//
//  Created by VZ on 1/8/24.
//

import Foundation
import React

@objc(AddCardRequestHandler)
class AddCardRequestHandler: NSObject {
    var cardId: String
    var token: String
    var resolver: RCTPromiseResolveBlock
    var rejecter: RCTPromiseRejectBlock
    var isTestnet: Bool

    @objc
    init(resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock, cardId: String, token: String, isTestnet: Bool) {
        self.cardId = cardId
        self.token = token
        self.resolver = resolver
        self.rejecter = rejecter
        self.isTestnet = isTestnet
    }
}

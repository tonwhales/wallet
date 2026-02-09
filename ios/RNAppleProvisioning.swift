//
//  RNAppleProvisioning.swift
//  WhalesApp
//

import Foundation
import PassKit
import React

@objc(RNAppleProvisioning)
class RNAppleProvisioning: NSObject, RCTBridgeModule, PKAddPaymentPassViewControllerDelegate {
  var currentRequest: AddCardRequestHandler?
  var passLibrary: PKPassLibrary?
  var watchSession: WatchConnectivitySession?
  
  override init() {
    super.init()
    self.passLibrary = PKPassLibrary()
    self.watchSession = WatchConnectivitySession.shared
  }
  
  static func moduleName() -> String! {
    return "RNAppleProvisioning"
  }
  
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func canAddCards(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // check if we are on iPad
    let isIPAD = UIDevice.current.model.hasPrefix("iPad")
    let canAddPaymentPass = PKAddPaymentPassViewController.canAddPaymentPass()
    
    if isIPAD {
      resolve(canAddPaymentPass)
      return
    }
    
    if !PKAddPassesViewController.canAddPasses() || !canAddPaymentPass {
      resolve(false)
    } else {
      resolve(true)
    }
  }
  
  @objc
  func checkIfCardIsAlreadyAdded(_ suff: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if (passLibrary == nil) {
      passLibrary = PKPassLibrary()
    }
    
    if (watchSession == nil) {
      watchSession = WatchConnectivitySession.shared
    }
    
    let isAddedToAllDevices = cardIsAlreadyAdded(suff: suff, library: passLibrary!, watchSession: watchSession!)
    
    resolve(isAddedToAllDevices)
  }

  @objc
  func checkIfCardsAreAdded(_ cardIds: [String], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if (passLibrary == nil) {
      passLibrary = PKPassLibrary()
    }

    var result = [String: Bool]()
    for cardId in cardIds {
      result[cardId] = cardIsAlreadyAdded(suff: cardId, library: passLibrary!, watchSession: watchSession!)
    }

    resolve(result)
  }

  @objc
  func canAddCard(_ cardIdentifier: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if (passLibrary == nil) {
      passLibrary = PKPassLibrary()
    }
    resolve(passLibrary!.canAddPaymentPass(withPrimaryAccountIdentifier: cardIdentifier))
  }
  
  @objc
  func addCardToWallet(_ cardDetails: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard currentRequest == nil else {
      reject("error", "Another request is being processed", nil)
      return
    }
    
    guard let cardId = cardDetails["cardId"] as? String,
          let token = cardDetails["token"] as? String,
          let isTestnet = cardDetails["isTestnet"] as? Bool else {
      reject("error", "Missing required card details (cardId, token, or isTestnet)", nil)
      return
    }
    
    currentRequest = AddCardRequestHandler(resolver: resolve, rejecter: reject, cardId: cardId, token: token, isTestnet: isTestnet)
    
    guard let config = PKAddPaymentPassRequestConfiguration(encryptionScheme: .ECC_V2) else {
      reject("error", "Unable to create PKAddPaymentPassRequestConfiguration", nil)
      return
    }
    
    config.primaryAccountSuffix = cardDetails["primaryAccountNumberSuffix"] as? String
    config.cardholderName = cardDetails["cardholderName"] as? String
    config.style = .payment
    
    // to distinguish between cards on different devices
    let library = PKPassLibrary()
    let primaryAccountIdentifier = getPrimaryAccountIdentifier(library: library,suff: cardDetails["primaryAccountNumberSuffix"] as? String)
    if (primaryAccountIdentifier != nil) {
      config.primaryAccountIdentifier = primaryAccountIdentifier
    }
    
    guard let paymentPassVC = PKAddPaymentPassViewController(requestConfiguration: config, delegate: self) else {
      reject("error", "Unable to create PKAddPaymentPassViewController", nil)
      return
    }
    
    DispatchQueue.main.async {
      if let rootViewController = UIApplication.shared.delegate?.window??.rootViewController {
        rootViewController.present(paymentPassVC, animated: true, completion: nil)
      }
    }
  }
  
  func addPaymentPassViewController(_ controller: PKAddPaymentPassViewController, generateRequestWithCertificateChain certificates: [Data], nonce: Data, nonceSignature: Data, completionHandler: @escaping (PKAddPaymentPassRequest) -> Void) {
    guard let req = currentRequest else {
      completionHandler(PKAddPaymentPassRequest())
      return
    }
    let cardRequest = AddCardRequest(cardId: req.cardId, token: req.token, isTestnet: req.isTestnet)
    
    sendDataToServerForEncryption(cardRequest: cardRequest, certificates: certificates, nonce: nonce, nonceSignature: nonceSignature) { response, error in
      guard let response = response, error == nil else {
        completionHandler(PKAddPaymentPassRequest())
        return
      }
      
      guard let resData = response["data"] as? [String: Any] else {
        completionHandler(PKAddPaymentPassRequest())
        return
      }
      
      guard let encryptedData = resData["encryptedData"] as? String,
            let activationData = resData["activationData"] as? String,
            let ephemeralPublicKey = resData["ephemeralPublicKey"] as? String else {
        completionHandler(PKAddPaymentPassRequest())
        return
      }
      
      let addRequest = PKAddPaymentPassRequest()
      addRequest.encryptedPassData = Data(base64Encoded: encryptedData)
      addRequest.activationData = Data(base64Encoded: activationData)
      addRequest.ephemeralPublicKey = Data(base64Encoded: ephemeralPublicKey)
      
      completionHandler(addRequest)
    }
  }
  
  func addPaymentPassViewController(_ controller: PKAddPaymentPassViewController, didFinishAdding pass: PKPaymentPass?, error: Error?) {
    if pass != nil {
      print("Card added successfully")
      currentRequest?.resolver(true)
    } else {
      currentRequest?.resolver(false)
    }
    currentRequest = nil
    controller.dismiss(animated: true, completion: nil)
  }
  
  @objc
  func getCredentials(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if (passLibrary == nil) {
      passLibrary = PKPassLibrary()
    }
    // map each credential to a dictionary so it can be serialized for JS
    let credentials = getProvisioningCredentials(passLibrary: passLibrary!).map { credential in
      return [
        "identifier": credential.identifier,
        "label": credential.label,
        "cardholderName": credential.cardholderName,
        "token": credential.token,
        "address": credential.address,
        "primaryAccountSuffix": credential.primaryAccountSuffix,
        "isTestnet": credential.isTestnet ?? false,
        "assetName": credential.assetName as Any,
        "assetUrl": credential.assetUrl as Any
      ]
    }
    
    resolve(credentials)
  }
  
  @objc
  func setCredentialsInGroupUserDefaults(_ data: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    var credsDict = [String: ProvisioningCredential]()
    
    for (key, value) in data {
      guard let credDict = value as? [String: Any],
            let identifier = credDict["identifier"] as? String,
            let label = credDict["label"] as? String,
            let cardholderName = credDict["cardholderName"] as? String,
            let token = credDict["token"] as? String,
            let address = credDict["address"] as? String,
            let primaryAccountSuffix = credDict["primaryAccountSuffix"] as? String else {
        reject("error", "Invalid credential data for key: \(key)", nil)
        return
      }
      
      let credential = ProvisioningCredential(
        identifier: identifier,
        label: label,
        cardholderName: cardholderName,
        token: token,
        address: address,
        primaryAccountSuffix: primaryAccountSuffix,
        isTestnet: credDict["isTestnet"] as? Bool,
        assetName: credDict["assetName"] as? String,
        assetUrl: credDict["assetUrl"] as? String
      )
      credsDict[key] = credential
    }
    
    setProvisioningCredentials(credentials: credsDict)
    resolve(true)
  }
  
  @objc
  func getGroupUserDefaults(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let appGroupSharedDefaults = getUserDefaultsDict()
    resolve(appGroupSharedDefaults)
  }
  
  @objc
  func getShouldRequireAuthenticationForAppleWallet(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let shouldRequireAuthentication = shouldRequireAuthenticationForAppleWallet()
    resolve(shouldRequireAuthentication)
  }
  
  @objc
  func setShouldRequireAuthenticationForAppleWallet(_ shouldRequireAuthentication: Bool, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    setShouldRequireAuthentication(shouldRequireAuthentication: shouldRequireAuthentication)
    resolve(true)
  }
  
  @objc
  func getExtensionData(_ key: String, resolver resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let dataString = getExtensionDevData(key: key)
    resolve(dataString)
  }
  
  @objc
  func setExtensionData(_ key: String, dict: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    storeExtensionDevData(key: key, dict: dict)
    resolve(true)
  }
}

//
//  RNAppleProvisioning.swift
//  WhalesApp
//
//  Created by VZ on 1/8/24.
//

import Foundation
import PassKit
import React

@objc(ProvisioningCredential)
class ProvisioningCredential: NSObject {
  @objc var identifier: String = ""
  @objc var label: String = ""
  @objc var cardholderName: String = ""
  @objc var token: String = ""
  @objc var primaryAccountSuffix: String = ""
  @objc var isTestnet: NSNumber?
  @objc var assetName: String?
  @objc var assetUrl: String?
}

@objc(RNAppleProvisioning)
class RNAppleProvisioning: NSObject, RCTBridgeModule, PKAddPaymentPassViewControllerDelegate {
  var currentRequest: AddCardRequestHandler?
  
  static func moduleName() -> String! {
    return "RNAppleProvisioning"
  }
  
  @objc
  func canAddCards(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if !PKAddPassesViewController.canAddPasses() || !PKAddPaymentPassViewController.canAddPaymentPass() {
      resolve(false)
    } else {
      resolve(true)
    }
  }
  
  @objc
  func checkIfCardIsAlreadyAdded(_ primaryAccountNumberSuffix: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let library = PKPassLibrary()
    let passes = library.passes(of: .payment)
    var cardExists = false
    
    if #available(iOS 13.4, *) {
      for pass in passes {
        if let paymentPass = pass as? PKSecureElementPass, paymentPass.primaryAccountNumberSuffix == primaryAccountNumberSuffix {
          cardExists = true
          break
        }
      }
    } else {
      for pass in passes {
        if let paymentPass = pass as? PKPaymentPass, paymentPass.primaryAccountNumberSuffix == primaryAccountNumberSuffix {
          cardExists = true
          break
        }
      }
    }
    
    resolve(cardExists)
  }
  
  @objc
  func canAddCard(_ cardIdentifier: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let library = PKPassLibrary()
    resolve(library.canAddPaymentPass(withPrimaryAccountIdentifier: cardIdentifier))
  }
  
  @objc
  func addCardToWallet(_ cardDetails: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard currentRequest == nil else {
      reject("error", "Another request is being processed", nil)
      return
    }
    
    currentRequest = AddCardRequestHandler(resolver: resolve, rejecter: reject, cardId: cardDetails["cardId"] as! String, token: cardDetails["token"] as! String, network: cardDetails["network"] as! String)

    guard let config = PKAddPaymentPassRequestConfiguration(encryptionScheme: .ECC_V2) else {
      reject("error", "Unable to create PKAddPaymentPassRequestConfiguration", nil)
      return
    }

    config.primaryAccountSuffix = cardDetails["primaryAccountSuffix"] as? String
    config.cardholderName = cardDetails["cardholderName"] as? String
    config.style = .payment
    
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
  
  func sendDataToServerForEncryption(certificates: [Data], nonce: Data, nonceSignature: Data, completion: @escaping ([String: Any]?, Error?) -> Void) {
    guard let currentRequest = currentRequest else { return }
    
    let network = currentRequest.network
    let isTest = network == "test"
    let base = isTest ? "https://card-staging.whales-api.com" : "https://card-prod.whales-api.com"
    let baseUrl = "\(base)/v2/card/get/apple/provisioning/data"
    guard let url = URL(string: baseUrl) else { return }
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let certificatesStrings = certificates.map { $0.base64EncodedString() }
    let nonceString = nonce.base64EncodedString()
    let nonceSignatureString = nonceSignature.base64EncodedString()
    
    let params: [String: Any] = ["certificates": certificatesStrings, "nonce": nonceString, "nonceSignature": nonceSignatureString]
    let postData: [String: Any] = ["params": params, "token": currentRequest.token, "id": currentRequest.cardId]
    
    do {
      let postDataJSON = try JSONSerialization.data(withJSONObject: postData, options: [])
      request.httpBody = postDataJSON
    } catch {
      completion(nil, error)
      return
    }
    
    let dataTask = URLSession.shared.dataTask(with: request) { data, response, error in
      if let error = error {
        completion(nil, error)
        return
      }
      if let data = data, let responseJSON = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
        completion(responseJSON, nil)
      }
    }
    dataTask.resume()
  }
  
  func addPaymentPassViewController(_ controller: PKAddPaymentPassViewController, generateRequestWithCertificateChain certificates: [Data], nonce: Data, nonceSignature: Data, completionHandler: @escaping (PKAddPaymentPassRequest) -> Void) {
    sendDataToServerForEncryption(certificates: certificates, nonce: nonce, nonceSignature: nonceSignature) { response, error in
      guard let response = response, error == nil else {
        completionHandler(PKAddPaymentPassRequest())
        return
      }
      
      guard let encryptedData = response["data"] as? String,
            let activationData = response["activationData"] as? String,
            let ephemeralPublicKey = response["ephemeralPublicKey"] as? String else {
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
    if let pass = pass {
      currentRequest?.resolver(true)
    } else {
      currentRequest?.resolver(false)
    }
    currentRequest = nil
    controller.dismiss(animated: true, completion: nil)
  }
  
  @objc
  func getCredentials(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let provisioningCredentials = getProvisioningCredentials()
    let credentials = provisioningCredentials.map { credential in
      return [
        "identifier": credential.identifier,
        "label": credential.label,
        "token": credential.token,
        "primaryAccountSuffix": credential.primaryAccountSuffix,
        "cardholderName": credential.cardholderName,
        "isTestnet": credential.isTestnet?.boolValue ?? false,
        "assetName": credential.assetName ?? "",
        "assetUrl": credential.assetUrl ?? ""
      ]
    }
    resolve(credentials)
  }
  
  func getProvisioningCredentials() -> [ProvisioningCredential] {
    let appGroupID = "group.4CFQ3FG324.com.tonhub.app"
    let appGroupSharedDefaults = UserDefaults(suiteName: appGroupID)
    let cachedCredentialsData = appGroupSharedDefaults?.dictionary(forKey: "PaymentPassCredentials")
    var provisioningCredentials = [ProvisioningCredential]()
    
    cachedCredentialsData?.values.forEach { credentialDict in
      if let credentialDict = credentialDict as? [String: Any] {
        let credential = ProvisioningCredential()
        credential.identifier = credentialDict["identifier"] as? String ?? ""
        credential.label = credentialDict["label"] as? String ?? ""
        credential.token = credentialDict["token"] as? String ?? ""
        credential.primaryAccountSuffix = credentialDict["primaryAccountSuffix"] as? String ?? ""
        credential.cardholderName = credentialDict["cardholderName"] as? String ?? ""
        credential.isTestnet = credentialDict["isTestnet"] as? NSNumber
        credential.assetName = credentialDict["assetName"] as? String
        credential.assetUrl = credentialDict["assetUrl"] as? String
        provisioningCredentials.append(credential)
      }
    }
    
    return provisioningCredentials
  }
  
  @objc
  func setCredentialsInGroupUserDefaults(_ data: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let appGroupID = "group.4CFQ3FG324.com.tonhub.app"
    let appGroupSharedDefaults = UserDefaults(suiteName: appGroupID)
    appGroupSharedDefaults?.set(data, forKey: "PaymentPassCredentials")
    appGroupSharedDefaults?.synchronize()
    resolve(true)
  }
  
  @available(iOS 14.0, *)
  @objc
  func status(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let status = PKIssuerProvisioningExtensionStatus()
    let library = PKPassLibrary()
    let paymentPassLibrary = library.passes(of: .payment)
    var passIdentifiers = Set<String>()
    var remotePassIdentifiers = Set<String>()
    var availablePassesForIphone = 0
    var availableRemotePassesForAppleWatch = 0
    
    for pass in paymentPassLibrary {
      if let suff = pass.secureElementPass?.primaryAccountNumberSuffix {
        if pass.isRemotePass && pass.deviceName.localizedCaseInsensitiveContains("Apple Watch") {
          remotePassIdentifiers.insert(suff)
        } else if !pass.isRemotePass {
          passIdentifiers.insert(suff)
        }
      }
    }
    
    let cachedCredentials = getProvisioningCredentials()
    for credential in cachedCredentials {
      if !passIdentifiers.contains(credential.primaryAccountSuffix) {
        availablePassesForIphone += 1
      }
      if !remotePassIdentifiers.contains(credential.primaryAccountSuffix) {
        availableRemotePassesForAppleWatch += 1
      }
    }
    
    status.passEntriesAvailable = availablePassesForIphone > 0
    status.remotePassEntriesAvailable = availableRemotePassesForAppleWatch > 0
    
    let appGroupSharedDefaults = UserDefaults(suiteName: "group.4CFQ3FG324.com.tonhub.app")
    status.requiresAuthentication = appGroupSharedDefaults?.bool(forKey: "ShouldRequireAuthenticationForAppleWallet") ?? false
    
    resolve([
      "passEntriesAvailable": status.passEntriesAvailable,
      "remotePassEntriesAvailable": status.remotePassEntriesAvailable,
      "requiresAuthentication": status.requiresAuthentication
    ])
  }
  
  @objc
  func getGroupUserDefaults(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let appGroupID = "group.4CFQ3FG324.com.tonhub.app"
    let appGroupSharedDefaults = UserDefaults(suiteName: appGroupID)
    let groupUserDefaults = appGroupSharedDefaults?.dictionaryRepresentation() ?? [:]
    resolve(groupUserDefaults)
  }
  
  @objc
  func getShouldRequireAuthenticationForAppleWallet(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let appGroupID = "group.4CFQ3FG324.com.tonhub.app"
    let appGroupSharedDefaults = UserDefaults(suiteName: appGroupID)
    let shouldRequireAuthentication = appGroupSharedDefaults?.bool(forKey: "ShouldRequireAuthenticationForAppleWallet") ?? false
    resolve(shouldRequireAuthentication)
  }
  
  @objc
  func setShouldRequireAuthenticationForAppleWallet(_ shouldRequireAuthentication: Bool, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let appGroupID = "group.4CFQ3FG324.com.tonhub.app"
    let appGroupSharedDefaults = UserDefaults(suiteName: appGroupID)
    appGroupSharedDefaults?.set(shouldRequireAuthentication, forKey: "ShouldRequireAuthenticationForAppleWallet")
    appGroupSharedDefaults?.synchronize()
    resolve(true)
  }
}

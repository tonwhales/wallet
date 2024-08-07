//
//  RNAppleProvisioning.swift
//  WhalesApp
//
//  Created by VZ on 1/8/24.
//

import Foundation
import PassKit
import React

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
  func checkIfCardIsAlreadyAdded(_ suff: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let library = PKPassLibrary()

    var cardAdded = false
    
    if #available(iOS 13.4, *) {
      let passes = library.passes()
      let remotePasses = library.remoteSecureElementPasses

      if (remotePasses.count > 0) {
        var cardAddedToWatch = false
        for pass in remotePasses {
          print("remote pass suffix: \(pass.primaryAccountNumberSuffix), suff: \(suff)")
          
          if (pass.primaryAccountNumberSuffix == suff) {
            cardAddedToWatch = true
            break
          }
        }

        for pass in passes {
          print("pass suffix: \(String(describing: pass.secureElementPass?.primaryAccountNumberSuffix)), suff: \(suff)")
          if (pass.secureElementPass?.primaryAccountNumberSuffix == suff) {
            cardAdded = true
            break
          }
        }

        resolve(cardAdded && cardAddedToWatch)
        return
      } else {
        for pass in passes {
          print("pass suffix: \(pass.secureElementPass?.primaryAccountNumberSuffix), suff: \(suff)")
          if (pass.secureElementPass?.primaryAccountNumberSuffix == suff ){
            resolve(true)
            break
          }
        }
      }
    } else {
      let passes = library.passes(of: .payment)
      let remotePasses = library.remotePaymentPasses()

      if (remotePasses.count > 0) {
        var cardAddedToWatch = false
        for pass in remotePasses {
          if (pass.primaryAccountNumberSuffix == suff) {
            cardAddedToWatch = true
            break
          }
        }

        for pass in passes {
          if (pass.paymentPass?.primaryAccountNumberSuffix == suff) {
            cardAdded = true
            break
          }
        }

        resolve(cardAdded && cardAddedToWatch)
        return
      } else {
        for pass in passes {
          if let paymentPass = pass as? PKPaymentPass, paymentPass.primaryAccountNumberSuffix == suff {
            resolve(true)
            break
          }
        }
      }
    }
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
    
    currentRequest = AddCardRequestHandler(resolver: resolve, rejecter: reject, cardId: cardDetails["cardId"] as! String, token: cardDetails["token"] as! String, isTestnet: cardDetails["isTestnet"] as! Bool)
    
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
    // map each credential to a dictionary so it can be serialized for JS
    let credentials = getProvisioningCredentials().map { credential in
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
      let credDict = value as! [String: Any]
      let credential = ProvisioningCredential(
        identifier: credDict["identifier"] as! String,
        label: credDict["label"] as! String,
        cardholderName: credDict["cardholderName"] as! String,
        token: credDict["token"] as! String,
        address: credDict["address"] as! String,
        primaryAccountSuffix: credDict["primaryAccountSuffix"] as! String,
        isTestnet: credDict["isTestnet"] as? Bool,
        assetName: credDict["assetName"] as? String,
        assetUrl: credDict["assetUrl"] as? String
      )
      credsDict[key] = credential
    }
    
    setProvisioningCredentials(credentials: credsDict)
    resolve(true)
  }
  
  @available(iOS 14.0, *)
  @objc
  func getStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let library = PKPassLibrary()
    let watchSession = WatchConnectivitySession.shared
    paymentPassStatus(passLibrary: library, watchSession: watchSession) { status in
      resolve(
        [
          "passEntriesAvailable": status.passEntriesAvailable,
          "remotePassEntriesAvailable": status.remotePassEntriesAvailable,
          "requiresAuthentication": status.requiresAuthentication,
          "isPaired": watchSession.isPaired,
        ]
      )
    }
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

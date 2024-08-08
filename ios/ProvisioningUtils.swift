//
//  ProvisioningUtils.swift
//  wallet
//
//  Created by VZ on 1/8/24.
//

import Foundation
import PassKit

struct ProvisioningCredential {
  let identifier: String
  let label: String
  let cardholderName: String
  let token: String
  let address: String
  let primaryAccountSuffix: String
  let isTestnet: Bool?
  let assetName: String?
  let assetUrl: String?
}

struct EncryptedPassDataResponse {
  let activationData: Data
  let encryptedPassData: Data
  let ephemeralPublicKey: Data
}

struct EncryptedPassDataRequest: Codable {
  let certificates: [String]
  let nonce: String
  let nonceSignature: String
}

struct AddCardRequest {
  let cardId: String
  let token: String
  let isTestnet: Bool
}

func sendDataToServerForEncryption(cardRequest: AddCardRequest, certificates: [Data], nonce: Data, nonceSignature: Data, completion: @escaping ([String: Any]?, Error?) -> Void) {
  let base = cardRequest.isTestnet ? "https://card-staging.whales-api.com" : "https://card-prod.whales-api.com"
  let baseUrl = "\(base)/v2/card/get/apple/provisioning/data"
  guard let url = URL(string: baseUrl) else {
    completion(nil, NSError(domain: "RNAppleProvisioning", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
    return
  }
  
  var request = URLRequest(url: url)
  request.httpMethod = "POST"
  request.setValue("application/json", forHTTPHeaderField: "Content-Type")
  
  let certificatesStrings = certificates.map { $0.base64EncodedString() }
  let nonceString = nonce.base64EncodedString()
  let nonceSignatureString = nonceSignature.base64EncodedString()
  
  let params: [String: Any] = ["certificates": certificatesStrings, "nonce": nonceString, "nonceSignature": nonceSignatureString]
  let postData: [String: Any] = ["params": params, "token": cardRequest.token, "id": cardRequest.cardId]
  
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

func getUserDefaults() -> UserDefaults? {
  let appGroupID = "group.4CFQ3FG324.com.tonhub.app"
  let appGroupSharedDefaults = UserDefaults(suiteName: appGroupID)
  return appGroupSharedDefaults
}

func getUserDefaultsDict() -> [String: Any] {
  let appGroupSharedDefaults = getUserDefaults()
  let groupUserDefaults = appGroupSharedDefaults?.dictionaryRepresentation() ?? [:]
  return groupUserDefaults
}

func shouldRequireAuthenticationForAppleWallet() -> Bool {
  let appGroupSharedDefaults = getUserDefaultsDict();
  return appGroupSharedDefaults["ShouldRequireAuthenticationForAppleWallet"] as? Bool ?? false
}

func setShouldRequireAuthentication(shouldRequireAuthentication: Bool) {
  let appGroupSharedDefaults = getUserDefaults()
  appGroupSharedDefaults?.set(shouldRequireAuthentication, forKey: "ShouldRequireAuthenticationForAppleWallet")
  appGroupSharedDefaults?.synchronize()
}

func getProvisioningCredentials(passLibrary: PKPassLibrary) -> [ProvisioningCredential] {
  let appGroupSharedDefaults = getUserDefaultsDict()
  let cachedCredentialsData = appGroupSharedDefaults["PaymentPassCredentials"] as? String
  
  var provisioningCredentials = [ProvisioningCredential]()
  
  // try parsing json to creds
  if let data = cachedCredentialsData?.data(using: .utf8) {
    do {
      let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: [String: Any]]
      json?.forEach { (key, credentialDict) in
        let suff = credentialDict["primaryAccountSuffix"] as? String
        let cardholderName = credentialDict["cardholderName"] as? String
        
        guard suff != nil && cardholderName != nil else {
          return
        }
        
        let credential = ProvisioningCredential(
          identifier: credentialDict["identifier"] as? String ?? "",
          label: credentialDict["label"] as? String ?? "",
          cardholderName: cardholderName!,
          token: credentialDict["token"] as? String ?? "",
          address: credentialDict["address"] as? String ?? "",
          primaryAccountSuffix: suff!,
          isTestnet: credentialDict["isTestnet"] as? Bool,
          assetName: credentialDict["assetName"] as? String,
          assetUrl: credentialDict["assetUrl"] as? String
        )
        
        provisioningCredentials.append(credential)
      }
    } catch {
      print("Failed to decode credentials from JSON")
    }
  }
  
  return provisioningCredentials
}

func setProvisioningCredentials(credentials: [String: ProvisioningCredential]) {
  let appGroupSharedDefaults = getUserDefaults()
  
  var jsonCompatibleDict = [String: Any]()
  
  for (key, credential) in credentials {
    jsonCompatibleDict[key] = [
      "identifier": credential.identifier,
      "label": credential.label,
      "cardholderName": credential.cardholderName,
      "token": credential.token,
      "address": credential.address,
      "primaryAccountSuffix": credential.primaryAccountSuffix,
      "isTestnet": credential.isTestnet as Any,
      "assetName": credential.assetName as Any,
      "assetUrl": credential.assetUrl as Any
    ]
  }
  
  // dict -> data
  if let jsonData = try? JSONSerialization.data(withJSONObject: jsonCompatibleDict, options: []) {
    let jsonString = String(data: jsonData, encoding: .utf8)
    appGroupSharedDefaults?.set(jsonString, forKey: "PaymentPassCredentials")
    appGroupSharedDefaults?.synchronize()
  } else {
    print("Failed to encode credentials to JSON")
  }
}

struct PKPassAcc {
  let identifier: String
  let suffix: String
}

@available(iOS 13.4, *)
func getRemoteAccs(library: PKPassLibrary) -> [PKPassAcc] {
  let paymentPassLibrary = library.passes(of: .payment)
  var remoteAccs = [PKPassAcc]()
  
  for pass in paymentPassLibrary {
    if let secureElementPass = pass.secureElementPass {
      if pass.isRemotePass && pass.deviceName.localizedCaseInsensitiveContains("Apple Watch") {
        remoteAccs.append(PKPassAcc(identifier: secureElementPass.primaryAccountIdentifier, suffix: secureElementPass.primaryAccountNumberSuffix))
      }
    }
  }
  
  return remoteAccs
}

@available(iOS 13.4, *)
func getAccs(library: PKPassLibrary) -> [PKPassAcc] {
  let paymentPassLibrary = library.passes(of: .payment)
  var accs = [PKPassAcc]()
  
  for pass in paymentPassLibrary {
    if let secureElementPass = pass.secureElementPass {
      if !pass.isRemotePass {
        accs.append(PKPassAcc(identifier: secureElementPass.primaryAccountIdentifier, suffix: secureElementPass.primaryAccountNumberSuffix))
      }
    }
  }
  
  return accs
}

func getPrimaryAccountIdentifier(library: PKPassLibrary, suff: String?) -> String? {
  if (suff == nil) {
    return nil
  }
  
  if #available(iOS 13.4, *) {
    let passes = library.passes()
    let remotePasses = library.remoteSecureElementPasses
    
    for pass in passes {
      if let secureElementPass = pass.secureElementPass {
        if secureElementPass.primaryAccountNumberSuffix == suff {
          return secureElementPass.primaryAccountIdentifier
        }
      }
    }
    
    for pass in remotePasses {
      if let secureElementPass = pass.secureElementPass {
        if secureElementPass.primaryAccountNumberSuffix == suff {
          return secureElementPass.primaryAccountIdentifier
        }
      }
    }
  } else {
    let passes = library.passes(of: .payment)
    let remotePasses = library.remotePaymentPasses()
    
    for pass in passes {
      if let secureElementPass = pass.paymentPass {
        if secureElementPass.primaryAccountNumberSuffix == suff {
          return secureElementPass.primaryAccountIdentifier
        }
      }
    }
    
    for pass in remotePasses {
      if let secureElementPass = pass.paymentPass {
        if secureElementPass.primaryAccountNumberSuffix == suff {
          return secureElementPass.primaryAccountIdentifier
        }
      }
    }
  }
  
  return nil
}

func cardIsAlreadyAdded(suff: String, library: PKPassLibrary) -> Bool {
  var cardAdded = false
  var cardAddedToWatch = false
  
  if #available(iOS 13.4, *) {
    let passes = library.passes()
    let remotePasses = library.remoteSecureElementPasses
    
    if (remotePasses.count > 0) {
      for pass in remotePasses {
        if (pass.primaryAccountNumberSuffix == suff) {
          cardAddedToWatch = true
          break
        }
      }
      
      for pass in passes {
        if (pass.secureElementPass?.primaryAccountNumberSuffix == suff) {
          cardAdded = true
          break
        }
      }
      
      return cardAdded && cardAddedToWatch
    } else {
      for pass in passes {
        if (pass.secureElementPass?.primaryAccountNumberSuffix == suff ){
          return true
        }
      }
    }
  } else {
    let passes = library.passes(of: .payment)
    let remotePasses = library.remotePaymentPasses()
    
    if (remotePasses.count > 0) {
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
      
      return cardAdded && cardAddedToWatch
    } else {
      for pass in passes {
        if let paymentPass = pass as? PKPaymentPass, paymentPass.primaryAccountNumberSuffix == suff {
          return true
        }
      }
    }
  }
  
  return false
}

/**
 *  Dev checks
 */

func dictToJSONString(dict: [String: Any]) -> String? {
  if let jsonData = try? JSONSerialization.data(withJSONObject: dict, options: []) {
    return String(data: jsonData, encoding: .utf8)
  }
  return nil
}

func jsonStringToDict(jsonString: String) -> [String: Any]? {
  if let data = jsonString.data(using: .utf8) {
    return try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
  }
  return nil
}

func storeExtensionDevData(key: String, dict: [String: Any]) {
  let appGroupSharedDefaults = getUserDefaults()
  let dictString = dictToJSONString(dict: dict)
  appGroupSharedDefaults?.set(dictString, forKey: key)
  appGroupSharedDefaults?.synchronize()
}

func getExtensionDevDataDict(key: String) -> [String: Any]? {
  let appGroupSharedDefaults = getUserDefaults()
  if let jsonString = appGroupSharedDefaults?.object(forKey: key) as? String {
    return jsonStringToDict(jsonString: jsonString)
  }
  return nil
}

func getExtensionDevData(key: String) -> String? {
  let appGroupSharedDefaults = getUserDefaults()
  return appGroupSharedDefaults?.object(forKey: key) as? String
}

func clearExtensionDevData(key: String) {
  let appGroupSharedDefaults = getUserDefaults()
  appGroupSharedDefaults?.removeObject(forKey: key)
  appGroupSharedDefaults?.synchronize()
}

func storeExtensionDevDataByKey(mainKey: String, key: String, value: String) {
  var currentStateDict = getExtensionDevDataDict(key: mainKey) ?? [:]
  currentStateDict[key] = value
  storeExtensionDevData(key: mainKey, dict: currentStateDict)
}

@available(iOS 14, *)
func paymentPassStatus(passLibrary: PKPassLibrary) async -> PKIssuerProvisioningExtensionStatus {
  let passes = passLibrary.passes().map { $0.secureElementPass?.primaryAccountNumberSuffix }
  let remotePasses = passLibrary.remoteSecureElementPasses.map { $0.primaryAccountNumberSuffix }
  let status = PKIssuerProvisioningExtensionStatus()
  let passSuffixes = Set(passes)
  let remotePassSuffixes = Set(remotePasses)
  var availablePassesForIphone: Int = 0
  var availableRemotePassesForAppleWatch: Int = 0
  
  // Get cached credentials data of all of the user's issued cards,
  // within the issuer app, from the user's defaults database.
  let cachedCredentials = getProvisioningCredentials(passLibrary: passLibrary)
  
  for credential in cachedCredentials {
    if !passSuffixes.contains(credential.primaryAccountSuffix) {
      availablePassesForIphone += 1
    }
    
    if !remotePassSuffixes.contains(credential.primaryAccountSuffix) {
      availableRemotePassesForAppleWatch += 1
    }
  }
  
  let passEntriesAvailable = availablePassesForIphone > 0
  let remotePassEntriesAvailable = availableRemotePassesForAppleWatch > 0
  let requiresAuthentication = shouldRequireAuthenticationForAppleWallet()
  
  status.passEntriesAvailable = passEntriesAvailable
  status.remotePassEntriesAvailable = remotePassEntriesAvailable
  status.requiresAuthentication = requiresAuthentication
  
  return status
}

@available(iOS 14, *)
func paymentPassStatus(passLibrary: PKPassLibrary, completion: @escaping (PKIssuerProvisioningExtensionStatus) -> Void) {
  let passes = passLibrary.passes().map { $0.secureElementPass?.primaryAccountNumberSuffix }
  let remotePasses = passLibrary.remoteSecureElementPasses.map { $0.primaryAccountNumberSuffix }
  let status = PKIssuerProvisioningExtensionStatus()
  let passSuffixes = Set(passes)
  let remotePassSuffixes = Set(remotePasses)
  var availablePassesForIphone: Int = 0
  var availableRemotePassesForAppleWatch: Int = 0
  
  // Get cached credentials data of all of the user's issued cards,
  // within the issuer app, from the user's defaults database.
  let cachedCredentials = getProvisioningCredentials(passLibrary: passLibrary)
  
  for credential in cachedCredentials {
    if !passSuffixes.contains(credential.primaryAccountSuffix) {
      availablePassesForIphone += 1
    }
    
    if !remotePassSuffixes.contains(credential.primaryAccountSuffix) {
      availableRemotePassesForAppleWatch += 1
    }
  }
  
  let passEntriesAvailable = availablePassesForIphone > 0
  let remotePassEntriesAvailable = availableRemotePassesForAppleWatch > 0
  let requiresAuthentication = shouldRequireAuthenticationForAppleWallet()
  
  status.passEntriesAvailable = passEntriesAvailable
  status.remotePassEntriesAvailable = remotePassEntriesAvailable
  status.requiresAuthentication = requiresAuthentication
  
  // The system needs to invoke the handler within 100 ms, or the extension does not display to the user in Apple Wallet.
  completion(status)
}

func getEntryArt(image: UIImage) -> CGImage {
  let ciImage = CIImage(image: image)
  let ciContext = CIContext(options: nil)
  return ciContext.createCGImage(ciImage!, from: ciImage!.extent)!
}

func getDefaultEntryArt() -> CGImage {
  guard let uiImage = UIImage(named: "card-default") else {
    return UIImage().cgImage!
  }
  return getEntryArt(image: uiImage)
}

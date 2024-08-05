//
//  ActionRequestHandler.swift
//  WNonUIExt
//
//  Created by VZ on 25/7/24.
//

import Foundation
import PassKit

class ActionRequestHandler: PKIssuerProvisioningExtensionHandler {
  let passLibrary = PKPassLibrary()
  let watchSession = WatchConnectivitySession()
  
  /**
   Sets the status of the extension to indicate whether a payment pass is available to add and whether
   adding it requires authentication.
   */
  // MARK: Status
  override func status(completion: @escaping (PKIssuerProvisioningExtensionStatus) -> Void) {
    // TODO: remove dev tracking
    storeExtensionDevData(key: "status-init", dict: [
      "started": true
    ])
    let paymentPassLibrary: [PKPass] = self.passLibrary.passes(of: .secureElement)
    
    // This status will be passed to the completion handler.
    let status = PKIssuerProvisioningExtensionStatus()
    var passSuffixes: Set<String> = []
    var remotePassSuffixes: Set<String> = []
    var availablePassesForIphone: Int = 0
    var availableRemotePassesForAppleWatch: Int = 0
    
    // Get the identifiers of payment passes that are already added
    // to Apple Pay.
    for pass in paymentPassLibrary {
      if let identifier = pass.secureElementPass?.primaryAccountNumberSuffix {
        if pass.isRemotePass && pass.deviceName.localizedCaseInsensitiveContains("Apple Watch") {
          remotePassSuffixes.insert(identifier)
        } else if !pass.isRemotePass {
          passSuffixes.insert(identifier)
        }
      }
    }
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentials = getProvisioningCredentials()
    
    for credential in cachedCredentials {
      if !passSuffixes.contains(credential.primaryAccountSuffix) {
        availablePassesForIphone += 1
      }
      
      if !remotePassSuffixes.contains(credential.primaryAccountSuffix) {
        availableRemotePassesForAppleWatch += 1
      }
    }
    
    // Set the status of the extension.
    status.passEntriesAvailable = availablePassesForIphone > 0
    status.remotePassEntriesAvailable = watchSession.isPaired && availableRemotePassesForAppleWatch > 0
    
    // You can also set requiresAuthentication to "true" or "false"
    // directly, if not wanting to rely on a cached value.
    status.requiresAuthentication = shouldRequireAuthenticationForAppleWallet()
    
    // TODO: remove dev tracking
    storeExtensionDevData(key: "status", dict: [
      "passEntriesAvailable": status.passEntriesAvailable,
      "remotePassEntriesAvailable": status.remotePassEntriesAvailable,
      "requiresAuthentication": status.requiresAuthentication
    ])
    
    // Invoke the completion handler.
    // The system needs to invoke the handler within 100 ms, or the extension does not display to the user in Apple Wallet.
    completion(status)
  }
  
  // MARK: PassEntries iPhone
  // gather and return a list of payment pass entries that can be added to Apple Pay for iPhone
  override func passEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    let suffixes = getAccSuffixes()
    
    // TODO: remove dev tracking
    storeExtensionDevData(key: "passEntries-suffixes", dict: [
      "suffixes": suffixes.count
    ])
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentialsData = getProvisioningCredentials()
    
    let eligibleCredentials = cachedCredentialsData.filter { !suffixes.contains($0.primaryAccountSuffix) }
    
    // TODO: remove dev tracking
    storeExtensionDevData(key: "passEntries-elg", dict: [
      "eligibleCredentials": eligibleCredentials.count
    ])
    
    // Create a payment pass entry for each credential.
    getPaymentPassEntries(for: eligibleCredentials) { entries in
      // TODO: remove dev tracking
      storeExtensionDevData(key: "passEntries-entries", dict: [
        "entries": entries.count
      ])
      
      completion(entries)
    }
  }
  
  // MARK: PassEntries Watch
  override func remotePassEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    let remoteSuffixes = getRemoteAccSuffixes()
    
    // TODO: remove dev tracking
    storeExtensionDevData(key: "remotePassEntries-suffixes", dict: [
      "suffixes": remoteSuffixes.count
    ])
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentialsData = getProvisioningCredentials()
    
    let eligibleCredentials = cachedCredentialsData.filter { !remoteSuffixes.contains($0.primaryAccountSuffix) }
    
    // TODO: remove dev tracking
    storeExtensionDevData(key: "remotePassEntries-elg", dict: [
      "eligibleCredentials": eligibleCredentials.count
    ])
    
    // Create a payment pass entry for each credential.
    getPaymentPassEntries(for: eligibleCredentials) { entries in
      // TODO: remove dev tracking
      storeExtensionDevData(key: "remotePassEntries-entries", dict: [
        "entries": entries.count
      ])
      completion(entries)
    }
  }
  
  // MARK: Payment Pass Request
  override func generateAddPaymentPassRequestForPassEntryWithIdentifier(_ identifier: String, configuration: PKAddPaymentPassRequestConfiguration,
                                                                        certificateChain certificates: [Data], nonce: Data, nonceSignature: Data,
                                                                        completionHandler completion: @escaping (PKAddPaymentPassRequest?) ->
                                                                        Void) {
    // You can use the array.first(where:) method to retrieve a
    // specific PKLabeledValue card detail from a configuration.
    // configuration.cardDetails.first(where: { $0.label == "expiration" })!
    
    //TODO: last 4 digits of the card number (primaryAccountSuffix) ???
    
    // get token from shared defaults with indentifier
    let entries = getProvisioningCredentials()
    let entry = entries.first(where: { $0.identifier == identifier })
    let token = entry?.token
    let isTest = entry?.isTestnet ?? false
    
    if token == nil {
      print("Token not found for identifier: \(identifier)")
      completion(nil)
      return
    }
    
    let cardReq = AddCardRequest(cardId: identifier, token: token!, isTestnet: isTest)
    
    // TODO: remove dev tracking
    storeExtensionDevData(key: "add-req-step-0", dict: [
      "identifier": identifier,
      "token": token!,
      "isTest": isTest
    ])
    
    sendDataToServerForEncryption(
      cardRequest: cardReq,
      certificates: certificates,
      nonce: nonce,
      nonceSignature: nonceSignature) { response, error in
        guard let response = response, error == nil else {
          // TODO: remove dev tracking
          storeExtensionDevData(key: "add-req-step-1", dict: [
            "error": error?.localizedDescription ?? "Unknown error"
          ])
          completion(nil)
          return
        }
        
        guard let encryptedData = response["data"] as? String,
              let activationData = response["activationData"] as? String,
              let ephemeralPublicKey = response["ephemeralPublicKey"] as? String else {
          // TODO: remove dev tracking
          storeExtensionDevData(key: "add-req-step-1", dict: [
            "error": "Failed to get encrypted data"
          ])
          completion(nil)
          return
        }
        
        let addRequest = PKAddPaymentPassRequest()
        addRequest.encryptedPassData = Data(base64Encoded: encryptedData)
        addRequest.activationData = Data(base64Encoded: activationData)
        addRequest.ephemeralPublicKey = Data(base64Encoded: ephemeralPublicKey)
        
        // TODO: remove dev tracking
        storeExtensionDevData(key: "add-req-step-2", dict: [
          "status": "sent to completion"
        ])
        
        completion(addRequest)
      }
  }
  
  // MARK: Private Methods
  // Converts a UIImage to a CGImage.
  private func getEntryArt(image: UIImage) -> CGImage {
    let ciImage = CIImage(image: image)
    let ciContext = CIContext(options: nil)
    return ciContext.createCGImage(ciImage!, from: ciImage!.extent)!
  }
  
  private func downloadImage(from url: URL, completion: @escaping (UIImage?) -> Void) {
    URLSession.shared.dataTask(with: url) { data, response, error in
      guard let data = data, error == nil else {
        print("Error downloading image: \(error?.localizedDescription ?? "Unknown error")")
        completion(nil)
        return
      }
      
      if let image = UIImage(data: data) {
        DispatchQueue.main.async {
          completion(image)
        }
      } else {
        print("Error creating image from data")
        completion(nil)
      }
    }.resume()
  }
  
  private func createPaymentPassEntry(provisioningCredential: ProvisioningCredential, completion: @escaping (PKIssuerProvisioningExtensionPaymentPassEntry?) -> Void) {
    let identifier = provisioningCredential.identifier
    let label = provisioningCredential.label
    
    // TODO: remove dev tracking
    storeExtensionDevData(key: "createPaymentPassEntry", dict: [
      "identifier": identifier,
      "label": label
    ])
    
    let requestConfig = PKAddPaymentPassRequestConfiguration(encryptionScheme: .ECC_V2)!
    requestConfig.primaryAccountIdentifier = identifier
    requestConfig.cardholderName = provisioningCredential.cardholderName
    requestConfig.localizedDescription = provisioningCredential.label
    requestConfig.primaryAccountSuffix = provisioningCredential.primaryAccountSuffix
    requestConfig.style = .payment
    
    if let assetUrl = provisioningCredential.assetUrl, let url = URL(string: assetUrl) {
      downloadImage(from: url) { image in
        let entry: PKIssuerProvisioningExtensionPaymentPassEntry
        if let uiImage = image {
          entry = PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                                title: label,
                                                                art: self.getEntryArt(image: uiImage),
                                                                addRequestConfiguration: requestConfig)!
        } else {
          entry = PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                                title: label,
                                                                art: self.getEntryArt(image: #imageLiteral(resourceName: "generic")),
                                                                addRequestConfiguration: requestConfig)!
        }
        completion(entry)
      }
    } else if let assetName = provisioningCredential.assetName, let uiImage = UIImage(named: assetName) {
      let entry = PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                                title: label,
                                                                art: getEntryArt(image: uiImage),
                                                                addRequestConfiguration: requestConfig)!
      completion(entry)
    } else {
      let entry = PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                                title: label,
                                                                art: getEntryArt(image: #imageLiteral(resourceName: "generic")),
                                                                addRequestConfiguration: requestConfig)!
      completion(entry)
    }
  }
  
  private func getPaymentPassEntries(for credentials: [ProvisioningCredential], completion: @escaping ([PKIssuerProvisioningExtensionPaymentPassEntry]) -> Void) {
    let dispatchGroup = DispatchGroup()
    var entries: [PKIssuerProvisioningExtensionPaymentPassEntry] = []
    var errors: [Error] = []
    
    for credential in credentials {
      dispatchGroup.enter()
      createPaymentPassEntry(provisioningCredential: credential) { entry in
        if let entry = entry {
          entries.append(entry)
        } else {
          // Handle the error case if needed
          errors.append(NSError(domain: "EntryCreationError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to create entry for credential: \(credential.identifier)"]))
        }
        dispatchGroup.leave()
      }
    }
    
    dispatchGroup.notify(queue: .main) {
      if errors.isEmpty {
        completion(entries)
      } else {
        // Handle errors if needed
        print("Errors occurred: \(errors)")
        completion(entries)
      }
    }
  }
}

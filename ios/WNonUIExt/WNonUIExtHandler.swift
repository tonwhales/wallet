//
//  WNonUIExtHandler.swift
//  WNonUIExt
//
//  Created by VZ on 25/7/24.
//

import Foundation
import PassKit
import os.log

class WNonUIExtHandler: PKIssuerProvisioningExtensionHandler {
  let passLibrary = PKPassLibrary()
  let watchSession = WatchConnectivitySession()
  
  /**
   Sets the status of the extension to indicate whether a payment pass is available to add and whether
   adding it requires authentication.
   */
  // MARK: Status
  override func status(completion: @escaping (PKIssuerProvisioningExtensionStatus) -> Void) {
    storeExtensionDevData(key: "WNonUIExtHandler", dict: ["step": "0", "status": "init"])
    paymentPassStatus { status in
      os_log("WNonUIExtHandler Payment pass status passEntriesAvailable: %{public}@", status.passEntriesAvailable)
      os_log("WNonUIExtHandler Payment pass status requiresAuthentication: %{public}@", status.requiresAuthentication)
      os_log("WNonUIExtHandler Payment pass status remotePassEntriesAvailable: %{public}@", status.remotePassEntriesAvailable)
      storeExtensionDevData(key: "WNonUIExtHandler", dict: ["step": "0", "status": "success", "res": "\(status.passEntriesAvailable) \(status.requiresAuthentication) \(status.remotePassEntriesAvailable)"])
      completion(status)
    }
  }
  
  // MARK: PassEntries iPhone
  // gather and return a list of payment pass entries that can be added to Apple Pay for iPhone
  override func passEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    let suffixes = getAccSuffixes()
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentialsData = getProvisioningCredentials()
    
    let eligibleCredentials = cachedCredentialsData.filter { !suffixes.contains($0.primaryAccountSuffix) }
    
    storeExtensionDevData(key: "WNonUIExtHandler", dict: [
      "step": "1",
      "status": "init",
      "res": "\(eligibleCredentials.count)"
    ])
    
    // Create a payment pass entry for each credential.
    getPaymentPassEntries(for: eligibleCredentials) { entries in
      os_log("WNonUIExtHandler Payment pass entries: %{public}@", entries.count)
      storeExtensionDevData(key: "WNonUIExtHandler", dict: [
        "step": "1",
        "status": "success",
        "res": "\(entries.count)"
      ])
      completion(entries)
    }
  }
  
  // MARK: PassEntries Watch
  override func remotePassEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    let remoteSuffixes = getRemoteAccSuffixes()
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentialsData = getProvisioningCredentials()
    
    let eligibleCredentials = cachedCredentialsData.filter { !remoteSuffixes.contains($0.primaryAccountSuffix) }
    
    storeExtensionDevData(key: "WNonUIExtHandler", dict: [
      "step": "2",
      "status": "init",
      "res": "\(eligibleCredentials.count)"
    ])
    
    // Create a payment pass entry for each credential.
    getPaymentPassEntries(for: eligibleCredentials) { entries in
      os_log("WNonUIExtHandler Remote payment pass entries: %{public}@", entries.count)
      storeExtensionDevData(key: "WNonUIExtHandler", dict: [
        "step": "2",
        "status": "success",
        "res": "\(entries.count)"
      ])
      completion(entries)
    }
  }
  
  // MARK: Payment Pass Request
  override func generateAddPaymentPassRequestForPassEntryWithIdentifier(_ identifier: String, configuration: PKAddPaymentPassRequestConfiguration,
                                                                        certificateChain certificates: [Data], nonce: Data, nonceSignature: Data,
                                                                        completionHandler completion: @escaping (PKAddPaymentPassRequest?) ->
                                                                        Void) {
    storeExtensionDevData(key: "WNonUIExtHandler", dict: [
      "step": "3",
      "status": "init-0",
      "res": "\(identifier)"
    ])
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
      os_log("WNonUIExtHandler generateAddPaymentPassRequestForPassEntryWithIdentifier: Error getting token")
      completion(nil)
      return
    }
    
    let cardReq = AddCardRequest(cardId: identifier, token: token!, isTestnet: isTest)
    
    storeExtensionDevData(key: "WNonUIExtHandler", dict: [
      "step": "3",
      "status": "init-1",
      "res": "\(identifier)"
    ])
    
    sendDataToServerForEncryption(
      cardRequest: cardReq,
      certificates: certificates,
      nonce: nonce,
      nonceSignature: nonceSignature) { response, error in
        guard let response = response, error == nil else {
          os_log("WNonUIExtHandler sendDataToServerForEncryption: Error: %{public}@", error?.localizedDescription ?? "Unknown error")
          storeExtensionDevData(key: "WNonUIExtHandler", dict: [
            "step": "3",
            "status": "error",
            "res": "\(error?.localizedDescription ?? "Unknown error")"
          ])
          completion(nil)
          return
        }
        
        guard let resData = response["data"] as? [String: Any] else {
          os_log("WNonUIExtHandler generateAddPaymentPassRequestForPassEntryWithIdentifier: Error getting data")
          storeExtensionDevData(key: "WNonUIExtHandler", dict: [
            "step": "3",
            "status": "error",
            "res": "Error getting data"
          ])
          completion(nil)
          return
        }
        
        guard let encryptedData = resData["encryptedData"] as? String,
              let activationData = resData["activationData"] as? String,
              let ephemeralPublicKey = resData["ephemeralPublicKey"] as? String else {
          os_log("WNonUIExtHandler generateAddPaymentPassRequestForPassEntryWithIdentifier: Error getting encrypted data")
          storeExtensionDevData(key: "WNonUIExtHandler", dict: [
            "step": "3",
            "status": "error",
            "res": "Error getting encrypted data"
          ])
          completion(nil)
          return
        }
        
        let addRequest = PKAddPaymentPassRequest()
        addRequest.encryptedPassData = Data(base64Encoded: encryptedData)
        addRequest.activationData = Data(base64Encoded: activationData)
        addRequest.ephemeralPublicKey = Data(base64Encoded: ephemeralPublicKey)
        
        os_log("WNonUIExtHandler generateAddPaymentPassRequestForPassEntryWithIdentifier: Success")
        storeExtensionDevData(key: "WNonUIExtHandler", dict: [
          "step": "3",
          "status": "success",
          "res": "Success"
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
          let art = self.getEntryArt(image: uiImage)
          entry = PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                                title: label,
                                                                art: art,
                                                                addRequestConfiguration: requestConfig)!
        } else {
          guard let uiImage = UIImage(named: "card-default") else {
            completion(nil)
            return
          }
          
          let art = self.getEntryArt(image: uiImage)
          
          entry = PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                                title: label,
                                                                art: art,
                                                                addRequestConfiguration: requestConfig)!
        }
        completion(entry)
      }
    } else if let assetName = provisioningCredential.assetName, let uiImage = UIImage(named: assetName) {
      let entry = PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                                title: label,
                                                                art: self.getEntryArt(image: uiImage),
                                                                addRequestConfiguration: requestConfig)!
      completion(entry)
    } else {
      guard let uiImage = UIImage(named: "card-default") else {
        completion(nil)
        return
      }
      
      let art = self.getEntryArt(image: uiImage)
      let entry = PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                                title: label,
                                                                art: art,
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
        storeExtensionDevData(key: "WNonUIExtHandler", dict: [
          "step": "4",
          "status": "success",
          "res": "\(entries.count)"
        ])
        completion(entries)
      } else {
        // Handle errors if needed
        print("Errors occurred: \(errors)")
        storeExtensionDevData(key: "WNonUIExtHandler", dict: [
          "step": "4",
          "status": "success with errors",
          "res": "\(entries.count)"
        ])
        completion(entries)
      }
    }
  }
}

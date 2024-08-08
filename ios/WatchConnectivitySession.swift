//
//  WatchConnectivitySession.swift
//  WNonUIExt
//
//  Created by VZ on 25/7/24.
//

import WatchConnectivity

class WatchConnectivitySession: NSObject, WCSessionDelegate {
  static let shared = WatchConnectivitySession()
  let session = WCSession.default
  private var sessionReadyCompletion: ((Bool) -> Void)?
  
  override init() {
    // Initialize the superclass.
    super.init()
    
    // Activate the session if the current iPhone is able to use a
    // session object.
    if WCSession.isSupported() {
      session.delegate = self
      if (session.activationState != .activated) {
        session.activate()
      }
    }
  }
  
  // A Boolean indicating whether the current iPhone has a paired Apple Watch.
  var isPaired: Bool {
    return session.isPaired
  }
  
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    sessionReadyCompletion?(session.isPaired)
    
    if error != nil {
      print("NSXPCConnectionInterrupted: The connection was interrupted.")
    }
  }
  
  func sessionDidBecomeInactive(_ session: WCSession) {
    // session.activate()
  }
  
  func sessionDidDeactivate(_ session: WCSession) {
    // session.activate()
  }
}

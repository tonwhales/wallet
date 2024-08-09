//
//  WatchConnectivitySession.swift
//  WNonUIExt
//
//  Created by VZ on 25/7/24.
//

import WatchConnectivity

class WatchConnectivitySession: NSObject, WCSessionDelegate {
  static let shared = WatchConnectivitySession()
  private var isPairedContinuation: CheckedContinuation<Bool, Never>?
  let session = WCSession.default
  
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
  
  public func hasPairedWatchDevices() async -> Bool {
    await withCheckedContinuation { [weak self] continuation in
      guard let self else { return continuation.resume(returning: false) }
      
      guard WCSession.isSupported() else { return continuation.resume(returning: false) }
      let session = WCSession.default
      session.delegate = self
      session.activate()
      isPairedContinuation = continuation
    }
  }
  
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    storeExtensionDevDataByKey(mainKey: "WatchConnectivitySession", key: "session", value: "called: \(activationState.rawValue)")
    if activationState == .activated {
      isPairedContinuation?.resume(returning: session.isPaired)
      isPairedContinuation = nil
    }
    
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

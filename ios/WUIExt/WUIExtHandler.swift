//
//  ActionViewController.swift
//  WUIExt
//

import UIKit
import SwiftUI
import PassKit

class WUIExtHandler: UIViewController, PKIssuerProvisioningExtensionAuthorizationProviding {
  
  var completionHandler: ((PKIssuerProvisioningExtensionAuthorizationResult) -> Void)?
  
  override func viewDidLoad() {
          super.viewDidLoad()
          
          // Create an instance of the SwiftUI view.
          // The completion handler should be passed to the SwiftUI view.
          let swiftUIView = WUIExtView(completionHandler: completionHandler)
          
          // Create a UIHostingController with the extension's SwiftUI view as
          // its root view.
          let controller = UIHostingController(rootView: swiftUIView)
          
          // Add the UIHostingController's view to the destination
          // view controller.
          addChild(controller)
          controller.view.translatesAutoresizingMaskIntoConstraints = false
          view.addSubview(controller.view)
          
          // Set and activate the constraints for the extension's SwiftUI view.
          NSLayoutConstraint.activate([
              controller.view.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 1),
              controller.view.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 1),
              controller.view.centerXAnchor.constraint(equalTo: view.centerXAnchor),
              controller.view.centerYAnchor.constraint(equalTo: view.centerYAnchor)
          ])
          
          // Notify the child view controller that the move is complete.
          controller.didMove(toParent: self)
      }
}

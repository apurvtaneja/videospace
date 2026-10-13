// Prints the Chrome for Testing windows macOS currently shows on screen.
// Windows parked on another Space are not on screen, which lets the E2E run
// tell whether a fullscreen window really got its own Space.
import CoreGraphics
import Foundation

let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
let windows = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] ?? []
var out: [[String: Int]] = []
for w in windows {
  guard let owner = w[kCGWindowOwnerName as String] as? String, owner.contains("Chrome for Testing"),
        (w[kCGWindowLayer as String] as? Int) == 0,
        let b = w[kCGWindowBounds as String] as? [String: Any] else { continue }
  let n = { (k: String) in (b[k] as? NSNumber)?.intValue ?? 0 }
  if n("Width") < 100 || n("Height") < 100 { continue }
  out.append(["x": n("X"), "y": n("Y"), "w": n("Width"), "h": n("Height")])
}
print(String(data: try! JSONSerialization.data(withJSONObject: out), encoding: .utf8)!)

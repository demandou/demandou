// Máscara de pessoa (Apple Vision, qualidade 'accurate') -> quadros cinza 8 bits no stdout (tamanho nativo da máscara); tamanho em stderr
import AVFoundation
import Vision
import Foundation
import CoreImage
let src = URL(fileURLWithPath: CommandLine.arguments[1])
let OW = Int(CommandLine.arguments[2])!, OH = Int(CommandLine.arguments[3])!
let asset = AVURLAsset(url: src)
let track = asset.tracks(withMediaType: .video)[0]
let reader = try! AVAssetReader(asset: asset)
let o = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
reader.add(o); reader.startReading()
let ctx = CIContext()
let out = FileHandle.standardOutput
var buf = [UInt8](repeating: 0, count: OW * OH)
let cs = CGColorSpaceCreateDeviceGray()
while let sb = o.copyNextSampleBuffer() {
  guard let pb = CMSampleBufferGetImageBuffer(sb) else { continue }
  let req = VNGeneratePersonSegmentationRequest(); req.qualityLevel = .accurate; req.outputPixelFormat = kCVPixelFormatType_OneComponent8
  try? VNImageRequestHandler(cvPixelBuffer: pb, options: [:]).perform([req])
  if let m = req.results?.first?.pixelBuffer {
    var ci = CIImage(cvPixelBuffer: m)
    ci = ci.transformed(by: CGAffineTransform(scaleX: CGFloat(OW) / ci.extent.width, y: CGFloat(OH) / ci.extent.height))
    ctx.render(ci, toBitmap: &buf, rowBytes: OW, bounds: CGRect(x: 0, y: 0, width: OW, height: OH), format: .L8, colorSpace: cs)
  } else { for k in 0..<buf.count { buf[k] = 0 } }
  out.write(Data(buf))
}

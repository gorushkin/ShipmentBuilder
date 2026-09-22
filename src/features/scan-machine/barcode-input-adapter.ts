import { BarcodeResolver } from './barcode-resolver'
import type { ResolvedScanEvent } from './scan-machine'

interface ScanReceiver {
  barcodeUnknown(): void
  send(event: ResolvedScanEvent): void
}

export class BarcodeInputAdapter {
  private readonly resolver: BarcodeResolver
  private readonly receiver: ScanReceiver

  constructor(resolver: BarcodeResolver, receiver: ScanReceiver) {
    this.resolver = resolver
    this.receiver = receiver
  }

  submit(rawValue: string): void {
    const resolution = this.resolver.resolve(rawValue)
    if (resolution.kind === 'unknown') {
      this.receiver.barcodeUnknown()
      return
    }
    this.receiver.send(resolution.event)
  }
}

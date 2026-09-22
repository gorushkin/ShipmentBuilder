import { BarcodeResolver } from './barcode-resolver'
import { ScanMachine } from './scan-machine'

export class BarcodeInputAdapter {
  private readonly resolver: BarcodeResolver
  private readonly scanMachine: ScanMachine

  constructor(
    resolver: BarcodeResolver,
    scanMachine: ScanMachine,
  ) {
    this.resolver = resolver
    this.scanMachine = scanMachine
  }

  submit(rawValue: string): void {
    const resolution = this.resolver.resolve(rawValue)
    if (resolution.kind === 'unknown') {
      this.scanMachine.barcodeUnknown()
      return
    }
    this.scanMachine.send(resolution.event)
  }
}

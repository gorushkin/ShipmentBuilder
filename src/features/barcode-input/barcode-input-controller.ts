export class BarcodeInputController {
  private input: HTMLInputElement | null = null

  connect(input: HTMLInputElement | null): void {
    this.input = input
  }

  focus(): void {
    this.input?.focus({ preventScroll: true })
  }

  isFocused(): boolean {
    return document.activeElement === this.input
  }
}

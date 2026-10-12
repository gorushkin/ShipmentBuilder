import { makeAutoObservable } from 'mobx'

export class BarcodeInputController {
  isExpanded = false
  value = ''

  constructor() {
    makeAutoObservable(this)
  }

  toggle(): void {
    this.isExpanded = !this.isExpanded
  }

  collapse(): void {
    this.isExpanded = false
  }

  setValue(value: string): void {
    this.value = value
  }

  takeValue(): string {
    const value = this.value.trim()
    this.value = ''
    return value
  }
}

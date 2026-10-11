import { commands } from '@/features/command-config'

export const shipmentShortcuts = {
  get clearFilter() {
    return commands.clearFilter.shortcut
  },
  get createTransportPlace() {
    return commands.createTransportPlace.shortcut
  },
  get mix() {
    return commands.mix.shortcut
  },
  get pal() {
    return commands.pal.shortcut
  },
  get printLabel() {
    return commands.printLabel.shortcut
  },
  get printReports() {
    return commands.printReports.shortcut
  },
  get receiveLabels() {
    return commands.receiveLabels.shortcut
  },
  get receiveSSCC() {
    return commands.receiveSSCC.shortcut
  },
  get repeatShipment() {
    return commands.repeatShipment.shortcut
  },
  get returnAll() {
    return commands.returnAll.shortcut
  },
  get returnQuantity() {
    return commands.returnQuantity.shortcut
  },
  get returnRow() {
    return commands.returnRow.shortcut
  },
  get sendTo1C() {
    return commands.sendTo1C.shortcut
  },
  get transferAll() {
    return commands.transferAll.shortcut
  },
  get transferQuantity() {
    return commands.transferQuantity.shortcut
  },
  get transferRow() {
    return commands.transferRow.shortcut
  },
}

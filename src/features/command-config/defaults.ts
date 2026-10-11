export const defaultCommands = {
  barcodeToggle: {
    description: 'Развернуть / свернуть ручной ввод штрихкода',
    label: 'Развернуть / свернуть ввод',
    shortcut: 'F2',
  },
  cancel: {
    description: 'Отменить текущую операцию',
    label: 'Отмена',
    shortcut: 'Escape',
  },
  clearFilter: {
    description: 'Сбросить фильтр источника',
    label: 'Сбросить',
    shortcut: 'x',
  },
  createTransportPlace: {
    description: 'Создать новое транспортное место',
    label: 'Создать ТМ',
    shortcut: 'n',
  },
  deleteTransportPlace: {
    description: 'Удалить выбранное ТМ с подтверждением и возвратом товаров',
    label: 'Удалить ТМ',
    shortcut: 'shift+n',
  },
  historyToggle: {
    description: 'Развернуть / свернуть историю действий',
    label: 'История',
    shortcut: 'F3',
  },
  mix: {
    description: 'Будет доступно в следующих версиях прототипа',
    label: 'MIX',
    shortcut: 'm',
  },
  pal: {
    description: 'Будет доступно в следующих версиях прототипа',
    label: 'PAL',
    shortcut: 'b',
  },
  printLabel: {
    description: 'Печать этикетки ТМ: будет доступно в следующих версиях прототипа',
    label: 'Печать этикетки ТМ',
    shortcut: 't',
  },
  printReports: {
    description: 'Открыть выбор отчета для печати',
    label: 'Печать',
    shortcut: 'p',
  },
  receiveLabels: {
    description: 'Получить маркировки: будет доступно в следующих версиях прототипа',
    label: 'Получить маркировки',
    shortcut: 'l',
  },
  receiveSSCC: {
    description: 'Получить SSCC: будет доступно в следующих версиях прототипа',
    label: 'Получить SSCC',
    shortcut: 'c',
  },
  repeatShipment: {
    description: 'Повторная отправка: будет доступно в следующих версиях прототипа',
    label: 'Повторная отправка',
    shortcut: 'r',
  },
  returnAll: {
    description: 'Вернуть все товары из активного ТМ',
    label: 'Вернуть всё из ТМ',
    shortcut: 'shift+a',
  },
  returnQuantity: {
    description: 'Выбрать количество для возврата из активного ТМ',
    label: 'Вернуть количество',
    shortcut: 'shift+q',
  },
  returnRow: {
    description: 'Вернуть выбранную строку из активного ТМ',
    label: 'Вернуть строку',
    shortcut: 'shift+d',
  },
  sendTo1C: {
    description: 'Отправка ТМ в 1С: будет доступно в следующих версиях прототипа',
    label: 'Отправка ТМ в 1С',
    shortcut: 's',
  },
  transferAll: {
    description: 'Переместить все товары по текущему фильтру в активное ТМ',
    label: 'Переместить всё по фильтру',
    shortcut: 'a',
  },
  transferQuantity: {
    description: 'Выбрать количество для перемещения в активное ТМ',
    label: 'Переместить количество',
    shortcut: 'q',
  },
  transferRow: {
    description: 'Переместить выбранную строку в активное ТМ',
    label: 'Переместить строку',
    shortcut: 'd',
  },
}

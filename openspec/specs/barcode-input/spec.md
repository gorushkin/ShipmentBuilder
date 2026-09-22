# Barcode Input

## Purpose

Определяет постоянно доступную точку технического ввода штрихкода до
подключения сценарной машины и доменных операций.

## Requirements

### Requirement: Persistent barcode entry point

Экран SHALL отображать независимый компонент `BarcodeInput` перед сведениями о
текущем заказе. Компонент SHALL постоянно рендерить enabled и focusable форму с
одним доступно именованным input для штрихкода. В штатном режиме input SHALL
быть визуально скрыт без `display: none`, атрибута `hidden` или `disabled`.

#### Scenario: Hidden scanner input accepts a scan

- **WHEN** форма открыта в штатном скрытом режиме и сканер вводит значение с
  завершающим `Enter`
- **THEN** input получает значение и форма обрабатывает нативный submit

### Requirement: Technical submit before workflow integration

Нативный submit `BarcodeInput` по `Enter` SHALL нормализовать значение путём
удаления краевых пробелов, очистить input и вывести в console log сообщение
`barcode completed` с нормализованным непустым значением и ISO-временем. Submit
SHALL NOT изменять данные заказа, фильтры, транспортные места или распределения.

#### Scenario: Submit a manually entered barcode

- **WHEN** пользователь вводит `  N00001  ` и нажимает `Enter`
- **THEN** console log содержит `barcode completed` со значением `N00001` и
  ISO-временем
- **AND** input очищен, а данные формирования ТМ не изменены

#### Scenario: Submit an empty barcode

- **WHEN** пользователь отправляет поле, содержащее только пробелы
- **THEN** компонент очищает поле и не выводит техническое сообщение

### Requirement: Scanner focus and manual-entry presentation

В штатном режиме scanner input SHALL получать фокус при открытии экрана и после
submit. После мышиного действия на экране фокус SHALL возвращаться в scanner
input, кроме открытого modal dialog или другого текстового поля, в котором
пользователь вводит значение. Компонент SHALL предоставлять кнопку раскрытия и
горячую клавишу `F2`, которые раскрывают и фокусируют тот же input; `Esc` SHALL
вернуть его к скрытому представлению и фокусу. Компонент SHALL NOT отображать
отдельную кнопку submit.

#### Scenario: Reveal and hide manual entry

- **WHEN** пользователь нажимает `F2`
- **THEN** тот же scanner input становится видимым и получает фокус
- **WHEN** пользователь затем нажимает `Esc`
- **THEN** input возвращается к скрытому представлению и сохраняет фокус

#### Scenario: Partial-quantity dialog keeps focus

- **WHEN** открыт диалог частичного перемещения количества
- **THEN** scanner input не перехватывает фокус у поля количества

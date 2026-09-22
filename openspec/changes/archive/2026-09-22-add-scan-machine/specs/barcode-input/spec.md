## MODIFIED Requirements

### Requirement: Technical submit before workflow integration

Нативный submit `BarcodeInput` по `Enter` SHALL очищать input и передавать
каждое непустое значение во входной adapter. Adapter SHALL отвечать за
нормализацию, resolver и передачу typed event в `ScanMachine`. Submit SHALL NOT
писать технический console log и SHALL NOT напрямую изменять данные заказа,
фильтры, транспортные места или распределения.

#### Scenario: Submit a manually entered barcode

- **WHEN** пользователь вводит `  P1  ` и нажимает `Enter`
- **THEN** input очищен и adapter получает введённое непустое значение
- **AND** data store не изменяется напрямую из `BarcodeInput`

#### Scenario: Submit an empty barcode

- **WHEN** пользователь отправляет поле, содержащее только пробелы
- **THEN** компонент очищает поле и не вызывает input adapter

### Requirement: Scanner focus and manual-entry presentation

В штатном режиме scanner input SHALL получать фокус при открытии экрана и после
submit. После мышиного действия на экране фокус SHALL возвращаться в scanner
input, кроме открытого modal dialog или другого текстового поля, в котором
пользователь вводит значение. Компонент SHALL предоставлять кнопку раскрытия и
горячую клавишу `F2`, которые раскрывают и фокусируют тот же input; `Esc` SHALL
вернуть его к скрытому представлению и фокусу. Компонент SHALL NOT отображать
отдельную кнопку submit. Пока `ScanMachine` находится в `transferring-*`, input
SHALL быть disabled и визуально показывать состояние «Обработка…».

#### Scenario: Reveal and hide manual entry

- **WHEN** пользователь нажимает `F2`
- **THEN** тот же scanner input становится видимым и получает фокус
- **WHEN** пользователь затем нажимает `Esc`
- **THEN** input возвращается к скрытому представлению и сохраняет фокус

#### Scenario: Partial-quantity dialog keeps focus

- **WHEN** открыт диалог частичного перемещения количества
- **THEN** scanner input не перехватывает фокус у поля количества

#### Scenario: Display pending transfer processing

- **WHEN** машина находится в `transferring-container(C1)`
- **THEN** scanner input disabled и отображается «Обработка…»

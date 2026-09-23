## MODIFIED Requirements

### Requirement: Scanner focus and manual-entry presentation

В штатном режиме scanner input SHALL быть визуально скрыт, получать фокус при
открытии экрана и после submit. После мышиного действия на экране фокус SHALL
возвращаться в scanner input, кроме открытого modal dialog или другого
текстового поля, в котором пользователь вводит значение. Компонент SHALL
предоставлять кнопку раскрытия и горячую клавишу `F2`, которые раскрывают и
фокусируют тот же input; `Esc` из раскрытого сфокусированного scanner input
SHALL вернуть его к скрытому представлению и фокусу, не отменяя workflow
действие. Компонент SHALL NOT отображать отдельную кнопку submit. Пока
`ScanMachine` находится в `transferring-*`, input SHALL быть disabled и
визуально показывать состояние «Обработка…».

#### Scenario: Hidden scanner input accepts a scan

- **WHEN** экран открыт в штатном режиме и сканер вводит значение с завершающим
  `Enter`
- **THEN** скрытый scanner input получает значение и форма обрабатывает
  нативный submit

#### Scenario: Reveal and hide manual entry

- **WHEN** пользователь нажимает `F2`, пока не открыт dialog и фокус не
  находится в другом текстовом поле
- **THEN** тот же scanner input становится видимым и получает фокус
- **WHEN** пользователь затем нажимает `Esc`, пока этот input раскрыт и
  сфокусирован
- **THEN** input возвращается к скрытому представлению, сохраняет фокус и не
  отменяет workflow-действие

#### Scenario: Partial-quantity dialog keeps focus

- **WHEN** открыт диалог частичного перемещения количества
- **THEN** scanner input не перехватывает фокус у поля количества

#### Scenario: Display pending transfer processing

- **WHEN** машина находится в `transferring-container(C1)`
- **THEN** scanner input disabled и отображается «Обработка…»

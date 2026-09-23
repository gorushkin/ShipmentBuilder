## ADDED Requirements
### Requirement: Complete operation catalog
Workflow SHALL поддерживать перенос контейнера, товара из контейнера, следующей строки товара, выбранной sourceLine, всего товара, всех строк фильтра и количества; возврат ТМ, товара и количества. Кнопки и command barcodes SHALL давать одинаковые операции. Режим таблицы SHALL NOT определять scope.
#### Scenario: Equivalent input paths
- **WHEN** кнопка переноса контейнера и CMD:CONTAINER выполняются в одинаковом контексте
- **THEN** одинаковые sourceLines и количества переносятся в одно ТМ

### Requirement: Explicit line precedence
Совпадающий скан SHALL переносить явно выбранную строку и очищать её выбор после успеха. Без pin повторный скан SHALL брать первую положительную sourceLine в порядке snapshot.
#### Scenario: Continue after a pinned line
- **WHEN** пользователь выбирает L3 товара P1 и затем дважды сканирует P1
- **THEN** переносятся L3, затем первая оставшаяся L1, а фильтр сохраняется

### Requirement: Return product acquisition
CMD:RETURN и CMD:RETURN-QTY SHALL использовать выбранный товар активного ТМ либо ожидать его скана. Скан P в этом ожидании SHALL адресовать назначение, сохраняя source context.
#### Scenario: Scan return target
- **WHEN** после CMD:RETURN сканируется P1 при активном TM1
- **THEN** возвращается только P1 из TM1
#### Scenario: Missing destination product
- **WHEN** товар отсутствует в активном ТМ
- **THEN** ошибка оставляет ожидание открытым без mutation

### Requirement: Post-operation context
Успех SHALL сохранять source filter даже при опустошении и активное ТМ. Перенос товара из контейнера SHALL возвращать к выбору контейнера. Перенос следующей строки SHALL сохранять выбор товара. Failure SHALL сохранять предоперационный контекст.
#### Scenario: Empty filter
- **WHEN** переносится последний остаток P1
- **THEN** фильтр остаётся с пустым результатом, следующий перенос сообщает отсутствие остатка

### Requirement: Scoped quantities
Количество SHALL применяться к выбранной строке, иначе товару выбранного контейнера, иначе всем строкам товара в стабильном порядке. Возврат SHALL ограничиваться товаром активного ТМ.
#### Scenario: Cross-container quantity
- **WHEN** без pin/container filter остатки P1 равны 4 и 6, подтверждено 7
- **THEN** переносится 4 из первой строки и 3 из второй
#### Scenario: Pin prevents spillover
- **WHEN** выбрана строка с остатком 4, подтверждено 5
- **THEN** операция отклоняется без изменения других строк

### Requirement: Unified distribution UI
Таблицы, controls, summary и progress SHALL читать общий ShipmentDataStore через оркестратор. SourceLine и КМ/КА SHALL сохраняться.
#### Scenario: Totals follow operations
- **WHEN** выполнен перенос и возврат
- **THEN** таблицы, остатки и прогресс обновляются согласованно без записи в legacy store

## 1. Зависимости и пути

- [x] 1.1 Сверить manifest, lockfile и установленное дерево пяти согласованных devDependencies; устранить отсутствие пакетов или peer-конфликты без отката ESLint 10 и повторной установки подходящих версий.
- [x] 1.2 Настроить @/* в tsconfig.app.json и alias @ в Vite на src.

## 2. Правила и форматирование

- [x] 2.1 Обновить flat config: type-aware пресеты, projectService, разделение browser/Node и сохранение React Hooks/Refresh; настроить exhaustive-deps и no-console.
- [x] 2.2 Добавить unused-imports без дублирования, выбранное правило MobX, сортировку perfectionist и точный запрет ../ в src с разрешением ./.
- [x] 2.3 Добавить отдельный Prettier-конфиг и ignore-файл, eslint-config-prettier последним; настроить format, format:check и lint:fix с ограниченной областью форматирования.

## 3. Приведение кода и проверка

- [x] 3.1 Привести исходники и конфиги к новым правилам без изменения поведения; сохранить семантически значимый порядок, проверить один реальный импорт через @/.
- [x] 3.2 Проверить --print-config для TS, TSX и vite.config.ts, выполнить pnpm lint, pnpm format:check и pnpm build; не добавлять тесты и runner.

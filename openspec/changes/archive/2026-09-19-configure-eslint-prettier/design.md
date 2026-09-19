## Context

Проект использует ESLint 10, TypeScript 6, React, Vite и MobX. За основу берём существующий flat config и согласованные правила прошлого проекта. Пользователь сообщил об установке пакетов, но на момент подготовки change они не отражены в package.json текущей папки: при применении сначала сверить manifest, lockfile и установленное дерево.

## Goals / Non-Goals

**Goals:** единая проверка TypeScript и React, сортировка, отдельное форматирование, рабочий alias.

**Non-Goals:** тесты и runner, Storybook, UI kit, новая функциональность приложения, обновление основных версий зависимостей и изменение бизнес-логики.

## Decisions

### Flat config ESLint 10

Сохранить defineConfig/globalIgnores. Подключить recommendedTypeChecked и stylisticTypeChecked через projectService: true и tsconfigRootDir. Type-aware правила применяются только к TS/TSX, входящим в app/node tsconfig. Для JS-конфигов — обычные recommended-правила без type-aware parsing. Для src использовать globals.browser, для Vite и корневых JS-конфигов — globals.node. Не задавать устаревший ecmaVersion: 2020.

Сохранить текущие flat-пресеты React Hooks и React Refresh для исходников; exhaustive-deps — error. Не добавлять eslint-plugin-react в этот change: отдельное расширение JSX-правил не согласовывали.

Перенести no-console: error с разрешением error/info, отключённые consistent-type-definitions и prefer-nullish-coalescing из прошлого конфига. Не включать ограничения длины строки и core-правило no-multiple-empty-lines: форматированием занимается Prettier.

### Неиспользуемый код и MobX

Пакеты: eslint-plugin-unused-imports и eslint-plugin-mobx. Отключить core no-unused-vars и @typescript-eslint/no-unused-vars, включить unused-imports/no-unused-imports и unused-imports/no-unused-vars как error. Для переменных сохранить args/caughtErrors: all, исключения ^_ для аргументов, переменных, ошибок и деструктурированных массивов, ignoreRestSiblings: true. TypeScript noUnusedLocals/noUnusedParameters остаются независимыми проверками компилятора; исключение ESLint не гарантирует принятие любого имени с _ компилятором.

Из MobX включить только unconditional-make-observable: error. Правила явных аннотаций, декораторов и обязательного observer для всех компонентов не нужны для текущего подхода.

### Сортировка

eslint-plugin-perfectionist отвечает за sort-imports, sort-objects, sort-interfaces и sort-object-types. Уровень warn, алфавитный порядок по возрастанию без учёта регистра. Импорты группируются: React/React DOM, остальные внешние и builtin, внутренние @/, затем относительные; между группами пустая строка. Не добавлять eslint-plugin-import, который при проверке не заявлял поддержку ESLint 10.

Не переставлять side-effect импорты и зависимые вычисления ради сортировки. При приведении существующего кода просматривать autofix на сохранение семантики; для исключений с важным порядком допустимо точечное отключение с объяснением. Порядок массивов моков не сортируется.

### Отдельный Prettier

Пакеты prettier и eslint-config-prettier; последний подключить после остальных ESLint-настроек. eslint-plugin-prettier не нужен. Добавить .prettierrc.json: tabWidth 2, singleQuote true, semi false, trailingComma all, bracketSpacing true, printWidth 100. Это сохраняет стиль существующих исходников; настройки можно изменить независимо от правил корректности.

Команды format и format:check используют один явный набор: src, корневые JS/TS-конфиги, package.json, tsconfig*.json, index.html и .prettierrc.json. format выполняет --write, format:check — --check. Исключить dist, node_modules, lockfile и служебные каталоги; не переформатировать openspec и .codex. Добавить lint:fix для ESLint --fix.

### Импорты

Настроить @/* → src/* через paths в tsconfig.app.json без устаревшего baseUrl; Vite resolve.alias должен указывать на абсолютный src через import.meta.url. В src запретить ../ и ../** через no-restricted-imports, разрешить ./; сообщение должно точно объяснять правило. Alias относится к исходникам, не к Node-конфигам. При необходимости продемонстрировать реальное использование @/ в одном существующем импорте для проверки сборкой.

### Проверка и зависимости

Ожидаемые devDependencies: prettier, eslint-config-prettier, eslint-plugin-unused-imports, eslint-plugin-perfectionist, eslint-plugin-mobx. Сначала проверить сделанную пользователем установку; отсутствующие зависимости должны быть внесены в manifest/lockfile до настройки, без переустановки уже подходящих версий и без подавления peer-конфликтов.

Проверки: pnpm lint, pnpm format:check, pnpm build. Проверить эффективный ESLint config для TS, TSX и vite.config.ts через --print-config. Дополнительные тестовые файлы и тестовая инфраструктура не создаются.

## Risks / Trade-offs

- Type-aware linting выявит новые замечания → исправить адресно, без ослабления всех recommended-правил.
- Автосортировка может затронуть порядок исполнения → проверить изменения, сохранить порядок side-effect импортов и зависимых выражений.
- Включение стилистических правил создаст diff существующих файлов → ограничить изменения форматированием, импортами и необходимыми исправлениями lint без изменения поведения.
- Peer-совместимость не гарантирует фактическую работу → подтвердить командами на установленном дереве.

## Migration Plan

Проверить зависимости, настроить конфиги и alias, привести исходники к правилам, выполнить проверки. Миграции данных отсутствуют.

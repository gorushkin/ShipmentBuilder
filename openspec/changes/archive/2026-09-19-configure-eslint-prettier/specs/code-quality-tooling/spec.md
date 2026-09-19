## ADDED Requirements

### Requirement: Type-aware linting with correct environments

Проект SHALL использовать ESLint 10 flat config, recommendedTypeChecked и stylisticTypeChecked с projectService для TypeScript. Browser globals SHALL применяться к src, Node globals — к конфигам. React Hooks и React Refresh SHALL сохраняться, exhaustive-deps SHALL иметь уровень error. JavaScript-конфиги SHALL проверяться без требования включения в TypeScript project.

#### Scenario: Lint source and configuration files
- **WHEN** разработчик запускает pnpm lint
- **THEN** TS/TSX и поддерживаемые JS-конфиги проверяются без ошибок настройки parser/project или неизвестных правил

### Requirement: Unused code and MobX rules

Неиспользуемые импорты и переменные SHALL проверяться через unused-imports без дублирования core и TypeScript no-unused-vars. Исключения для имён с _ SHALL сохраняться в ESLint. Безусловность makeAutoObservable SHALL проверяться; обязательный observer для всех компонентов SHALL NOT включаться. console SHALL допускать только error и info.

#### Scenario: Fix unused imports
- **WHEN** запускается pnpm lint:fix для кода с неиспользуемым импортом
- **THEN** импорт удаляется, а диагностика не дублируется правилами no-unused-vars

### Requirement: Alphabetical sorting

Perfectionist SHALL проверять сортировку импортов, объектов, интерфейсов и объектных типов на уровне warn, по возрастанию без учёта регистра. Порядок массивов и семантически значимых side-effect импортов SHALL сохраняться.

#### Scenario: Unsorted interface fields
- **WHEN** ESLint обрабатывает интерфейс с несортированными независимыми полями
- **THEN** выдаётся предупреждение о сортировке, исправляемое lint:fix

### Requirement: Independent formatting

Prettier SHALL запускаться отдельно командами format и format:check; ESLint SHALL подключать eslint-config-prettier. Команды SHALL охватывать одинаковый набор исходников и конфигов, исключая generated output, зависимости, lockfile и служебную документацию. Формат SHALL использовать 2 пробела, одинарные кавычки, отсутствие semicolon, trailingComma all и printWidth 100.

#### Scenario: Check without writing
- **WHEN** запускается pnpm format:check
- **THEN** сообщается соответствие форматированию без изменения файлов

### Requirement: Source alias and local imports

TypeScript и Vite SHALL одинаково разрешать @/ к src. В исходниках импорты из родительских каталогов через ../ SHALL запрещаться, а импорты ./ SHALL разрешаться.

#### Scenario: Import source through alias
- **WHEN** исходник импортирует существующий модуль через @/
- **THEN** TypeScript и Vite успешно разрешают импорт при pnpm build

#### Scenario: Parent import diagnostic
- **WHEN** исходник импортирует модуль через ../
- **THEN** ESLint сообщает ошибку с рекомендацией использовать @/, без ложного заявления о запрете ./

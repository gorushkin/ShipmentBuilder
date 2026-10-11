---
name: project-code-style
description: Apply ShipmentBuilder code style when writing or modifying project code, including React components and hooks.
---

# Project code style

Apply these conventions to new code and the blocks you modify. Leave unrelated existing code and lint configuration unchanged unless the task includes updating them.

## Blank lines

- Separate logical blocks inside a function with one blank line: setup and hooks, derived values, handlers, and rendering.
- Keep closely related declarations and consecutive related hook calls together. Choose boundaries by purpose, rather than inserting a blank line after every statement or hook.
- Separate a component's final `return` containing JSX from preceding code with one blank line. A function whose body consists only of `return` needs no leading blank line.

```tsx
const workflow = scannerWorkflowOrchestrator
const shortcut = shipmentShortcuts.createTransportPlace

const available = () =>
  workflow.hasSnapshot && !workflow.isBusy && !workflow.isWaiting

const create = () => {
  if (available()) workflow.createTransportPlace()
}

useShortcut(shortcut, create, { accepts: available })

return (
  <Button shortcut={shortcut} onClick={create}>
    Создать ТМ
  </Button>
)
```

## 1. Barcode input feature

- [x] 1.1 Create the independent `BarcodeInput` component and its
  `BarcodeInputController` with a stable input ref and controlled value.
- [x] 1.2 Render a single enabled, focusable form and shadcn `Input` before
  `OrderSummary`; add accessible naming and visually-hidden styling that keeps
  the field in the DOM.
- [x] 1.3 Implement native `Enter` submit: trim nonempty values, log `barcode
  completed` with ISO time, clear the field, and leave shipment data unchanged.

## 2. Presentation and focus lifecycle

- [x] 2.1 Add the explicit reveal control plus `F2` to reveal and focus the
  same input, and `Esc` to return it to the hidden presentation.
- [x] 2.2 Restore scanner focus after submit and ordinary mouse actions without
  stealing focus from an open dialog or another actively edited text field.
- [x] 2.3 Confirm there is no submit button and no global keyboard interception
  that affects unrelated text inputs.

## 3. Verification

- [x] 3.1 Run lint and production build.
- [x] 3.2 Manually verify hidden scanner submit, expanded manual submit,
  `F2`/`Esc`, console output, focus restoration, and partial-quantity dialog
  focus retention.

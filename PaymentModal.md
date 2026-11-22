# PaymentModal.tsx — Review

Reviewed file: `src/components/modals/PaymentModal.tsx`

## Changes Applied
- Renamed the WebView message handler from `handleWebViewMessage` to `handleWebViewMessagePayload` (both the function declaration and the `onMessage` prop usage).

## Notes
- The rename removes an ambiguous short handler name and makes the payload-handling responsibility clearer in this checkout modal.
- The file is a large in-app checkout / enrollment-sync modal with WebView injection, billing details autofill, and enrollment verification logic.

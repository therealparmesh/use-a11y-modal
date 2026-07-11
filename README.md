# use-a11y-modal

[![npm version](https://img.shields.io/npm/v/use-a11y-modal.svg)](https://www.npmjs.com/package/use-a11y-modal)
[![npm downloads](https://img.shields.io/npm/dt/use-a11y-modal.svg)](https://www.npmjs.com/package/use-a11y-modal)
[![Bun CI](https://github.com/therealparmesh/use-a11y-modal/actions/workflows/ci.yml/badge.svg)](https://github.com/therealparmesh/use-a11y-modal/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/use-a11y-modal.svg)](LICENSE)

Create accessible React modals with managed portals, focus, inert backgrounds,
and scroll locking with no runtime dependencies.

## Installation

```sh
npm install use-a11y-modal
```

Other package managers:

```sh
yarn add use-a11y-modal
pnpm add use-a11y-modal
bun add use-a11y-modal
```

## Usage

```jsx
import * as React from "react";
import { useA11yModal } from "use-a11y-modal";

export function Example() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { createPortal, modalProps, titleProps } = useA11yModal({
    id: "😎-id",
    isOpen,
    onClickOutside: () => setIsOpen(false),
    onEscapeKeyPress: () => setIsOpen(false),
  });

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open modal
      </button>

      {Array.from({ length: 50 }, (_, index) => (
        <p key={index}>Body Content</p>
      ))}

      {createPortal(
        <div className="overlay">
          <div className="modal" {...modalProps}>
            <h1 className="title" {...titleProps}>
              Modal Title
            </h1>
            <form>
              <label>
                Modal Field Label:
                <input />
              </label>
              <button type="button" onClick={() => setIsOpen(false)}>
                Close Modal
              </button>
              {Array.from({ length: 50 }, (_, index) => (
                <p key={index}>Modal Content</p>
              ))}
            </form>
          </div>
        </div>,
      )}
    </>
  );
}
```

When open, the hook creates a portal under `document.body`, makes its siblings
inert, locks body scrolling, moves focus into the modal, and restores document
state and focus when closed.

TypeScript declarations are included with the package.

## API

### `useA11yModal(options)`

Returns `createPortal`, `modalProps`, and `titleProps` for rendering and labeling
the modal.

#### `options`

| Option             | Default | Description                                    |
| ------------------ | ------- | ---------------------------------------------- |
| `id`               | —       | Required unique ID applied to the dialog.      |
| `isOpen`           | —       | Controls portal creation and modal behavior.   |
| `autoFocus`        | `true`  | Focus the first focusable element when opened. |
| `onClickOutside`   | —       | Handle mouse or touch interaction outside.     |
| `onEscapeKeyPress` | —       | Handle the Escape key.                         |

The application controls whether the modal closes; the callbacks do not change
`isOpen` themselves.

#### `createPortal(children)`

Renders children in the managed portal, or returns `null` while closed.

#### `modalProps`

Accessibility props for the dialog element.

#### `titleProps`

Props for the element that labels the dialog.

## Runtime requirements

- React and React DOM 16.8 or newer
- An ESM-compatible runtime or bundler
- A browser with native [`inert`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert) support

Server-side imports are safe; DOM work begins only after the hook mounts in a
browser.

### Legacy browsers

The library does not bundle an `inert` polyfill. If your supported browser set
requires one, install it in your application and import it once in the browser
entry point before rendering React:

```sh
npm install wicg-inert
```

```js
import "wicg-inert";
```

## Development

Run the test suite:

```sh
bun run test
```

Inspect the package contents before publishing:

```sh
bun pm pack --dry-run
```

## License

[MIT](LICENSE)

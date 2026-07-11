import { afterEach, describe, expect, test } from "bun:test";

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { useA11yModal } from "../src/index.js";

let root;
let container;

function Modal({ id = "example", isOpen, onClickOutside, onEscapeKeyPress }) {
  const { createPortal, modalProps, titleProps } = useA11yModal({
    id,
    isOpen,
    onClickOutside,
    onEscapeKeyPress,
  });

  return createPortal(
    createElement(
      "div",
      modalProps,
      createElement("h2", titleProps, "Title"),
      createElement("a", { href: "#target" }, "Focusable link"),
    ),
  );
}

function mount(element) {
  container = document.createElement("main");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(element));
}

afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  document.body.replaceChildren();
  document.body.removeAttribute("style");
});

describe("useA11yModal", () => {
  test("creates a portal and restores document state when closed", () => {
    container = document.createElement("main");
    container.setAttribute("aria-hidden", "false");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => root.render(createElement(Modal, { isOpen: true })));
    expect(document.querySelector("#example")).not.toBeNull();
    expect(container.getAttribute("inert")).toBe("");
    expect(document.body.style.overflow).toBe("hidden");

    act(() => root.render(createElement(Modal, { isOpen: false })));
    expect(document.querySelector("#example")).toBeNull();
    expect(container.hasAttribute("inert")).toBe(false);
    expect(container.getAttribute("aria-hidden")).toBe("false");
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  test("focuses href elements and restores the previous focus", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    mount(createElement(Modal, { isOpen: true }));

    await act(async () => window.happyDOM.waitUntilComplete());
    expect(document.activeElement?.textContent).toBe("Focusable link");

    act(() => root.render(createElement(Modal, { isOpen: false })));
    await act(async () => window.happyDOM.waitUntilComplete());
    expect(document.activeElement).toBe(trigger);
  });

  test("uses the latest outside-click and Escape callbacks", () => {
    const calls = [];
    mount(
      createElement(Modal, {
        isOpen: true,
        onClickOutside: () => calls.push("old outside"),
        onEscapeKeyPress: () => calls.push("old escape"),
      }),
    );

    act(() =>
      root.render(
        createElement(Modal, {
          isOpen: true,
          onClickOutside: () => calls.push("outside"),
          onEscapeKeyPress: () => calls.push("escape"),
        }),
      ),
    );
    act(() => container.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    act(() =>
      document.body.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })),
    );

    expect(calls).toEqual(["outside", "escape"]);
  });

  test("handles outside interaction when callbacks are omitted", () => {
    mount(createElement(Modal, { isOpen: true }));

    expect(() => {
      act(() => container.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
      act(() =>
        document.body.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })),
      );
    }).not.toThrow();
  });

  test("keeps the background inert when nested modals close out of order", () => {
    function Nested({ firstOpen, secondOpen }) {
      return createElement(
        "div",
        null,
        createElement(Modal, { id: "first", isOpen: firstOpen }),
        createElement(Modal, { id: "second", isOpen: secondOpen }),
      );
    }

    mount(createElement(Nested, { firstOpen: true, secondOpen: true }));
    expect(container.getAttribute("inert")).toBe("");

    act(() => root.render(createElement(Nested, { firstOpen: false, secondOpen: true })));
    expect(container.getAttribute("inert")).toBe("");
    expect(document.body.style.overflow).toBe("hidden");

    act(() => root.render(createElement(Nested, { firstOpen: false, secondOpen: false })));
    expect(container.hasAttribute("inert")).toBe(false);
  });

  test("cancels pending autofocus work during cleanup", () => {
    const originalRequest = window.requestAnimationFrame;
    const originalCancel = window.cancelAnimationFrame;
    const cancelledFrames = [];

    window.requestAnimationFrame = () => 42;
    window.cancelAnimationFrame = (frame) => cancelledFrames.push(frame);

    try {
      mount(createElement(Modal, { isOpen: true }));
      act(() => root.render(createElement(Modal, { isOpen: false })));
      expect(cancelledFrames).toContain(42);
    } finally {
      window.requestAnimationFrame = originalRequest;
      window.cancelAnimationFrame = originalCancel;
    }
  });
});

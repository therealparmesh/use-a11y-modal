import React from "react";
import { createPortal as createReactPortal } from "react-dom";

const TYPE = "a11y-modal-portal";
const NOOP = () => {};
const hiddenNodeStates = new WeakMap();
let bodyLockCount = 0;
let bodyOverflow;

const hideNode = (node) => {
  const existingState = hiddenNodeStates.get(node);

  if (existingState) {
    existingState.count += 1;
    return;
  }

  hiddenNodeStates.set(node, {
    count: 1,
    inert: node.getAttribute("inert"),
    hidden: node.getAttribute("aria-hidden"),
  });

  node.setAttribute("inert", "");
  node.setAttribute("aria-hidden", "true");
};

const showNode = (node) => {
  const state = hiddenNodeStates.get(node);
  if (!state) return;

  state.count -= 1;
  if (state.count > 0) return;

  state.inert === null ? node.removeAttribute("inert") : node.setAttribute("inert", state.inert);

  state.hidden === null
    ? node.removeAttribute("aria-hidden")
    : node.setAttribute("aria-hidden", state.hidden);

  hiddenNodeStates.delete(node);
};

const lockBody = () => {
  if (bodyLockCount === 0) {
    bodyOverflow = window.getComputedStyle(document.body).overflow;
  }
  bodyLockCount += 1;
  document.body.style.overflow = "hidden";
};

const unlockBody = () => {
  bodyLockCount -= 1;
  if (bodyLockCount === 0) document.body.style.overflow = bodyOverflow;
};

export const useA11yModal = ({
  id,
  isOpen,
  autoFocus = true,
  onClickOutside = NOOP,
  onEscapeKeyPress = NOOP,
}) => {
  const labelId = `${id}_label`;
  const portalId = `${id}_portal`;
  const portalRef = React.useRef(null);
  const restoreFocusFrame = React.useRef(null);
  const [, forceUpdate] = React.useState({});

  React.useEffect(() => {
    if (!isOpen) return;

    const portalNode = (portalRef.current = document.createElement(TYPE));

    portalNode.setAttribute("id", portalId);
    portalNode.setAttribute("role", "region");
    document.body.appendChild(portalNode);
    forceUpdate({});

    return () => {
      portalRef.current = null;
      portalNode.remove();
      forceUpdate({});
    };
  }, [id, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (restoreFocusFrame.current !== null) {
      window.cancelAnimationFrame(restoreFocusFrame.current);
      restoreFocusFrame.current = null;
    }

    const activeElement = document.activeElement;
    let focusFrame = null;

    if (autoFocus) {
      focusFrame = window.requestAnimationFrame(() => {
        const focusElement =
          document.querySelector(`
            #${id} input:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} textarea:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} select:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} button:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} iframe:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} object:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} embed:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} [tabindex]:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} [href]:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} [contenteditable]:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} [autofocus]:not([tabindex="-1"]):not([disabled]):not([readonly])
          `) || document.querySelector(`#${id}`);

        if (focusElement) focusElement.focus();
      });
    }

    lockBody();

    const clickOutsideListener = (event) => {
      const portalNode = document.querySelector(`#${portalId}`);
      const modalNode = document.querySelector(`#${id}`);

      if (
        portalNode &&
        portalNode.getAttribute("inert") !== "" &&
        modalNode &&
        !modalNode.contains(event.target)
      ) {
        onClickOutside(event);
      }
    };

    const escapeKeyPressListener = (event) => {
      const portalNode = document.querySelector(`#${portalId}`);

      if (portalNode && portalNode.getAttribute("inert") !== "" && event.key === "Escape") {
        onEscapeKeyPress(event);
      }
    };

    document.body.addEventListener("mousedown", clickOutsideListener);
    document.body.addEventListener("touchstart", clickOutsideListener);
    document.body.addEventListener("keydown", escapeKeyPressListener);

    const hiddenNodes = Array.from(document.querySelectorAll("body > *")).filter(
      (rootNode) =>
        rootNode.tagName !== TYPE.toUpperCase() || rootNode.getAttribute("id") !== portalId,
    );

    hiddenNodes.forEach(hideNode);

    return () => {
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame);
      hiddenNodes.forEach(showNode);

      document.body.removeEventListener("mousedown", clickOutsideListener);
      document.body.removeEventListener("touchstart", clickOutsideListener);
      document.body.removeEventListener("keydown", escapeKeyPressListener);

      unlockBody();

      restoreFocusFrame.current = window.requestAnimationFrame(() => {
        restoreFocusFrame.current = null;
        if (activeElement) activeElement.focus();
      });
    };
  }, [id, isOpen, autoFocus, onClickOutside, onEscapeKeyPress]);

  React.useEffect(
    () => () => {
      if (restoreFocusFrame.current !== null) {
        window.cancelAnimationFrame(restoreFocusFrame.current);
      }
    },
    [],
  );

  return React.useMemo(
    () => ({
      createPortal: (children) =>
        portalRef.current ? createReactPortal(children, portalRef.current) : null,
      modalProps: {
        id,
        role: "dialog",
        tabIndex: -1,
        "aria-labelledby": labelId,
        "aria-modal": true,
      },
      titleProps: {
        id: labelId,
        role: "heading",
        tabIndex: -1,
      },
    }),
    [id],
  );
};

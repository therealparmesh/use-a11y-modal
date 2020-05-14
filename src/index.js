import React from 'react';
import ReactDOM from 'react-dom';

const nativeInert = Element.prototype.hasOwnProperty('inert');

if (!nativeInert) {
  require('wicg-inert');
}

const TYPE = 'a11y-modal-portal';

export const useA11yModal = ({
  id,
  isOpen,
  autoFocus = true,
  onClickOutside = () => {},
  onEscapeKeyPress = () => {},
}) => {
  const labelId = `${id}_label`;
  const portalId = `${id}_portal`;
  const portalRef = React.useRef(null);
  const [, forceUpdate] = React.useState({});

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const portalNode = (portalRef.current = document.createElement(TYPE));

    portalNode.setAttribute('id', portalId);
    portalNode.setAttribute('role', 'region');
    document.body.appendChild(portalNode);
    forceUpdate({});

    return () => {
      portalRef.current = null;

      document.body.removeChild(portalNode);
      forceUpdate({});
    };
  }, [id, isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const activeElement = document.activeElement;

    if (autoFocus) {
      window.requestAnimationFrame(() => {
        const focusElement =
          document.querySelector(`
            #${id} input:not([tabindex="-1"]):not([disabled]):not([readonly]), 
            #${id} textarea:not([tabindex="-1"]):not([disabled]):not([readonly]), 
            #${id} select:not([tabindex="-1"]):not([disabled]):not([readonly]), 
            #${id} button:not([tabindex="-1"]):not([disabled]):not([readonly]), 
            #${id} iframe:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} object:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} embed:not([tabindex="-1"]):not([disabled]):not([readonly])
            #${id} [tabindex]:not([tabindex="-1"]):not([disabled]):not([readonly])
            #${id} [href]:not([tabindex="-1"]):not([disabled]):not([readonly]), 
            #${id} [contenteditable]:not([tabindex="-1"]):not([disabled]):not([readonly]),
            #${id} [autofocus]:not([tabindex="-1"]):not([disabled]):not([readonly])
          `) || document.querySelector(`#${id}`);

        if (focusElement) {
          focusElement.focus();
        }
      });
    }

    const overflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const clickOutsideListener = (e) => {
      if (
        document.querySelector(`#${portalId}`) &&
        document.querySelector(`#${portalId}`).getAttribute('inert') !== '' &&
        document.querySelector(`#${id}`) &&
        !document.querySelector(`#${id}`).contains(e.target)
      ) {
        onClickOutside(e);
      }
    };

    const escapeKeyPressListener = (e) => {
      if (
        document.querySelector(`#${portalId}`) &&
        document.querySelector(`#${portalId}`).getAttribute('inert') !== '' &&
        e.key === 'Escape'
      ) {
        onEscapeKeyPress(e);
      }
    };

    document.body.addEventListener('mousedown', clickOutsideListener);
    document.body.addEventListener('touchstart', clickOutsideListener);
    document.body.addEventListener('keydown', escapeKeyPressListener);

    const hiddenNodes = Array.from(document.querySelectorAll(`body > *`))
      .map((rootNode) => {
        if (
          rootNode.tagName === TYPE.toUpperCase() &&
          rootNode.getAttribute('id') === portalId
        ) {
          return null;
        }

        return {
          node: rootNode,
          inert: rootNode.getAttribute('inert'),
          hidden: nativeInert ? rootNode.getAttribute('aria-hidden') : null,
        };
      })
      .filter((hiddenNode) => hiddenNode !== null);

    hiddenNodes.forEach((hiddenNode) => {
      hiddenNode.node.setAttribute('inert', '');

      if (nativeInert) {
        hiddenNode.node.setAttribute('aria-hidden', 'true');
      }
    });

    return () => {
      hiddenNodes.forEach((hiddenNode) => {
        hiddenNode.inert === null
          ? hiddenNode.node.removeAttribute('inert')
          : hiddenNode.node.setAttribute('inert', hiddenNode.inert);

        if (nativeInert) {
          hiddenNode.hidden === null
            ? hiddenNode.node.removeAttribute('aria-hidden')
            : hiddenNode.node.setAttribute('aria-hidden', hiddenNode.hidden);
        }
      });

      document.body.removeEventListener('mousedown', clickOutsideListener);
      document.body.removeEventListener('touchstart', clickOutsideListener);
      document.body.removeEventListener('keydown', escapeKeyPressListener);

      document.body.style.overflow = overflow;

      window.requestAnimationFrame(() => {
        if (activeElement) {
          activeElement.focus();
        }
      });
    };
  }, [id, isOpen, autoFocus]);

  return React.useMemo(
    () => ({
      createPortal: (children) =>
        portalRef.current
          ? ReactDOM.createPortal(children, portalRef.current)
          : null,
      modalProps: {
        id,
        role: 'dialog',
        tabIndex: -1,
        'aria-labelledby': labelId,
        'aria-modal': true,
      },
      titleProps: {
        id: labelId,
        role: 'heading',
        tabIndex: -1,
      },
    }),
    [id],
  );
};

import React from 'react';
import ReactDOM from 'react-dom';

const nativeInert = Element.prototype.hasOwnProperty('inert');

if (!nativeInert) {
  require('wicg-inert');
}

const TYPE = 'a11y-modal-portal';

export const useA11yModal = ({
  id,
  autoFocus = true,
  clickOutside = true,
  escapeKeyPress = true,
  initialIsOpen = false,
  isOpen: givenIsOpen,
  onDismiss = () => {},
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(initialIsOpen);
  const isControlled = React.useRef(givenIsOpen !== undefined);
  const isOpen = isControlled.current ? givenIsOpen : isModalOpen;

  const openModal = React.useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const portalId = `${id}_portal`;
  const labelId = `${id}_label`;

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
        onDismiss(e);
        closeModal();
      }
    };

    const escapeKeyPressListener = (e) => {
      if (
        document.querySelector(`#${portalId}`) &&
        document.querySelector(`#${portalId}`).getAttribute('inert') !== '' &&
        e.key === 'Escape'
      ) {
        onDismiss(e);
        closeModal();
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
        hiddenNodes.forEach((hiddenNode) => {
          hiddenNode.node.setAttribute('aria-hidden', 'true');
        });
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

      if (activeElement) {
        window.requestAnimationFrame(() => {
          activeElement.focus();
        });
      }
    };
  }, [
    id,
    autoFocus,
    clickOutside,
    escapeKeyPress,
    isOpen,
    closeModal,
    portalId,
  ]);

  return React.useMemo(
    () => ({
      isOpen,
      openModal,
      closeModal,
      portalProps: {
        id: portalId,
        role: 'region',
      },
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
      },
    }),
    [id, isOpen, openModal, closeModal, portalId, labelId],
  );
};

export const A11yModalPortal = ({ children, id, role }) => {
  const portalRef = React.useRef(null);
  const [, forceUpdate] = React.useState({});

  React.useEffect(() => {
    const portalNode = (portalRef.current = document.createElement(TYPE));

    portalNode.setAttribute('id', id);
    portalNode.setAttribute('role', role);
    document.body.appendChild(portalNode);
    forceUpdate({});

    return () => {
      portalRef.current = null;

      document.body.removeChild(portalNode);
      forceUpdate({});
    };
  }, [id, role]);

  return portalRef.current
    ? ReactDOM.createPortal(children, portalRef.current)
    : null;
};

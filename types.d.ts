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
  onClickOutside = () => {},
  onEscapeKeyPress = () => {},
  setIsOpen: givenSetIsOpen,
}) => {
  const isControlled = React.useRef(
    !(givenIsOpen === undefined || givenSetIsOpen === undefined),
  );

  const [isOpen, setIsOpen] = React.useState(
    isControlled.current ? givenIsOpen : initialIsOpen,
  );

  React.useEffect(() => {
    if (isControlled.current && givenIsOpen !== isOpen) {
      setIsOpen(givenIsOpen);
    }
  }, [givenIsOpen, isOpen]);

  const openModal = React.useCallback(() => {
    isControlled.current ? givenSetIsOpen(true) : setIsOpen(true);
  }, [givenSetIsOpen]);

  const closeModal = React.useCallback(() => {
    isControlled.current ? givenSetIsOpen(false) : setIsOpen(false);
  }, [givenSetIsOpen]);

  const portalId = `${id}_portal`;
  const labelId = `${id}_label`;

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const activeElement = document.activeElement;

    window.requestAnimationFrame(() => {
      if (autoFocus) {
        const focusElement =
          document.querySelector(`
            #${id} input:not([tabindex="-1"]):not([disabled]), 
            #${id} textarea:not([tabindex="-1"]):not([disabled]), 
            #${id} select:not([tabindex="-1"]):not([disabled]), 
            #${id} button:not([tabindex="-1"]):not([disabled]), 
            #${id} [href]:not([tabindex="-1"]):not([disabled]), 
            #${id} [tabindex]:not([tabindex="-1"]):not([disabled])
          `) || document.querySelector(`#${id}`);

        if (focusElement) {
          focusElement.focus();
        }
      }
    });

    const overflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const clickOutsideListener = (e) => {
      if (
        document.querySelector(`#${portalId}`) &&
        document.querySelector(`#${portalId}`).getAttribute('inert') !== '' &&
        document.querySelector(`#${id}`) &&
        !document.querySelector(`#${id}`).contains(e.target) &&
        clickOutside
      ) {
        onClickOutside(e);
        closeModal();
      }
    };

    const escapeKeyPressListener = (e) => {
      if (
        document.querySelector(`#${portalId}`) &&
        document.querySelector(`#${portalId}`).getAttribute('inert') !== '' &&
        e.key === 'Escape' &&
        escapeKeyPress
      ) {
        onEscapeKeyPress(e);
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

      window.requestAnimationFrame(() => {
        activeElement.focus();
      });
    };
  }, [id, autoFocus, clickOutside, escapeKeyPress, isOpen]);

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
        tabIndex: 0,
        'aria-labelledby': labelId,
        'aria-modal': true,
      },
      titleProps: {
        id: labelId,
        role: 'heading',
      },
    }),
    [id, isOpen],
  );
};

export const A11yModalPortal = ({ children, id, role }) => {
  const portalRef = React.useRef(null);
  const [, forceUpdate] = React.useState({});

  React.useLayoutEffect(() => {
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

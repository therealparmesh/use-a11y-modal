import React from 'react';
import ReactDOM from 'react-dom';
import 'wicg-inert';

const TYPE = 'a11y-modal-portal';

export const useA11yModal = (
  id,
  isOpen,
  onClose = () => {},
  { disableClickOutside, disableEscapeKey } = {},
) => {
  const portalId = `${id}_portal`;
  const labelId = `${id}_label`;

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const activeElement = document.activeElement;

    window.requestAnimationFrame(() => {
      if (document.querySelector(`#${id}`)) {
        document.querySelector(`#${id}`).focus();
      }
    });

    const overflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const clickOutsideListener = (e) => {
      if (
        document.querySelector(`#${portalId}`) &&
        document.querySelector(`#${portalId}`).getAttribute('aria-hidden') !==
          'true' &&
        document.querySelector(`#${portalId}`).getAttribute('inert') !==
          'true' &&
        document.querySelector(`#${id}`) &&
        !document.querySelector(`#${id}`).contains(e.target) &&
        !disableClickOutside
      ) {
        onClose(e);
      }
    };

    const escapeKeyListener = (e) => {
      if (
        document.querySelector(`#${portalId}`) &&
        document.querySelector(`#${portalId}`).getAttribute('aria-hidden') !==
          'true' &&
        document.querySelector(`#${portalId}`).getAttribute('inert') !==
          'true' &&
        e.key === 'Escape' &&
        !disableEscapeKey
      ) {
        onClose(e);
      }
    };

    document.body.addEventListener('mousedown', clickOutsideListener);
    document.body.addEventListener('touchstart', clickOutsideListener);
    document.body.addEventListener('keydown', escapeKeyListener);

    const hiddenNodes = Array.from(document.querySelectorAll(`body > *`))
      .map((rootNode) => {
        if (
          rootNode.tagName === TYPE.toUpperCase() &&
          rootNode.id === portalId
        ) {
          return null;
        }

        return {
          node: rootNode,
          hidden: rootNode.getAttribute('aria-hidden'),
          inert: rootNode.getAttribute('inert'),
        };
      })
      .filter((hiddenNode) => hiddenNode !== null);

    hiddenNodes.forEach((hiddenNode) => {
      hiddenNode.node.setAttribute('aria-hidden', 'true');
      hiddenNode.node.setAttribute('inert', 'true');
    });

    return () => {
      document.body.style.overflow = overflow;

      document.body.removeEventListener('mousedown', clickOutsideListener);
      document.body.removeEventListener('touchstart', clickOutsideListener);
      document.body.removeEventListener('keydown', escapeKeyListener);

      hiddenNodes.forEach((hiddenNode) => {
        hiddenNode.hidden === null
          ? hiddenNode.node.removeAttribute('aria-hidden')
          : hiddenNode.node.setAttribute('aria-hidden', hiddenNode.hidden);

        hiddenNode.inert === null
          ? hiddenNode.node.removeAttribute('inert')
          : hiddenNode.node.setAttribute('intert', hiddenNode.inert);
      });

      window.requestAnimationFrame(() => {
        activeElement.focus();
      });
    };
  }, [id, isOpen, portalId, labelId]);

  return React.useMemo(
    () => [
      {
        id: portalId,
        role: 'region',
      },
      {
        id,
        role: 'dialog',
        tabIndex: 0,
        'aria-labelledby': `${id}_label`,
        'aria-modal': true,
      },
      {
        id: labelId,
        role: 'heading',
      },
    ],
    [id, portalId, labelId],
  );
};

export const A11yModalPortal = ({ children, id }) => {
  const portalRef = React.useRef(null);
  const [, forceUpdate] = React.useState({});

  React.useLayoutEffect(() => {
    const portalNode = (portalRef.current = document.createElement(TYPE));
    portalNode.id = id;

    document.body.appendChild(portalNode);
    forceUpdate({});

    return () => {
      portalRef.current = null;

      document.body.removeChild(portalNode);
      forceUpdate({});
    };
  }, [id]);

  return portalRef.current
    ? ReactDOM.createPortal(children, portalRef.current)
    : null;
};

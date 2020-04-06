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
        document.querySelector(`#${portalId}`).getAttribute('inert') !== '' &&
        document.querySelector(`#${portalId}`).getAttribute('aria-hidden') !==
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
        document.querySelector(`#${portalId}`).getAttribute('inert') !== '' &&
        document.querySelector(`#${portalId}`).getAttribute('aria-hidden') !==
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
          inert: rootNode.getAttribute('inert'),
          hidden: rootNode.getAttribute('aria-hidden'),
        };
      })
      .filter((hiddenNode) => hiddenNode !== null);

    hiddenNodes.forEach((hiddenNode) => {
      hiddenNode.node.setAttribute('inert', '');
    });

    window.requestAnimationFrame(() => {
      hiddenNodes.forEach((hiddenNode) => {
        hiddenNode.node.setAttribute('aria-hidden', 'true');
      });
    });

    return () => {
      hiddenNodes.forEach((hiddenNode) => {
        hiddenNode.inert === null
          ? hiddenNode.node.removeAttribute('inert')
          : hiddenNode.node.setAttribute('inert', hiddenNode.inert);
      });

      window.requestAnimationFrame(() => {
        hiddenNodes.forEach((hiddenNode) => {
          hiddenNode.hidden === null
            ? hiddenNode.node.removeAttribute('aria-hidden')
            : hiddenNode.node.setAttribute('aria-hidden', hiddenNode.hidden);
        });
      });

      document.body.removeEventListener('mousedown', clickOutsideListener);
      document.body.removeEventListener('touchstart', clickOutsideListener);
      document.body.removeEventListener('keydown', escapeKeyListener);

      document.body.style.overflow = overflow;

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

import React from 'react';
import ReactDOM from 'react-dom';
import FocusLock from 'react-focus-lock';

const TYPE = 'a11y-modal-portal';

const makeA11yModalPortal = (ref) => ({ children }) => {
  const [, forceUpdate] = React.useState({});

  React.useLayoutEffect(() => {
    const node = (ref.current = document.createElement(TYPE));

    document.body.appendChild(node);
    forceUpdate({});

    return () => {
      document.body.removeChild(node);
    };
  }, []);

  return ref.current
    ? ReactDOM.createPortal(<FocusLock>{children}</FocusLock>, ref.current)
    : null;
};

export const useA11yModal = (isOpen) => {
  const portalRef = React.useRef();
  const A11yModalPortal = React.useRef(makeA11yModalPortal(portalRef));

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const overflow = window.getComputedStyle(document.body).overflow;

    document.body.style.overflow = 'hidden';

    const hiddenNodes = Array.from(document.querySelectorAll(`body > *`))
      .map((rootNode) => {
        if (rootNode === portalRef.current) {
          return undefined;
        }

        return {
          node: rootNode,
          hidden: rootNode.getAttribute('aria-hidden'),
        };
      })
      .filter((hiddenNode) => hiddenNode);

    hiddenNodes.forEach((hiddenNode) => {
      hiddenNode.node.setAttribute('aria-hidden', 'true');
    });

    return () => {
      document.body.style.overflow = overflow;

      hiddenNodes.forEach((hiddenNode) => {
        if (hiddenNode.hidden === null) {
          hiddenNode.node.removeAttribute('aria-hidden');
        } else {
          hiddenNode.node.setAttribute('aria-hidden', hiddenNode.hidden);
        }
      });
    };
  }, [isOpen]);

  return A11yModalPortal.current;
};

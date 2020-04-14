export const useA11yModal: (options: {
  id: React.HTMLAttributes<Element>['id'];
  autoFocus?: boolean;
  clickOutside?: boolean;
  escapeKeyPress?: boolean;
  isOpen?: boolean;
  onClickOutside?: (e: MouseEvent | TouchEvent) => void;
  onEscapeKeyPress?: (e: KeyboardEvent) => void;
  setIsOpen?: (value: boolean) => void;
}) => {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  portalProps: {
    id: React.HTMLAttributes<Element>['id'];
    role: React.HTMLAttributes<Element>['role'];
  };
  modalProps: {
    id: React.HTMLAttributes<Element>['id'];
    role: React.HTMLAttributes<Element>['role'];
    tabIndex: React.HTMLAttributes<Element>['tabIndex'];
    'aria-labelledby': React.HTMLAttributes<Element>['aria-labelledby'];
    'aria-modal': React.HTMLAttributes<Element>['aria-modal'];
  };
  titleProps: {
    id: React.HTMLAttributes<Element>['id'];
    role: React.HTMLAttributes<Element>['role'];
  };
};

export const A11yModalPortal: React.FC<{
  children: ReactNode;
  id: React.HTMLAttributes<Element>['id'];
  role: React.HTMLAttributes<Element>['role'];
}>;

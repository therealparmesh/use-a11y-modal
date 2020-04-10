export const useA11yModal: (
  id: React.HTMLAttributes<Element>['id'],
  isOpen: boolean,
  onClose?: (e: MouseEvent | TouchEvent | KeyboardEvent) => void,
  options?: {
    disableClickOutside?: boolean;
    disableEscapeKey?: boolean;
  },
) => [
  {
    id: React.HTMLAttributes<Element>['id'];
    role: React.HTMLAttributes<Element>['role'];
  },
  {
    id: React.HTMLAttributes<Element>['id'];
    role: React.HTMLAttributes<Element>['role'];
    tabIndex: React.HTMLAttributes<Element>['tabIndex'];
    'aria-labelledby': React.HTMLAttributes<Element>['aria-labelledby'];
    'aria-modal': React.HTMLAttributes<Element>['aria-modal'];
  },
  {
    id: React.HTMLAttributes<Element>['id'];
    role: React.HTMLAttributes<Element>['role'];
  },
];

export const A11yModalPortal: React.FC<{
  children: ReactNode;
  id: React.HTMLAttributes<Element>['id'];
  role: React.HTMLAttributes<Element>['role'];
}>;

import type { ReactNode, ReactPortal } from "react";

export interface UseA11yModalOptions {
  id: string;
  isOpen: boolean;
  autoFocus?: boolean;
  onClickOutside?: (e: MouseEvent | TouchEvent) => void;
  onEscapeKeyPress?: (e: KeyboardEvent) => void;
}

export interface UseA11yModalResult {
  createPortal: (children: ReactNode) => ReactPortal | null;
  modalProps: {
    id: string;
    role: "dialog";
    tabIndex: -1;
    "aria-labelledby": string;
    "aria-modal": true;
  };
  titleProps: {
    id: string;
    role: "heading";
    tabIndex: -1;
  };
}

export function useA11yModal(options: UseA11yModalOptions): UseA11yModalResult;

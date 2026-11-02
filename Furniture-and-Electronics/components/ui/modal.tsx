"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  backdropClassName?: string;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  offsetSidebar?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  containerClassName = "max-w-2xl",
  backdropClassName = "bg-black/60 backdrop-blur-xs",
  showCloseButton = false,
  closeOnOutsideClick = true,
  offsetSidebar = true,
}: ModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-y-0 right-0 ${offsetSidebar ? "left-0 md:left-[286px]" : "left-0"} z-50 grid place-items-center p-3 sm:p-4 overflow-y-auto`}>
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-y-0 right-0 ${offsetSidebar ? "left-0 md:left-[286px]" : "left-0"} h-full w-full ${backdropClassName}`}
            onClick={closeOnOutsideClick ? onClose : undefined}
          />

          {/* Animated Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.12 } }}
            transition={{ type: "spring", damping: 26, stiffness: 360 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 w-full flex flex-col shadow-2xl overflow-hidden rounded-2xl ${containerClassName} ${className}`}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 z-20 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full h-7 w-7 text-gray-500 hover:text-gray-900 transition"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;


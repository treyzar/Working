// Modal.tsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Placement = "center" | "left" | "right" | "top" | "bottom";
type FooterAlign = "left" | "center" | "right" | "between";
type Size = "sm" | "md" | "lg" | "xl";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;

  placement?: Placement;

  size?: Size;

  sheetSize?: number | string;

  footerAlign?: FooterAlign;

  footer?: React.ReactNode | null;

  closeOnBackdrop?: boolean;

  closeOnEsc?: boolean;

  surfaceBg?: string;

  chromeBg?: string;

  contentClassName?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  placement = "center",
  size = "lg",
  sheetSize = 420,
  footerAlign = "right",
  footer,
  closeOnBackdrop = true,
  closeOnEsc = true,
  surfaceBg = "var(--c-bg-100, #fff)",
  chromeBg = "var(--c-bg-200, #eeeeeeff)",
  contentClassName = "",
}: ModalProps) {
  const portalRef = useRef<HTMLDivElement | null>(null);
  if (!portalRef.current) portalRef.current = document.createElement("div");

  useEffect(() => {
    const el = portalRef.current!;
    document.body.appendChild(el);
    return () => {
      el.remove();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  const onBackdropMouseDown = (e: React.MouseEvent) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose();
  };

  const dim = typeof sheetSize === "number" ? `${sheetSize}px` : sheetSize;

  const rootStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1055,
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,.5)",
  };

  const panelStyleBase: React.CSSProperties = {
    position: "absolute",
    display: "flex",
    alignItems: "stretch",
    pointerEvents: "none",
  };

  const contentStyleBase: React.CSSProperties = {
    background: surfaceBg, // единый фон тела
    borderRadius: "var(--radius-md, 10px)",
    boxShadow: "var(--shadow-md, 0 10px 30px rgba(0,0,0,.15))",
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    maxHeight: "100%",
    overflow: "hidden",
  };

  let panelStyle = { ...panelStyleBase };
  const contentStyle = { ...contentStyleBase } as React.CSSProperties;

  const sizeWidth =
    size === "sm"
      ? "28rem"
      : size === "lg"
      ? "48rem"
      : size === "xl"
      ? "64rem"
      : "36rem";

  if (placement === "center") {
    panelStyle = {
      ...panelStyle,
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
    };
    contentStyle.width = sizeWidth;
    contentStyle.maxWidth = "min(90vw, 64rem)";
  } else if (placement === "left") {
    panelStyle = { ...panelStyle, top: 0, bottom: 0, left: 0 };
    contentStyle.height = "100%";
    contentStyle.borderRadius = 0;
    contentStyle.width = dim;
  } else if (placement === "right") {
    panelStyle = { ...panelStyle, top: 0, bottom: 0, right: 0 };
    contentStyle.height = "100%";
    contentStyle.borderRadius = 0;
    contentStyle.width = dim;
  } else if (placement === "top") {
    panelStyle = {
      ...panelStyle,
      left: "50%",
      top: 24,
      transform: "translateX(-50%)",
    };
    contentStyle.width = sizeWidth;
    contentStyle.maxWidth = "min(90vw, 64rem)";
    contentStyle.height = dim;
  } else if (placement === "bottom") {
    panelStyle = {
      ...panelStyle,
      left: "50%",
      bottom: 0,
      transform: "translateX(-50%)",
    };
    contentStyle.width = sizeWidth;
    contentStyle.maxWidth = "min(90vw, 64rem)";
    contentStyle.height = dim;
  }

  const borderColor = "var(--border, rgba(0,0,0,.08))";

  const headerStyle: React.CSSProperties = {
    padding: "1rem 1.25rem",
    borderBottom: `1px solid ${borderColor}`,
    background: chromeBg,
  };

  const bodyStyle: React.CSSProperties = {
    padding: "1rem 1.25rem",
    overflow: "auto",
  };

  const footerJustify =
    (footerAlign === "left" && "flex-start") ||
    (footerAlign === "center" && "center") ||
    (footerAlign === "between" && "space-between") ||
    "flex-end";

  const footerStyle: React.CSSProperties = {
    padding: "0.75rem 1.25rem",
    borderTop: `1px solid ${borderColor}`,
    background: chromeBg,
    display: "flex",
    justifyContent: footerJustify,
    gap: ".5rem",
  };

  return createPortal(
    <div
      style={rootStyle}
      aria-modal="true"
      role="dialog"
      onMouseDown={onBackdropMouseDown}
    >
      <div style={overlayStyle} />
      <div style={panelStyle} onMouseDown={(e) => e.stopPropagation()}>
        <div
          className={`modal-content card-bs is-static ${
            contentClassName || ""
          }`}
          style={contentStyle}
        >
          <div className="modal-header" style={headerStyle}>
            <h5 className="modal-title" style={{ margin: 0 }}>
              {title}
            </h5>
            <button
              className="btn-close"
              aria-label="Закрыть"
              onClick={onClose}
            />
          </div>

          <div className="modal-body" style={bodyStyle}>
            {children}
          </div>

          {footer !== null && (
            <div className="modal-footer" style={footerStyle}>
              {footer ?? (
                <button className="btn btn-outline-secondary" onClick={onClose}>
                  Закрыть
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    portalRef.current
  );
}

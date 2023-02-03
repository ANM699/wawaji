import React, { useState } from "react";

export default function ImgButton({ children, enable = true }) {
  const [pd, setPd] = useState(false);
  return enable ? (
    <div
      onPointerDown={() => setPd(true)}
      onPointerUp={() => setPd(false)}
      style={{ transform: pd ? "scale(0.96)" : "scale(1)" }}
    >
      {children}
    </div>
  ) : (
    children
  );
}

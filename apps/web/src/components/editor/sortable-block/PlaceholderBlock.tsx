"use client";

type CallbackRef = (element: HTMLDivElement | null) => void;

interface PlaceholderBlockProps {
  refProp: CallbackRef;
  id: string;
}

export function PlaceholderBlock({ refProp, id }: PlaceholderBlockProps) {
  return (
    <div
      ref={refProp}
      id={id}
      className="canvas-drop-placeholder"
      style={{
        pointerEvents: "none",
        position: "relative",
        width: "100%",
        padding: "5px 0",
      }}
    >
      <div className="canvas-drop-line">
        <span className="canvas-drop-dot" />
      </div>
    </div>
  );
}

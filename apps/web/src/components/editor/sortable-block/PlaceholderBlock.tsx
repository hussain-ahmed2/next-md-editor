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
      style={{
        pointerEvents: "none",
        position: "relative",
        width: "100%",
        padding: "6px 0",
      }}
    >
      <div
        style={{
          height: 3,
          background: "var(--accent)",
          borderRadius: 1.5,
          position: "relative",
          width: "100%",
        }}
      >
        {/* Circular anchor dot */}
        <div
          style={{
            position: "absolute",
            left: -4,
            top: -2.5,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

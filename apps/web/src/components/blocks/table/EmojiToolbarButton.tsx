import { useState, useRef } from "react";
import { Smile } from "lucide-react";
import { EmojiPicker } from "../../editor/EmojiPicker";

export function EmojiToolbarButton() {
	const [emojiPicker, setEmojiPicker] = useState(false);
	const emojiBtnRef = useRef<HTMLButtonElement>(null);
	const [savedRange, setSavedRange] = useState<Range | null>(null);

	const handleEmoji = (emoji: string) => {
		setEmojiPicker(false);

		if (savedRange) {
			const selection = window.getSelection();
			if (selection) {
				selection.removeAllRanges();
				selection.addRange(savedRange);
			}
		}

		document.execCommand("insertText", false, emoji);

		const activeEl = document.activeElement;
		if (activeEl && (activeEl.tagName === "TD" || activeEl.tagName === "TH")) {
			activeEl.dispatchEvent(new Event("input", { bubbles: true }));
		}
	};

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 8 }}>
			<button
				ref={emojiBtnRef}
				onMouseDown={() => {
					// Save range on mouse down before any focus is lost
					const selection = window.getSelection();
					if (selection && selection.rangeCount > 0) {
						setSavedRange(selection.getRangeAt(0).cloneRange());
					}
				}}
				onClick={() => setEmojiPicker((p) => !p)}
				title="Emoji"
				style={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					background: emojiPicker ? "var(--accent)" : "transparent",
					border: "none",
					borderRadius: 4,
					padding: "4px 6px",
					cursor: "pointer",
					color: emojiPicker ? "#fff" : "var(--text-secondary)",
					transition: "all 0.12s",
				}}
				onMouseEnter={(e) => {
					if (!emojiPicker) {
						e.currentTarget.style.background = "var(--bg-elevated)";
						e.currentTarget.style.color = "var(--text-primary)";
					}
				}}
				onMouseLeave={(e) => {
					if (!emojiPicker) {
						e.currentTarget.style.background = "transparent";
						e.currentTarget.style.color = "var(--text-secondary)";
					}
				}}
			>
				<Smile size={14} />
			</button>
			{emojiPicker && (
				<EmojiPicker
					onSelect={handleEmoji}
					onClose={() => setEmojiPicker(false)}
					buttonRef={emojiBtnRef}
				/>
			)}
		</div>
	);
}

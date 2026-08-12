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
				className={emojiPicker ? "ide-btn active" : "ide-btn"}
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
					width: 26,
					padding: 0,
					transition: "background 0.1s, color 0.1s",
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

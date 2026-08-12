import { ReactNode } from "react";

interface FormatButtonProps {
	command: string;
	label: string;
	icon: ReactNode;
	active: boolean;
	onUpdateFormats: () => void;
}

export function FormatButton({ command, label, icon, active, onUpdateFormats }: FormatButtonProps) {
	return (
		<button
			title={label}
			className={active ? "ide-btn active" : "ide-btn"}
			onMouseDown={(e) => {
				e.preventDefault(); // Keep focus in contentEditable
				if (command === "code") {
					const selection = window.getSelection();
					if (!selection || selection.rangeCount === 0) return;
					const range = selection.getRangeAt(0);

					if (active) {
						// Unwrap: find the parent code node
						let node = selection.anchorNode;
						let codeNode: HTMLElement | null = null;
						while (node && node !== document.activeElement) {
							if (node.nodeName.toLowerCase() === "code") {
								codeNode = node as HTMLElement;
								break;
							}
							node = node.parentNode;
						}
						if (codeNode && codeNode.parentNode) {
							const parent = codeNode.parentNode;
							const firstChild = codeNode.firstChild;
							const lastChild = codeNode.lastChild;

							while (codeNode.firstChild) {
								parent.insertBefore(codeNode.firstChild, codeNode);
							}
							parent.removeChild(codeNode);

							if (firstChild && lastChild) {
								const newRange = document.createRange();
								// Try to select exactly the unwrapped text
								if (firstChild.nodeType === Node.TEXT_NODE) {
									newRange.setStart(firstChild, 0);
								} else {
									newRange.setStartBefore(firstChild);
								}
								if (lastChild.nodeType === Node.TEXT_NODE) {
									newRange.setEnd(lastChild, lastChild.textContent?.length || 0);
								} else {
									newRange.setEndAfter(lastChild);
								}
								selection.removeAllRanges();
								selection.addRange(newRange);
							}
						}
					} else {
						// Wrap
						const codeElement = document.createElement("code");
						codeElement.className = "lexical-code";
						try {
							codeElement.appendChild(range.extractContents());
							range.insertNode(codeElement);

							const newRange = document.createRange();
							newRange.selectNodeContents(codeElement);
							selection.removeAllRanges();
							selection.addRange(newRange);
						} catch {
							// fallback for complex selections
						}
					}
				} else if (command === "link") {
					const url = prompt("Enter URL:", "https://");
					if (url) document.execCommand("createLink", false, url);
				} else {
					document.execCommand(command, false);
				}

				// Force React onInput to fire by finding the active cell
				const activeEl = document.activeElement;
				if (activeEl && (activeEl.tagName === "TD" || activeEl.tagName === "TH")) {
					activeEl.dispatchEvent(new Event("input", { bubbles: true }));
				}
				onUpdateFormats();
			}}
			style={{
				width: 26,
				padding: 0,
				transition: "background 0.1s, color 0.1s",
			}}
		>
			{icon}
		</button>
	);
}

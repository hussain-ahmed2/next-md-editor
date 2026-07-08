import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { KEY_ARROW_RIGHT_COMMAND, COMMAND_PRIORITY_LOW, $getSelection, $isRangeSelection, $createTextNode, $isTextNode } from "lexical";

export function EscapeFormatPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => {
        let handled = false;
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const anchor = selection.anchor;
            const node = anchor.getNode();
            
            // Check if we are at the very end of a formatted text node
            if ($isTextNode(node) && anchor.offset === node.getTextContentSize() && node.getFormat() !== 0) {
              const nextSibling = node.getNextSibling();
              // If there is no node after this (we are at the end of the block)
              if (!nextSibling) {
                // Insert a physical unformatted space
                const spaceNode = $createTextNode(" ");
                spaceNode.setFormat(0);
                node.insertAfter(spaceNode);
                // CRITICAL: Select AFTER the space (offset 1) so the browser cursor is physically
                // detached from the boundary of the formatted node.
                const newSelection = spaceNode.select(1, 1);
                // ALSO CRITICAL: Force Lexical's internal format memory to 0 so the next keystroke doesn't inherit the code style.
                newSelection.format = 0;
                handled = true;
                event.preventDefault();
              }
            }
          }
        });
        return handled;
      },
      4 // COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  return null;
}

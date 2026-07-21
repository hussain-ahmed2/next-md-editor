"use client";

import React, { useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, EditorState, LexicalEditor, $createParagraphNode, $setSelection } from 'lexical';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TEXT_FORMAT_TRANSFORMERS, TEXT_MATCH_TRANSFORMERS } from '@lexical/markdown';
import { EscapeFormatPlugin } from './plugins/EscapeFormatPlugin';

const INLINE_MARKDOWN_TRANSFORMERS = [...TEXT_FORMAT_TRANSFORMERS, ...TEXT_MATCH_TRANSFORMERS];

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const EMAIL_MATCHER =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    if (match === null) return null;
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
    };
  },
  (text: string) => {
    const match = EMAIL_MATCHER.exec(text);
    if (match === null) return null;
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: `mailto:${fullMatch}`,
    };
  },
];

import { useEditorStore } from '@next-md-editor/editor-core';

interface LexicalRichTextProps {
  blockId: string;
  initialHtml?: string;
  placeholder?: string;
  autoFocus?: boolean;
  topUI?: React.ReactNode;
  contentStyle?: React.CSSProperties;
  onChangeOverride?: (html: string) => void;
}

const theme = {
  text: {
    bold: 'lexical-bold',
    italic: 'lexical-italic',
    underline: 'lexical-underline',
    strikethrough: 'lexical-strikethrough',
    underlineStrikethrough: 'lexical-underlineStrikethrough',
    code: 'lexical-code',
  },
  paragraph: 'lexical-paragraph',
  link: 'lexical-link',
  list: {
    ul: 'lexical-ul',
    ol: 'lexical-ol',
    listitem: 'lexical-listitem',
    nested: { listitem: 'lexical-nested-listitem' },
    ulDepth: ['lexical-ul-depth-1', 'lexical-ul-depth-2', 'lexical-ul-depth-3'],
    olDepth: ['lexical-ol-depth-1', 'lexical-ol-depth-2', 'lexical-ol-depth-3'],
  },
};

import { FloatingToolbarPlugin } from './plugins/FloatingToolbarPlugin';

// Plugin to load initial HTML
function HtmlSyncPlugin({ initialHtml }: { initialHtml: string }) {
  const [editor] = useLexicalComposerContext();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialHtml) {
        editor.update(() => {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialHtml, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          
          const root = $getRoot();
          root.clear();
          
          if (nodes.length > 0) {
            const p = $createParagraphNode();
            root.append(p);
            p.select();
            $insertNodes(nodes);

            // Cleanup any lingering empty paragraphs that $insertNodes might have left
            const children = root.getChildren();
            if (children.length > 1) {
              const first = children[0];
              if (first.getType() === 'paragraph' && first.getTextContent() === '') {
                first.remove();
              }
              const last = root.getLastChild();
              if (last && last !== first && last.getType() === 'paragraph' && last.getTextContent() === '') {
                last.remove();
              }
            }
            
            // Clear selection so the browser doesn't automatically scroll down to this block
            $setSelection(null);
          } else {
            root.append($createParagraphNode());
          }
        });
      }
    } else {
      // Sync external changes (like Undo/Redo from outside) if this editor is NOT actively being typed in.
      if (editor.getRootElement() !== document.activeElement) {
        editor.update(() => {
          const currentHtml = $generateHtmlFromNodes(editor, null);
          if (currentHtml !== initialHtml) {
            const parser = new DOMParser();
            const dom = parser.parseFromString(initialHtml, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);
            const root = $getRoot();
            root.clear();
            if (nodes.length > 0) {
              const p = $createParagraphNode();
              root.append(p);
              p.select();
              $insertNodes(nodes);
              const children = root.getChildren();
              if (children.length > 1) {
                const first = children[0];
                if (first.getType() === 'paragraph' && first.getTextContent() === '') first.remove();
                const last = root.getLastChild();
                if (last && last !== first && last.getType() === 'paragraph' && last.getTextContent() === '') last.remove();
              }
              $setSelection(null);
            } else {
              root.append($createParagraphNode());
            }
          }
        });
      }
    }
  }, [editor, initialHtml]);

  return null;
}

import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { SlashCommandPlugin } from './plugins/SlashCommandPlugin';

export function LexicalRichText({
  blockId,
  initialHtml = '',
  placeholder = 'Start typing...',
  topUI,
  contentStyle,
  onChangeOverride,
}: LexicalRichTextProps) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialConfig = {
    namespace: `LexicalEditor-${blockId}`,
    theme,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      LinkNode,
      AutoLinkNode,
    ],
    onError: (error: Error) => {
      console.error(error);
    },
  };

  const onChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const html = $generateHtmlFromNodes(editor, null);
      
      // Debounce Zustand update
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (onChangeOverride) {
          onChangeOverride(html);
        } else {
          updateBlock(blockId, { content: html });
        }
      }, 400);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="lexical-editor-container" style={{ position: 'relative', width: '100%' }}>
        <FloatingToolbarPlugin blockId={blockId} />
        {topUI}
        <div style={{ ...contentStyle, position: 'relative' }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="lexical-content-editable" 
                style={{
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  color: 'inherit',
                  outline: 'none',
                  minHeight: 'inherit',
                }}
              />
            }
            placeholder={<div className="lexical-placeholder" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', color: 'var(--text-muted)' }}>{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <LinkPlugin />
        <AutoLinkPlugin matchers={MATCHERS} />
        <MarkdownShortcutPlugin transformers={INLINE_MARKDOWN_TRANSFORMERS} />
        <ListPlugin />
        <TabIndentationPlugin />
        <EscapeFormatPlugin />
        <SlashCommandPlugin blockId={blockId} />
        <OnChangePlugin onChange={onChange} ignoreSelectionChange />
        <HtmlSyncPlugin initialHtml={initialHtml} />
      </div>
    </LexicalComposer>
  );
}

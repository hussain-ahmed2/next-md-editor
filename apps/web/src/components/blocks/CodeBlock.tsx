"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { useTheme } from "@/hooks/useTheme";

const HLJS_LANGUAGES = [
	"1c",
	"abnf",
	"accesslog",
	"actionscript",
	"ada",
	"angelscript",
	"apache",
	"applescript",
	"arcade",
	"arduino",
	"armasm",
	"asciidoc",
	"aspectj",
	"autohotkey",
	"autoit",
	"avrasm",
	"awk",
	"axapta",
	"bash",
	"basic",
	"bnf",
	"brainfuck",
	"c",
	"cal",
	"capnproto",
	"ceylon",
	"clean",
	"clojure",
	"clojure-repl",
	"cmake",
	"coffeescript",
	"coq",
	"cos",
	"cpp",
	"crmsh",
	"crystal",
	"csharp",
	"csp",
	"css",
	"d",
	"dart",
	"delphi",
	"diff",
	"django",
	"dns",
	"dockerfile",
	"dos",
	"dsconfig",
	"dts",
	"dust",
	"ebnf",
	"elixir",
	"elm",
	"erb",
	"erlang",
	"erlang-repl",
	"excel",
	"fix",
	"flix",
	"fortran",
	"fsharp",
	"gams",
	"gauss",
	"gcode",
	"gherkin",
	"glsl",
	"gml",
	"go",
	"golo",
	"gradle",
	"graphql",
	"groovy",
	"haml",
	"handlebars",
	"haskell",
	"haxe",
	"hsp",
	"http",
	"hy",
	"inform7",
	"ini",
	"irpf90",
	"isbl",
	"java",
	"javascript",
	"jboss-cli",
	"json",
	"julia",
	"julia-repl",
	"kotlin",
	"lasso",
	"latex",
	"ldif",
	"leaf",
	"less",
	"lisp",
	"livecodeserver",
	"livescript",
	"llvm",
	"lsl",
	"lua",
	"makefile",
	"markdown",
	"mathematica",
	"matlab",
	"maxima",
	"mel",
	"mercury",
	"mipsasm",
	"mizar",
	"mojolicious",
	"monkey",
	"moonscript",
	"n1ql",
	"nestedtext",
	"nginx",
	"nim",
	"nix",
	"node-repl",
	"nsis",
	"objectivec",
	"ocaml",
	"openscad",
	"oxygene",
	"parser3",
	"perl",
	"pf",
	"pgsql",
	"php",
	"php-template",
	"plaintext",
	"pony",
	"powershell",
	"processing",
	"profile",
	"prolog",
	"properties",
	"protobuf",
	"puppet",
	"purebasic",
	"python",
	"python-repl",
	"q",
	"qml",
	"r",
	"reasonml",
	"rib",
	"roboconf",
	"routeros",
	"rsl",
	"ruby",
	"ruleslanguage",
	"rust",
	"sas",
	"scala",
	"scheme",
	"scilab",
	"scss",
	"shell",
	"smali",
	"smalltalk",
	"sml",
	"sqf",
	"sql",
	"stan",
	"stata",
	"step21",
	"stylus",
	"subunit",
	"swift",
	"taggerscript",
	"tap",
	"tcl",
	"thrift",
	"tp",
	"twig",
	"typescript",
	"vala",
	"vbnet",
	"vbscript",
	"vbscript-html",
	"verilog",
	"vhdl",
	"vim",
	"wasm",
	"wren",
	"x86asm",
	"xl",
	"xml",
	"xquery",
	"yaml",
	"zephir",
	"mermaid",
];

const POPULAR_LANGUAGES = [
	"javascript",
	"typescript",
	"jsx",
	"tsx",
	"python",
	"java",
	"cpp",
	"c",
	"csharp",
	"go",
	"rust",
	"swift",
	"kotlin",
	"php",
	"ruby",
	"scala",
	"bash",
	"shell",
	"powershell",
	"sql",
	"html",
	"css",
	"json",
	"yaml",
	"markdown",
	"dockerfile",
	"graphql",
	"sass",
	"less",
	"lua",
	"perl",
	"r",
	"dart",
	"elixir",
	"haskell",
	"clojure",
	"zig",
	"solidity",
	"xml",
	"toml",
	"ini",
	"diff",
	"nginx",
	"mermaid",
];

// Helper to map hljs alias to codemirror lang
const CM_LANG_MAP: Record<string, string> = {
	ts: "typescript",
	tsx: "tsx",
	js: "javascript",
	jsx: "jsx",
	sh: "shell",
	bash: "shell",
	rb: "ruby",
	py: "python",
	yml: "yaml",
};

export function CodeBlock({ block }: { block: Block }) {
	const { theme } = useTheme();
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const blocks = useEditorStore((s) => s.blocks);
	// Read own data directly from store to bypass prop chain issues
	const myBlock = blocks.find((b) => b.id === block.id) ?? block;
	const code = (myBlock.props.code as string) ?? "";
	const lang = (myBlock.props.language as string) ?? "ts";

	const onChange = useCallback(
		(val: string) => {
			updateBlock(block.id, { code: val });
		},
		[block.id, updateBlock],
	);

	// Map the selected language to a codemirror extension
	const mappedLang = CM_LANG_MAP[lang] ?? lang;
	const languageExtension = loadLanguage(mappedLang as Parameters<typeof loadLanguage>[0]);
	const extensions = languageExtension ? [languageExtension] : [];

	return (
		<div
			style={{
				borderRadius: 6,
				border: "1px solid var(--border)",
				overflow: "hidden",
				background: "var(--bg-surface)",
			}}
		>
			{/* Code header */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "6px 12px",
					borderBottom: "1px solid var(--border)",
					background: "var(--bg-elevated)",
				}}
			>
				<div style={{ display: "flex", gap: 6 }}>
					<span
						style={{
							width: 10,
							height: 10,
							borderRadius: "50%",
							background: "#f87171",
							display: "inline-block",
						}}
					/>
					<span
						style={{
							width: 10,
							height: 10,
							borderRadius: "50%",
							background: "#fbbf24",
							display: "inline-block",
						}}
					/>
					<span
						style={{
							width: 10,
							height: 10,
							borderRadius: "50%",
							background: "#4ade80",
							display: "inline-block",
						}}
					/>
				</div>
				<select
					value={lang}
					onChange={(e) => {
						e.stopPropagation();
						updateBlock(block.id, { language: e.target.value });
					}}
					style={{
						background: "transparent",
						border: "none",
						color: "var(--text-muted)",
						fontSize: 11,
						fontFamily: "var(--font-mono)",
						outline: "none",
						minWidth: 120,
						maxWidth: 180,
						textAlign: "right",
						textAlignLast: "right",
						cursor: "pointer",
					}}
				>
					<optgroup label="Popular">
						{POPULAR_LANGUAGES.map((l) => (
							<option key={l} value={l}>
								{l}
							</option>
						))}
					</optgroup>
					<optgroup label="All Languages">
						{HLJS_LANGUAGES.filter((l) => !POPULAR_LANGUAGES.includes(l)).map((l) => (
							<option key={l} value={l}>
								{l}
							</option>
						))}
					</optgroup>
				</select>
			</div>

			{/* Code area - Using uiw/react-codemirror */}
			<div style={{ position: "relative" }} className="next-md-cm-wrapper">
				<CodeMirror
					value={code}
					theme={theme === "light" ? githubLight : githubDark}
					extensions={extensions}
					onChange={onChange}
					onKeyDown={(e) => {
						const isMeta = e.ctrlKey || e.metaKey;
						// Prevent custom undo/redo if within CodeMirror as it has its own history
						if (isMeta && (e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) {
							e.stopPropagation();
						}
					}}
					basicSetup={{
						lineNumbers: false,
						foldGutter: false,
						highlightActiveLine: false,
						dropCursor: false,
						allowMultipleSelections: false,
						indentOnInput: true,
					}}
					style={{
						fontSize: 13,
						fontFamily: "var(--font-mono)",
					}}
				/>
				<style>{`
          .next-md-cm-wrapper .cm-editor {
            background-color: transparent !important;
          }
          .next-md-cm-wrapper .cm-scroller {
            padding: 14px 16px;
            font-family: var(--font-mono);
          }
          .next-md-cm-wrapper .cm-content {
            padding: 0;
          }
        `}</style>
			</div>
		</div>
	);
}

/**
 * Lightweight, high-performance regex-based syntax highlighter
 * for Javascript, TypeScript, JSON, Bash, Python, HTML, CSS, etc.
 * Emulates GitHub Dark Theme color tokens exactly.
 * 
 * Uses safe late-binding tokens with pure-alphabet indexing to prevent
 * subsequent regexes from matching text/numbers inside HTML style tags.
 */

// Helper to convert indices to alphabetical characters (preventing number-regex matches)
function toLetters(num: number): string {
  let r = "";
  let n = num;
  while (n >= 0) {
    r = String.fromCharCode((n % 26) + 97) + r;
    n = Math.floor(n / 26) - 1;
  }
  return r;
}

export function highlightCodeHtml(code: string, lang: string = "ts"): string {
  if (!code) return "";

  // Escape HTML tags to prevent XSS / broken UI
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 1. Stash Comments with purely alphabetical placeholders
  const comments: string[] = [];
  html = html.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g, (match) => {
    comments.push(match);
    const key = toLetters(comments.length - 1);
    return `__COMMENTPLACEHOLDER${key}__`;
  });

  // 2. Stash Strings with purely alphabetical placeholders
  const strings: string[] = [];
  html = html.replace(/(["'`])(.*?)\1/g, (match) => {
    strings.push(match);
    const key = toLetters(strings.length - 1);
    return `__STRINGPLACEHOLDER${key}__`;
  });

  // 3. Mark Keywords
  const keywords = /\b(const|let|var|function|return|export|import|from|default|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|typeof|instanceof|async|await|try|catch|finally|throw|interface|type|public|private|protected|readonly|any|string|number|boolean|void|null|undefined|as|implements|package|in|of)\b/g;
  html = html.replace(keywords, "__KW_START__$1__KW_END__");

  // 4. Mark Built-in Objects and Methods
  html = html.replace(/\b(console|log|warn|error|info|window|document|process|global|require|module|exports|JSON|Math|Object|Array|Promise|Set|Map|String|Number|Boolean|Function|Date|RegExp)\b/g, "__BI_START__$1__BI_END__");

  // 5. Mark Numbers
  html = html.replace(/\b(\d+)\b/g, "__NUM_START__$1__NUM_END__");

  // 6. Mark Functions / Method execution
  html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/g, "__FUNC_START__$1__FUNC_END__");

  // 7. Restore Strings wrapped in styled spans
  strings.forEach((str, idx) => {
    const key = toLetters(idx);
    html = html.replace(`__STRINGPLACEHOLDER${key}__`, `__STR_START__${str}__STR_END__`);
  });

  // 8. Restore Comments wrapped in styled spans
  comments.forEach((comment, idx) => {
    const key = toLetters(idx);
    html = html.replace(`__COMMENTPLACEHOLDER${key}__`, `__COM_START__${comment}__COM_END__`);
  });

  // 9. Late-bind all marked tokens to safe HTML tags
  html = html
    .replace(/__KW_START__/g, '<span style="color: #ff7b72; font-weight: 500;">')
    .replace(/__KW_END__/g, "</span>")
    
    .replace(/__BI_START__/g, '<span style="color: #79c0ff;">')
    .replace(/__BI_END__/g, "</span>")
    
    .replace(/__NUM_START__/g, '<span style="color: #79c0ff;">')
    .replace(/__NUM_END__/g, "</span>")
    
    .replace(/__FUNC_START__/g, '<span style="color: #d2a8ff;">')
    .replace(/__FUNC_END__/g, "</span>")
    
    .replace(/__STR_START__/g, '<span style="color: #a5d6ff;">')
    .replace(/__STR_END__/g, "</span>")
    
    .replace(/__COM_START__/g, '<span style="color: #8b949e; font-style: italic;">')
    .replace(/__COM_END__/g, "</span>");

  return html;
}

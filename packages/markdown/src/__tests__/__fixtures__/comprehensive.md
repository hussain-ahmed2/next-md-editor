# Comprehensive Parser Test

## Headings

All heading levels:

### H3 - Section Title

#### H4 - Sub Section

##### H5 - Detailed

###### H6 - Footnote

## Inline Formatting

A plain paragraph with no formatting.

A paragraph with **bold text**, *italic text*, ***bold italic***, and `inline code`.

A paragraph with ~~strikethrough~~ text and a [link to GitHub](https://github.com).

An image inline: ![Alt Text](https://example.com/image.png)

Mixed formatting: **bold with *italic nested* inside** and `code with **bold** inside` (code is literal).

## Code Blocks

A JavaScript code block:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
console.log(greet("World"));
```

A code block without language:

```
plain text block
no language specified
```

A TypeScript code block with generics:

```typescript
interface User<T> {
  id: string;
  data: T;
}
```

## Blockquotes

Simple blockquote:

> This is a blockquote.

Multi-paragraph blockquote:

> First paragraph of blockquote.
>
> Second paragraph of blockquote.

Nested blockquote:

> Outer quote
>
> > Inner quote
> >
> > More inner

## Callouts

> [!NOTE]
> This is a note callout.

> [!TIP]
> This is a tip callout.

> [!IMPORTANT]
> This is important.

> [!WARNING]
> This is a warning.

> [!CAUTION]
> This is a caution.

## Lists

Bullet list:

- Item one
- Item two
- Item three

Nested bullet list:

- Parent item
  - Child item
  - Another child
- Back to parent

Numbered list:

1. First step
2. Second step
3. Third step

Nested numbered list:

1. Main step
   1. Sub step A
   2. Sub step B
2. Next main step
   - Bullet under numbered
   - Another bullet

Mixed list with formatting:

- **Bold item**
- *Italic item*
- `Code item`
- [Link item](https://example.com)

## Tables

Simple table:

| Name | Age | City |
|------|-----|------|
| Alice | 30 | New York |
| Bob | 25 | London |
| Charlie | 35 | Tokyo |

Table with alignment:

| Left | Center | Right |
|:-----|:------:|------:|
| a | b | c |
| d | e | f |

## Divider

Text before divider.

---

Text after divider.

## Image Grid

<!-- image-grid -->

<table>
<tr>
<td><img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600" alt="Fluid abstract" /></td>
<td><img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600" alt="Glossy 3D" /></td>
</tr>
</table>

## Badge Group

<!-- badge-group -->

![image](https://img.shields.io/badge/license-MIT-blue.svg)
![image](https://img.shields.io/badge/build-passing-brightgreen)

## GitHub Stats

![GitHub Stats](http://localhost:3000/api/github/facebook/stats.svg)

## Empty Content

This paragraph is intentionally followed by an empty line.

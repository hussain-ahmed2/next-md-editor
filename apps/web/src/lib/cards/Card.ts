/**
 * SVG card shell, adapted from anuraghazra/github-readme-stats (MIT
 * license) — src/common/Card.js.
 */
import { encodeHTML, flexLayout, type CardColors } from "./utils";

interface CardOptions {
  width?: number;
  height?: number;
  borderRadius?: number;
  customTitle?: string;
  defaultTitle?: string;
  titlePrefixIcon?: string;
  colors: CardColors;
}

export class Card {
  width: number;
  height: number;
  borderRadius: number;
  hideBorder = false;
  hideTitle = false;
  title: string;
  titlePrefixIcon?: string;
  colors: CardColors;
  css = "";
  paddingX = 25;
  paddingY = 35;
  animations = true;
  private accessibleTitle = "";
  private accessibleDesc = "";

  constructor({
    width = 100,
    height = 100,
    borderRadius = 4.5,
    customTitle,
    defaultTitle = "",
    titlePrefixIcon,
    colors,
  }: CardOptions) {
    this.width = width;
    this.height = height;
    this.borderRadius = borderRadius;
    this.title = customTitle !== undefined ? encodeHTML(customTitle) : encodeHTML(defaultTitle);
    this.titlePrefixIcon = titlePrefixIcon;
    this.colors = colors;
    this.accessibleTitle = this.title;
  }

  setAccessibilityLabel({ title, desc }: { title: string; desc: string }) {
    this.accessibleTitle = title;
    this.accessibleDesc = desc;
  }

  setCSS(css: string) {
    this.css = css;
  }

  setHideBorder(hide: boolean) {
    this.hideBorder = hide;
  }

  setHideTitle(hide: boolean) {
    this.hideTitle = hide;
    if (hide) this.height -= 30;
  }

  disableAnimations() {
    this.animations = false;
  }

  private renderTitle(): string {
    const titleText = `
      <text x="0" y="0" class="header" data-testid="header">${this.title}</text>
    `;
    const prefixIcon = `
      <svg class="icon" x="0" y="-13" viewBox="0 0 16 16" version="1.1" width="16" height="16">
        ${this.titlePrefixIcon}
      </svg>
    `;
    return `
      <g data-testid="card-title" transform="translate(${this.paddingX}, ${this.paddingY})">
        ${flexLayout({
          items: [this.titlePrefixIcon ? prefixIcon : "", titleText],
          gap: 25,
        }).join("")}
      </g>
    `;
  }

  private renderGradient(): string {
    if (typeof this.colors.bgColor !== "object") return "";
    const gradients = this.colors.bgColor.slice(1);
    return `
      <defs>
        <linearGradient id="gradient" gradientTransform="rotate(${this.colors.bgColor[0]})" gradientUnits="userSpaceOnUse">
          ${gradients
            .map((grad, index) => {
              const offset = (index * 100) / (gradients.length - 1);
              return `<stop offset="${offset}%" stop-color="#${grad}" />`;
            })
            .join("")}
        </linearGradient>
      </defs>
    `;
  }

  render(body: string): string {
    return `
      <svg
        width="${this.width}"
        height="${this.height}"
        viewBox="0 0 ${this.width} ${this.height}"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="descId"
      >
        <title id="titleId">${this.accessibleTitle}</title>
        <desc id="descId">${this.accessibleDesc}</desc>
        <style>
          .header {
            font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
            fill: ${this.colors.titleColor};
            animation: fadeInAnimation 0.8s ease-in-out forwards;
          }
          @supports(-moz-appearance: auto) {
            /* Selector detects Firefox */
            .header { font-size: 15.5px; }
          }
          ${this.css}
          ${
            this.animations
              ? ""
              : `* { animation-duration: 0s !important; animation-delay: 0s !important; }`
          }
          @keyframes fadeInAnimation {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        </style>
        ${this.renderGradient()}
        <rect
          data-testid="card-bg"
          x="0.5"
          y="0.5"
          rx="${this.borderRadius}"
          height="99%"
          stroke="${this.colors.borderColor}"
          width="${this.width - 1}"
          fill="${typeof this.colors.bgColor === "object" ? "url(#gradient)" : this.colors.bgColor}"
          stroke-opacity="${this.hideBorder ? 0 : 1}"
        />
        ${this.hideTitle ? "" : this.renderTitle()}
        <g
          data-testid="main-card-body"
          transform="translate(0, ${this.hideTitle ? this.paddingX : this.paddingY + 20})"
        >
          ${body}
        </g>
      </svg>
    `;
  }
}

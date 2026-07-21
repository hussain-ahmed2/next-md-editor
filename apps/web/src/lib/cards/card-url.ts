/**
 * Builds card image URLs for the github-stats block — either against this
 * app's /api/cards endpoints or a user's own github-readme-stats Vercel
 * instance (which uses upstream paths /api, /api/top-langs, /api/pin).
 */

export type CardKind = "stats" | "top-langs" | "pin";

export interface StatsBlockProps {
  username?: string;
  card?: CardKind;
  theme?: string;
  repo?: string;
  showIcons?: boolean;
  hideBorder?: boolean;
  hideRank?: boolean;
  layout?: string;
  useOwnInstance?: boolean;
  instanceUrl?: string;
  /** Legacy props from the pre-cards block */
  variant?: string;
}

export function buildCardUrl(props: StatsBlockProps, instanceUrl?: string): string {
  const card = props.card ?? "stats";
  const params = new URLSearchParams();
  params.set("username", props.username ?? "");
  if (card === "pin" && props.repo) params.set("repo", props.repo);
  if (props.theme && props.theme !== "default") params.set("theme", props.theme);
  if (props.showIcons && card === "stats") params.set("show_icons", "true");
  if (props.hideBorder) params.set("hide_border", "true");
  if (props.hideRank && card === "stats") params.set("hide_rank", "true");
  if (props.layout && props.layout !== "normal" && card === "top-langs")
    params.set("layout", props.layout);

  const instance = instanceUrl?.replace(/\/+$/, "");
  if (instance) {
    const path = card === "stats" ? "/api" : card === "top-langs" ? "/api/top-langs" : "/api/pin";
    return `${instance}${path}?${params.toString()}`;
  }

  const path =
    card === "stats"
      ? "/api/cards/stats"
      : card === "top-langs"
        ? "/api/cards/top-langs"
        : "/api/cards/pin";
  return `${path}?${params.toString()}`;
}

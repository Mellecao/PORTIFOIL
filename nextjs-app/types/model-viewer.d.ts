import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        "auto-rotate"?: boolean;
        "camera-controls"?: boolean;
        "disable-zoom"?: boolean;
        "rotation-per-second"?: string;
        "interaction-prompt"?: string;
        "shadow-intensity"?: string;
        exposure?: string;
        "camera-orbit"?: string;
        "touch-action"?: string;
      };
    }
  }
}

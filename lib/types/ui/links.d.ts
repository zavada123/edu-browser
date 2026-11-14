import type { MouseEvent, PointerEvent } from "react";
import type { Url } from "../core/url.ts";
export interface LinkHandlers {
    readonly open: (url: Url) => void;
    readonly openInNewTab: (url: Url) => void;
    readonly menu: (url: Url, x: number, y: number) => void;
}
/**
 * Props for a link of a made-up page: a click follows it, Ctrl+click or the middle button opens it
 * in a new tab, the right button or a long press shows «Відкрити в новій вкладці».
 */
export declare const linkProps: (url: Url, handlers: LinkHandlers) => {
    href: string;
    onClick: (e: MouseEvent) => void;
    onAuxClick: (e: MouseEvent) => void;
    onContextMenu: (e: MouseEvent) => void;
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
};

/** A key press, as much of it as the shortcuts need. */
export interface KeyPress {
    readonly key: string;
    readonly code: string;
    readonly ctrl: boolean;
    readonly shift: boolean;
    readonly alt: boolean;
}
export type Command = "newTab" | "closeTab" | "nextTab" | "prevTab" | "history" | "bookmark" | "address" | "back" | "forward" | "reload" | "escape" | "find" | "zoomIn" | "zoomOut" | "zoomReset";
/**
 * The browser shortcuts from the textbooks. Letters are read from `code`, so they work in the Ukrainian
 * layout too (Ctrl+Т is still Ctrl+T). The real browser keeps Ctrl+T and Ctrl+W for itself in most cases;
 * the buttons do the same.
 */
export declare const commandFor: (k: KeyPress) => Command | null;

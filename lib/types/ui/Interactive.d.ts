import type { ChatMessage } from "../core/sites.ts";
import type { Download, PopupState } from "../core/state.ts";
/** What the blocks of a page can do besides links. */
export interface PageActions {
    readonly submitted: ReadonlyArray<string>;
    readonly submit: (form: string) => void;
    readonly report: (form: string) => void;
    readonly download: (file: string) => void;
}
export declare const FormBlock: ({ id, title, fields, button, sentText, actions }: {
    readonly id: string;
    readonly title: string;
    readonly fields: ReadonlyArray<string>;
    readonly button: string;
    readonly sentText: string | undefined;
    readonly actions: PageActions;
}) => import("react").JSX.Element;
/** A chat with scripted messages. What the student writes stays on their screen only. */
export declare const ChatBlock: ({ id, title, messages, reply, actions }: {
    readonly id: string;
    readonly title: string;
    readonly messages: ReadonlyArray<ChatMessage>;
    readonly reply: string | undefined;
    readonly actions: PageActions;
}) => import("react").JSX.Element;
export declare const DownloadBlock: ({ file, label, size, actions }: {
    readonly file: string;
    readonly label: string;
    readonly size: string;
    readonly actions: PageActions;
}) => import("react").JSX.Element;
/** A window over the page. It blocks the page until the student chooses. */
export declare const PopupWindow: ({ popup, onAccept, onClose }: {
    readonly popup: PopupState;
    readonly onAccept: () => void;
    readonly onClose: () => void;
}) => import("react").JSX.Element;
/** The antivirus stops a dangerous file and asks what to do. */
export declare const AntivirusDialog: ({ item, onDelete, onOpen }: {
    readonly item: Download;
    readonly onDelete: () => void;
    readonly onOpen: () => void;
}) => import("react").JSX.Element;
export declare const DownloadsPanelBody: ({ downloads, onDelete }: {
    readonly downloads: ReadonlyArray<Download>;
    readonly onDelete: (id: number) => void;
}) => import("react").JSX.Element;

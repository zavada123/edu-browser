import { type RefObject } from "react";
interface Props {
    /** The page to search in. */
    readonly pageRef: RefObject<HTMLDivElement | null>;
    /** Changes when the page in front changes, so the matches are found again. */
    readonly pageKey: string;
    /** Called on Enter with new words: the trainer records the search. */
    readonly onSearch: (text: string) => void;
    readonly onClose: () => void;
}
/** «Знайти на сторінці» (Ctrl+F): a field under the toolbar that highlights the words on the page. */
export declare const FindBar: ({ pageRef, pageKey, onSearch, onClose }: Props) => import("react").JSX.Element;
export {};

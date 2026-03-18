type SimpleVector2 = {
    x: number;
    y: number;
};

type SimpleVector3 = {
    x: number;
    y: number;
    z: number;
};

type SimpleSize = {
    width: number;
    height: number;
};

type DomLike =
    | Element
    | HTMLElement
    | HTMLDivElement
    | HTMLButtonElement
    | HTMLAnchorElement
    | HTMLVideoElement
    | HTMLImageElement
    | HTMLParagraphElement
    | HTMLSpanElement
    | HTMLHeadingElement
    | HTMLListElement
    | HTMLTableElement
    | HTMLTableCellElement
    | HTMLTableHeaderCellElement
    | HTMLTableBodyElement
    | HTMLTableFooterElement;

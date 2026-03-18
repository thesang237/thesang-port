type AssetEventHandler = {
    onStart?: () => void;
    onProgress?: (progress: number) => void;
    onComplete?: () => void;
    onError?: (error: unknown) => void;
};

type FontEventHandler = {
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (error: unknown) => void;
};

type CursorEventHandler = {
    onMove?: (position: SimpleVector2) => void;
};

type PageEventHandler = {
    onChange?: (pageState: PageState, pageInfo: PageInfo) => void;
};

type WindowSizeEventHandler = {
    onChange?: (size: SimpleSize) => void;
};

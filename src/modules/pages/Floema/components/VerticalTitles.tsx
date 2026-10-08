import { content, numbers } from '../data';
export const titleHeights = [28.6, 45.1, 53.1, 28.8];
export const titleCycle = titleHeights.reduce((sum, height) => sum + height + 16, 0);
export function VerticalTitles({ repeat = 1 }: { repeat?: number }) {
    return (
        <div className="floema-titles" aria-hidden="true">
            {Array.from({ length: repeat }, (_, row) => (
                <div className="floema-titles-cycle" key={row}>
                    {content.collections.map((collection, index) => (
                        <div className="floema-title-pair" key={collection.title}>
                            <div className="floema-title-label">
                                <span>
                                    Collection
                                    <br />
                                    {numbers[index]}
                                </span>
                            </div>
                            <div className="floema-title-name" style={{ height: `calc(var(--f) * ${titleHeights[index]})` }}>
                                <span>{collection.title}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

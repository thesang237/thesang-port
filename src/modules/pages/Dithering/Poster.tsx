import Image from 'next/image';
/** A useful still image when a device cannot create or keep a WebGL context. */
export function Poster({ message }: { message: string }) {
    return (
        <div className="studio-poster">
            <Image src="/all/dithering.webp" width={960} height={600} alt="A helmet rendered as an ordered black and white dither print" unoptimized />
            <p>{message}</p>
        </div>
    );
}

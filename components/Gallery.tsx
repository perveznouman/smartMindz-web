"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import type { GalleryPhoto } from "@/lib/types";

const PAGE_SIZE = 12;

/**
 * Responsive masonry-ish gallery. Renders THUMBNAILS lazily and opens the
 * full-resolution image in a lightbox on click. Paginated with "load more" so
 * hundreds of photos never block the initial render.
 */
export function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [index, setIndex] = useState(-1);

  if (photos.length === 0) {
    return (
      <p className="text-center text-sm text-content-muted">
        Photos coming soon.
      </p>
    );
  }

  const shown = photos.slice(0, visible);
  const slides = photos.map((p) => ({ src: p.url, description: p.caption ?? undefined }));

  return (
    <>
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
        {shown.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative block w-full overflow-hidden rounded-xl border border-border bg-surface-2"
            aria-label={photo.caption ?? "Open photo"}
          >
            <Image
              src={photo.thumbUrl ?? photo.url}
              alt={photo.caption ?? "SmartMindz event photo"}
              width={400}
              height={300}
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {visible < photos.length && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="btn-outline"
          >
            Load more ({photos.length - visible} left)
          </button>
        </div>
      )}

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={slides}
      />
    </>
  );
}

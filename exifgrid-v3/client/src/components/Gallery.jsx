import PhotoCard from './PhotoCard.jsx';

/**
 * Gallery — migrated from vanilla gallery grid + handleFiles card append.
 *
 * Vanilla: columns layout on #gallery, appendChild(buildCard()).
 * React:   maps photos[] to <PhotoCard />; masonry via CSS columns in gallery.css.
 */
export default function Gallery({ photos, onOpenPhoto, onRemovePhoto }) {
  return (
    <div id="gallery" className="gallery--visible">
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          index={index}
          onOpen={onOpenPhoto}
          onRemove={onRemovePhoto}
        />
      ))}
    </div>
  );
}

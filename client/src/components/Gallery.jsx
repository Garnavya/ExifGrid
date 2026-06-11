import PhotoCard from './PhotoCard.jsx';

export default function Gallery({ photos, onOpenPhoto, onRemovePhoto, comparisonIds, onToggleCompare }) {
  return (
    <div id="gallery" className="gallery--visible">
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          index={index}
          onOpen={onOpenPhoto}
          onRemove={onRemovePhoto}
          isComparing={comparisonIds?.includes(photo.id)}
          onToggleCompare={onToggleCompare}
        />
      ))}
    </div>
  );
}
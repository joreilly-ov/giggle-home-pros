import { Camera, X } from "lucide-react";
import { PhotoFile, ImageFeedback, MAX_PHOTOS } from "./types";

type Props = {
  photos: PhotoFile[];
  onRemove: (id: string) => void;
  onAddMore: () => void;
  imageFeedback?: ImageFeedback[];
};

const PhotoGrid = ({ photos, onRemove, onAddMore, imageFeedback }: Props) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
    {photos.map((p, index) => {
      const feedback = imageFeedback?.find((f) => f.index === index);
      const isBlurry = feedback?.quality === "blurry";

      return (
        <div key={p.id} className={`relative group aspect-square rounded-xl overflow-hidden border bg-secondary ${isBlurry ? "border-destructive" : "border-border"}`}>
          <img src={p.preview} alt="Upload preview" className="w-full h-full object-cover" />
          <button
            onClick={() => onRemove(p.id)}
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5 text-foreground" />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent p-2">
            <p className="text-xs text-primary-foreground truncate">{p.file.name}</p>
          </div>
          {feedback && (
            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isBlurry ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
              {feedback.role}{isBlurry ? " · Blurry" : ""}
            </div>
          )}
          {feedback?.note && (
            <div className="absolute inset-x-0 top-8 left-2 right-2">
              <p className="text-[10px] bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-destructive font-medium">{feedback.note}</p>
            </div>
          )}
        </div>
      );
    })}

    {photos.length < MAX_PHOTOS && (
      <button
        onClick={onAddMore}
        className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
      >
        <Camera className="w-6 h-6 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Add more</span>
      </button>
    )}
  </div>
);

export default PhotoGrid;

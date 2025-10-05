import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, Filter, CheckCircle2 } from "lucide-react";

const Results = () => {
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  
  const images = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    prompt: `Prompt ${i + 1}`,
    url: `https://picsum.photos/seed/${i + 1}/400/300`,
    variation: (i % 3) + 1,
  }));

  const toggleImage = (id: number) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedImages(newSelected);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Results Gallery</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and select your best generated images
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Download className="mr-2 h-4 w-4" />
          Export Selected ({selectedImages.size})
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by prompt..."
              className="pl-9"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={image.url}
                alt={image.prompt}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            
            <div className="absolute bottom-0 left-0 right-0 translate-y-full p-4 transition-transform group-hover:translate-y-0">
              <p className="text-sm font-medium text-white">{image.prompt}</p>
              <p className="text-xs text-white/80">Variation {image.variation}</p>
            </div>

            <div className="absolute right-2 top-2">
              <div
                onClick={() => toggleImage(image.id)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
              >
                {selectedImages.has(image.id) ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-400" />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Results;

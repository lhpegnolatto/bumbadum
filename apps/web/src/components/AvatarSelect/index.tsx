import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAvatarSelect } from "./hook";
import { AvatarField } from "./types";
import { avatarFields } from "./data";

export function AvatarSelect() {
  const { containerRef, canvasRef, avatarOptions, changeField } = useAvatarSelect();

  return (
    <div className="flex items-center justify-center">
      <div
        ref={containerRef}
        className="h-[200px] w-[200px] overflow-hidden rounded-lg border"
      >
        <canvas
          ref={canvasRef}
          style={{
            imageRendering: "pixelated",
            transform: "scale(4)",
            transformOrigin: " 0 0",
          }}
        />
      </div>

      <div className="ml-4 flex flex-col gap-2">
        {[
          { label: "skin tone", field: "skinTone" },
          { label: "hair", field: "hairType" },
          { label: "hair color", field: "hairColor" },
          { label: "top", field: "topType" },
          { label: "top color", field: "topColor" },
          { label: "bottom", field: "bottomType" },
          { label: "bottom color", field: "bottomColor" },
          { label: "footwear", field: "footwearType" },
          { label: "footwear color", field: "footwearColor" },
        ].map(({ label, field }) => (
          <div key={field} className="flex flex-col items-center">
            <div className="flex w-[180px] items-center justify-between gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => changeField(field as AvatarField, "prev")}
              >
                <ChevronLeft size="18" />
              </Button>
              <div className="flex flex-col items-center">
                <div className="text-xs text-slate-600">{label}</div>
                <div className="text-xs text-slate-400">
                  {avatarFields[field as AvatarField].getLabel(avatarOptions)}
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => changeField(field as AvatarField, "next")}
              >
                <ChevronRight size="18" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div >
  )
}

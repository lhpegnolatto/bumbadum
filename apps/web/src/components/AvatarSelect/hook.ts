import { useEffect, useRef, useState } from "react";

import { GameObject } from "@/game/GameObject";
import { withGrid } from "@/game/utils";
import { avatarFields, convertToApiData, convertToFields, getRandomAvatarFields } from "./data";
import { AvatarField, AvatarOptions } from "./types";
import { getLayersFromAvatar } from "@/utils/getLayersFromAvatar";

export function useAvatarSelect() {
  const [avatarOptions, setAvatarOptions] = useState<AvatarOptions>(() => {
    const storageAvatarOptions = JSON.parse(localStorage.getItem("bumbadum-avatar") || "null");

    if (!storageAvatarOptions) {
      const randomAvatarOptions = getRandomAvatarFields()
      localStorage.setItem("bumbadum-avatar", JSON.stringify(convertToApiData(randomAvatarOptions)))

      return randomAvatarOptions
    }

    return convertToFields(storageAvatarOptions)
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const avatarGameObjectRef = useRef<GameObject>(new GameObject({ x: 0, y: 0 }));

  useEffect(() => {
    const convertedAvatarOptions = convertToApiData(avatarOptions)
    avatarGameObjectRef.current = new GameObject({
      x: withGrid(1),
      y: withGrid(1.5),
      layers: getLayersFromAvatar(convertedAvatarOptions)
    });
  }, [avatarOptions]);

  useEffect(() => {
    function step() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        return;
      }

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cameraPerson = new GameObject({ x: withGrid(6.5), y: withGrid(6.5) });
      avatarGameObjectRef.current.sprite.draw(ctx, cameraPerson);

      requestAnimationFrame(step);
    }
    step();
  }, []);

  function changeField(field: AvatarField, action: "prev" | "next") {
    const maxIndex = avatarFields[field].variantsCount - 1;

    setAvatarOptions((old) => {
      let newValue;
      if (action === "prev") {
        newValue = ({
          ...old,
          [field]: old[field] === 0 ? maxIndex : old[field] - 1
        })
      } else {
        newValue = ({
          ...old,
          [field]: old[field] === maxIndex ? 0 : old[field] + 1
        })
      }

      localStorage.setItem("bumbadum-avatar", JSON.stringify(convertToApiData(newValue)))

      return newValue
    })
  }

  return { containerRef, canvasRef, avatarOptions, changeField }
}
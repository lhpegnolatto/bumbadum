export type AvatarOptions = {
  skin: number;
  hair: { type: number; color: number };
  top: { type: number; color: number };
  bottom: { type: number; color: number };
  footwear: { type: number; color: number };
}

export const hairTypesFiles = ["extra_long.png", "gentleman.png"];
export const topsTypesFiles = ["dress.png", "shirt.png"];
export const bottomsTypesFiles = ["pants.png", "skirt.png", ""];
export const footwearsTypesFiles = ["shoes.png", ""];

export const getLayersFromAvatar = ({ skin, hair, top, bottom, footwear }: AvatarOptions) => [
  { src: "/char.png", variant: skin },
  {
    src: `/hairs/${hairTypesFiles[hair.type]}`,
    variant: hair.color
  },
  {
    src: `/tops/${topsTypesFiles[top.type]}`,
    variant: top.color
  },
  {
    src: `/bottoms/${bottomsTypesFiles[bottom.type]}`,
    variant: bottom.color
  },
  {
    src: `/footwear/${footwearsTypesFiles[footwear.type]}`,
    variant: footwear.color
  },
]
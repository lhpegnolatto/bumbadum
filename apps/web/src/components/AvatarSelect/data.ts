import { getRandomFromInterval } from "@/utils/randomFromInterval";
import { AvatarOptions } from "./types";
import { AvatarOptions as AvatarApiOptions } from "@/utils/getLayersFromAvatar";

export const avatarFields = {
  skinTone: {
    variantsCount: 8,
    getLabel: ({ skinTone }: AvatarOptions) => skinTone + 1,
  },
  hairType: {
    variantsCount: 2,
    getLabel: ({ hairType }: AvatarOptions) => hairType + 1,
  },
  hairColor: {
    variantsCount: 14,
    getLabel: ({ hairColor }: AvatarOptions) => hairColor + 1,
  },
  topType: {
    variantsCount: 2,
    getLabel: ({ topType }: AvatarOptions) => {
      const topsTypesLabels = ["dress", "shirt"];
      return topsTypesLabels[topType];
    }
  },
  topColor: {
    variantsCount: 10,
    getLabel: ({ topColor }: AvatarOptions) => topColor + 1
  },
  bottomType: {
    variantsCount: 3,
    getLabel: ({ bottomType }: AvatarOptions) => {
      const bottomsTypesLabels = ["pants", "skirt", "none"];
      return bottomsTypesLabels[bottomType];
    }
  },
  bottomColor: {
    variantsCount: 10,
    getLabel: ({ bottomColor }: AvatarOptions) => bottomColor + 1
  },
  footwearType: {
    variantsCount: 2,
    getLabel: ({ footwearType }: AvatarOptions) => {
      const footwearsTypesLabels = ["shoes", "none"];
      return footwearsTypesLabels[footwearType];
    }
  },
  footwearColor: {
    variantsCount: 10,
    getLabel: ({ footwearColor }: AvatarOptions) => footwearColor + 1
  }
}

export const getRandomAvatarFields = () => ({
  skinTone: getRandomFromInterval(0, avatarFields.skinTone.variantsCount - 1),
  hairType: getRandomFromInterval(0, avatarFields.hairType.variantsCount - 1),
  hairColor: getRandomFromInterval(0, avatarFields.hairColor.variantsCount - 1),
  topType: getRandomFromInterval(0, avatarFields.topType.variantsCount - 1),
  topColor: getRandomFromInterval(0, avatarFields.topColor.variantsCount - 1),
  bottomType: getRandomFromInterval(0, avatarFields.bottomType.variantsCount - 1),
  bottomColor: getRandomFromInterval(0, avatarFields.bottomColor.variantsCount - 1),
  footwearType: getRandomFromInterval(0, avatarFields.footwearType.variantsCount - 1),
  footwearColor: getRandomFromInterval(0, avatarFields.footwearColor.variantsCount - 1),
})

export const convertToFields = ({
  skin,
  hair,
  top,
  bottom,
  footwear
}: AvatarApiOptions): AvatarOptions => ({
  skinTone: skin,
  hairType: hair.type,
  hairColor: hair.color,
  topType: top.type,
  topColor: top.color,
  bottomType: bottom.type,
  bottomColor: bottom.color,
  footwearType: footwear.type,
  footwearColor: footwear.color,
})

export const convertToApiData = ({
  skinTone,
  hairType,
  hairColor,
  topType,
  topColor,
  bottomType,
  bottomColor,
  footwearType,
  footwearColor
}: AvatarOptions): AvatarApiOptions => ({
  skin: skinTone,
  hair: { type: hairType, color: hairColor },
  top: { type: topType, color: topColor },
  bottom: { type: bottomType, color: bottomColor },
  footwear: { type: footwearType, color: footwearColor },
})


export type AvatarField = "skinTone" | "hairType" | "hairColor" | "topType" | "topColor" | "bottomType" | "bottomColor" | "footwearType" | "footwearColor";

export type AvatarOptions = {
  [key in AvatarField]: number;
}


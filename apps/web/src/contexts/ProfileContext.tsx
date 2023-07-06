"use client";

import { ProfileDialog, ProfileForm } from "@/components/ProfileDialog";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
  useEffect,
} from "react";

interface ProfileContextProps {
  children: ReactNode;
}

type ProfileContextData = {
  setIsProfileDialogOpen: Dispatch<SetStateAction<boolean>>;
};

const ProfileContext = createContext({} as ProfileContextData);

export function ProfileProvider({ children }: ProfileContextProps) {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  function handleOnSubmit(data: ProfileForm) {
    const profileStorage = localStorage.getItem("bumbadum-profile");

    localStorage?.setItem("bumbadum-profile", JSON.stringify(data));

    if (profileStorage) {
      const respawnUser = new CustomEvent("respawnUser");
      document.dispatchEvent(respawnUser);
    } else {
      const spawnUser = new CustomEvent("spawnUser");
      document.dispatchEvent(spawnUser);
    }

    setIsProfileDialogOpen(false);
  }

  useEffect(() => {
    const profileStorage = localStorage.getItem("bumbadum-profile");

    if (!profileStorage) {
      setIsProfileDialogOpen(true);
    } else {
      const spawnUser = new CustomEvent("spawnUser");
      document.dispatchEvent(spawnUser);
    }
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        setIsProfileDialogOpen,
      }}
    >
      <ProfileDialog isOpen={isProfileDialogOpen} onSubmit={handleOnSubmit} />
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfileContext = () => useContext(ProfileContext);

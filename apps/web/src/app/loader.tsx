"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode, useEffect, useRef, useState } from "react";

interface HomeLoaderProps {
  children: ReactNode;
}

export function HomeLoader({ children }: HomeLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const startTime = new Date().getTime();

    const intervalId = setInterval(() => {
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - startTime;
      const elapsedSeconds = elapsedTime / 1000;

      setIsAvailable(elapsedSeconds <= 10);
    }, 1000);

    function handleAvailableApi() {
      setIsLoading(false);
      setIsAvailable(true);
    }

    function checkApiHealth() {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`).then(({ ok }) => {
        if (ok) {
          clearInterval(intervalId);
          handleAvailableApi();
        }
      });
    }

    checkApiHealth();
  }, []);

  return (
    <>
      {isLoading ? (
        <>
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-900 shadow">
            <div
              className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-slate-800 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
            {!isAvailable && (
              <p className="mt-6 font-bold text-slate-700">
                Our server is waking up, you will be connected soon... (some
                like 2 minutes)
              </p>
            )}
          </div>
          <div className="flex w-80 flex-col gap-6 overflow-hidden rounded-xl bg-slate-900 shadow">
            <div className="h-20 w-full animate-pulse bg-slate-800" />
            <div className="flex h-full flex-col gap-2 p-6">
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
              </div>

              <div className="flex gap-2">
                <Skeleton className="h-4 w-14 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>

              <div className="flex gap-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>

              <div className="flex gap-2">
                <Skeleton className="h-4 w-12 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
              </div>
            </div>
            <div className="p-6">
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        </>
      ) : (
        children
      )}
    </>
  );
}

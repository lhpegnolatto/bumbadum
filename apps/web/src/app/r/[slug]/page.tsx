import { RoomView } from "@/features/room/room-view.tsx";

/** Any slug other than the lobby is redirected in next.config.ts. */
export default async function RoomPage({ params }: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  return <RoomView slug={slug} />;
}

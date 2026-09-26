"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LandingScreen from "@/components/LandingScreen";
import CameraScreen from "@/components/Camera";
import UploadScreen from "@/components/UploadScreen";
import Editor from "@/components/Editor";
import { logout } from "@/lib/api";
import type { FilterId } from "@/lib/filters";
import type { StripSource } from "@/lib/stripTypes";

type Screen = "landing" | "camera" | "upload" | "editor";

export default function BoothApp({ userName }: { userName: string }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("landing");
  const [photos, setPhotos] = useState<string[]>([]);
  const [filter, setFilter] = useState<FilterId>("original");
  const [source, setSource] = useState<StripSource>("camera");

  function handleCaptured(shots: string[], filterId: FilterId) {
    setPhotos(shots);
    // Camera shots are captured unfiltered; the editor applies the look (and lets you change it).
    setFilter(filterId);
    setSource("camera");
    setScreen("editor");
  }

  function handleUploaded(shots: string[], filterId: FilterId) {
    setPhotos(shots);
    // Uploaded photos are untouched, so the editor applies the chosen filter (once).
    setFilter(filterId);
    setSource("upload");
    setScreen("editor");
  }

  function handleBackFromEditor() {
    if (source === "upload") {
      // keep the picked photos + filter so the user can tweak and continue again
      setScreen("upload");
    } else {
      setPhotos([]);
      setScreen("camera");
    }
  }

  function startOver(next: Screen) {
    setPhotos([]);
    setFilter("original");
    setScreen(next);
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div key={screen} className="animate-screen-in">
      {screen === "landing" && (
        <LandingScreen
          name={userName}
          onTakePhotos={() => startOver("camera")}
          onUpload={() => startOver("upload")}
          onLogout={handleLogout}
        />
      )}
      {screen === "camera" && (
        <CameraScreen onComplete={handleCaptured} onBack={() => setScreen("landing")} />
      )}
      {screen === "upload" && (
        <UploadScreen
          initialPhotos={source === "upload" ? photos : []}
          initialFilter={source === "upload" ? filter : "original"}
          onComplete={handleUploaded}
          onBack={() => startOver("landing")}
        />
      )}
      {screen === "editor" && photos.length > 0 && (
        <Editor
          photos={photos}
          filter={filter}
          source={source}
          backLabel={source === "upload" ? "← Photos" : "← Retake"}
          onRetake={handleBackFromEditor}
        />
      )}
    </div>
  );
}

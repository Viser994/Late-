import { useEffect } from "react";

/**
 * MediaRecorder output (webm) has no duration header, which makes the element report
 * Infinity and breaks seeking. Seeking far past the end forces the browser to compute it.
 */
export function useFixInfiniteDuration(audio: HTMLMediaElement | null, src: string | null) {
  useEffect(() => {
    if (!audio || !src) return;

    const onMeta = () => {
      if (audio.duration !== Infinity) return;
      const restore = () => {
        audio.removeEventListener("timeupdate", restore);
        audio.currentTime = 0;
      };
      audio.addEventListener("timeupdate", restore);
      audio.currentTime = 1e101;
    };

    audio.addEventListener("loadedmetadata", onMeta);
    return () => audio.removeEventListener("loadedmetadata", onMeta);
  }, [audio, src]);
}

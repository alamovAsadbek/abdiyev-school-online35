import { useEffect, useRef, useState } from "react";
import ShakaPlayer from "shaka-player-react";
import "shaka-player-react/dist/controls.css";

export default function VideoPlayer({ videoUrl, userId }: { videoUrl: string, userId: string }) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const watermarkRef = useRef<HTMLSpanElement>(null);

    const [dateTime, setDateTime] = useState<string>("");
    const [isEmbedUrl, setIsEmbedUrl] = useState(false);

    // Check if URL is embed type (YouTube, Vimeo, etc.)
    useEffect(() => {
        if (videoUrl) {
            const isEmbed = videoUrl.includes('youtube.com') || 
                           videoUrl.includes('youtu.be') || 
                           videoUrl.includes('vimeo.com');
            setIsEmbedUrl(isEmbed);
        }
    }, [videoUrl]);

    // Real-time sana + vaqt
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const day = now.getDate().toString().padStart(2, "0");
            const month = (now.getMonth() + 1).toString().padStart(2, "0");
            const year = now.getFullYear();

            const hours = now.getHours().toString().padStart(2, "0");
            const minutes = now.getMinutes().toString().padStart(2, "0");
            const seconds = now.getSeconds().toString().padStart(2, "0");

            setDateTime(`${day}.${month}.${year} ${hours}:${minutes}:${seconds}`);
        };

        updateTime(); // Dastlab
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    // Fullscreen event
    useEffect(() => {
        const handleFullScreenChange = () => {
            if (!wrapperRef.current || !watermarkRef.current) return;
            const fsElement = document.fullscreenElement;
            if (fsElement) {
                // Fullscreen bo'lsa watermarkni container ichiga qo'yish
                fsElement.appendChild(watermarkRef.current);
            } else {
                // Normal holatga qaytganida wrapper ichiga qaytarish
                wrapperRef.current.appendChild(watermarkRef.current);
            }
        };

        document.addEventListener("fullscreenchange", handleFullScreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full rounded-xl bg-black overflow-hidden aspect-video">

            {/* VIDEO */}
            {isEmbedUrl ? (
                <iframe
                    src={videoUrl}
                    title="Video Player"
                    className="w-full h-full absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    style={{ border: 'none' }}
                />
            ) : (
                <div className="w-full h-full">
                    <ShakaPlayer
                        src={videoUrl}
                        controls
                        className="w-full h-full"
                        style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </div>
            )}

            {/* WATERMARK */}
            <span
                ref={watermarkRef}
                className="absolute text-white/70 font-semibold select-none z-20 pointer-events-none animate-watermark top-4 left-4"
                style={{
                    fontSize: "0.75rem",
                }}
            >
                {userId} • {dateTime}
            </span>
        </div>
    );
}

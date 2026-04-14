import React, { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, Platform, ActivityIndicator } from "react-native";
import { UploadCloud, Image as ImageIcon, Video, MonitorUp } from "lucide-react-native";
import { KadoColors } from "@/constants/theme";

interface DesktopDropzoneProps {
  isScanning: boolean;
  onImageCaptured: (fileOrBase64: File | string, method: "drop" | "upload" | "paste") => void;
  onToggleWebcam: () => void;
}

export const DesktopDropzone: React.FC<DesktopDropzoneProps> = ({
  isScanning,
  onImageCaptured,
  onToggleWebcam,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Native DOM drag and drop handlers (Only active on Web)
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (isScanning) return;

      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
      if (file) {
        onImageCaptured(file, "drop");
      }
    },
    [isScanning, onImageCaptured]
  );

  const handleContainerPress = () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isScanning) return;
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageCaptured(file, "upload");
    }
    // reset so you can select the same file again if needed
    e.target.value = "";
  };

  return (
    <View className="flex-1 w-full max-w-4xl self-center px-8 py-10 justify-center">
      {/* Hidden file input for web */}
      {Platform.OS === "web" && (
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      )}

      {/* Main Dropzone Container */}
      {/* @ts-ignore: React Native Web supports these native DOM drag events */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ flex: 1, display: 'flex', minHeight: 450 }}
      >
        <Pressable
          onPress={handleContainerPress}
          className={`flex-1 w-full rounded-[32px] items-center justify-center border-2 border-dashed
            ${isDragging ? "bg-navy/90 border-umber shadow-[0_0_40px_rgba(212,175,55,0.15)]" : "bg-navy/40 border-white/10"}
          `}
          style={{
            transition: "all 0.2s ease-in-out",
          } as any}
        >
          {isScanning ? (
            <View className="items-center justify-center p-12">
              <ActivityIndicator size="large" color={KadoColors.umber} />
              <Text className="mt-8 text-xl font-bold tracking-tight text-white/90">
                Analyzing intel...
              </Text>
              <Text className="mt-2 text-sm text-slate-text text-center max-w-[280px]">
                Matching features against the global database.
              </Text>
            </View>
          ) : (
            <View className="items-center justify-center p-12 pointer-events-none">
              <View 
                className={`w-28 h-28 rounded-full items-center justify-center mb-8 border border-white/5
                  ${isDragging ? "bg-umber/10" : "bg-white/5"}
                `}
                style={{
                  transition: "all 0.2s ease-in-out",
                  transform: [{ scale: isDragging ? 1.05 : 1 }],
                } as any}
              >
                {isDragging ? (
                  <UploadCloud size={48} color={KadoColors.umber} strokeWidth={1.5} />
                ) : (
                  <ImageIcon size={48} color={KadoColors.lightSlate} strokeWidth={1.5} />
                )}
              </View>

              <Text className={`text-3xl font-bold tracking-tight mb-4
                ${isDragging ? "text-umber" : "text-white/90"}
              `}>
                {isDragging ? "Drop to Scan" : "Drag & Drop Image"}
              </Text>

              <Text className="text-slate-text text-base leading-relaxed text-center mb-10 max-w-[360px]">
                Drop a card image here, click to browse, or press{" "}
                <Text className="text-white/80 font-semibold px-2 py-0.5 bg-white/10 rounded-md">Ctrl+V</Text>{" "}
                anywhere to paste a screenshot or marketplace link.
              </Text>

              <View className="flex-row items-center gap-6 opacity-60">
                <View className="flex-row items-center gap-2">
                  <MonitorUp size={16} color={KadoColors.slateText} />
                  <Text className="text-sm font-medium text-slate-text">Files & URLs</Text>
                </View>
                <View className="w-1 h-1 rounded-full bg-slate-text/50" />
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-medium text-slate-text">JPG, PNG, WEBP</Text>
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </div>

      {/* Footer controls: Webcam toggle */}
      <View className="mt-8 flex-row justify-between items-center px-4">
        <Pressable 
          onPress={onToggleWebcam}
          disabled={isScanning}
          className="flex-row items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 active:opacity-75 hover:bg-white/10"
          style={{ transition: "all 0.15s ease" } as any}
        >
          <Video size={18} color={KadoColors.slateText} />
          <Text className="text-sm font-bold text-slate-text">
            Use Desktop Webcam
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

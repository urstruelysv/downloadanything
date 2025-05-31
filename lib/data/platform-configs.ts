import { Youtube, Facebook, Instagram, Twitter, Video, Play } from "lucide-react"
import type { PlatformConfig } from "@/types/video"

export const platformConfigs: PlatformConfig[] = [
  { name: "YouTube", icon: Youtube, color: "text-red-500" },
  { name: "Instagram", icon: Instagram, color: "text-pink-500" },
  { name: "Facebook", icon: Facebook, color: "text-blue-500" },
  { name: "Twitter", icon: Twitter, color: "text-sky-500" },
  { name: "TikTok", icon: Video, color: "text-black" },
  { name: "Vimeo", icon: Play, color: "text-blue-400" },
]

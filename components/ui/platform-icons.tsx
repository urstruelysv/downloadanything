import { motion } from "framer-motion";
import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaFacebook,
} from "react-icons/fa";

export function PlatformIcons() {
  const platforms = [
    { icon: FaYoutube, name: "YouTube", color: "#FF0000" },
    { icon: FaInstagram, name: "Instagram", color: "#E1306C" },
    { icon: FaTiktok, name: "TikTok", color: "#010101" },
    { icon: FaTwitter, name: "Twitter", color: "#1DA1F2" },
    { icon: FaFacebook, name: "Facebook", color: "#4267B2" },
  ];

  return (
    <div className="flex gap-5 sm:gap-6 md:gap-8 items-center flex-wrap">
      {platforms.map(({ icon: Icon, name, color }, index) => (
        <motion.div
          key={name}
          whileHover={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-md dark:shadow-none bg-white dark:bg-gray-800"
          style={{
            color: color,
          }}
        >
          <Icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
        </motion.div>
      ))}
    </div>
  );
}

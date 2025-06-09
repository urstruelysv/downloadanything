import { Globe, Download, CheckCircle } from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Step 1: Effortlessly Copy Your Desired Video Link",
    descriptions: [
      "Begin your seamless download journey by simply copying the video link from your favorite platform. Our intelligent system supports a wide array of sources, ensuring you can grab content from almost anywhere.",
      "Whether it's a trending video from YouTube, a captivating Instagram Reel, an engaging Facebook Live stream, or a viral TikTok clip, our tool is designed to recognize and process links from all major social media and video hosting sites. Just find the share button, copy the URL, and you're halfway there!",
      "We've optimized our link detection to be robust, handling various URL formats from different platforms. This means less hassle for you and a higher success rate for your downloads.",
    ],
    icon: Globe,
    image: "/images/step1-copy-link.png",
  },
  {
    step: 2,
    title: "Step 2: Paste, Process, and Prepare for Download",
    descriptions: [
      "Once you have your video link, navigate back to our user-friendly interface. You'll find a prominent input field designed for easy pasting. Simply paste your copied URL into this field.",
      "Upon pasting, our advanced system immediately begins processing the link. This involves quickly analyzing the video source, fetching essential metadata like the video title and available formats, and preparing the content for download. A real-time progress indicator will keep you informed during this brief preparation phase.",
      "Our backend is powered by highly efficient algorithms that work tirelessly to ensure minimal wait times. We prioritize speed and security, providing you with a smooth and reliable experience without compromising your data.",
    ],
    icon: Download,
    image: "/images/step2-paste-process.png",
  },
  {
    step: 3,
    title: "Step 3: Instantly Download in Optimal Format & Quality",
    descriptions: [
      "After processing, you're just one click away from owning your content! Our tool automatically selects the optimal format (MP4) and best available quality to ensure maximum compatibility and viewing pleasure across all your devices.",
      "A single, clear 'Download' button will appear, accompanied by a dynamic progress bar that shows the download percentage in real-time. There's no need to clutter your experience with complicated format or quality selections – we handle it all to provide you with the best output.",
      "Our system ensures fast download speeds, and once completed, the file will be saved directly to your device. Enjoy your favorite videos offline, anytime, anywhere, with perfect audio-video synchronization and crystal-clear resolution. We guarantee a smooth and reliable download experience every time.",
    ],
    icon: CheckCircle,
    image: "/images/step3-choose-download.png",
  },
];

export function HowToUseSection() {
  return (
    <section
      id="how-to-use"
      className="max-w-6xl mx-auto py-16 px-4 md:px-6 lg:px-8"
    >
      <div className="text-center mb-16">
        <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
          Effortless Video Downloading in Just 3 Simple Steps
        </h3>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Download content from YouTube, Instagram, and more with unparalleled
          ease and speed.
        </p>
      </div>

      <div className="space-y-24">
        {steps.map((item, index) => (
          <div
            key={item.step}
            className={`flex flex-col lg:flex-row items-center gap-12 p-8 md:p-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-xl dark:shadow-blue-500/10 transition-all duration-500 transform hover:scale-[1.005] ${
              index % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div className="lg:w-1/2 flex justify-center items-center relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-500/10 rounded-full animate-pulse-slow"></div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/10 rounded-full animate-pulse-slow delay-200"></div>
              <img
                src={item.image}
                alt={`Step ${item.step} illustration`}
                className="w-full max-w-xl h-auto object-contain rounded-xl shadow-2xl dark:shadow-blue-700/30 border border-gray-200 dark:border-gray-700 transform hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-700 dark:from-blue-700 dark:to-purple-800 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6 shadow-xl dark:shadow-blue-500/30">
                <item.icon className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-snug">
                {item.title}
              </h4>
              <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300">
                {item.descriptions.map((desc, idx) => (
                  <p key={idx}>{desc}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

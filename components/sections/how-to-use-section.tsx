import { Globe, Download, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: 1,
    title: "Copy the Link",
    description:
      "Copy the video link from YouTube, Instagram, Facebook, or any supported platform.",
    icon: Globe,
  },
  {
    step: 2,
    title: "Paste & Process",
    description:
      "Paste the link into our input field and click the download button.",
    icon: Download,
  },
  {
    step: 3,
    title: "Choose & Download",
    description:
      "Select your preferred format and quality, then download instantly.",
    icon: CheckCircle,
  },
];

export function HowToUseSection() {
  return (
    <section id="how-to-use" className="max-w-4xl mx-auto mb-12">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          How to Use DownloadSomething
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Download videos in just 3 simple steps
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((item) => (
          <Card
            key={item.step}
            className="text-center p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl dark:hover:shadow-blue-500/10 transition-all duration-300"
          >
            <CardContent className="p-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg dark:shadow-blue-500/20">
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                Step {item.step}
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

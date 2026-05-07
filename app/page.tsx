"use client";

import { useState } from "react";
import { Hero, RecentSection } from "@/components/site/hero";
import {
  CTAStrip,
  FAQSection,
  FeaturesSection,
  Footer,
  HowItWorksSection,
  PlatformsSection,
  PricingSection,
  StatsSection,
  TestimonialsSection,
} from "@/components/site/sections";
import {
  DownloaderModal,
  type DownloadRecord,
} from "@/components/site/downloader";

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [seedUrl, setSeedUrl] = useState("");
  const [recent, setRecent] = useState<DownloadRecord[]>([]);

  const openDownloader = (url: string) => {
    setSeedUrl(url || "");
    setModalOpen(true);
  };

  const onComplete = (record: DownloadRecord) =>
    setRecent((prev) => [record, ...prev].slice(0, 8));

  return (
    <>
      <Hero onOpenDownloader={openDownloader} />
      <RecentSection recent={recent} />
      <PlatformsSection />
      <FeaturesSection />
      <HowItWorksSection onDemo={() => openDownloader("")} />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTAStrip onDemo={() => openDownloader("")} />
      <Footer />

      <DownloaderModal
        open={modalOpen}
        initialUrl={seedUrl}
        onClose={() => setModalOpen(false)}
        onComplete={onComplete}
      />
    </>
  );
}

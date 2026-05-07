"use client";

import { useEffect, useRef, useState } from "react";
import { PLATFORM_LABEL, PLATFORM_COLOR, labelForError } from "./constants";
import type { DownloadRecord, Step, ExtractApiResponse } from "./types";

export function useExtraction({
  open,
  initialUrl,
  onComplete,
}: {
  open: boolean;
  initialUrl: string;
  onComplete?: (record: DownloadRecord) => void;
}) {
  const [step, setStep] = useState<Step>("paste");
  const [url, setUrl] = useState(initialUrl);
  const [result, setResult] = useState<ExtractApiResponse | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setResult(null);
      setErrorMsg("");
      setErrorCode("");
      setStep("paste");
      if (initialUrl) analyze(initialUrl);
    } else {
      abortRef.current?.abort();
    }
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUrl]);

  const analyze = async (link: string) => {
    if (!link.trim()) return;
    setStep("analyzing");
    setErrorMsg("");
    setErrorCode("");
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: link }),
        signal: ac.signal,
      });
      const body = await res.json();
      if (!res.ok) {
        setErrorCode(body.error ?? "internal");
        setErrorMsg(body.message ?? labelForError(body.error));
        setStep("error");
        return;
      }
      const r = body as ExtractApiResponse;
      setResult(r);
      const flat = r.items.flatMap((i) => i.formats);
      setSelectedFormatId(flat[0]?.formatId ?? "");
      setStep("preview");
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setErrorCode("network");
      setErrorMsg("Network error. Check your connection and retry.");
      setStep("error");
    }
  };

  const [remaining, setRemaining] = useState<number | null>(null);

  const startDownload = async () => {
    if (!result || !selectedFormatId) return;
    const flat = result.items.flatMap((i) => i.formats);
    const fmt = flat.find((f) => f.formatId === selectedFormatId);
    if (!fmt) return;
    setStep("downloading");
    setErrorMsg("");
    try {
      const body: Record<string, unknown> = {
        url,
        formatId: selectedFormatId,
        title: result.title,
        ext: fmt.ext,
      };
      if (fmt.delivery === "direct" && fmt.directUrl) {
        body.directUrl = fmt.directUrl;
        if (fmt.directHeaders) body.directHeaders = fmt.directHeaders;
      }
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorCode(err.error ?? "internal");
        setErrorMsg(err.message ?? labelForError(err.error));
        setStep("error");
        return;
      }
      const ct = res.headers.get("content-type") ?? "";
      const filename = `${result.title.replace(/[^\w\d.-]+/g, "_")}.${fmt.ext}`;
      let downloadUrl: string;
      let blob: Blob | null = null;
      if (ct.includes("application/json")) {
        const j = (await res.json()) as { r2Url?: string; remaining?: number };
        downloadUrl = j.r2Url ?? "";
        if (j.remaining !== undefined) setRemaining(j.remaining);
      } else {
        blob = await res.blob();
        downloadUrl = URL.createObjectURL(blob);
        const hdr = res.headers.get("x-remaining");
        if (hdr) setRemaining(Number(hdr));
      }
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (blob) setTimeout(() => URL.revokeObjectURL(downloadUrl), 30_000);
      onComplete?.({
        url,
        platform: PLATFORM_LABEL[result.platform] ?? null,
        meta: {
          title: result.title,
          thumbColor:
            PLATFORM_COLOR[result.platform] ?? PLATFORM_COLOR.generic,
        },
        quality: fmt.quality,
        format: fmt.ext.toUpperCase(),
        completedAt: Date.now(),
      });
      setStep("done");
    } catch {
      setErrorCode("network");
      setErrorMsg("Network error during download. Retry.");
      setStep("error");
    }
  };

  const reset = () => {
    setUrl("");
    setResult(null);
    setSelectedFormatId("");
    setErrorMsg("");
    setErrorCode("");
    setStep("paste");
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        analyze(text);
      }
    } catch {}
  };

  return {
    step,
    url,
    setUrl,
    result,
    selectedFormatId,
    setSelectedFormatId,
    errorMsg,
    errorCode,
    remaining,
    analyze,
    startDownload,
    reset,
    handlePaste,
  };
}

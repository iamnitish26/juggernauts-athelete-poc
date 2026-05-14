"use client";

import { useState } from "react";
import { Copy, Check, Share2, MessageCircle } from "lucide-react";

interface SharePanelProps {
  athleteId: string;
  name: string;
  sport: string;
  ageGroup: string;
  district: string;
  profileUrl: string;
}

export default function SharePanel({
  athleteId,
  name,
  sport,
  ageGroup,
  district,
  profileUrl,
}: SharePanelProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const whatsappText = `🏆 Check out ${name}'s athlete profile on Juggernauts!\n\n${profileUrl}`;
  const tweetText = `Check out ${name}'s Juggernauts Athlete ID! ${sport} • ${district}, Odisha`;
  const instagramCaption = `Proud to create my Juggernauts Athlete ID.\n\nName: ${name}\nSport: ${sport}\nAge Group: ${ageGroup}\nDistrict: ${district}\nAthlete ID: ${athleteId}\n\nView profile: ${profileUrl}`;

  async function copyLink() {
    await navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(instagramCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  }

  async function nativeShare() {
    if (!navigator.share) return;
    await navigator.share({
      title: `${name} | Juggernauts Athlete ID`,
      text: `Check out ${name}'s athlete profile — ${sport} from ${district}, Odisha.`,
      url: profileUrl,
    });
  }

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="space-y-4">
      {/* Primary share row */}
      <div className="flex flex-wrap gap-2">
        {/* Copy link */}
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copiedLink ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copiedLink ? "Copied!" : "Copy Link"}
        </button>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-medium transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>

        {/* X (Twitter) */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(profileUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black hover:bg-gray-900 text-white text-sm font-medium transition-colors"
        >
          {/* X logo */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="hidden sm:inline">Post on </span>X
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm font-medium transition-colors"
        >
          {/* Facebook f logo */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="hidden sm:inline">Facebook</span>
        </a>

        {/* Web Share API — shown only when supported */}
        {hasNativeShare && (
          <button
            onClick={nativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#3B0764] text-white text-sm font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
      </div>

      {/* Instagram caption copy */}
      <div className="rounded-xl border border-dashed border-purple-200 bg-[#F5F3FF] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5B21B6]">
            {/* Instagram gradient camera icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            Instagram Caption
          </div>
          <button
            onClick={copyCaption}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#5B21B6] hover:text-[#3B0764]"
          >
            {copiedCaption ? (
              <>
                <Check className="w-3 h-3 text-green-500" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>
        </div>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
          {instagramCaption}
        </pre>
      </div>
    </div>
  );
}

"use client";

interface DownloadButtonProps {
  onClick: () => void;
}

export default function DownloadButton({ onClick }: DownloadButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mt-4 w-full py-3 rounded-lg font-medium text-sm transition-colors bg-green-600 hover:bg-green-700 text-white"
    >
      Download Converted File
    </button>
  );
}

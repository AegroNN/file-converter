"use client";

interface ConvertButtonProps {
  onClick: () => void;
  disabled: boolean;
  status: string;
}

export default function ConvertButton({
  onClick,
  disabled,
  status,
}: ConvertButtonProps) {
  const isConverting = status === "uploading" || status === "processing";

  return (
    <button
      onClick={onClick}
      disabled={disabled || isConverting}
      className="mt-4 w-full py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
    >
      {status === "uploading"
        ? "Uploading..."
        : status === "processing"
        ? "Converting..."
        : "Convert"}
    </button>
  );
}

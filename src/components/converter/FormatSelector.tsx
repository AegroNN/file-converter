"use client";

interface FormatSelectorProps {
  formats: string[];
  value: string;
  onChange: (format: string) => void;
  currentExtension?: string;
}

export default function FormatSelector({
  formats,
  value,
  onChange,
  currentExtension,
}: FormatSelectorProps) {
  const available = formats.filter((f) => f !== currentExtension);

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        Output Format
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {available.map((format) => (
          <option key={format} value={format}>
            .{format.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}

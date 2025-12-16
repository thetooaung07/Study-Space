"use client"

interface StatusBadgeProps {
  status: "OFFLINE" | "BREAK" | "STUDYING"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    OFFLINE: { bg: "bg-gray-500/20", text: "text-gray-600", label: "Offline" },
    BREAK: { bg: "bg-yellow-500/20", text: "text-yellow-600", label: "On Break" },
    STUDYING: { bg: "bg-green-500/20", text: "text-green-600", label: "Studying" },
  }

  const config = statusConfig[status]

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg}`}>
      <div className={`w-2 h-2 rounded-full ${config.text}`} />
      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
    </div>
  )
}

import { platformConfigs } from "@/lib/data/platform-configs"

export function PlatformIcons() {
  return (
    <div className="flex justify-center gap-6 mb-8">
      {platformConfigs.map((platform) => (
        <div key={platform.name} className="flex flex-col items-center gap-2 group">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center group-hover:shadow-md transition-shadow">
            <platform.icon className={`w-6 h-6 ${platform.color}`} />
          </div>
          <span className="text-xs text-gray-500">{platform.name}</span>
        </div>
      ))}
    </div>
  )
}

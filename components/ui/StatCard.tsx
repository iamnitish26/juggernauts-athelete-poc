interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
}

export default function StatCard({ label, value, icon, color = "bg-purple-50", subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`${color} p-3 rounded-xl`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface BarChartItem {
  label: string;
  shortLabel?: string;
  value: number;
  percentage: number;
  color: string;
}

const SimpleBarChart = ({ data }: { data: BarChartItem[] }) => (
  <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
    <div className="flex items-end justify-between h-56 min-w-[680px] gap-2 pt-10 px-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 group">
          <div className="text-[9px] text-muted-foreground mb-1 text-center leading-tight">
            {item.percentage}%
          </div>
          <div className="relative w-full max-w-[30px] bg-secondary rounded-t-md h-full overflow-hidden flex items-end mx-auto">
            <div
              className={`w-full transition-all duration-1000 ease-out ${item.color}`}
              style={{ height: `${item.percentage}%` }}
            />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              {item.label}: {item.value} ({item.percentage}%)
            </div>
          </div>
          <span className="text-[9px] text-muted-foreground font-bold mt-2 text-center leading-tight truncate w-full px-1">
            {item.shortLabel || item.label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default SimpleBarChart;

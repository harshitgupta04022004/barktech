import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  label: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: string; // "currency", "percent", "number"
}

interface DataPoint {
  label: string;
  value: number;
}

interface StatsChartData {
  title?: string;
  chart_type?: 'bar' | 'line' | 'pie' | 'donut';
  metrics: Metric[];
  data_points?: DataPoint[];
}

interface StatsChartProps {
  data: StatsChartData;
}

function formatValue(value: number | string, format?: string): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'currency':
      return `₹${value.toLocaleString('en-IN')}`;
    case 'percent':
      return `${value}%`;
    default:
      return value.toLocaleString('en-IN');
  }
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />;
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function MiniBarChart({ dataPoints }: { dataPoints: DataPoint[] }) {
  if (!dataPoints || dataPoints.length === 0) return null;
  const maxVal = Math.max(...dataPoints.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1 h-20 mt-2">
      {dataPoints.map((dp, i) => {
        const height = Math.max((dp.value / maxVal) * 100, 4);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-[#e65100] dark:bg-[#ff6d00] rounded-t"
              style={{ height: `${height}%` }}
              title={`${dp.label}: ${dp.value}`}
            />
            <span className="text-[9px] text-muted-foreground truncate max-w-full">
              {dp.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function StatsChart({ data }: StatsChartProps) {
  if (!data.metrics || data.metrics.length === 0) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden my-2">
      {data.title && (
        <div className="px-4 py-2.5 bg-muted border-b border-border">
          <span className="text-sm font-bold text-foreground">{data.title}</span>
        </div>
      )}
      <div className="p-4">
        {/* Metrics grid */}
        <div className={`grid gap-3 ${
          data.metrics.length <= 2 ? 'grid-cols-2' :
          data.metrics.length <= 4 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {data.metrics.map((metric, i) => (
            <div key={i} className="text-center">
              <div className="text-lg font-bold text-foreground">
                {formatValue(metric.value, metric.format)}
              </div>
              <div className="text-[10px] text-muted-foreground">{metric.label}</div>
              {metric.change && (
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <TrendIcon trend={metric.trend} />
                  <span className={`text-[10px] font-medium ${
                    metric.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                    metric.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                    'text-muted-foreground'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bar chart */}
        {data.data_points && data.data_points.length > 0 && (
          <MiniBarChart dataPoints={data.data_points} />
        )}
      </div>
    </div>
  );
}

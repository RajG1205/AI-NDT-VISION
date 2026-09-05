import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DetectionRow, InspectionWithDetections } from "@/types/ndt";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function Empty({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded border border-dashed border-border">
      <p className="px-4 text-center text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

export function DefectChart({ detections }: { detections: DetectionRow[] }) {
  if (detections.length === 0) return <Empty message="No detections recorded yet." />;
  const counts = new Map<string, number>();
  detections.forEach((d) => counts.set(d.class_name, (counts.get(d.class_name) ?? 0) + 1));
  const data = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" {...axis} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const severityFill: Record<string, string> = {
  Low: "var(--severity-low)",
  Medium: "var(--severity-medium)",
  High: "var(--severity-high)",
};

export function SeverityChart({ detections }: { detections: DetectionRow[] }) {
  if (detections.length === 0) return <Empty message="No severity estimates yet." />;
  const data = (["Low", "Medium", "High"] as const).map((s) => ({
    name: s,
    count: detections.filter((d) => d.severity === s).length,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" {...axis} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={severityFill[d.name]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ConfidenceChart({ detections }: { detections: DetectionRow[] }) {
  if (detections.length === 0) return <Empty message="No confidence values yet." />;
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    name: `${i * 10}-${i * 10 + 10}%`,
    count: 0,
  }));
  detections.forEach((d) => {
    const idx = Math.min(9, Math.floor(d.confidence * 10));
    const bucket = buckets[idx];
    if (bucket) bucket.count += 1;
  });
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={buckets} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" {...axis} interval={1} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="count" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function InspectionsOverTime({ inspections }: { inspections: InspectionWithDetections[] }) {
  if (inspections.length === 0) return <Empty message="No inspections recorded yet." />;
  const counts = new Map<string, number>();
  inspections.forEach((i) => {
    const day = new Date(i.created_at).toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  });
  const data = [...counts.entries()].sort().map(([date, count]) => ({ date, count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 16, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" {...axis} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

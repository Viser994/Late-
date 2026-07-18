"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsSummary } from "@/lib/data/types";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 12 };
const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

export function AnswersOverTimeChart({ data }: { data: AnalyticsSummary["answersOverTime"] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="ai" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="ai" name="AI answers" stroke="hsl(var(--primary))" fill="url(#ai)" strokeWidth={2} />
        <Line type="monotone" dataKey="human" name="Human answers" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function KnowledgeGrowthChart({ data }: { data: AnalyticsSummary["knowledgeGrowth"] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="documents" name="Documents" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="chunks" name="Chunks" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopQuestionsChart({ data }: { data: AnalyticsSummary["topQuestions"] }) {
  const trimmed = data.map((d) => ({ ...d, label: d.prompt.length > 30 ? `${d.prompt.slice(0, 30)}…` : d.prompt }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={trimmed} layout="vertical" margin={{ left: 40, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" {...axis} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" width={140} {...axis} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" name="Times asked" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

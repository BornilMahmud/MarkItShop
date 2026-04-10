"use client";

import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AdminAnalyticsChartProps {
  title: string;
  subtitle: string;
  type: "area" | "line";
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
  colors?: string[];
}

const AdminAnalyticsChart = ({
  title,
  subtitle,
  type,
  categories,
  series,
  colors = ["#3b82f6", "#0f172a"],
}: AdminAnalyticsChartProps) => {
  const options = {
    chart: {
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      fontFamily: "inherit",
    },
    colors,
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    legend: {
      position: "top" as const,
      horizontalAlign: "right" as const,
    },
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    fill: {
      type: type === "area" ? "gradient" : "solid",
      gradient: {
        opacityFrom: 0.35,
        opacityTo: 0.05,
      },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: "#64748b",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748b",
        },
      },
    },
    tooltip: {
      theme: "light" as const,
    },
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <Chart options={options} series={series} type={type} height={280} />
    </div>
  );
};

export default AdminAnalyticsChart;

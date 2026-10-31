import Chart from "chart.js/auto";
import { BasicPlatform } from "chart.js";
import C2S from "@mithrandirii/canvas2svg";

const exportButton = document.getElementById("export-btn");
const exportMenu = document.getElementById("export-menu");

exportButton.addEventListener("click", () => {
  if (exportMenu.classList.contains("hidden")) {
    exportMenu.classList.remove("hidden");
  } else {
    exportMenu.classList.add("hidden");
  }
});

export async function show_export_options(data) {
  exportButton.classList.remove("hidden");
  exportButton.disabled = false;
}

exportMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-format]");
  if (!option) return;

  const format = option.getAttribute("data-format");
  const chart = Chart.getChart("lcia-chart");
  if (!chart) return;

  if (format == "png" || format == "svg") {
    const ctxWidth = chart.width || chart.canvas?.width || 500;
    const ctxHeight = chart.height || chart.canvas?.height || 500;

    if (format == "png") {
      var url = generate_PNG(chart, ctxWidth, ctxHeight);
    } else {
      var url = generate_SVG(chart, ctxWidth, ctxHeight);
    }
  } else if (format == "csv") {
    var url = generate_CSV(chart);
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = `lciaOut-${chart.config.type}.${format}`;
  a.click();

  if (format == "svg" || format == "csv") {
    URL.revokeObjectURL(url);
  }
});

function generate_CSV(chart) {
  const labels = chart.data.labels ?? [];
  const datasets = chart.data.datasets ?? [];

  if (datasets[0]["label"] == "Time series") {
    const header = ["Scenario", "Score"];
    const rows = datasets[0].data.map((point) => [point.scenario, point.y]);

    var csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v)}"`).join(";"))
      .join("\n");
  } else if (datasets[0]["label"] == "Box") {
    const header = ["Statistic", "Value"];
    const rows = get_summary_stats(datasets[0].data[0]);

    var csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v)}"`).join(";"))
      .join("\n");
  } else {
    const header = ["Scenario", ...datasets.map((d) => d.label || "Dataset")];

    const rows = labels.map((label, i) => [
      label,
      ...datasets.map((d) => (Array.isArray(d.data) ? (d.data[i] ?? "") : "")),
    ]);

    var csv = [header, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"),
      )
      .join("\n");
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  return URL.createObjectURL(blob);
}

function generate_PNG(chart, ctxWidth, ctxHeight) {
  const pngCtx = document.createElement("canvas");
  pngCtx.width = ctxWidth;
  pngCtx.height = ctxHeight;

  const pngChart = new Chart(pngCtx, build_chart_configs(chart));

  const pngChartData = pngChart.toBase64Image("image/png", 1);
  pngChart.destroy();

  return pngChartData;
}

function generate_SVG(chart, ctxWidth, ctxHeight) {
  const svgCtx = new C2S({ width: ctxWidth, height: ctxHeight, document });
  if (typeof svgCtx.resetTransform !== "function") {
    svgCtx.resetTransform = () => svgCtx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const svgCanvas = {
    width: ctxWidth,
    height: ctxHeight,
    style: {},
    getContext: (contextType) => (contextType === "2d" ? svgCtx : null),
  };
  svgCtx.canvas = svgCanvas;

  const svgChart = new Chart(svgCanvas, {
    ...build_chart_configs(chart),
    platform: BasicPlatform,
  });
  svgChart.update();

  const svgText = svgCtx.getSerializedSvg();
  svgChart.destroy();

  const blob = new Blob([svgText], { type: "image/svg+xml" });

  return URL.createObjectURL(blob);
}

function build_chart_configs(chart) {
  const EXPORT_TEXT_COLOR = "#6b7280";

  const chartConfig = {
    type: chart.config.type,
    data: {
      labels: [...(chart.config.data?.labels ?? [])],
      datasets: (chart.config.data?.datasets ?? []).map((dataset) => ({
        ...dataset,
        label:
          typeof dataset.label === "string"
            ? dataset.label
            : dataset.label
              ? String(dataset.label)
              : "Dataset",
        data: Array.isArray(dataset.data) ? [...dataset.data] : dataset.data,
      })),
    },
    options: {
      ...(chart.config.options ?? {}),
      color: EXPORT_TEXT_COLOR,
      plugins: {
        ...(chart.config.options?.plugins ?? {}),
        title: {
          ...(chart.config.options?.plugins?.title ?? {}),
          color: EXPORT_TEXT_COLOR,
        },
        legend: {
          ...(chart.config.options?.plugins?.legend ?? {}),
          display: true,
          position: "bottom",
          maxHeight: 400,
          align: "start",
          labels: {
            ...(chart.config.options?.plugins?.legend?.labels ?? {}),
            font: {
              size: 10,
            },
            textAlign: "left",
            color: EXPORT_TEXT_COLOR,
          },
        },
      },
      scales: Object.fromEntries(
        Object.entries(chart.config.options?.scales ?? {}).map(
          ([scaleId, scale]) => [
            scaleId,
            {
              ...scale,
              ticks: {
                ...(scale?.ticks ?? {}),
                color: EXPORT_TEXT_COLOR,
              },
              title: {
                ...(scale?.title ?? {}),
                color: EXPORT_TEXT_COLOR,
              },
            },
          ],
        ),
      ),
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
    },
    plugins: chart.config.plugins ?? [],
  };

  return chartConfig;
}

function get_summary_stats(values) {
  const nums = values
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  if (!nums.length) return null;

  const mean = nums.reduce((s, n) => s + n, 0) / nums.length;

  const quantile = (arr, q) => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    const next = arr[base + 1];
    return next !== undefined
      ? arr[base] + rest * (next - arr[base])
      : arr[base];
  };

  return [
    ["min", nums[0]],
    ["q1", quantile(nums, 0.25)],
    ["median", quantile(nums, 0.5)],
    ["mean", mean],
    ["q3", quantile(nums, 0.75)],
    ["max", nums[nums.length - 1]],
  ];
}

import { wants2view, wantsMethod, wantsCategory, wantsImpact } from "./app.js";
import Chart from "chart.js/auto";
import {
  BoxPlotController,
  BoxAndWiskers,
} from "@sgratzl/chartjs-chart-boxplot";

Chart.register(BoxPlotController, BoxAndWiskers);
Chart.defaults.color = "#fff";
Chart.defaults.font.size = 16;
Chart.defaults.font.weight = "bold";

const ctx = document.getElementById("lcia-chart");
const exportMenu = document.getElementById("export-menu");

export async function show_chart(scores) {
  let chartStatus = Chart.getChart("lcia-chart");

  // destroy the previous chart, if any
  if (chartStatus != undefined) {
    chartStatus.destroy();
    exportMenu.classList.add("hidden");
  }

  if (scores) {
    if (wants2view.value == "detailed:emissions") {
      const chart = new Chart(ctx, {
        type: "bar",
        data: { labels: scores.pollutans.labels, datasets: scores.pollutans.datasets },
        options: {
          plugins: {
            title: {
              display: true,
              text: scores.lciamethod,
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toExponential(3)}`;
                },
              },
            },
          },
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            x: { stacked: true },
            y: {
              stacked: true,
              title: { display: true, text: "Score" },
              ticks: { callback: function(value) {
                return Number(value).toExponential(3);
              }}
            },
          },
        },
      });
    } else if (wants2view.value == "detailed:processes") {
      const chart = new Chart(ctx, {
        type: "bar",
        data: { labels: scores.processes.labels, datasets: scores.processes.datasets },
        options: {
          plugins: {
            title: {
              display: true,
              text: scores.lciamethod,
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toExponential(3)}`;
                },
              },
            },
          },
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            x: { stacked: true },
            y: {
              stacked: true,
              title: { display: true, text: "Score" },
              ticks: { callback: function(value) {
                return Number(value).toExponential(3);
              }}
            },
          },
        },
      });
    } else if (wants2view.value == "aggregated:time series") {

      var sum = [];
      var length = scores["single scores"].datasets.length

      for (var i = 0; i < length; i++) {

        var str = scores["single scores"].labels[i];
        if (str.split(" > ")[1] != "statusquo") {
          var trimmedStr = str.trim();
          var numberStr = trimmedStr.slice(trimmedStr.lastIndexOf(" ") + 1);
          var number = parseInt(numberStr, 10);
        } else {
          var number = 2025;
        }
        sum.push({ x: number, y: scores["single scores"].datasets[i], scenario: str });
      }
      const data = {
        datasets: [
          {
            label: "Time series",
            data: sum,
          },
        ],
      };

      const chart = new Chart(ctx, {
        type: "scatter",
        data: data,
        options: {
          scales: {
            x: {
              type: "linear",
              position: "bottom",
              title: { display: true, text: "Year" },
              ticks: {
                callback: function (value) {
                  return value.toString();
                },
              },
              min: 2020,
              max: 2110,
            },
            y: {
              title: { display: true, text: "Score" },
              ticks: { callback: function(value) {
                return Number(value).toExponential(3);
              }}
            },
          },
          plugins: {
            title: {
              display: true,
              text: scores.lciamethod,
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `${scores["single scores"].labels[tooltipItem.dataIndex]}: ${tooltipItem.raw.y.toExponential(3)}`;
                },
              },
            },
          },
          elements: {
            point: {
              radius: 10,
              backgroundColor: "#477ba6",
            },
          },
        },
      });
    } else if (wants2view.value == "aggregated:statistics") {

      const boxplotData = {
        labels: ["Aggregated LCIA scores"],
        datasets: [
          {
            label: "Box",
            backgroundColor: "#477ba6",
            borderColor: "#477ba6",
            itemRadius: 8,
            itemBackgroundColor: "#9fa647",
            data: [scores["single scores"].datasets],
          },
        ],
      };

      const chart = new Chart(ctx, {
        type: "boxplot",
        data: boxplotData,
        options: {
          responsive: true,
          scales: {
            x: {
              title: { display: false },
            },
            y: {
              title: { display: true, text: "Score" },
              ticks: { callback: function(value) {
                return Number(value).toExponential(3);
              }}
            },
          },
          plugins: {
            title: {
              display: true,
              text: scores.lciamethod,
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `Min ${tooltipItem.parsed.min.toExponential(3)}; Q1 ${tooltipItem.parsed.q1.toExponential(3)}; Median ${tooltipItem.parsed.median.toExponential(3)}; Mean ${tooltipItem.parsed.mean.toExponential(3)}; Q3 ${tooltipItem.parsed.q3.toExponential(3)}; Max ${tooltipItem.parsed.max.toExponential(3)}`;
                },
              },
            },
          },
        },
      });
    }
  }
}

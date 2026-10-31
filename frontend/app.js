import axios, { isCancel, AxiosError } from "axios";
import { TabulatorFull as Tabulator } from "tabulator-tables";

import { show_chart } from "./chartcontrol.js";
import { show_export_options } from "./chartexportcontrol.js";

// ============================ communication with backend

export const backendAt = "http://127.0.0.1:5000";
async function get_methods() {
    // query the backend to determine the hierarchy of LCIA method/category/impact
    try {
        const methodsResponse = await axios.get(`${backendAt}/listmethods/`);
        var methodsAvailable = methodsResponse.data;
    } catch (error) {
        console.log(error);
    }

    return methodsAvailable;
}

async function get_lcia_scores() {
    // query the backend to get the LCIA scores per database per emission for a given inventory and method
    const wantsScenarios = document.getElementById("selectedScenarios");
    const scenarioData = Array.from(wantsScenarios.childNodes)
        .map((node) => node.textContent)
        .join("; ");
    const inventoryTable = Tabulator.findTable("#inventory-table")[0];

    try {
        const lciaResponse = await axios.post(
            `${backendAt}/lcia/`,
            {
                scenarios: scenarioData,
                method: wantsMethod.value,
                category: wantsCategory.value,
                impact: wantsImpact.value,
                inv: JSON.stringify(inventoryTable.getData()),
            },
        );
        var lciaScores = {
            status: lciaResponse.status,
            data: lciaResponse.data,
        };
    } catch (error) {
        console.log(error);
        var lciaScores = {
            message: error.response.data,
        };
    }
    return lciaScores;
}

// ============================ control panel components

const wants2compute = document.querySelector("#compute-btn");
Object.defineProperty(wants2compute, "lciaResponse", {
    value: [],
    writable: true,
});
wants2compute.addEventListener("click", async () => {
    loader.style.display = "block";

    try {
        Object.defineProperty(wants2compute, "lciaResponse", {
            value: await get_lcia_scores(),
            writable: true,
        });

        if (wants2compute.lciaResponse.status !== 200) {
            show_chart(null);
        } else {
            show_chart(wants2compute.lciaResponse.data);
            show_export_options(wants2compute.lciaResponse.data);
        }
        show_logs(wants2compute.lciaResponse.data.logs);
    } catch (error) {
        show_chart(null);
        show_export_options(null);
        alert("... some server-side error 👿 idk");
        console.log(error);
    }

    loader.style.display = "none";
});

// scenario selector [managed in scenariocontrol.js]

// method selector

export const wantsMethod = document.getElementById("select-method");
export const wantsCategory = document.getElementById("select-category");
export const wantsImpact = document.getElementById("select-impact");

function make_option(component, o) {
    const option = document.createElement("option");
    option.value = o;
    option.textContent = o;
    component.appendChild(option);
}

// selection of what to display

export const wants2view = document.getElementById("select-aggview");

wants2view.addEventListener("change", () => {
    show_chart(wants2compute.lciaResponse.data);
    show_export_options(wants2compute.lciaResponse.data);
});

// session's log

const logsDisplay = document.getElementById("log-component");
function show_logs(logs) {
    logsDisplay.innerHTML = "";

    if (logs.fatal) {
        logsDisplay.innerHTML = `<h2>${logs.fatal}</h2>\n`;
    }

    if (logs.links.length != 0) {
        logsDisplay.innerHTML += "<h3>Check log message(s) 😐️</h3>\n";

        for (var logKind of ["links", "lcia"]) {
            if (logs[logKind].length != 0) {
                logsDisplay.innerHTML += `<h4>${logKind}</h4>\n`;
                let i = 0;
                logs[logKind].forEach((item) => {
                    i += 1;
                    logsDisplay.innerHTML += `<ul>${i}. ${item}</ul`;
                });
            }
        }
    }
}

// the DOM

const loader = document.getElementById("loader-container");

document.addEventListener("DOMContentLoaded", async () => {
    // load the available methods and make the hierarchy available for interactive selection
    loader.style.display = "block";
    const methods = await get_methods();

    for (var m of Object.keys(methods)) {
        make_option(wantsMethod, m);
    }
    for (var c of Object.keys(methods[wantsMethod.value])) {
        make_option(wantsCategory, c);
    }
    for (var i of methods[wantsMethod.value][wantsCategory.value]) {
        make_option(wantsImpact, i);
    }

    wantsMethod.addEventListener("change", () => {
        wantsCategory.innerHTML = "";
        for (var c of Object.keys(methods[wantsMethod.value])) {
            make_option(wantsCategory, c);
        }
        wantsImpact.innerHTML = "";
        for (var i of methods[wantsMethod.value][wantsCategory.value]) {
            make_option(wantsImpact, i);
        }
    });

    wantsMethod.dispatchEvent(new Event("change"));

    wantsCategory.addEventListener("change", () => {
        wantsImpact.innerHTML = "";
        for (var i of methods[wantsMethod.value][wantsCategory.value]) {
            make_option(wantsImpact, i);
        }
    });

    wantsCategory.dispatchEvent(new Event("change"));

    const wantsActivityInMatrix = document.getElementById(
        "activity-lookup-matrix",
    );
    wantsActivityInMatrix.value = "technosphere";

    loader.style.display = "none";
});

// ============================ activity lookup [managed in lookupcontrol.js]

// ============================ inventory table [managed in inventorycontrol.js]

// ============================ lcia chart [managed in chartcontrol.js]

// ============================ lcia chart export [managed in chartexportcontrol.js]

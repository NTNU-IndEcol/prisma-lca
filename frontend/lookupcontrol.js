import axios, { isCancel, AxiosError } from "axios";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import { backendAt } from "./app.js";

async function find_activities() {
    // query the backend to find activities matching search criteria
    const wantsScenarios = document.getElementById("selectedScenarios");
    const scenarioData = Array.from(wantsScenarios.childNodes)
        .map((node) => node.textContent)
        .join("; ");
    const wantsActivityInMatrix = document.getElementById(
        "activity-lookup-matrix",
    );
    const wantsActivityLoc = document.getElementById(
        "activity-lookup-location",
    );
    const wantsActivityUnit = document.getElementById("activity-lookup-unit");
    const wantsActivity = document.getElementById("activity-lookup-name");

    try {
        const activitiesResponse = await axios.post(
            `${backendAt}/listactivities/`,
            {
                scenarios: scenarioData,
                matrix: wantsActivityInMatrix.value,
                location: wantsActivityLoc.value,
                unit: wantsActivityUnit.value,
                search4: wantsActivity.value,
            },
        );
        var searchResults = activitiesResponse.data;
    } catch (error) {
        console.log(error);
    }
    return searchResults;
}

const wantsActivityInMatrix = document.getElementById("activity-lookup-matrix");
wantsActivityInMatrix.addEventListener("change", () => {
    lookupResults.style.display = "none";
    noActivityMessage.style.display = "none";
    const wantsActivityLoc = document.getElementById(
        "activity-lookup-location",
    );
    if (wantsActivityInMatrix.value == "technosphere") {
        wantsActivityLoc.style.display = "block";
    } else {
        wantsActivityLoc.style.display = "none";
    }
});

const wantsActivityLoc = document.getElementById("activity-lookup-location");
wantsActivityLoc.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        lookup_activities();
    }
});

const wantsActivityUnit = document.getElementById("activity-lookup-unit");
wantsActivityUnit.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        lookup_activities();
    }
});

const wantsActivity = document.getElementById("activity-lookup-name");
wantsActivity.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        lookup_activities();
    }
});

const lookupResults = document.getElementById("select-activity");
lookupResults.addEventListener("change", (e) => {
    let inventoryTable = Tabulator.findTable("#inventory-table")[0];
    const [name, unit, loc, type, cats, matrix] = e.target.value.split("; ");
    inventoryTable.addRow(
        {
            name: `${name}`,
            unit: `${unit}`,
            location: `${loc}`,
            type: `${type}`,
            categories: `${cats}`,
            matrix: `${matrix}`,
        },
        false,
    );
});

const noActivityMessage = document.getElementById("no-activity-message");

const loader = document.getElementById("loader-container");

function show_option(t, v) {
    if (v !== undefined && v !== null && v !== "") {
        if (t == "loc") {
            return `📍 ${v}`;
        } else if (t == "type") {
            return `🧩 ${v}`;
        } else if (t == "cats") {
            return `🌍 ${v}`;
        }
    } else {
        return "";
    }
}

async function lookup_activities() {
    noActivityMessage.style.display = "none";
    loader.style.display = "block"; // show the loader while waiting

    lookupResults.replaceChildren(); // clear the list of inventories found in a previous search

    var activitiesFound = await find_activities();

    if (activitiesFound.length !== 0) {
        activitiesFound.forEach((activity) => {
            var [name, unit, loc, type, cats, matrix] = [
                activity.name,
                activity.unit,
                activity.location,
                activity.type,
                activity.categories,
                activity.matrix,
            ];
            var option = document.createElement("option");
            option.innerHTML = `🏷️ ${name} ⚖️ ${unit} ${show_option("loc", loc)} ${show_option("type", type)} ${show_option("cats", cats)}`;
            option.value = `${name}; ${unit}; ${loc}; ${type}; ${cats}; ${matrix}`;
            lookupResults.appendChild(option);
            lookupResults.style.display = "block";
        });
    } else {
        lookupResults.style.display = "none";
        noActivityMessage.style.display = "block";
    }

    // add an inactive placeholder
    const placeholder = document.createElement("option");
    placeholder.innerHTML = "🔍 Lookup results";
    placeholder.selected = true;
    placeholder.disabled = true;
    lookupResults.prepend(placeholder);

    loader.style.display = "none"; // dismiss the loader
}

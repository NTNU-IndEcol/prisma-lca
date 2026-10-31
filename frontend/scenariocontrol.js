import axios, { isCancel, AxiosError } from "axios";
import { backendAt } from "./app.js";

// query the backend to determine which iam/pathway/year combinations are available
async function get_scenarios() {
    try {
        const scenarioResponse = await axios.get(
            `${backendAt}/listscenarios/`,
        );
        var scenariosAvailable = scenarioResponse.data;
    } catch (error) {
        console.log(error);
    }

    return scenariosAvailable;
}

const data = await get_scenarios();

const ul = document.getElementById("selectedScenarios");
const addBtn = document.getElementById("addscenario-btn");
const menuDiv = document.getElementById("scenarioMenu");

addBtn.addEventListener("click", () => {
    if (menuDiv.classList.contains("hidden")) {
        menuDiv.classList.remove("hidden");
        renderMenu();
    } else {
        menuDiv.classList.add("hidden");
    }
});

let selectedScenarios = new Set();

function renderMenu() {
    menuDiv.innerHTML = "";

    const sysmodOptions = [...new Set(data.map((d) => d.system))].filter(
        (cat) => hasUnselected({ system: cat }),
    );

    if (!sysmodOptions.length) return;

    const sysmodSelect = createSelect("system model", sysmodOptions);
    menuDiv.appendChild(sysmodSelect);

    sysmodSelect.addEventListener("change", () => {
        clearNext(sysmodSelect);
        const selectedSysmod = sysmodSelect.value;
        if (!selectedSysmod) return;

        const iams = [
            ...new Set(
                data
                    .filter((d) => d.system === selectedSysmod)
                    .map((d) => d.iam),
            ),
        ].filter((iam) =>
            hasUnselected({
                system: selectedSysmod,
                iam: iam,
            }),
        );

        if (iams.length) {
            const iamSelect = createSelect("IAM", iams);
            sysmodSelect.after(iamSelect);

            iamSelect.addEventListener("change", () => {
                clearNext(iamSelect);
                const selectedIAM = iamSelect.value;
                if (!selectedIAM) return;

                const paths = [
                    ...new Set(
                        data
                            .filter(
                                (d) =>
                                    d.system === selectedSysmod &&
                                    d.iam === selectedIAM,
                            )
                            .map((d) => d.pathway)
                            .filter(Boolean),
                    ),
                ].filter((path) =>
                    hasUnselected({
                        system: selectedSysmod,
                        iam: selectedIAM,
                        pathway: path,
                    }),
                );

                const hasYears = data.some(
                    (d) =>
                        d.system === selectedSysmod &&
                        d.iam === selectedIAM &&
                        d.year,
                );

                if (!paths.length && !hasYears) {
                    addItem({
                        system: selectedSysmod,
                        iam: selectedIAM,
                        pathway: null,
                        year: null,
                    });
                    renderMenu();
                    return;
                }

                if (paths.length) {
                    const pathSelect = createSelect("pathway", paths);
                    iamSelect.after(pathSelect);

                    pathSelect.addEventListener("change", () => {
                        clearNext(pathSelect);
                        const selectedPath = pathSelect.value;
                        if (!selectedPath) return;

                        let years = [
                            ...new Set(
                                data
                                    .filter(
                                        (d) =>
                                            d.system === selectedSysmod &&
                                            d.iam === selectedIAM &&
                                            d.pathway === selectedPath,
                                    )
                                    .map((d) => d.year),
                            ),
                        ].filter((year) =>
                            hasUnselected({
                                system: selectedSysmod,
                                iam: selectedIAM,
                                pathway: selectedPath,
                                year: year,
                            }),
                        );

                        if (years.length) {
                            years.unshift("all");
                            const yearSelect = createSelect("year", years);
                            pathSelect.after(yearSelect);

                            yearSelect.addEventListener("change", () => {
                                const selectedYear = yearSelect.value;
                                if (!selectedYear) return;
                                if (selectedYear === "all") {
                                    data.filter(
                                        (d) =>
                                            d.system === selectedSysmod &&
                                            d.iam === selectedIAM &&
                                            d.pathway === selectedPath,
                                    ).forEach(addItem);
                                } else {
                                    addItem({
                                        system: selectedSysmod,
                                        iam: selectedIAM,
                                        pathway: selectedPath,
                                        year: selectedYear,
                                    });
                                }
                                renderMenu();
                            });
                        }
                    });
                }
            });
        }
    });
}

function createSelect(label, options) {
    const select = document.createElement("select");
    select.classList.add("select-misc");
    const placeholder = document.createElement("option");
    placeholder.textContent = `[${label}]`;
    placeholder.value = "";
    select.appendChild(placeholder);

    options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
    });

    return select;
}

function clearNext(el) {
    while (el.nextSibling) {
        el.nextSibling.remove();
    }
}

function addItem(item) {
    const key = JSON.stringify(item);
    if (selectedScenarios.has(key)) return;
    selectedScenarios.add(key);

    const li = document.createElement("scenarioitem");
    li.textContent = Object.values(item).filter(Boolean).join(" > ");
    li.addEventListener("click", () => {
        selectedScenarios.delete(key);
        li.remove();
        renderMenu();
    });
    ul.appendChild(li);
    menuDiv.classList.add("hidden");
}

// check if unselected items remain
function hasUnselected(criteria) {
    const items = data.filter(
        (d) =>
            (!criteria.system || d.system === criteria.system) &&
            (!criteria.iam || d.iam === criteria.iam) &&
            (!criteria.pathway || d.pathway === criteria.pathway) &&
            (!criteria.year || d.year === criteria.year),
    );
    return items.some((d) => !selectedScenarios.has(JSON.stringify(d)));
}

// add a default item
function addDefaultItem() {
    const first = data.find((d) => !selectedScenarios.has(JSON.stringify(d)));
    if (first) addItem(first);
}

// ... init
addDefaultItem();
renderMenu();

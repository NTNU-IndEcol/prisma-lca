import { TabulatorFull as Tabulator } from "tabulator-tables";
import Papa from "papaparse";

function build_inventory_table() {
  const wantsInventoryType = document.getElementById("inventory-type-select");
  const type = wantsInventoryType.value;

  let amount = type == "static" ? "amount" : "amount 25";

  let table = Tabulator.findTable("#inventory-table")[0];

  if (table) {
    let fields = table.getColumns().map((col) => col.getField());
    const amounts = fields.filter((i) => i.startsWith("amount"));

    let data = table.getData();
    data = data.map((row) => {
      amounts.forEach((col) => delete row[col]);
      return row;
    });
    let columns = table.getColumnDefinitions();
    columns = columns.filter((col) => !amounts.includes(col.field));

    table.setColumns(columns);
    table.replaceData(data);

    table.addColumn(
      {
        title: "Amount statusquo",
        field: amount,
        editor: "input",
        validator: ["required", "numeric"],
        headerClick: function (e, t) {
          if (amount != "amount") {
            offer_options(e, t);
          }
        },
      },
      false,
      "name",
    );
    if (amount == "amount 25") {
      highlight_header(amount);
    }
  } else {
    table = new Tabulator("#inventory-table", {
      index: "i",
      layout: "fitDataStretch",
      history: true,
      movableColumns: false,
      headerSortClickElement: "icon",
      columnDefaults: { tooltip: true },
      validationMode: "highlight",
      selectableRows: 1,
      columns: [
        {
          title: "I",
          field: "i",
          formatter: "rownum",
        },
        {
          title: "Name",
          field: "name",
          width: 200,
          editor: "input",
          validator: "required",
        },
        {
          title: "Amount statusquo",
          field: amount,
          editor: "input",
          validator: ["required", "numeric"],
          headerClick: function (e, t) {
            if (amount != "amount") {
              offer_options(e, t);
            }
          },
        },
        {
          title: "Unit",
          field: "unit",
          editor: "input",
          validator: "required",
        },
        {
          title: "Location",
          field: "location",
          editor: "input",
          validator: "required",
        },
        { title: "Type", field: "type", editor: "input" },
        { title: "Categories", field: "categories", editor: "input" },
        {
          title: "Matrix",
          field: "matrix",
          editor: "list",
          editorParams: {
            values: { technosphere: "technosphere", biosphere: "biosphere" },
          },
        },
        { title: "Comment", field: "comment", editor: "input" },
      ],
      data: [
        {
          name: "market for tap water",
          [amount]: "1",
          unit: "kilogram",
          location: "RoW",
          type: "process",
          categories: "undefined",
          matrix: "technosphere",
          comment: "just a dummy 🧸 exchange",
        },
      ],
    });
    table.on("tableBuilt", function () {
      let fields = table.getColumns().map((col) => col.getField());
      if (fields.includes("amount 25")) {
        highlight_header("amount 25");
      }
    });
  }
  return table;
}

build_inventory_table();

const wantsInventoryType = document.getElementById("inventory-type-select");
wantsInventoryType.addEventListener("change", (e) => {
  const amountControlMenu = document.getElementById("inventory-amount-control");
  if (!amountControlMenu.classList.contains("hidden")) {
    amountControlMenu.classList.add("hidden");
  }
  build_inventory_table();
});

function highlight_header(fieldName) {
  const header = document.querySelector(`[tabulator-field="${fieldName}"]`);
  header.classList.add("tabulator-amount-header");
}

// row control
const wantsAnotherInvRow = document.getElementById("inv-addrow-btn");
wantsAnotherInvRow.addEventListener("click", () => {
  const table = Tabulator.findTable("#inventory-table")[0];
  table.addRow({}, false);
});
const wantsDelInvRow = document.getElementById("inv-delrow-btn");
wantsDelInvRow.addEventListener("click", () => {
  const table = Tabulator.findTable("#inventory-table")[0];
  var selectedRow = table.getSelectedRows()[0];
  if (selectedRow) {
    selectedRow.delete();
  }
});

function offer_options(e, t) {
  const [x, y] = [e.clientX, e.clientY];

  var fromYear = t._column.field.split(" ")[1];

  render_menu(x, y, fromYear);
}

function render_menu(x, y, year) {
  const amountControlMenu = document.getElementById("inventory-amount-control");

  if (amountControlMenu.classList.contains("hidden")) {
    amountControlMenu.classList.remove("hidden");
    amountControlMenu.style.left = x + "px";
    amountControlMenu.style.top = y + 20 + "px";

    var yearLongForm = year != "25" ? year : "statusquo";

    const wantsAnotherYear = document.getElementById("inv-addamount-btn");
    wantsAnotherYear.innerHTML = `Copy [${yearLongForm}]`;

    const table = Tabulator.findTable("#inventory-table")[0];

    let yearsPresent = [];
    table.getColumns().forEach((c) => {
      if (c._column.field.startsWith("amount ")) {
        yearsPresent.push(Number(c._column.field.split(" ")[1]));
      }
    });

    const wantsDelYear = document.getElementById("inv-delamount-btn");
    wantsDelYear.innerHTML = `Del [${yearLongForm}]`;
    wantsDelYear.year = year;

    if (yearsPresent.length > 1) {
      wantsDelYear.disabled = false;
    } else {
      wantsDelYear.disabled = true;
    }
  } else {
    amountControlMenu.classList.add("hidden");
  }
}

let allYears = [...Array(8).keys()].map((i) => i * 10 + 30);
allYears.unshift(25);

const wantsAnotherYear = document.getElementById("inv-addamount-btn");
wantsAnotherYear.addEventListener("click", () => {
  const table = Tabulator.findTable("#inventory-table")[0];
  const yearSelector = document.getElementById("select-year");
  yearSelector.replaceChildren();

  if (yearSelector.classList.contains("hidden")) {
    yearSelector.classList.remove("hidden");

    let yearsPresent = [];
    table.getColumns().forEach((c) => {
      if (c._column.field.startsWith("amount ")) {
        yearsPresent.push(Number(c._column.field.split(" ")[1]));
      }
    });

    let yearsCanSelect = [];
    allYears.forEach((a) => {
      if (!yearsPresent.includes(a)) {
        yearsCanSelect.push(a);
      }
    });

    create_select(yearsCanSelect);
  } else {
    yearSelector.classList.add("hidden");
  }
});

function create_select(options) {
  const yearSelector = document.getElementById("select-year");

  const placeholder = document.createElement("option");
  placeholder.textContent = "[to year]";
  yearSelector.appendChild(placeholder);

  options.forEach((opt) => {
    const option = document.createElement("option");
    var optLongForm = opt != 25 ? opt : "statusquo";
    option.value = opt;
    option.textContent = optLongForm;
    yearSelector.appendChild(option);
  });
}

const yearSelector = document.getElementById("select-year");
yearSelector.addEventListener("change", (e) => {
  insert_column(e.target.value);
  const amountControlMenu = document.getElementById("inventory-amount-control");
  amountControlMenu.classList.add("hidden");
  yearSelector.classList.add("hidden");
});

const wantsDelYear = document.getElementById("inv-delamount-btn");
wantsDelYear.addEventListener("click", () => {
  const amountControlMenu = document.getElementById("inventory-amount-control");
  amountControlMenu.classList.add("hidden");

  var fromYear = document.getElementById("inv-delamount-btn").year;
  fromYear = fromYear != "statusquo" ? fromYear : "25";

  const table = Tabulator.findTable("#inventory-table")[0];
  table.deleteColumn(`amount ${fromYear}`);
  table.getRows().forEach((r) => {
    let data = r.getData();
    delete data[`amount ${fromYear}`];
    r.update(data);
  });
});

function insert_column(toYear) {
  var fromYear = document.getElementById("inv-delamount-btn").year;
  const table = Tabulator.findTable("#inventory-table")[0];

  let yearsPresent = [];
  table.getColumns().forEach((c) => {
    if (c._column.field.startsWith("amount ")) {
      yearsPresent.push(Number(c._column.field.split(" ")[1]));
    }
  });

  let earlierPresentYears = [];
  yearsPresent.forEach((y) => {
    if (y < toYear) {
      earlierPresentYears.push(y);
    }
  });

  let latestPresentYear = Math.max(...earlierPresentYears);

  let adjacentLeftCol =
    latestPresentYear === -Infinity ? "name" : `amount ${latestPresentYear}`;

  var toYearDisplay = toYear != "25" ? toYear : "statusquo";
  table.addColumn(
    {
      title: `Amount ${toYearDisplay}`,
      field: `amount ${toYear}`,
      editor: "input",
      validator: ["required", "numeric"],
      headerClick: function (e, t) {
        offer_options(e, t);
      },
    },
    false,
    adjacentLeftCol,
  );

  highlight_header(`amount ${toYear}`);

  let amountsToDuplicate = [];
  table.getColumn(`amount ${fromYear}`)._column.cells.forEach((a) => {
    amountsToDuplicate.push(a.value);
  });

  table.getRows().forEach((r, i) => {
    r.getCell(`amount ${toYear}`).setValue(amountsToDuplicate[i]);
  });
}

const wantsDownload = document.getElementById("inv-download-btn");
wantsDownload.addEventListener("click", () => {
  const table = Tabulator.findTable("#inventory-table")[0];
  table.download("csv", "foreground.csv");
});

const uploadInput = document.getElementById("inv-upload-input");

const wantsUpload = document.getElementById("inv-upload-btn");
wantsUpload.addEventListener("click", () => {
  if (uploadInput.classList.contains("hidden")) {
    uploadInput.classList.remove("hidden");
  } else {
    uploadInput.classList.add("hidden");
  }
});

uploadInput.addEventListener("change", function (event) {
  const table = Tabulator.findTable("#inventory-table")[0];
  const fieldNames = table.getColumns().map((col) => col.getField());

  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: function (results) {
      const data = results.data;
      table.replaceData(match_table(data, fieldNames));
      uploadInput.classList.add("hidden");
    },
    error: function (error) {
      alert("Error parsing CSV: " + error.message);
    },
  });
});

function match_table(arr, fieldNames) {
  const wantsInventoryType = document.getElementById("inventory-type-select");
  const type = wantsInventoryType.value;

  return arr.map((obj) => {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (key != "Amount statusquo") {
          if (fieldNames.includes(key.toLowerCase())) {
            return [key.toLowerCase(), value];
          } else {
            return [null, null];
          }
        } else {
          if (type == "dynamic") {
            return ["amount 25", value];
          } else {
            return ["amount", value];
          }
        }
      }),
    );
  });
}

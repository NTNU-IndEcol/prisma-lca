import json, secrets, logging

import bw2analyzer as ba
import bw2calc as bc
import bw2data as bd
import pandas as pd

def list_scenarios():
    """
    Get/format a list of available scenarios
    """

    bd.projects.set_current("plca")

    scenarios = []

    for db in list(bd.databases):
        if db.startswith("consequential") or db.startswith("cutoff"):
            s, i, p, y = (db.split("_") + [None] * 4)[:4]

            scenarios.append({"system": s, "iam": i, "pathway": p, "year": y})

    return scenarios


def list_methods():
    """
    Get/format a list of available LCIA methods
    """

    bd.projects.set_current("plca")

    methodsFlat = [
        {"method": m[1], "category": m[2], "impact": m[3]} for m in bd.methods
    ]

    methodsHierarch = {}
    for mtd in sorted(set(i["method"] for i in methodsFlat)):
        methodsHierarch[mtd] = {}
        for cat in sorted(
            set(j["category"] for j in methodsFlat if j["method"] == mtd)
        ):
            methodsHierarch[mtd][cat] = []
            for imp in sorted(
                set(
                    k["impact"]
                    for k in methodsFlat
                    if k["method"] == mtd and k["category"] == cat
                )
            ):
                methodsHierarch[mtd][cat].append(imp)

    return methodsHierarch


def list_activities(lciLookup4):
    """
    Get/format a list of available activities,
    in selected matrix of requested scenario(s), mathcing the search querry.
    Return 100 items
    """

    scenariosRequested, matrixRequested, locationRequested, unitRequested, search4 = [v for v in lciLookup4.values()]

    bd.projects.set_current("plca")

    if matrixRequested == "biosphere":
        biosphereName = [db for db in bd.databases if db.endswith('biosphere')].pop()
        bioDB = bd.Database(biosphereName)

        searchResults = [
            {
                "database": "biosphere",
                "fields": ["name", "unit", "categories", "type"],
                "activities": [
                    act
                    for act in bioDB
                    if search4 in act["name"].lower()
                    and unitRequested in act["unit"].lower()
                ][:100],
            }
        ]

    else:
        scenariosPresent = bd.databases.keys()

        scenarios2lookIn = []

        for s in scenariosRequested.split("; "):
            sm, iam, path, y = (s.split(" > ") + [None] * 4)[:4]

            if not (path == None) | (y == None):
                scenarioNameNative = f"{sm}_{iam}_{path}_{y}"
            else:
                scenarioNameNative = f"{sm}_{iam}"

            if scenarioNameNative in scenariosPresent:
                scenarios2lookIn.append(scenarioNameNative)

        searchResults = []

        for s in scenarios2lookIn:
            db = bd.Database(s)

            searchResults.append(
                {
                    "database": s,
                    "fields": ["name", "unit", "location", "type"],
                    "activities": [
                        act
                        for act in db
                        if search4 in act["name"].lower()
                        and unitRequested in act["unit"].lower()
                        and locationRequested in act["location"].lower()
                    ][:100],
                }
            )

    acts = []

    for r in searchResults:
        for act in r["activities"]:
            actData = act.as_dict()
            act2show = {i: actData[i] for i in r["fields"]}
            act2show["matrix"] = matrixRequested
            acts.append(act2show)

    actsDF = pd.DataFrame(acts)

    if not actsDF.empty:
        actsFlat = (
            actsDF.drop_duplicates()
            .sort_values("name")
            .fillna("undefined")
            .to_dict("records")
        )
    else:
        actsFlat = []

    return actsFlat


def gather_lcia_results(lcia4):

    scenarios, method, category, impact, inventoryRaw = [v for v in lcia4.values()]
    inventory = json.loads(inventoryRaw)

    bd.projects.set_current("plca")
    scenariosPresent = bd.databases.keys()

    logs = {
        "links": [],  # problems interpreting/matching certain inventory records (top level and LCIA level)
        "lcia": [],  # problems running LCIA for particular scenario/inventory
        "formatting": [], # preparing the response
        "fatal": None,  # interrupting the entire workflow
    }  # fallback for logs
    lciaResponse = {"logs": logs}  # fallback for response

    # get valid scenarios to run for
    scenarios2run4 = {}

    for s in scenarios.split("; "):
        sm, iam, path, y = (s.split(" > ") + [None] * 4)[:4]

        if not (path == None) | (y == None):
            scenarioNameNative = f"{sm}_{iam}_{path}_{y}"
        else:
            scenarioNameNative = f"{sm}_{iam}"

        if scenarioNameNative in scenariosPresent:
            scenarios2run4[scenarioNameNative] = s

    if len(scenarios2run4.keys()) == 0:  # nothing to compute, exit
        logs["fatal"] = "☠️ zero scenarios"
        return lciaResponse

    # get seemingly valid inventory flows to run for, catch problems otherwise
    inventory2run4 = []

    for i in inventory:
        if "name" not in i.keys() or i["name"] == "":  # non-empy name
            logs["links"].append(f"⚠️ activity with empty name, skipped")
        elif not any(
            [i.startswith("amount") for i in i.keys()]
        ):  # at least one `amount <year>` column must exist
            logs["links"].append(f"⚠️ {i['name']} has empty amount, skipped")
        elif "matrix" not in i.keys():
            logs["links"].append(
                f"⚠️ {i['name']} with unknown matrix, skipped"
            )  # `techno-/bio-sphere cell is mandatory

        else:
            inventory2run4.append(i)

    if len(inventory2run4) == 0:  # nothing to compute, exit
        logs["fatal"] = "☠️ zero valid inventory flows"
        return lciaResponse

    else:
        lciaResults = {}  # fallback for errors in LCIA

        amounts = []  # either `amount` or multiple `amount <year>` fetched from inventory table

        for i in inventory2run4:
            for k in i.keys():
                if k.startswith("amount") and k not in amounts:
                    amounts.append(k)

        static = True if len(amounts) == 1 and amounts[0] == "amount" else False

        if static:  # run the only `amount` in inventory agains all requested scenarios
            for scenario in scenarios2run4:
                pollutants, processes, singleScore, funcLogs = compute_lcia_results(
                    scenario, scenarios2run4[scenario], "amount", inventory2run4,
                    method, category, impact,
                )

                logs["links"].extend(funcLogs["links"])

                if funcLogs["lcia"]:
                    logs["lcia"].append(funcLogs["lcia"])

                lciaResults[scenarios2run4[scenario]] = {'pollutans':pollutants, 'processes':processes, 'single score': singleScore}

        else:  # run for intersections of `amount <year>` inventory and `scenario <year>` requested scenarios
            intersectionCount = 0
            for scenario in scenarios2run4:
                s = scenario.split("_")[-1]
                s = s if s != "statusquo" else "2025"

                for a in amounts:
                    if str(int(a.split(" ")[-1]) + 2000) == s:
                        intersectionCount += 1
                        pollutants, processes, singleScore, funcLogs = compute_lcia_results(
                            scenario, scenarios2run4[scenario], a, inventory2run4,
                            method, category, impact,
                        )

                        logs["links"].extend(funcLogs["links"])

                        if funcLogs["lcia"]:
                            logs["lcia"].append(funcLogs["lcia"])

                        lciaResults[scenarios2run4[scenario]] = {'pollutans':pollutants, 'processes':processes, 'single score': singleScore}

            if intersectionCount == 0:
                logs["fatal"] = "☠️ missing scenarios for dynamic inventory"
                return lciaResponse

        response = format_response(lciaResults, logs, f"{method} {category} {impact}")

        return response


def format_response(lciaResults, logs, lciaMethod):

    logging.info(f'formatting results: {lciaResults}')

    lciaResponse = {"logs": logs, "lciamethod": lciaMethod}

    labs = list(lciaResults.keys())
    lciaResponse['single scores'] = {
        'datasets': [lciaResults[s]['single score'] for s in labs],
        'labels': labs
    }

    for aggregator in ['pollutans', 'processes']:

        try:
            longDF = pd.DataFrame([
                    {"scenario": s, "name": i["name"], "score": i["score"]}
                    for s in labs
                    for i in lciaResults[s][aggregator]
                    if i["score"] != 0
            ])

            wideDF = (
                longDF.pivot_table(index="name", columns="scenario", aggfunc="sum")
                .droplevel(0, axis=1)
                .rename_axis(None, axis=1)
                .fillna(0)
                )[labs]

            wideDF = pd.concat([
                wideDF,
                pd.DataFrame({"'Other'": lciaResponse['single scores']['datasets'] - wideDF.sum()}).T
            ])

            rows = [{"label": i, "data": wideDF.loc[i].values.tolist()} for i in wideDF.index]

            lciaResponse[aggregator] = {'datasets':rows, 'labels':labs}

        except:
            lciaResponse['logs']["formatting"] = f"could not prepare response for {aggregator}"
            lciaResponse[aggregator] = {'datasets':[], 'labels':[]}

            continue

    return lciaResponse


def compute_lcia_results(
    scenario, scenarioUserFriendly, amountAt, inventory2run4,
    method, category, impact,
):

    topPollutants, topProcesses, singleScore = [], [], None   # fallback results to return
    funcLogs = {"links": [], "lcia": None}  # logs, if any, to return

    eiDB = bd.Database(scenario)
    biosphereName = [db for db in bd.databases if db.endswith('biosphere')].pop()
    bioDB = bd.Database(biosphereName)

    # build a list of dicts containing unique matched activities/flows
    exchanges = []

    for i in inventory2run4:
        try:
            if i["matrix"] == "technosphere":
                inpAll = [act for act in eiDB
                    if i["name"] == act["name"]
                    and i["unit"] == act["unit"]
                    and i["location"] == act["location"]
                ]
            else:
                inpAll = [act for act in bioDB
                    if i["name"] == act["name"]
                    and i["unit"] == act["unit"]
                    and i["type"] == act["type"]
                    and tuple(i["categories"].split(",", 1)) == act["categories"]
                ]

            if len(inpAll) > 1:
                funcLogs["links"].append(
                    f"⚠️ {scenarioUserFriendly}: {i['name']}: search result is not unique, assumed 1st"
                )
            inp = inpAll[0].key

        except:
            funcLogs["links"].append(
                f"⚠️ {scenarioUserFriendly}: {i['name']}: could not match, skipped"
            )
            continue

        try:
            amount = float(i[amountAt])
        except:
            funcLogs["links"].append(
                f"⚠️ {scenarioUserFriendly}: {i['name']}: non-numeric amount, skipped"
            )
            continue

        exchanges.append({
                "input": inp,
                "amount": amount,
                "unit": i["unit"],
                "type": i["matrix"],
        })

    if len(exchanges) == 0:
        return (topPollutants, topProcesses, singleScore, funcLogs)  # nothing to compute, exit
    else:
        try:
            # create a temporary database with one activity corresponding to the FU
            fooDBname = secrets.token_hex()
            fooDB = bd.Database(fooDBname)
            fooDB.register()

            fooAct = fooDB.new_node(name="fooActName")
            fooAct.save()
            fooActProd = fooAct.new_edge(amount=1, input=fooAct, type="production").save()

            # write the matched exchanges to the temporary databases
            [fooAct.new_exchange(**e).save() for e in exchanges]

            try:
                # running LCIA
                lciaMethod = (f'ecoinvent-{biosphereName.split('-')[1]}', method, category, impact)

                fu, data_objs, _ = bd.prepare_lca_inputs({fooAct: 1}, lciaMethod)

                lca = bc.LCA(demand=fu, data_objs=data_objs)
                lca.lci()
                lca.lcia()
                ca = ba.ContributionAnalysis()

                topPollutants = ca.annotated_top_emissions(lca)
                topProcesses = ca.annotated_top_processes(lca, 20)
                singleScore = lca.score

            except:
                funcLogs["lcia"] = (
                    f"👿 {scenarioUserFriendly}: error in computing LCIA results"
                )
            fooDB.deregister()

        except:
            funcLogs["lcia"] = f"👿 {scenarioUserFriendly}: error in writing database"
            fooDB.deregister()

    return (
        [{"score": float(i[0]), "name": str(i[2])} for i in topPollutants],
        [{"score": float(i[0]), "name": str(i[2])} for i in topProcesses],
        float(singleScore),
        funcLogs
    )

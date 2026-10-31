import json
import logging
import re
from pathlib import Path

import bw2data as bd
import bw2io as bi
import premise

logging.basicConfig(level="INFO")

# get premise decryption key
premiseKeyFile = open("./premisekey.txt", "r")
premiseKey = premiseKeyFile.readline()
premiseKeyFile.close()

# setup the EI meta from extracted archives
eiSourceDir = Path("./eisource")
archivePattern = re.compile(r"^ecoinvent\s+([0-9.]+)_([a-zA-Z0-9-]+)_ecoSpold02$")
eiDirs = [
    p for p in eiSourceDir.iterdir() if p.is_dir() and archivePattern.match(p.name)
]

if not eiDirs:
    raise RuntimeError("No unpacked ecoinvent directories found in ./eisource")

eiVersions = set()
sysModels = []

for directory in sorted(eiDirs):
    match = archivePattern.match(directory.name)
    if not match:
        continue

    version = match.group(1)
    model = match.group(2)
    eiVersions.add(version)

    if model not in sysModels:
        sysModels.append(model)

if len(eiVersions) != 1:
    raise RuntimeError(
        f"Inconsistent ecoinvent versions detected: {', '.join(sorted(eiVersions))}"
    )

eiVersion = eiVersions.pop()

# setup the bw project with EI biosphere in there
bd.projects.set_current("plca")
bi.remote.install_project(f"ecoinvent-{eiVersion}-biosphere", "plca", overwrite_existing=True)

premise.clear_cache()

for model in sysModels:
    # setup bare EI in the BW project
    eiName4bw = f"{model}_statusquo"
    eiPath = Path(f"eisource/ecoinvent {eiVersion}_{model}_ecoSpold02/datasets")
    importer = bi.SingleOutputEcospold2Importer(dirpath=str(eiPath), db_name=eiName4bw)
    importer.apply_strategies()
    importer.write_database()

    # build/write premise DBs for all IAM-pathway combinations
    scenariosBulk = [
        [
            {'model': 'remind', 'pathway': 'SSP2-NDC', 'year': 2030},
            # {'model': 'remind', 'pathway': 'SSP2-NDC', 'year': 2070},
            # {'model': 'remind', 'pathway': 'SSP1-NPi', 'year': 2030},
        ],
        [
            {'model': 'image', 'pathway': 'SSP1-M', 'year': 2050}
        ]
    ]

    for scenarios in scenariosBulk:

        try:
            preDB = premise.NewDatabase(
                scenarios=scenarios,
                source_db=eiName4bw,
                source_version=eiVersion,
                biosphere_name=f"ecoinvent-{eiVersion}-biosphere",
                system_model=model,
                key=premiseKey,
                keep_source_db_uncertainty=True,
                use_absolute_efficiency=True,
            )
            preDB.update()
            preDB.write_db_to_brightway(
                name=[
                    f"{model}_{s['model']}_{s['pathway']}_{s['year']}"
                    for s in scenarios
                ]
            )

            logging.info(f"built dbs for {scenarios}")

        except:
            logging.info(f"failed building dbs for {scenarios}")
            continue

<h1>
    <img src="./frontend/assets/img/prism.svg" alt="prisma logo" width="150" style="vertical-align: middle; margin-right: 10px;"> PRISMA LCA
</h1> 
A cloud-native application for Prospective Life Cycle Assessment (pLCA), in essence:

* a compute API with tooling for Life Cycle Impact Assessment (LCIA) and background Life Cycle Inventory (LCI) lookup
* a web interface for building/exchanging (foreground) process inventories, requesting pLCA results from the API, visualizing/analyzing/exporting these results

PRISMA is also an acronym for PRospective Integrated System Modelling and Analysis.

Background LCI is a variant of [Ecoinvent](https://ecoinvent.org/) dataset modified (by [Premise](https://premise.readthedocs.io/en/latest/index.html)) to represent the social, technical and economic state-of-the-art at a selected time horizon under a selected scenario.
These scenarios follow various Integrated Assessment Models (IAMs) and Shared Socioeconomic Pathways (SSPs). If raw Ecoinvent datasets are used, PRISMA is also suited for conventional (non-prospective) LCA. 

## Key features

* Background LCI lookup by name, unit and location (if applicable) in selected scenarios or biosphere flows
* Building, importing and exporting a foreground inventory in a tabular format
* LCIA, given the:
    1. Foreground inventory table
    1. LCIA method, selected through a hierarchical menu
    1. A list of scenarios, selected through a hierarchical menu
* Interactive visualisation of LCIA results with:
    1. Bar chart stacked by LCIA scores per pollutant or background process
    1. t-plot and box-plot with aggregated LCIA scores
* Exporting LCIA results, in both graphical (.png, .svg) and tabular (.csv) format

## Delivery

This application is delivered in two ways:

* a managed Software-as-a-Service (SaaS) platform - accessible on the web, with background LCI datasets and compute resources already available
* a source code (in a GitHub repository) - enables installation, configuration and running the application on a PC or sever system (OS-agnostic), and making it available on an organisation’s local network

This is a public repo, containing the source code.

## Installation

### Data pipelines

* Build "futurised" versions of a background Life Cycle Inventory (LCI) database ([Ecoinvent](https://ecoinvent.org/)) using [Premise](https://premise.readthedocs.io/en/latest/index.html)
* Make background LCI datasets accessible for LCIA via the compute API
* Run a web interface such that it communicates with the compute API

### Prerequisites
* [Docker Engine/CE](https://docs.docker.com/engine/install/), standalone or as a component of [Docker Desktop](https://docs.docker.com/desktop/)
* A local copy of the GitHub repository
* Raw Ecoinvent dataset(s) in a `./scenariobuilder/eisource/` directory. Place at least one archive following the naming convention  `ecoinvent <version>_<system model>_ecoSpold02.7z`, e.g. `ecoinvent 3.12_cutoff_ecoSpold02.7z`. If more than one dataset, make sure `<version>` is consistent between them. Deployment is designed and tested for `consequential` and/or `cutoff` system models
* [Premise key](https://premise.readthedocs.io/en/latest/introduction.html#iam-data-access) in `./scenariobuilder/premisekey.txt` - a single line with a string of characters
 
### Build and run
In the project root repository, run `docker compose up`.

A web interface should be available at http://127.0.0.1:81

## Availability of IAMs, SSPs, LCI and LCIA methods

Currently available scenario datasets are built using Ecoinvent `v. 3.12` and Premise `v. 2.4.6`.

As of Premise `v.2.4.6`, the supported combinations of IAMs/SSPs are:

    IAMs: ('remind', 'remind-eu', 'image', 'message', 'tiam-ucl', 'gcam', 'witch')
    SSPs: ('SSP2-Base', 'SSP2-NDC', 'SSP2-NPi', 'SSP2-PkBudg1150', 'SSP2-PkBudg500', 'SSP2-PkBudg1000', 'SSP2-PkBudg650', 'SSP2-RCP26', 'SSP2-RCP19', 'SSP2-RCP45', 'SSP1-Base', 'SSP1-rollBack', 'SSP1-NPi', 'SSP1-PkBudg1150', 'SSP1-PkBudg500', 'SSP1-PkBudg1000', 'SSP1-PkBudg650', 'SSP3-rollBack', 'SSP5-Base', 'SSP5-NDC', 'SSP5-NPi', 'SSP5-PkBudg1150', 'SSP5-PkBudg500', 'SSP1-L', 'SSP1-M', 'SSP1-VL', 'SSP1-VLLO', 'SSP2-L', 'SSP2-M', 'SSP2-ML', 'SSP2-VLHO', 'SSP2-LO', 'SSP3-H', 'SSP4-LO', 'SSP5-H', 'SSP5-LO', 'static')

The available LCIA methods are those of [bw2data](https://docs.brightway.dev/en/latest/content/api/bw2data/index.html) `v. 4.7`.

## Software stack/architecture

Refer to an [illustration](./misc/illustrations/architecture.png) for details.

## Credits/contacts

This software is one of the expected outcomes of [LCA4Bio](https://lca4bioproject.eu/) project, funded by the European Union with the number 101135371. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union.

Get in touch with the developers via [contact@iedl.no](mailto:contact@iedl.no).

## License

The access is limited to, and free for, those affiliated with i) NTNU or ii) NTNU's collaborative partners, requires prior access approval and documented ownership of an Ecoinvent license. SaaS platform uses source code licensed under BSD 3-Clause.

**Copyright (c) 2026 by the [Industrial Ecology Digital Lab](https://iedl.no)**:

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:
    
    1. Redistributions of source code must retain the above copyright notice, this
      list of conditions and the following disclaimer.
    
    2. Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    
    3. Neither the name of the copyright holder nor the names of its
      contributors may be used to endorse or promote products derived from
      this software without specific prior written permission.
    
    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

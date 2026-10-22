# Occupation SDG Mapping

Skills carry the SDG targets that reskilling serves, mostly target 4.4 on youth and adult skills and goal 8 on decent work. This table adds the goals each job's own work serves, so a nurse shows health work (SDG 3) and a solar installer shows clean energy (SDG 7), rather than every job showing the same education and work goals.

Contents:

1.  [How It Works](#how-it-works)
1.  [Occupation Goals](#occupation-goals)
1.  [Limits](#limits)
1.  [See Also](#see-also)

## How It Works

`occupationSdgs(onetCode)` in `apps/web/src/engine/occupationSdg.ts` looks up the most specific key first. The detailed occupation code wins over its major group: `29-1141` is checked before `29`. An entry returns the goals its work serves and a one-line reason, which the interface shows in the chip tooltip.

## Occupation Goals

| Key     | Occupation                                                         | Goals  | Reason                                                                                               |
| ------- | ------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------- |
| 11      | Management                                                         | 8      | Managers run the organisations that create decent, productive work (SDG 8).                          |
| 13      | Business and Financial Operations                                  | 8      | Business and finance work keeps firms productive and widens access to financial services (SDG 8.10). |
| 15      | Computer and Mathematical                                          | 9      | Computing and data work builds digital infrastructure and innovation (SDG 9).                        |
| 17      | Architecture and Engineering                                       | 9, 11  | Engineers design the infrastructure that industry and cities run on (SDG 9, 11).                     |
| 19      | Life, Physical, and Social Science                                 | 9      | Scientists drive research and innovation (SDG 9.5).                                                  |
| 21      | Community and Social Service                                       | 10, 3  | Community and social service work reduces inequality and supports wellbeing (SDG 10, 3).             |
| 23      | Legal                                                              | 16     | Legal work upholds justice and the rule of law (SDG 16.3).                                           |
| 25      | Educational Instruction and Library                                | 4      | Educators deliver quality education (SDG 4).                                                         |
| 27      | Arts, Design, Entertainment, Sports, and Media                     | 8, 11  | Creative and media work sustains livelihoods and cultural heritage (SDG 8, 11.4).                    |
| 29      | Healthcare Practitioners and Technical                             | 3      | Health practitioners deliver health and wellbeing (SDG 3).                                           |
| 31      | Healthcare Support                                                 | 3      | Health support work keeps care running (SDG 3).                                                      |
| 33      | Protective Service                                                 | 16, 11 | Protective services keep people and places safe (SDG 16.1, 11.5).                                    |
| 35      | Food Preparation and Serving Related                               | 8, 12  | Food service creates jobs and can cut food waste (SDG 8, 12.3).                                      |
| 37      | Building and Grounds Cleaning and Maintenance                      | 6, 11  | Cleaning and grounds work keeps places sanitary and liveable (SDG 6.2, 11).                          |
| 39      | Personal Care and Service                                          | 3, 8   | Personal care work supports wellbeing and decent jobs (SDG 3, 8).                                    |
| 41      | Sales and Related                                                  | 8, 12  | Sales work drives trade and responsible consumption (SDG 8, 12).                                     |
| 43      | Office and Administrative Support                                  | 8      | Office and administrative work keeps organisations productive (SDG 8.2).                             |
| 45      | Farming, Fishing, and Forestry                                     | 2, 15  | Farming, fishing and forestry feed people and manage land (SDG 2, 15).                               |
| 47      | Construction and Extraction                                        | 9, 11  | Construction builds resilient infrastructure and housing (SDG 9, 11).                                |
| 49      | Installation, Maintenance, and Repair                              | 9      | Installation and repair keep infrastructure working (SDG 9.1).                                       |
| 51      | Production                                                         | 9, 12  | Production work drives sustainable industry and production (SDG 9.2, 12).                            |
| 53      | Transportation and Material Moving                                 | 11, 9  | Transport work moves people and goods (SDG 11.2, 9.1).                                               |
| 55      | Military Specific                                                  | 16     | Military work serves peace and security (SDG 16).                                                    |
| 11-9031 | Education and Childcare Administrators, Preschool and Daycare      | 4      | Early-childhood centre leaders run quality early education (SDG 4.2).                                |
| 11-9032 | Education Administrators, Kindergarten through Secondary           | 4      | School leaders run quality education (SDG 4.1).                                                      |
| 11-9033 | Education Administrators, Postsecondary                            | 4      | Postsecondary administrators run tertiary education (SDG 4.3).                                       |
| 11-9039 | Education Administrators, All Other                                | 4      | Education administrators run quality education (SDG 4).                                              |
| 11-9111 | Medical and Health Services Managers                               | 3      | Health service managers run health care (SDG 3.8).                                                   |
| 17-2071 | Electrical Engineers                                               | 7, 9   | Electrical engineers build energy systems (SDG 7, 9).                                                |
| 17-2081 | Environmental Engineers                                            | 6, 13  | Environmental engineers protect water and climate (SDG 6, 13).                                       |
| 17-3025 | Environmental Engineering Technologists and Technicians            | 6, 13  | Environmental engineering technicians protect water and climate (SDG 6, 13).                         |
| 19-1031 | Conservation Scientists                                            | 15     | Conservation scientists protect land ecosystems (SDG 15).                                            |
| 19-1041 | Epidemiologists                                                    | 3      | Epidemiologists protect public health (SDG 3.3).                                                     |
| 19-1042 | Medical Scientists, Except Epidemiologists                         | 3      | Medical scientists advance health research (SDG 3.b).                                                |
| 19-2041 | Environmental Scientists and Specialists, Including Health         | 13, 15 | Environmental scientists track climate and ecosystems (SDG 13, 15).                                  |
| 19-3011 | Economists                                                         | 8      | Economists inform growth and jobs policy (SDG 8).                                                    |
| 19-3051 | Urban and Regional Planners                                        | 11     | Urban and regional planners shape sustainable cities (SDG 11.3).                                     |
| 19-4042 | Environmental Science and Protection Technicians, Including Health | 6, 13  | Environmental science technicians monitor pollution (SDG 6, 13).                                     |
| 21-1094 | Community Health Workers                                           | 3      | Community health workers bring care to communities (SDG 3.8).                                        |
| 33-2011 | Firefighters                                                       | 11, 13 | Firefighters protect communities from disasters (SDG 11.5, 13.1).                                    |
| 39-9011 | Childcare Workers                                                  | 4, 5   | Childcare workers support early learning and parents at work (SDG 4.2, 5.4).                         |
| 45-3031 | Fishing and Hunting Workers                                        | 14     | Fishing workers depend on and manage life below water (SDG 14).                                      |
| 45-4011 | Forest and Conservation Workers                                    | 15     | Forest and conservation workers protect land ecosystems (SDG 15).                                    |
| 47-2152 | Plumbers, Pipefitters, and Steamfitters                            | 6      | Plumbers deliver clean water and sanitation (SDG 6).                                                 |
| 47-2231 | Solar Photovoltaic Installers                                      | 7, 13  | Solar installers expand clean energy (SDG 7, 13).                                                    |
| 49-9081 | Wind Turbine Service Technicians                                   | 7, 13  | Wind turbine technicians keep clean energy running (SDG 7, 13).                                      |
| 51-8013 | Power Plant Operators                                              | 7      | Power plant operators supply energy (SDG 7).                                                         |
| 51-8031 | Water and Wastewater Treatment Plant and System Operators          | 6      | Water treatment operators supply clean water (SDG 6).                                                |
| 53-3052 | Bus Drivers, Transit and Intercity                                 | 11     | Bus drivers provide public transport (SDG 11.2).                                                     |

## Limits

This is Kotak's own mapping, not an official UN or O\*NET classification. A job outside the detailed overrides takes its major group's goals, and a job whose major group is also absent shows no work-related chips.

## See Also

- [UN Sustainable Development Goals](https://sdgs.un.org/goals)
- [O\*NET Occupation Taxonomy](https://www.onetcenter.org/taxonomy.html)

# Global Data Analysis & Shared Intelligence Opportunities

**Objective**: Maximize the potential of the ecosystem by identifying shared data metrics and opportunities for cross-project optimization.

## 1. The Core Data Entities
Across the active projects (`Make_Ready_Board`, `Property_Dashboard`, `Owner_Directory`, `Utility_Tracker`, `Demand_Generator`), the following entities are constantly being reconstructed or fetched independently:

### A. The "Property > Unit" Hierarchy
*   **Current State**:
    *   **PMD (Property Dashboard)**: Infers properties from incoming AppFolio email reports.
    *   **MRB (Make Ready Board)**: Infers properties from incoming Maintenance email reports.
    *   **Demand Gen**: Likely reads from a standalone spreadsheet or user input.
    *   **Utility Tracker**: Often struggles with "Exact Match" property names (as seen in previous debugging).
*   **Opportunity**:
    *   Create a **Master Property Index** in `The_Workshop`.
    *   **Action**: `The_Workshop` should host a JSON or Sheet "Source of Truth" that maps `Property Name` (and aliases) to `Territory`, `Owner`, and `Units`.
    *   **Benefit**: `Utility_Tracker` can fuzzy-match against this Master Index to fix "Unmatched Water" errors. `MRB` and `PMD` can validate incoming emails against known properties to flag "New/Unknown" properties immediately.

### B. Tenant Data
*   **Current State**:
    *   **Delinquency** (PMD) knows who owes money.
    *   **Leasing** (PMD) knows who is applying.
    *   **Demand Generator** needs to know who to sue/evict.
*   **Opportunity**:
    *   Feed **PMD Delinquency Data** into **Demand Generator**.
    *   Instead of manually typing tenant names into Demand Generator, it should be able to "Import from PMD High Delinquency List".

### C. Inspection & Status Data
*   **Current State**:
    *   **MRB** tracks "Make Ready" status (Inspection -> Work Order -> Ready).
    *   **PMD** tracks "Vacancies" (Days Vacant).
*   **Opportunity**:
    *   **PMD Enrichment**: The "Critical Vacancies" tab in PMD should show *why* a unit is vacant.
    *   **Integration**: Pull the `Inspection Status` and `Rent Ready` flag from MRB and display it in PMD's Vacancy list.
    *   **Result**: Executive Summary can say "Unit 101 is vacant (20 days) - Status: *Waiting on Flooring* (from MRB)" instead of just "Vacant".

## 2. Immediate Optimization (The Feature Port)
**Task**: Port "Hide/Exclude Unit" from MRB to PMD.

*   **Source**: `Make_Ready_Board` uses a user-specific `mrb_hidden_list` property and a robust filtering UI (Eye Icon, "Show Hidden" toggle).
*   **Target**: `Property_Dashboard` (Critical Vacancies).
*   **Implementation Plan**:
    1.  **Persistence**: Add `mrb_hidden_list` (renamed to `pmd_hidden_vacancies`) handling to `PMD/Code.gs`.
    2.  **UI**: Inject the "Filter Mode" dropdown and "Unhide All" button into the Vacancy View in `PMD/index.html`.
    3.  **Logic**: Update `renderVacanciesTable` in `PMD/javascript.html` to respect the filter and render the interactive Eye icon.

## 3. Future "Beef Up" Proposals

1.  **The "Utility Alert" Layer**:
    *   **Idea**: If `Utility_Tracker` detects a high water bill for a vacant unit (known from `PMD/MRB`), trigger a prioritized alert. "Vacant unit usage > 0".
2.  **Owner Report enrichment**:
    *   **Idea**: When generating Owner Reports (in `Owner_Directory` or `PMD`), automatically fetch the "Make Ready Status" from `MRB` to include in the report. "Your unit is vacant, but painting is scheduled for tomorrow."

** Next Step**: Proceed with Item 2 (Feature Port) as requested.

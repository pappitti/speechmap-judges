# LLM Assessment Explorer

[Speechmap-judges Demo](https://github.com/user-attachments/assets/97da33fe-b033-4de5-886f-06fda8a0534c)

An interactive TypeScript app for exploring and comparing differences in Large Language Model (LLM) assessments. This tool helps visualize how different "judge" models classify the same LLM-generated responses, providing deep insights into inter-rater reliability and model behavior.

### Core Features

*   **Compare Any Two Judges**: Select any two LLM judges from the dataset to compare their assessments side-by-side.
*   **Filter by Theme**: Narrow down the analysis to specific topics or domains by filtering by question theme.
*   **Sankey Chart**: Visualize the reclassification flow, showing how assessments from Judge 1 are categorized by Judge 2.
*   **Transition Matrix (Heatmap)**: Get a clear, at-a-glance overview of agreement and disagreement between the two selected judges.
*   **Drill-Down to Details**: Click on any chart element to inspect the specific items, including the original question, the LLM's response, and the detailed analysis from both judges.

## Speechmap Data

This application explores datasets derived from xlr8harder's [Speechmap](https://speechmap.ai/) and [llm-compliance](https://github.com/xlr8harder/llm-compliance) projects. The data has been indexed and aggregated for efficient exploration.

The underlying dataset from HuggingFace includes:
*   **2.4k questions**: [speechmap-questions](https://huggingface.co/datasets/PITTI/speechmap-questions)
*   **336k responses**: [speechmap-responses](https://huggingface.co/datasets/PITTI/speechmap-responses-v2)
*   **875k LLM-judge assessments**: [speechmap-assessments](https://huggingface.co/datasets/PITTI/speechmap-assessments-v2)
    *   The assessment dataset combines the original assessments from `gpt-4o`, a new set from `mistral-small-3.1-2503`, a new set from `mistral-small-3.2-2506` and some manual annotations.

## Quick Start

### Prerequisites

You need to have [Node.js](https://nodejs.org/) (which includes npm) installed on your machine. Requires Node version >=20.15.1  

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/pappitti/speechmap-judges.git
    cd speechmap-judges
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Fetch Data and Build the Database:**  
    This command downloads the Parquet datasets from Hugging Face and creates a local `database.duckdb` file at the root of the project.

    ```sh
    npm run db:rebuild
    ```  
    This project includes a branch running on duckdb-wasm. That branch does not require this step 3 : you can run `npm run dev` directly after `npm install` (or `npm run build` and then `npm run preview` for production). However, that branch was never merged with the main branch because database persistence is tricky with duckdb-wasm so, right now, the database must be built again each time the app is started, which is really bad UX. IndexedDB is not an option ; more work is required on that branch.  
    _Also, duckdb-wasm in not as fast as expected for a database of this size_

4.  **Run the application:**  
    This command starts the React frontend development server.

    ```sh
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) (or the URL provided in your terminal) to view it in your browser.

## Acknowledgments

Whether you want to promote free speech or moderation, understanding biases in LLMs—and in the case of this project, biases in LLM-judges—is critical. Against this backdrop, the Speechmap project by xlr8harder is a very important initiative.


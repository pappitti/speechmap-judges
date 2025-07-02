# LLM Assessment Explorer

![LLM Assessment Explorer Demo](https://pitti-backend-assets.ams3.cdn.digitaloceanspaces.com/speechmap/speechmap-judges-overview.mp4)

An interactive TypeScript app for exploring and comparing differences in Large Language Model (LLM) assessments. This tool helps visualize how different "judge" models classify the same LLM-generated responses, providing deep insights into inter-rater reliability and model behavior.

### Core Features

*   **Compare Any Two Judges**: Select any two LLM judges from the dataset to compare their assessments side-by-side.
*   **Filter by Theme**: Narrow down the analysis to specific topics or domains by filtering by question theme.
*   **Waterfall Chart**: Visualize the reclassification flow, showing how assessments from Judge 1 are categorized by Judge 2.
*   **Transition Matrix (Heatmap)**: Get a clear, at-a-glance overview of agreement and disagreement between the two selected judges.
*   **Drill-Down to Details**: Click on any chart element to inspect the specific items, including the original question, the LLM's response, and the detailed analysis from both judges.

## Speechmap Data

This application explores datasets derived from xlr8harder's [Speechmap](https://speechmap.ai/) and [llm-compliance](https://github.com/xlr8harder/llm-compliance) projects. The data has been indexed and aggregated for efficient exploration.

The underlying dataset from Hugging Face includes:
*   **2.4k questions**: [speechmap-questions](https://huggingface.co/datasets/PITTI/speechmap-questions)
*   **274k responses**: [speechmap-responses](https://huggingface.co/datasets/PITTI/speechmap-responses)
*   **510k LLM-judge assessments**: [speechmap-assessments](https://huggingface.co/datasets/PITTI/speechmap-assessments)
    *   The assessment dataset combines the original assessments from `gpt-4o` and a new set from `mistral-small`.

## Quick Start

### Prerequisites

You need to have [Node.js](https://nodejs.org/) (which includes npm) installed on your machine.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
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

4.  **Run the application:**
    This command starts the React frontend development server.

    ```sh
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) (or the URL provided in your terminal) to view it in your browser.

## Acknowledgments

Whether you want to promote free speech or moderation, understanding biases in LLMs—and in the case of this project, biases in LLM-judges—is critical. Against this backdrop, the Speechmap project by xlr8harder is a very important initiative.

## TODO
*   **Move to `duckdb-wasm`**: Refactor the application to run entirely in the browser. This should be faster than the current DuckDb solution and will involve a client-side data persistence strategy (likely using the Origin Private File System) to download and build the database only once, ensuring fast load times on subsequent visits and eliminating the need for a Node.js backend.
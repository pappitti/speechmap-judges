// src/db/index.ts
import * as duckdb from '@duckdb/duckdb-wasm';
import { buildDatabase } from './builder';
// import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
// import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
// import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
// import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const DBNAME = 'speechmap.duckdb';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
        mainModule: '/duckdb-mvp.wasm',
        mainWorker: '/duckdb-browser-mvp.worker.js',
    },
    eh: {
        mainModule: '/duckdb-eh.wasm',
        mainWorker: '/duckdb-browser-eh.worker.js',
    },
};

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

function getDB(): Promise<duckdb.AsyncDuckDB> {
  
    if (dbPromise) {
        return dbPromise;
    }

    // This promise will be awaited by the UI. If it rejects, the UI will catch it.
    dbPromise = (async (): Promise<duckdb.AsyncDuckDB> => {
        console.log("[1/6] Creating logger...");
        const logger = new duckdb.ConsoleLogger();
        console.log("...OK");

        console.log("[2/6] Selecting bundle...");
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        // const bundle = MANUAL_BUNDLES.mvp; 
        console.log("...OK. Bundle selected:", bundle);

        console.log("[3/6] Creating new Worker...");
        const worker = new Worker(bundle.mainWorker!);
        console.log("...OK. Worker created.");

        console.log("[4/6] Creating AsyncDuckDB instance...");
        const db = new duckdb.AsyncDuckDB(logger, worker);
        console.log("...OK. Instance created.");

        console.log("[5/6] Instantiating Wasm module... (High chance of failure here)");
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        console.log("...OK. Module instantiated.");

        // ================== NEW DEBUGGING STEP ==================
        // Let's test the virtual file system before trying to open a file.
        try {
            console.log("--- Probing the virtual file system with glob... ---");
            const files = await db.globFiles('*');
            console.log("--- VFS probe success. Files found:", files);
            // On a truly clean slate, this should log an empty array [].
            // If it logs ['speechmap.duckdb'], then the file somehow still exists.
            // If it throws an error, we have PROVEN the VFS is broken.
        } catch (e) {
            console.error("--- VFS probe FAILED. The file system interface is not working.", e);
            throw new Error("VFS probe failed, aborting DB initialization.", { cause: e });
        }
        // =========================================================

        console.log("[6/6] Opening persisted database file... (High chance of failure here)");
        await db.open({ 
          path: DBNAME,
          accessMode : duckdb.DuckDBAccessMode.READ_WRITE,
        });
        console.log("...OK. Database file opened.");
        
        console.log("--- INITIALIZATION SUCCEEDED ---");
        
        const conn = await db.connect();
        try {
            const tablesResult = await conn.query(`SHOW TABLES;`);
            const tables = tablesResult.toArray().map((row: any) => row.name);
            if (!tables.includes('questions')) {
                console.log('Database requires build. Starting process...');
                await buildDatabase(db, conn);

                console.log("Build complete. Flushing changes to persistent storage...");
                await db.flushFiles();
                console.log("...OK. Database is now saved to IndexedDB.");
            } else {
                console.log('Database already exists.');
            }
        } finally {
            await conn.close();
        }

        return db;
    })();

    return dbPromise;
}

/**
 * The "Nuke" button. Wipes everything and starts fresh.
 * This is the ONLY function that should perform cleanup.
 */
async function repairAndReload(): Promise<void> {
    console.log("Wiping all DuckDB storage and reloading page.");
    
    // We do not try to access the old dbPromise. It's a rejected promise.
    // Instead, we just null it out so the next run starts fresh.
    dbPromise = null;
    
    // Create a new, temporary, clean instance just for cleanup.
    const logger = new duckdb.ConsoleLogger();
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    const worker = new Worker(bundle.mainWorker!);
    const tempDb = new duckdb.AsyncDuckDB(logger, worker);
    await tempDb.instantiate(bundle.mainModule, bundle.pthreadWorker);
    
    try {
        await tempDb.dropFiles();
        console.log("Successfully dropped all DuckDB files.");
    } catch(e) {
        console.error("Failed to drop files during repair.", e);
    } finally {
        await tempDb.terminate();
        console.log("Reloading the page to ensure a clean state.");
        // This is the most reliable way to kill all old state and workers.
        window.location.reload();
    }
}

export { getDB, repairAndReload };
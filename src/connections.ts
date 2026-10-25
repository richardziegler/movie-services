import { Database, OPEN_READONLY } from "sqlite3";

export interface DatabaseConnections {
  moviesDB: Database;
  ratingsDB: Database;
}

let connectionsPromise: Promise<DatabaseConnections> | undefined;

const closeDatabase = (db: Database): Promise<void> =>
  new Promise((resolve, reject) => {
    db.close((error) => error ? reject(error) : resolve());
  });

const openConnections = (): Promise<DatabaseConnections> => {
  return new Promise((resolve, reject) => {
    const moviesDB = new Database(
      "./db/movies.db",
      OPEN_READONLY,
      (err: Error | null) => {
        if (err) {
          console.error("Error opening movies database:", err.message);
          reject(err);
          return;
        }
        console.log("Movies database opened successfully");

        const ratingsDB = new Database(
          "./db/ratings.db",
          OPEN_READONLY,
          (err: Error | null) => {
            if (err) {
              console.error("Error opening ratings database:", err.message);
              closeDatabase(moviesDB).then(() => reject(err), reject);
              return;
            }
            console.log("Ratings database opened successfully");
            resolve({ moviesDB, ratingsDB });
          }
        );
      }
    );
  });
};

export const initDatabase = (): Promise<DatabaseConnections> => {
  connectionsPromise ??= openConnections().catch((error) => {
    connectionsPromise = undefined;
    throw error;
  });
  return connectionsPromise;
};

export const getMoviesDB = (): Promise<Database> => {
  return initDatabase().then(({ moviesDB }) => moviesDB);
};

export const getRatingsDB = (): Promise<Database> => {
  return initDatabase().then(({ ratingsDB }) => ratingsDB);
};

export const closeAllConnections = async (dbs: DatabaseConnections): Promise<void> => {
  await Promise.all([
    closeDatabase(dbs.moviesDB),
    closeDatabase(dbs.ratingsDB),
  ]);
  connectionsPromise = undefined;
  console.log("All database connections closed");
};

import { openDatabase } from "./db.js";
const db = openDatabase();
db.close();
console.log("Database initialized. Existing records were preserved.");


import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    try {
        const result = await db.update(users)
            .set({ role: "admin" })
            .where(eq(users.email, "admin_test@example.com"))
            .returning();

        console.log("Updated user:", result);
    } catch (error) {
        console.error("Error updating user:", error);
    }
    process.exit(0);
}

main();

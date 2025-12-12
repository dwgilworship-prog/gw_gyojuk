import { storage } from "./storage";
import { hashPassword } from "./auth";
import { log } from "./index";

const ADMIN_EMAIL = "admin@shepherdflow.com";
const ADMIN_PASSWORD = "admin1234";

export async function seedDatabase() {
  try {
    const existingAdmin = await storage.getUserByEmail(ADMIN_EMAIL);
    
    if (!existingAdmin) {
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);
      await storage.createUser({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
      });
      log(`Admin account created: ${ADMIN_EMAIL}`, "seed");
    } else {
      log("Admin account already exists", "seed");
    }
  } catch (error) {
    log(`Seed error: ${error}`, "seed");
  }
}

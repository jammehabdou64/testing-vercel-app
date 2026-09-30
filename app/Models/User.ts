import { Authenticatable } from "bun-jcc/Auth/Authenticatable";
import { Hash } from "bun-jcc";

export class User extends Authenticatable {
  static table = "users";
  protected hidden = ["password"];

  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare email_verified_at: string | null;

  static override booted(): void {
    this.creating(async (user) => {
      const password = user.getAttribute("password");
      if (typeof password === "string" && password !== "") {
        user.setAttribute("password", await Hash.make(password));
      }
      const now = new Date().toISOString();
      user.setAttribute("created_at", now);
      user.setAttribute("updated_at", now);
    });

    this.updating((user) => {
      user.setAttribute("updated_at", new Date().toISOString());
    });
  }
}

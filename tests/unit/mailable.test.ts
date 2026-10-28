import { describe, expect, test } from "bun:test";
import { WelcomeMail } from "../../src/mail/Welcome.mail.ts";

describe("Mailable System & JSX Email Rendering", () => {
  test("WelcomeMail produces valid envelope and HTML content", async () => {
    const mail = new WelcomeMail({
      name: "Budi Santoso",
      actionUrl: "https://example.com/dashboard",
    });

    const envelope = await mail.envelope();
    expect(envelope.subject).toBe("Selamat Datang, Budi Santoso!");

    const content = await mail.content();
    expect(content).toContain("Budi Santoso");
    expect(content).toContain("https://example.com/dashboard");
    expect(content).toContain("Buka Dashboard");
    expect(content).toContain("<html");
    expect(content).toContain("</html>");
  });
});

import { EmailLayout, EmailButton } from "./layouts/EmailLayout.tsx";

export interface WelcomeEmailProps {
  name: string;
  actionUrl?: string;
}

export const WelcomeEmail = ({
  name,
  actionUrl = "http://localhost:8080",
}: WelcomeEmailProps) => {
  return (
    <EmailLayout
      title="Selamat Datang!"
      previewText={`Halo ${name}, selamat datang di aplikasi kami!`}
    >
      <h2 style={{ margin: "0 0 16px 0", color: "#111827", fontSize: "18px" }}>
        Halo, {name}!
      </h2>
      <p style={{ margin: "0 0 16px 0", color: "#4b5563" }}>
        Terima kasih telah bergabung dengan platform kami. Akun Anda telah berhasil
        didaftarkan dan siap untuk digunakan.
      </p>
      <p style={{ margin: "0 0 16px 0", color: "#4b5563" }}>
        Silakan klik tombol di bawah ini untuk mengakses dashboard Anda:
      </p>

      <EmailButton href={actionUrl} label="Buka Dashboard" color="#2563eb" />

      <p style={{ margin: "24px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
        Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di browser Anda:
        <br />
        <a
          href={actionUrl}
          style={{ color: "#2563eb", wordBreak: "break-all" }}
        >
          {actionUrl}
        </a>
      </p>
    </EmailLayout>
  );
};

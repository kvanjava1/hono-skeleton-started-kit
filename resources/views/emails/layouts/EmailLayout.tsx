import type { Child } from "hono/jsx";

export interface EmailLayoutProps {
  title?: string;
  previewText?: string;
  children: Child;
}

export const EmailLayout = ({
  title = "Notification",
  previewText,
  children,
}: EmailLayoutProps) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {previewText && (
          <div
            style={{
              display: "none",
              maxHeight: "0px",
              overflow: "hidden",
            }}
          >
            {previewText}
          </div>
        )}
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f4f5f7",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#333333",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <table
          width="100%"
          border={0}
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: "#f4f5f7", padding: "30px 15px" }}
        >
          <tr>
            <td align="center">
              <table
                width="100%"
                border={0}
                cellPadding={0}
                cellSpacing={0}
                style={{
                  maxWidth: "600px",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    style={{
                      padding: "24px 32px",
                      backgroundColor: "#18181b",
                      textAlign: "center",
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "20px",
                        fontWeight: 600,
                        letterSpacing: "-0.5px",
                      }}
                    >
                      {title}
                    </h1>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td
                    style={{
                      padding: "32px",
                      fontSize: "16px",
                      lineHeight: "1.6",
                    }}
                  >
                    {children}
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      padding: "24px 32px",
                      backgroundColor: "#fafafa",
                      borderTop: "1px solid #eaeaea",
                      fontSize: "12px",
                      color: "#888888",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ margin: "0 0 6px 0" }}>
                      Dikirim secara otomatis oleh Hono Skeleton.
                    </p>
                    <p style={{ margin: 0 }}>
                      © {new Date().getFullYear()} All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

export interface EmailButtonProps {
  href: string;
  label: string;
  color?: string;
}

export const EmailButton = ({
  href,
  label,
  color = "#2563eb",
}: EmailButtonProps) => {
  return (
    <div style={{ margin: "24px 0", textAlign: "center" }}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          padding: "12px 28px",
          backgroundColor: color,
          color: "#ffffff",
          textDecoration: "none",
          borderRadius: "6px",
          fontWeight: 600,
          fontSize: "15px",
        }}
      >
        {label}
      </a>
    </div>
  );
};

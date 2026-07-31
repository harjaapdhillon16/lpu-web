import "./globals.css";

export const metadata = {
  title: {
    default: "Academic Document Authentication",
    template: "%s · Academic Records",
  },
  description: "University academic transcript verification portal.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/assets/portal-mark.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

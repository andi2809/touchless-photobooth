import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "PTIK BEMP Touchless Interactive Photobooth",
	description:
		"Aplikasi photobooth interaktif tanpa sentuh berbasis MediaPipe AI dan Dual-Monitor Sync untuk Pameran BEMP PTI UNJ.",
	icons: {
		icon: "/icon.png",
		apple: "/icon.png",
	},
};

export const viewport: Viewport = {
	themeColor: "#020617",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="id" className="dark" suppressHydrationWarning>
			<body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
				{children}
			</body>
		</html>
	);
}

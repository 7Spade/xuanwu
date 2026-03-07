
import type {Metadata} from 'next';

import './globals.css';
import { I18nProvider } from '@/shared/app-providers/i18n-provider';
import { AppProvider } from '@/features/workspace.slice';
import { AuthProvider } from '@/shared/app-providers/auth-provider';
import { FirebaseClientProvider } from '@/shared/app-providers/firebase-provider';
import { ThemeProvider } from '@/shared/app-providers/theme-provider';
import {Toaster} from '@/shared/shadcn-ui/toaster';
import { cn } from '@/shared/shadcn-ui/utils/utils';

export const metadata: Metadata = {
  title: 'OrgVerse | Modern Workspace Architecture',
  description: 'From Single Identity to Multidimensional Organization',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('font-sans', 'antialiased', 'min-h-screen', 'bg-background')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <FirebaseClientProvider>
              <AuthProvider>
                <AppProvider>
                  {children}
                  <Toaster />
                </AppProvider>
              </AuthProvider>
            </FirebaseClientProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

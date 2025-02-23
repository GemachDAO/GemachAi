import React from 'react'
import AppSidebar from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth/session';
export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    return (
        <>
            <SidebarProvider defaultOpen={true}>
                {
                    session && <AppSidebar user={session.user} />
                }
                <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
        </>
    )
}

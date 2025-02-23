'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountMenu } from '@/components/account-menu';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    useSidebar,
} from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, PlusIcon, Wallet } from "lucide-react"
import { ChatList } from '@/components/chat/chat-list';
import { AssetList } from '@/components/asset-list';
interface AppSidebarProps {
    user: User | undefined
}
const AppSidebar = ({ user }: AppSidebarProps) => {
    const router = useRouter();
    const { setOpenMobile } = useSidebar();
    const [activeTab, setActiveTab] = useState<'chats' | 'assets'>('chats')

    return (
        <Sidebar className="group-data-[side=left]:border-r-0">
            <SidebarHeader>
                <SidebarMenu>
                    <div className="flex flex-row justify-between items-center">
                        <div
                            onClick={() => {
                                setOpenMobile(false);
                                router.push('/');
                                router.refresh();
                            }}
                            className="flex flex-row gap-3 items-center"
                        >
                            <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer flex flex-row items-center gap-2 font-geist">
                                <Image src="/logo.svg" alt="agent-logo" width={24} height={24} />
                                Gemach AI
                            </span>
                        </div>
                        {/* <BetterTooltip content="New Chat" align="start">
                  <Button
                    variant="ghost"
                    className="p-2 h-fit"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push('/');
                      router.refresh();
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </BetterTooltip> */}
                    </div>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <div className="px-2 py-2">
                    <Tabs
                        defaultValue="chats"
                        className="w-full"
                        onValueChange={(value) => setActiveTab(value as 'chats' | 'assets')}
                    >
                        <TabsList className="grid w-full grid-cols-2 h-9 gap-1 bg-muted p-1">
                            <TabsTrigger
                                value="chats"
                                className="data-[state=active]:bg-background"
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="hidden sm:inline">Chats</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="assets"
                                className="data-[state=active]:bg-background"
                            >
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    <span className="hidden sm:inline">Assets</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="mt-4">
                    {activeTab === 'chats' ?
                        (<div className="flex flex-col gap-2">
                            <Button
                                variant="default"
                                size="lg"
                                className="p-2 w- mx-2 rounded-xl"
                                onClick={() => {
                                    setOpenMobile(false);
                                    router.push('/');
                                    router.refresh();
                                }}
                            >New Chat
                                <PlusIcon className="w-6 h-6" />
                            </Button>
                            <ChatList user={user} />
                        </div>)

                        : <AssetList user={user} />}
                </div>
            </SidebarContent>

            <SidebarFooter className="gap-0">
                {user && (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            {/* <AccountMenu user={user} /> */}
                            <AccountMenu />
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar
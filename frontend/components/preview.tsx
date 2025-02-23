'use client'

import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MessageSquare, History } from "lucide-react"
import Chat from '@/components/chat'
import Header from '@/components/header'
import TransactionHistory from '@/components/transaction-history'
import { SidebarToggle } from '@/components/sidebar-toggle'
import { Message } from 'ai';

interface PreviewProps {
    selectedModelId: string,
    id: string,
    isReadonly: boolean,
    session: Session | null,
    messages: Array<Message> | null,
}

const Preview = ({ id, isReadonly, selectedModelId, session, messages }: PreviewProps) => {

    return (
        <div className="flex flex-col min-w-0 h-dvh bg-background">
            {!session && (
                <div className="flex items-center gap-2 px-4 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <Header />
                </div>
            )}

            {session ? (
                <Tabs defaultValue="chat" className="flex flex-col flex-1 overflow-hidden">
                    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="container flex items-center relative">
                            <div className="absolute left-0">
                                <SidebarToggle />
                            </div>
                            <div className="flex-1 flex justify-center">
                                <TabsList className="h-12 items-center justify-center bg-transparent my-1">
                                    <TabsTrigger value="chat" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            <span className="hidden sm:inline">Chat</span>
                                        </div>
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                                        <div className="flex items-center gap-2">
                                            <History className="h-4 w-4" />
                                            <span className="hidden sm:inline">Transaction History</span>
                                        </div>
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>
                    </div>

                    <TabsContent value="chat" className="flex-1 h-[calc(100%-48px)] p-0 overflow-hidden">
                        <div className="container h-full mx-auto px-2 md:px-4 max-w-4xl">
                            <Chat session={session} selectedModelId={selectedModelId} id={id} initialMessages={messages || []} isReadonly={isReadonly} selectedVisibilityType={'public'} />
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="flex-1 h-[calc(100%-48px)] p-0 overflow-hidden">
                        <div className="container h-full mx-auto px-2 md:px-4 max-w-4xl">
                            <TransactionHistory />
                        </div>
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="container h-full mx-auto px-2 md:px-4 max-w-4xl">
                    <Chat
                        selectedModelId={selectedModelId}
                        id={id}
                        initialMessages={messages || []}
                        isReadonly={true}
                        selectedVisibilityType={'public'}
                    />
                </div>
            )}
        </div>
    )
}

export default Preview
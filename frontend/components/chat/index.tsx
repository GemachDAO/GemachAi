import React from 'react'
import { Attachment, Message } from 'ai';
import { useState } from 'react';
import { useChat } from 'ai/react';
import useSWR from 'swr';
import { Messages } from './messages';
import { authFetch } from '@/lib/auth/authFetch';
import { getServerUrl } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { toast } from 'sonner';
import { VisibilityType } from '../visibility-selector';
import { useRouter, useParams } from 'next/navigation';

interface ChatProps {
    session?: Session,
    selectedModelId: string,
    id: string,
    initialMessages: Array<Message>,
    selectedVisibilityType: VisibilityType,
    isReadonly: boolean,
}

const Chat = ({
    session,
    selectedModelId,
    id,
    initialMessages,
    selectedVisibilityType,
    isReadonly,
}: ChatProps) => {
    const { id: currentId } = useParams();
    const router = useRouter();
    const [, setAttachments] = useState<Array<Attachment>>([]);
    const { mutate: mutateChatList } = useSWR(session ? `/chat/list` : null, authFetch);
    const { mutate: mutateChatMessages, } = useSWR(`/chat/messages/${id}`, authFetch);
    const serverUrl = getServerUrl();
    const {

        messages,
        setMessages,
        handleSubmit,
        input,
        setInput,
        append,
        isLoading,
        stop,
        reload,
    } = useChat({
        id,
        headers: {
            Authorization: `Bearer ${session?.accessToken}`
        },
        maxSteps: 5,
        credentials: 'include',
        api: `${serverUrl}/chat/stream`,
        body: { id, modelId: selectedModelId },
        initialMessages,
        experimental_throttle: 100,
        onFinish: () => {
            if (currentId !== id) {
                router.push(`/chat/${id}`);
            }
            mutateChatList();
            mutateChatMessages();
        },
        onError: async (error) => {
            console.log("Error in chat", error.name);
            const parsedError = JSON.parse(error.message);
            toast.error(parsedError.message);
        },
    });


    return (
        <div className="flex flex-col h-full relative min-w-0 ">
            <div className="flex-1 overflow-y-auto scrollbar-none">
                <Messages
                    chatId={id}
                    isLoading={isLoading}
                    messages={messages}
                    setMessages={setMessages}
                    reload={reload}
                    isReadonly={isReadonly}
                    isBlockVisible={false}
                />
            </div>

            <div className="sticky bottom-0 bg-background pt-2">
                <form className="flex mx-auto px-4 bg-background pb-2 gap-2 w-full md:max-w-3xl">
                    <MultimodalInput
                        user={session?.user}
                        chatId={id}
                        input={input}
                        setInput={setInput}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                        stop={stop}
                        attachments={[]}
                        setAttachments={setAttachments}
                        messages={messages}
                        setMessages={setMessages}
                        append={append}
                    />
                </form>
                <div className="text-center text-sm text-muted-foreground pb-4 px-4">
                    ⚠️ AI agents can make mistakes. Please carefully review all transaction details including contract addresses and values before executing any transactions.
                </div>
            </div>
        </div>
    )
}

export default Chat
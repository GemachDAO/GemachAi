import React from 'react'
import { cookies } from 'next/headers';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import Preview from '@/components/preview';
import { notFound,  } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { authFetch } from '@/lib/auth/authFetch';


const getChatById = async (id: string,) => {
    try {
        const response = await authFetch(`/chat/${id}`,);

        return response;
    } catch (error) {
        console.error(error);
        return null;
    }
}

const getMessagesByChatId = async (id: string,) => {
    try {
        const response = await authFetch(`/chat/messages/${id}`);
        return response;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    const params = await props.params;
    const { id } = params;
    const chat = await getChatById(id,);
    if (!chat) {
        return notFound();
    }
    const messages = await getMessagesByChatId(id,);

    const cookieStore = await cookies();

    const modelIdFromCookie = cookieStore.get('model-id')?.value;
    const selectedModelId =
        models.find((model) => model.id === modelIdFromCookie)?.id ||
        DEFAULT_MODEL_NAME;

    return (
        <>
            <Preview id={id} selectedModelId={selectedModelId} isReadonly={false} session={session} messages={messages} />
        </>
    )
}

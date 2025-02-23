import { cookies } from 'next/headers';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import Preview from '@/components/preview';
import { v4 as uuidv4 } from 'uuid';
import { getSession, } from '@/lib/auth/session';


export default async function Page() {
    const session = await getSession();

    const id = uuidv4();
    const cookieStore = await cookies();
    const modelIdFromCookie = cookieStore.get('model-id')?.value;

    const selectedModelId =
        models.find((model) => model.id === modelIdFromCookie)?.id ||
        DEFAULT_MODEL_NAME;


    return (
        <div>
            <Preview id={id} selectedModelId={selectedModelId} isReadonly={false} session={session} messages={[]} />
        </div>
    )
}

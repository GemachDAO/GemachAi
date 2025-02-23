import { getSession, deleteSession } from "./session";
import { getServerUrl } from "@/lib/utils";


export interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}
interface ApplicationError extends Error {
    info: {
        message: string;
        error: string;
        statusCode: number;
    };
    status: number;
}

export const authFetch = async (
    url: string,
    options: FetchOptions = {}
) => {
    const serverUrl = getServerUrl();
    const session = await getSession();
    if (!session) {
        throw new Error('No session found');
    }


    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    let response = await fetch(`${serverUrl}${url}`, {
        ...options,
        headers,
    });

    if (!response.ok) {

        const error = new Error(
            'An error occurred while fetching the data.'
        ) as ApplicationError;
        error.info = await response.json();
        if (error.info.message === 'Please provide token') {
            await deleteSession();
        }
        error.status = response.status;
        throw error;
    }

    return await response.json();
};

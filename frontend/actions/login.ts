"use server";
import { cookies } from "next/headers";
import { getServerUrl } from "@/lib/utils";
const serverUrl = getServerUrl();

export const isLoggedIn = async (): Promise<boolean> => {
    try {
        const cookieStore = await cookies();
        const jwt = cookieStore.get('Authentication')?.value;
        console.log("jwt", jwt);

        const request = await fetch(`${serverUrl}/auth/is-logged-in`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${jwt}`,
            },
        });

        if (request.ok) {
            const data = await request.json();
            console.log("data", data);
            return data.valid;
        }
        return false;
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
}

export const getUser = async (): Promise<User | undefined> => {
    try {
        const cookieStore = await cookies();
        const jwt = cookieStore.get('Authentication')?.value;

        const request = await fetch(`${serverUrl}/users/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${jwt}`,
            },
        });

        if (request.ok) {
            return await request.json();
        }
        return undefined;
    } catch (error) {
        console.error('Error fetching user:', error);
        return undefined;
    }
}

export const setAuthCookie = async (response: Response) => {
    const setCookieHeader = response.headers.get("Set-Cookie");
    if (setCookieHeader) {
        const token = setCookieHeader.split(";")[0].split("=")[1];
        console.log("token from setAuthCookie", token);
        const cookieStore = await cookies();
        cookieStore.set({
            name: "Authentication",
            value: token,
            secure: true,
            httpOnly: true,
            sameSite: 'none',
            path: '/',
        });
    }
};

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('Authentication');

}



"use server";
import { jwtVerify, SignJWT } from "jose";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET_KEY
const encodedKey = new TextEncoder().encode(secretKey);

export const createSession = async (payload: Session) => {
    const expiredAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const session = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(encodedKey);
    const cookieStore = await cookies();

    cookieStore.set("session", session,
        {
            httpOnly: true,
            secure: true,
            expires: expiredAt,
            sameSite: "none",
            path: "/",
        }
    )
        ;

}

export const getSession = async (): Promise<Session | null> => {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("session")?.value;
    if (!cookie) return null;

    try {
        const { payload } = await jwtVerify(
            cookie,
            encodedKey,
            {
                algorithms: ["HS256"],
            }
        );


        return payload as Session;
    } catch (err) {
        console.error("Failed to verify the session", err);
        return null;
    }
}

export const deleteSession = async () => {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}


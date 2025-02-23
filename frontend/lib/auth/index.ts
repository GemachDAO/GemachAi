"use server";
import { VerifyLoginPayloadParams } from 'thirdweb/auth';
import { getServerUrl } from '@/lib/utils';
import { createSession, getSession, } from './session';



export const login = async (payload: VerifyLoginPayloadParams) => {
  const response = await fetch(`${getServerUrl()}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (response.ok) {
    const result = await response.json();

    await createSession(result);
    return result;
  }

};

export const isLoggedIn = async () => {
  const session = await getSession();
  return session !== null;
};

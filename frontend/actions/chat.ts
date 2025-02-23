'use server';

import { cookies } from 'next/headers';


export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  console.log("cookieStore", cookieStore.getAll());
  cookieStore.set('model-id', model);
}


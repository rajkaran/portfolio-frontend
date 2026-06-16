import { loopbackApi } from "./loopback-api";

export async function getIndustryTags(q?: string): Promise<string[]>{
    const res = await loopbackApi.get<string[]>('/industry-tags',{
        params: q?.trim() ? {q}:undefined,
    });
    return res.data;
}

export async function createIndustryTag(name: string): Promise<void>{
    await loopbackApi.post('/industry-tags', { name });
}
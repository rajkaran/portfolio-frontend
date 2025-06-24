export interface PromptHistory {
    id: string;
    prompt: string;
    promptsLeft?: number;
    response: string;
    userAction: 'like' | 'dislike' | 'report' | null;
}

export interface PromptPair {
    id: string;
    question: string;
    answer: string;
    userAction: 'like' | 'dislike' | 'report' | null;
}
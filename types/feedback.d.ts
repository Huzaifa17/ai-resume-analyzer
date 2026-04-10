// src/types/feedback.d.ts
interface Feedback {
    overallScore: number;
    toneAndStyle: {
        score: number;
        tips: string[];
    };
    content: {
        score: number;
        tips: string[];
    };
    structure: {
        score: number;
        tips: string[];
    };
    skills: {
        score: number;
        tips: string[];
    };
    ATS: {
        score: number;
        tips: string[];
    };
    summary: string;
    improvements: string[];
    strengths: string[];
}
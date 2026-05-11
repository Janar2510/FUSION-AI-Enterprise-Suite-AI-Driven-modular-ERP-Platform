import { create } from 'zustand';
import { surveysApi } from '@/lib/api';

export interface SurveyQuestion {
    id: number;
    title: string;
    questionType: string;
    sequence: number;
    isRequired: boolean;
    surveyId: number;
}

export interface SurveyUserInput {
    id: number;
    state: string;
    startDatetime: string;
    endDatetime: string | null;
    email: string | null;
    surveyId: number;
}

export interface Survey {
    id: number;
    title: string;
    description: string | null;
    state: string; // draft, open, closed
    scoringType: string;
    questions?: SurveyQuestion[];
    responses?: SurveyUserInput[];
    _count?: { questions: number, responses: number };
}

interface SurveysStore {
    surveys: Survey[];
    loading: boolean;
    error: string | null;

    fetchSurveys: () => Promise<void>;
    createSurvey: (data: Partial<Survey>) => Promise<Survey | undefined>;
    updateSurvey: (id: number, data: Partial<Survey>) => Promise<void>;
}

export const useSurveysStore = create<SurveysStore>((set, get) => ({
    surveys: [],
    loading: false,
    error: null,

    fetchSurveys: async () => {
        try {
            set({ loading: true, error: null });
            const res = await surveysApi.list({ limit: 1000 });
            set({ surveys: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createSurvey: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await surveysApi.create(data);
            await get().fetchSurveys();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateSurvey: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await surveysApi.update(id, data);
            await get().fetchSurveys();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useSurveysStore;

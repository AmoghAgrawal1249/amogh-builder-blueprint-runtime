import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
	getViewerAccountState,
	markWorkspaceOnboardingComplete,
	saveOnboardingCompanyProfile,
	type ViewerAccountState,
	type ViewerWorkspace
} from '../backend/auth/viewer';

export const saveOnboardingCompany = mutation({
	args: {
		companyName: v.string(),
		companyIndustry: v.string()
	},
	handler: async (ctx, args): Promise<ViewerWorkspace> =>
		await saveOnboardingCompanyProfile(ctx, args)
});

export const viewerAccountState = query({
	args: {},
	handler: async (ctx): Promise<ViewerAccountState> => await getViewerAccountState(ctx)
});

export const markOnboardingComplete = mutation({
	args: {},
	handler: async (ctx) => await markWorkspaceOnboardingComplete(ctx)
});

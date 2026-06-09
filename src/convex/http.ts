import { httpRouter } from 'convex/server';
import { Webhook } from 'svix';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';

type ClerkWebhookEvent = {
	type: string;
	data?: {
		id?: string | null;
	};
};

const CLERK_USER_DELETED_EVENT = 'user.deleted';

function getClerkWebhookSecret() {
	const secret = process.env.CLERK_WEBHOOK_SECRET;

	if (!secret) {
		return null;
	}

	return secret;
}

function getSvixHeaders(request: Request) {
	return {
		'svix-id': request.headers.get('svix-id') ?? '',
		'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
		'svix-signature': request.headers.get('svix-signature') ?? ''
	};
}

const http = httpRouter();

http.route({
	path: '/clerk/webhooks',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		const payload = await request.text();
		const webhookSecret = getClerkWebhookSecret();
		let event: ClerkWebhookEvent;

		if (!webhookSecret) {
			return new Response('Clerk webhook is not configured.', { status: 500 });
		}

		try {
			event = new Webhook(webhookSecret).verify(
				payload,
				getSvixHeaders(request)
			) as ClerkWebhookEvent;
		} catch {
			return new Response('Invalid Clerk webhook signature.', { status: 400 });
		}

		if (event.type !== CLERK_USER_DELETED_EVENT) {
			return new Response(null, { status: 200 });
		}

		const clerkUserId = event.data?.id;

		if (!clerkUserId) {
			return new Response('Clerk user.deleted webhook is missing data.id.', {
				status: 400
			});
		}

		await ctx.runMutation(internal.internal.auth.deleteAccountForClerkUser, {
			clerkUserId
		});

		return new Response(null, { status: 200 });
	})
});

export default http;

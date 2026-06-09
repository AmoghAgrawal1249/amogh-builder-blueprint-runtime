<script lang="ts">
	import {
		Button,
		FullHeightModalShell,
		TallModalCallout,
		TallModalStepList
	} from '$lib/ui';
	import ShieldCheckIcon from 'phosphor-svelte/lib/ShieldCheckIcon';

	type Props = {
		open: boolean;
		onClose: () => void;
	};

	const invitePartnerSteps = [
		{
			title: 'Tell us who you want to invite',
			description:
				'Share the partners you want to work with, what data would be useful and how you want to use it'
		},
		{
			title: 'We help you coordinate with each partner',
			description:
				'You stay in control of each conversation and we make it easy for partners to get set up'
		},
		{
			title: 'You control how your data is shared',
			description:
				'You control what data you share with each of your partners'
		}
	];

	const engineeringCalendarUrl = 'https://cal.com/juliennewman/julien';

	let { open, onClose }: Props = $props();
</script>

<FullHeightModalShell
	{open}
	title="Invite partners"
	subtitle="Securely share data with your ecosystem partners"
	placement="center"
	{onClose}
>
	<div class="flex min-h-full flex-col justify-between gap-6 pt-1">
		<div class="space-y-5">
			<p class="text-[0.72rem] leading-relaxed text-stone-600">
				Overbase's success team will work with your partners to let them easily share data with you
			</p>

			<TallModalStepList steps={invitePartnerSteps} />
		</div>

		<TallModalCallout
			icon={ShieldCheckIcon}
			text="Share sales data with your ecosystem partners quickly and securely"
		/>
	</div>

	{#snippet footer()}
		<Button
			class="ml-auto"
			onclick={() => window.open(engineeringCalendarUrl, '_blank', 'noopener,noreferrer')}
		>
			Talk to our success team
		</Button>
	{/snippet}
</FullHeightModalShell>

<script lang="ts">
	import {
		Button,
		FullHeightModalShell,
		TallModalCallout,
		TallModalFeatureGrid
	} from '$lib/ui';
	import BuildingsIcon from 'phosphor-svelte/lib/BuildingsIcon';
	import CalendarDotsIcon from 'phosphor-svelte/lib/CalendarDotsIcon';
	import FilesIcon from 'phosphor-svelte/lib/FilesIcon';
	import ShieldCheckIcon from 'phosphor-svelte/lib/ShieldCheckIcon';
	import StackSimpleIcon from 'phosphor-svelte/lib/StackSimpleIcon';

	type Props = {
		open: boolean;
		onClose: () => void;
	};

	const internalDataCategories = [
		{
			icon: BuildingsIcon,
			title: 'CRMs and ERPs',
			description:
				'Connect your CRM, ERP or other operating systems'
		},
		{
			icon: CalendarDotsIcon,
			title: 'Email, calendar, etc.',
			description:
				'Analyze email, calendars, Slack, Teams or other places your team already works'
		},
		{
			icon: FilesIcon,
			title: 'Spreadsheets, PDFs, etc.',
			description:
				'Share your data from where it already lives, even if it lives in spreadsheets, PDFs, etc.'
		},
		{
			icon: StackSimpleIcon,
			title: 'Any other internal data source',
			description:
				'Connect disconnected internal data wherever it lives'
		}
	];

	const engineeringCalendarUrl = 'https://cal.com/juliennewman/julien';

	let { open, onClose }: Props = $props();
</script>

<FullHeightModalShell
	{open}
	title="Add internal data source"
	subtitle="Connect your company's internal data sources to power your opportunities"
	placement="center"
	{onClose}
>
	<div class="flex min-h-full flex-col justify-between gap-6 pt-1">
		<div class="space-y-5">
			<p class="text-[0.72rem] leading-relaxed text-stone-600">
				Overbase's engineers will work with your IT team to connect your internal data sources.
			</p>

			<TallModalFeatureGrid features={internalDataCategories} />
		</div>

		<TallModalCallout
			icon={ShieldCheckIcon}
			text="Connect any of your internal data sources quickly and securely"
		/>
	</div>

	{#snippet footer()}
		<Button
			class="ml-auto"
			onclick={() => window.open(engineeringCalendarUrl, '_blank', 'noopener,noreferrer')}
		>
			Talk to our engineers
		</Button>
	{/snippet}
</FullHeightModalShell>

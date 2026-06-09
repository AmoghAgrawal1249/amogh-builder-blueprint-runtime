<script lang="ts">
	import { FloatingActionMenu, type FloatingActionMenuAction } from '$lib/ui';

	type Props = {
		actions?: FloatingActionMenuAction[];
	};

	const FEEDBACK_URL = 'https://cal.com/juliennewman';
	const DEFAULT_ACTIONS: FloatingActionMenuAction[] = [
		{
			label: 'Give feedback',
			onSelect: () => {
				window.open(FEEDBACK_URL, '_blank', 'noopener,noreferrer');
			}
		}
	];

	let { actions = [] }: Props = $props();
	let open = $state(false);
	const menuActions = $derived(actions.length > 0 ? actions : DEFAULT_ACTIONS);
</script>

<FloatingActionMenu
	id="header-overflow-actions"
	ariaLabel="More options"
	actions={menuActions}
	bind:open
	triggerClass="border border-stone-200/60 bg-white hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-300"
/>

<script lang="ts">
	import type { Id } from '$convex/_generated/dataModel';
	import { AvatarPersonPicker } from '$lib/entities/people';
	import { Button } from '$lib/ui';
	import type {
		EmailFormatRecipientPickerPerson,
		EmailFormatRecipientRef
	} from './email-format-configure-types';
	import { getFormatRecipientKey } from './email-format-configure-types';

	type EmailFormatStatus = 'active' | 'paused';

	type Props = {
		status: EmailFormatStatus | null;
		people: EmailFormatRecipientPickerPerson[];
		selectedRecipientRefs: EmailFormatRecipientRef[];
		isSavingRecipients: boolean;
		isUpdatingStatus: boolean;
		statusToggleDisabled?: boolean;
		onSelectedRecipientRefsChange: (nextRefs: EmailFormatRecipientRef[]) => void | Promise<void>;
		onToggleStatus: () => void | Promise<void>;
	};

	let {
		status,
		people,
		selectedRecipientRefs,
		isSavingRecipients,
		isUpdatingStatus,
		statusToggleDisabled = false,
		onSelectedRecipientRefsChange,
		onToggleStatus
	}: Props = $props();

	const selectedIds = $derived(selectedRecipientRefs.map(getFormatRecipientKey));
	const statusLabel = $derived(
		!status
			? 'Status'
			: isUpdatingStatus
			? status === 'active'
				? 'Pausing...'
				: 'Activating...'
			: status === 'active'
				? 'Active'
				: 'Paused'
	);

	function toRecipientRef(personId: string): EmailFormatRecipientRef | null {
		const separatorIndex = personId.indexOf(':');
		const kind = personId.slice(0, separatorIndex);
		const id = personId.slice(separatorIndex + 1);

		if (kind === 'user' && id) {
			return { kind, userId: id as Id<'users'> };
		}

		if (kind === 'teammate' && id) {
			return { kind, teammateId: id as Id<'teammates'> };
		}

		return null;
	}

	function updateSelectedIds(nextIds: string[]) {
		void onSelectedRecipientRefsChange(
			nextIds
				.map(toRecipientRef)
				.filter((ref): ref is EmailFormatRecipientRef => ref !== null)
		);
	}
</script>

<div class="flex items-center gap-2">
	<AvatarPersonPicker
		{people}
		{selectedIds}
		onSelectedIdsChange={updateSelectedIds}
		size={24}
		limit={3}
		ariaLabel={isSavingRecipients ? 'Saving email format recipients' : 'Manage email format recipients'}
		searchLabel="Search recipients"
		searchPlaceholder="Search recipients..."
		emptyLabel="No recipients found"
	/>
	<Button
		variant="secondary"
		class="h-7 px-2.5 text-[0.72rem]"
		disabled={!status || isUpdatingStatus || statusToggleDisabled}
		onclick={() => void onToggleStatus()}
	>
		{statusLabel}
	</Button>
</div>

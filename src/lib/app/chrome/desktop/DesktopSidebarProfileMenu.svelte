<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount, tick } from 'svelte';
	import CaretUpDownIcon from 'phosphor-svelte/lib/CaretUpDownIcon';
	import { APP_LINKS } from '$lib/app/app-links';
	import { useViewerSession } from '$lib/auth/viewer-session.svelte';
	import { cn } from '$lib/ui/cn';
	import { PersonAvatar } from '$lib/entities/people';

	type Profile = {
		name: string;
		avatarUrl: string;
	};

	type Props = {
		profile: Profile;
		expanded: boolean;
	};

	let { profile, expanded }: Props = $props();

	const viewerSession = useViewerSession();
	const menuId = 'desktop-sidebar-profile-menu';
	let isOpen = $state(false);
	let triggerElement = $state<HTMLButtonElement | null>(null);
	let menuElement = $state<HTMLDivElement | null>(null);
	let menuTop = $state(0);
	let menuLeft = $state(0);
	let menuWidth = $state(144);
	const menuStyle = $derived(
		`top: ${menuTop}px; left: ${menuLeft}px; width: ${menuWidth}px;`
	);

	onMount(() => {
		document.addEventListener('scroll', updateMenuPosition, true);

		return () => {
			document.removeEventListener('scroll', updateMenuPosition, true);
		};
	});

	function closeMenu({ restoreFocus = false } = {}) {
		isOpen = false;

		if (restoreFocus) {
			triggerElement?.focus();
		}
	}

	function toggleMenu() {
		isOpen = !isOpen;
	}

	async function logOut() {
		closeMenu();
		await viewerSession.signOut();
	}

	function shouldOpenAbove(triggerRect: DOMRect, menuHeight: number, gap: number, padding: number) {
		const topSpace = triggerRect.top - padding;
		const bottomSpace = window.innerHeight - triggerRect.bottom - padding;

		return bottomSpace < menuHeight + gap && topSpace > bottomSpace;
	}

	function updateMenuPosition() {
		if (!triggerElement || !isOpen) {
			return;
		}

		const viewportPadding = 16;
		const triggerGap = 8;
		const width = Math.min(144, window.innerWidth - viewportPadding * 2);
		const triggerRect = triggerElement.getBoundingClientRect();
		const menuHeight = menuElement?.getBoundingClientRect().height ?? 0;
		const preferredLeft = triggerRect.right - width;
		const maxLeft = window.innerWidth - width - viewportPadding;
		const opensAbove = shouldOpenAbove(triggerRect, menuHeight, triggerGap, viewportPadding);
		const preferredTop = opensAbove
			? triggerRect.top - menuHeight - triggerGap
			: triggerRect.bottom + triggerGap;
		const maxTop = window.innerHeight - menuHeight - viewportPadding;

		menuWidth = width;
		menuLeft = Math.max(viewportPadding, Math.min(preferredLeft, maxLeft));
		menuTop = Math.max(viewportPadding, Math.min(preferredTop, maxTop));
	}

	async function updateMenuPositionAfterRender() {
		await tick();
		updateMenuPosition();
	}

	$effect(() => {
		if (!expanded) {
			closeMenu();
		}
	});

	$effect(() => {
		if (isOpen) {
			void updateMenuPositionAfterRender();
		}
	});

	function handleDocumentClick(event: MouseEvent) {
		if (!isOpen) {
			return;
		}

		const target = event.target;

		if (!(target instanceof Node)) {
			return;
		}

		if (triggerElement?.contains(target) || menuElement?.contains(target)) {
			return;
		}

		closeMenu();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !isOpen) {
			return;
		}

		event.preventDefault();
		closeMenu({ restoreFocus: true });
	}
</script>

<div class="relative ml-auto shrink-0">
	<div
		class={cn(
			'flex items-center overflow-hidden transition-[max-width,opacity,transform] duration-200',
			expanded
				? 'max-w-24 translate-x-0 opacity-100'
				: 'pointer-events-none max-w-0 translate-x-1 opacity-0'
		)}
	>
		<button
			bind:this={triggerElement}
			type="button"
			class="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-stone-100 bg-stone-50 px-1.5 text-stone-500 transition-colors hover:border-transparent hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400"
			aria-label="Open profile menu"
			aria-haspopup="menu"
			aria-expanded={isOpen}
			aria-controls={isOpen ? menuId : undefined}
			onclick={toggleMenu}
		>
			<PersonAvatar
				person={profile}
				size={20}
				class="border border-stone-100 bg-white"
			/>
			<CaretUpDownIcon aria-hidden="true" size={12} weight="regular" class="text-stone-400" />
		</button>
	</div>

	{#if isOpen && expanded}
		<div
			bind:this={menuElement}
			id={menuId}
			role="menu"
			class="fixed z-50 min-w-36 overflow-hidden rounded-sm border border-stone-200 bg-white py-1 text-left shadow-lg shadow-stone-950/5"
			style={menuStyle}
			aria-label="Profile menu"
		>
			<a
				role="menuitem"
				href={resolve(APP_LINKS.settings.pathname)}
				class="flex h-8 w-full items-center px-2.5 text-left text-[0.72rem] font-normal text-stone-700 transition-colors hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:outline-none"
				onclick={() => {
					closeMenu();
				}}
			>
				Settings
			</a>
			<button
				type="button"
				role="menuitem"
				class="flex h-8 w-full items-center px-2.5 text-left text-[0.72rem] font-normal text-stone-700 transition-colors hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:outline-none"
				onclick={logOut}
			>
				Log out
			</button>
		</div>
	{/if}
</div>

<svelte:document onclick={handleDocumentClick} onkeydown={handleKeydown} />
<svelte:window onresize={updateMenuPosition} />

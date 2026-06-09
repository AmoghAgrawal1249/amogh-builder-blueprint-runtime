<script lang="ts" generics="Id extends string">
	import { onMount, tick } from 'svelte';
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
	import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
	import { cn } from '$lib/ui/cn';

	type SelectMenuOption = {
		id: Id;
		label: string;
	};

	type SelectMenuSize = 'compact' | 'standard' | 'comfortable';

	const SELECT_MENU_SIZE_CLASS: Record<
		SelectMenuSize,
		{
			triggerHeight: string;
			triggerText: string;
			triggerPadding: string;
			triggerFocus: string;
			placeholderText: string;
			caretIcon: number;
			optionHeight: string;
			optionText: string;
			optionPadding: string;
			checkSlot: string;
			checkIcon: number;
		}
	> = {
		compact: {
			triggerHeight: 'h-7',
			triggerText: 'text-[0.72rem]',
			triggerPadding: 'pr-2 pl-2.5',
			triggerFocus: 'focus:ring-stone-200',
			placeholderText: 'text-stone-500',
			caretIcon: 13,
			optionHeight: 'h-8',
			optionText: 'text-[0.72rem]',
			optionPadding: 'px-2.5',
			checkSlot: 'size-3.5',
			checkIcon: 12
		},
		standard: {
			triggerHeight: 'h-8',
			triggerText: 'text-[0.74rem]',
			triggerPadding: 'px-2.5',
			triggerFocus: 'focus:ring-stone-100',
			placeholderText: 'text-stone-400',
			caretIcon: 13,
			optionHeight: 'h-8',
			optionText: 'text-[0.74rem]',
			optionPadding: 'px-2.5',
			checkSlot: 'size-3.5',
			checkIcon: 12
		},
		comfortable: {
			triggerHeight: 'h-10',
			triggerText: 'text-sm',
			triggerPadding: 'pr-3 pl-3.5',
			triggerFocus: 'focus:ring-stone-200',
			placeholderText: 'text-[#8f9297]',
			caretIcon: 15,
			optionHeight: 'h-10',
			optionText: 'text-sm',
			optionPadding: 'px-3.5',
			checkSlot: 'size-4',
			checkIcon: 14
		}
	};

	type Props = {
		id: string;
		ariaLabel: string;
		ariaDescribedby?: string;
		selectedId?: Id | null;
		options: readonly SelectMenuOption[];
		onSelect: (id: Id) => void;
		placeholder?: string;
		width?: 'sm' | 'md' | 'full';
		size?: SelectMenuSize;
		class?: string;
	};

	let {
		id,
		ariaLabel,
		ariaDescribedby,
		selectedId = null,
		options,
		onSelect,
		placeholder = '',
		width = 'sm',
		size = 'compact',
		class: className = ''
	}: Props = $props();

	let open = $state(false);
	let triggerElement = $state<HTMLButtonElement | null>(null);
	let panelElement = $state<HTMLDivElement | null>(null);
	let panelTop = $state(0);
	let panelLeft = $state(0);
	let panelWidth = $state(128);
	let panelMaxHeight = $state(240);
	let activeOptionId = $state<Id | null>(null);

	const widthClass = $derived.by(() => {
		if (width === 'full') return 'w-full';
		return width === 'md' ? 'w-36' : 'w-32';
	});
	const sizeClass = $derived(SELECT_MENU_SIZE_CLASS[size]);
	const selectedOption = $derived(options.find((option) => option.id === selectedId));
	const triggerLabel = $derived(selectedOption?.label ?? placeholder);
	const triggerLabelClass = $derived(selectedOption ? '' : sizeClass.placeholderText);
	const menuId = $derived(`${id}-menu`.replace(/[^a-zA-Z0-9_-]/g, '-'));
	const isDisabled = $derived(options.length === 0);
	const activeOptionElementId = $derived(
		activeOptionId ? `${menuId}-${activeOptionId}`.replace(/[^a-zA-Z0-9_-]/g, '-') : undefined
	);
	const panelStyle = $derived(
		`top: ${panelTop}px; left: ${panelLeft}px; width: ${panelWidth}px; max-height: ${panelMaxHeight}px;`
	);

	onMount(() => {
		document.addEventListener('scroll', updatePanelPosition, true);

		return () => {
			document.removeEventListener('scroll', updatePanelPosition, true);
		};
	});

	$effect(() => {
		if (open && isDisabled) {
			close();
		}
	});

	$effect(() => {
		if (open) {
			void updatePanelPositionAfterRender();
			void scrollActiveOptionIntoViewAfterRender();
		}
	});

	function toggleOpen() {
		if (isDisabled) {
			return;
		}

		if (open) {
			close();
			return;
		}

		openMenu();
	}

	function close({ restoreFocus = false } = {}) {
		if (!open) {
			return;
		}

		open = false;
		activeOptionId = null;

		if (restoreFocus) {
			triggerElement?.focus();
		}
	}

	function openMenu() {
		if (isDisabled) {
			return;
		}

		activeOptionId = getInitialActiveOptionId();
		open = true;
	}

	function getInitialActiveOptionId() {
		return options.find((option) => option.id === selectedId)?.id ?? options[0]?.id ?? null;
	}

	function updatePanelPosition() {
		if (!triggerElement || !open) {
			return;
		}

		const viewportPadding = 16;
		const triggerGap = 8;
		const triggerRect = triggerElement.getBoundingClientRect();
		const availablePanelWidth = Math.max(1, window.innerWidth - viewportPadding * 2);
		const minPanelWidth = Math.min(Math.max(triggerRect.width, 128), availablePanelWidth);
		const measuredPanelWidth = Math.max(
			minPanelWidth,
			panelElement?.getBoundingClientRect().width ?? 128,
			panelElement?.scrollWidth ?? 128
		);
		const maxPanelHeight = Math.max(120, window.innerHeight - viewportPadding * 2);
		const measuredPanelHeight = Math.min(panelElement?.scrollHeight ?? 0, maxPanelHeight);
		const menuWidth = Math.min(measuredPanelWidth, availablePanelWidth);
		const preferredLeft = triggerRect.right - menuWidth;
		const maxLeft = window.innerWidth - menuWidth - viewportPadding;
		const preferredTop = triggerRect.bottom + triggerGap;
		const maxTop = Math.max(
			viewportPadding,
			window.innerHeight - measuredPanelHeight - viewportPadding
		);

		panelMaxHeight = maxPanelHeight;
		panelWidth = menuWidth;
		panelLeft = Math.max(viewportPadding, Math.min(preferredLeft, maxLeft));
		panelTop = Math.max(viewportPadding, Math.min(preferredTop, maxTop));
	}

	async function updatePanelPositionAfterRender() {
		await tick();
		updatePanelPosition();
	}

	async function scrollActiveOptionIntoViewAfterRender() {
		await tick();
		document.getElementById(activeOptionElementId ?? '')?.scrollIntoView({ block: 'nearest' });
	}

	function handleDocumentClick(event: MouseEvent) {
		if (!open) {
			return;
		}

		const target = event.target;

		if (!(target instanceof Node)) {
			return;
		}

		if (triggerElement?.contains(target) || panelElement?.contains(target)) {
			return;
		}

		close();
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (isDisabled) {
			return;
		}

		if (isMenuKeyboardEvent(event)) {
			event.stopPropagation();
		}

		if (!open) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				openMenu();
			}

			return;
		}

		handleOpenMenuKeydown(event);
	}

	function handleDocumentKeydown(event: KeyboardEvent) {
		if (!open) {
			return;
		}

		handleOpenMenuKeydown(event);
	}

	function handleOpenMenuKeydown(event: KeyboardEvent) {
		if (!isMenuKeyboardEvent(event)) {
			return;
		}

		event.preventDefault();

		if (event.key === 'Escape') {
			close({ restoreFocus: true });
			return;
		}

		if (event.key === 'Enter' || event.key === ' ') {
			if (activeOptionId) {
				selectOption(activeOptionId);
			}

			return;
		}

		moveActiveOption(event.key);
	}

	function isMenuKeyboardEvent(event: KeyboardEvent) {
		return ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(event.key);
	}

	function moveActiveOption(key: string) {
		if (options.length === 0) {
			return;
		}

		const activeIndex = Math.max(
			0,
			options.findIndex((option) => option.id === activeOptionId)
		);

		if (key === 'Home') {
			activeOptionId = options[0].id;
		} else if (key === 'End') {
			activeOptionId = options[options.length - 1].id;
		} else if (key === 'ArrowDown') {
			activeOptionId = options[(activeIndex + 1) % options.length].id;
		} else if (key === 'ArrowUp') {
			activeOptionId = options[(activeIndex - 1 + options.length) % options.length].id;
		}

		void scrollActiveOptionIntoViewAfterRender();
	}

	function selectOption(optionId: Id) {
		close({ restoreFocus: true });

		if (optionId !== selectedId) {
			onSelect(optionId);
		}
	}
</script>

<span class={cn('inline-flex items-center', sizeClass.triggerHeight, widthClass, className)}>
	<button
		bind:this={triggerElement}
		{id}
		type="button"
		aria-label={ariaLabel}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls={open ? menuId : undefined}
		aria-describedby={ariaDescribedby}
		disabled={isDisabled}
		onclick={toggleOpen}
		onkeydown={handleTriggerKeydown}
			class={cn(
				'inline-flex w-full min-w-0 items-center justify-between gap-1.5 whitespace-nowrap rounded-sm border border-stone-200/70 bg-white py-0 text-left font-normal text-stone-800 outline-none transition-colors hover:bg-stone-50 focus:border-stone-300 focus:ring-2 disabled:cursor-default disabled:opacity-55 disabled:hover:bg-white',
				sizeClass.triggerHeight,
				sizeClass.triggerText,
				sizeClass.triggerPadding,
				sizeClass.triggerFocus
			)}
		>
		<span class={cn('min-w-0 truncate', triggerLabelClass)}>{triggerLabel}</span>
		<CaretDownIcon
			aria-hidden="true"
			size={sizeClass.caretIcon}
			weight="regular"
			class="shrink-0 text-stone-500"
		/>
	</button>

	{#if open}
		<div
			bind:this={panelElement}
			id={menuId}
			role="menu"
			class="fixed z-50 overflow-x-hidden overflow-y-auto rounded-sm border border-stone-200 bg-white py-1 text-left shadow-lg shadow-stone-950/5"
			style={panelStyle}
		>
			{#each options as option (option.id)}
				<button
					id={`${menuId}-${option.id}`.replace(/[^a-zA-Z0-9_-]/g, '-')}
					type="button"
					role="menuitemradio"
					aria-checked={option.id === selectedId}
					class={cn(
						'flex w-full items-center gap-2 text-left font-normal text-stone-700 transition-colors hover:bg-stone-50',
						option.id === activeOptionId && 'bg-stone-100 text-stone-950',
						sizeClass.optionHeight,
						sizeClass.optionText,
						sizeClass.optionPadding
					)}
					onclick={() => selectOption(option.id)}
				>
					<span
						class={cn(
							'flex shrink-0 items-center justify-center text-stone-950',
							sizeClass.checkSlot
						)}
					>
						{#if option.id === selectedId}
							<CheckIcon aria-hidden="true" size={sizeClass.checkIcon} weight="bold" />
						{/if}
					</span>
					<span class="whitespace-nowrap">{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</span>

<svelte:document onclick={handleDocumentClick} onkeydown={handleDocumentKeydown} />
<svelte:window onresize={updatePanelPosition} />

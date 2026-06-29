<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { assessEvidenceBundle } from '$domain/source-ranking';
	import type {
		ContextSource,
		OwnerSignal,
		SourceAssessment,
		SourceClaim,
		SourceTier
	} from '$domain/source-ranking';
	import {
		buildEvidenceLabViewData,
		buildUploadedEvidenceBundle,
		parseEvidenceLabHiddenSourceIds,
		toUploadedEvidenceFile,
		withAiExtractedEvidence,
		type UploadedEvidenceFile
	} from '$lib/features/source-ranking/evidence-lab';
	import type { ExtractedEvidence } from '$lib/features/source-ranking/evidence-extraction';

	type SourceRow = {
		source: ContextSource;
		assessment: SourceAssessment | null;
		isHidden: boolean;
		expectedTier?: SourceTier;
	};

	let uploadedFiles = $state<UploadedEvidenceFile[]>([]);
	let uploadedHiddenSourceIds = $state<string[]>([]);
	let selectedUploadedSourceId = $state<string | null>(null);
	let uploadError = $state<string | null>(null);
	let isReadingFiles = $state(false);
	let aiExtractionError = $state<string | null>(null);
	let isExtractingWithAi = $state(false);
	let openFullTextSourceId = $state<string | null>(null);

	const lab = $derived(
		buildEvidenceLabViewData({
			fixtureId: page.url.searchParams.get('fixture'),
			sourceId: page.url.searchParams.get('source'),
			now: page.url.searchParams.get('now'),
			hiddenSourceIds: parseEvidenceLabHiddenSourceIds(page.url.searchParams)
		})
	);
	const uploadedBundle = $derived(
		uploadedFiles.length > 0 ? buildUploadedEvidenceBundle(uploadedFiles) : null
	);
	const uploadedVisibleSources = $derived(
		uploadedBundle
			? uploadedBundle.sources.filter((source) => !uploadedHiddenSourceIds.includes(source.id))
			: []
	);
	const uploadedActiveBundle = $derived(
		uploadedBundle
			? {
					...uploadedBundle,
					sources: uploadedVisibleSources
				}
			: null
	);
	const uploadedAssessment = $derived(
		uploadedActiveBundle ? assessEvidenceBundle({ bundle: uploadedActiveBundle, now: lab.now }) : null
	);
	const uploadedAssessmentBySourceId = $derived(
		new Map(uploadedAssessment?.sourceAssessments.map((assessment) => [assessment.sourceId, assessment]) ?? [])
	);
	const uploadedRows = $derived<SourceRow[]>(
		uploadedBundle
			? uploadedBundle.sources.map((source) => ({
					source,
					assessment: uploadedAssessmentBySourceId.get(source.id) ?? null,
					isHidden: uploadedHiddenSourceIds.includes(source.id)
				}))
			: []
	);
	const selectedUploadedRow = $derived(
		selectedUploadedSourceId
			? uploadedRows.find((row) => row.source.id === selectedUploadedSourceId) ?? null
			: null
	);
	const activeMode = $derived(uploadedBundle ? 'upload' : lab.hasSelectedFixture ? 'fixture' : 'catalog');
	const activeAssessment = $derived(activeMode === 'upload' ? uploadedAssessment : lab.selected.assessment);
	const activeRows = $derived<readonly SourceRow[]>(activeMode === 'upload' ? uploadedRows : lab.selected.sourceRows);
	const activeVisibleRows = $derived(activeRows.filter((row) => !row.isHidden));
	const activeSelectedRow = $derived(activeMode === 'upload' ? selectedUploadedRow : lab.selected.selectedSourceRow);
	const activeTitle = $derived(activeMode === 'upload' ? 'Uploaded data sources' : lab.selected.fixture.title);
	const uploadedExtractionKind = $derived(
		uploadedFiles.length > 0 && uploadedFiles.every((file) => file.extractionKind === 'ai')
			? 'AI extracted'
			: 'Keyword parsed'
	);
	const activeDescription = $derived(
		activeMode === 'upload'
			? `${uploadedExtractionKind} evidence bundle created from uploaded files. Nothing is persisted.`
			: lab.selected.fixture.description
	);
	const activeClaimGroups = $derived(
		groupClaims(activeVisibleRows.flatMap((row) => row.source.claims))
	);
	const selectedClaimGroups = $derived(
		groupClaims(activeSelectedRow?.source.claims ?? [])
	);
	const activeOwnerGroups = $derived(
		groupOwnerSignals(activeVisibleRows.flatMap((row) => row.source.ownerSignals))
	);
	const isFullTextOpen = $derived(
		Boolean(activeSelectedRow && openFullTextSourceId === activeSelectedRow.source.id)
	);

	$effect(() => {
		const selectedSourceId = activeSelectedRow?.source.id ?? null;

		if (openFullTextSourceId && openFullTextSourceId !== selectedSourceId) {
			openFullTextSourceId = null;
		}
	});

	function formatPercent(value: number) {
		return `${Math.round(value * 100)}%`;
	}

	function formatDate(value: number) {
		return new Date(value).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatLabel(value: string) {
		return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
	}

	function tierClass(tier: string | null | undefined) {
		if (tier === 'strong') {
			return 'border-emerald-200 bg-emerald-50 text-emerald-800';
		}

		if (tier === 'medium') {
			return 'border-amber-200 bg-amber-50 text-amber-800';
		}

		return 'border-red-200 bg-red-50 text-red-700';
	}

	function decisionClass(decision: string) {
		if (decision === 'autoHandoff') {
			return 'border-emerald-200 bg-emerald-50 text-emerald-800';
		}

		if (decision === 'generateContextRequest') {
			return 'border-blue-200 bg-blue-50 text-blue-800';
		}

		if (decision === 'needsUserReview') {
			return 'border-amber-200 bg-amber-50 text-amber-800';
		}

		return 'border-red-200 bg-red-50 text-red-700';
	}

	function claimGroupClass(kind: 'usableNow' | 'historicalContext' | 'needsValidation' | 'doNotUse') {
		if (kind === 'usableNow') {
			return 'border-emerald-100 bg-emerald-50 text-emerald-900';
		}

		if (kind === 'historicalContext') {
			return 'border-sky-100 bg-sky-50 text-sky-900';
		}

		if (kind === 'needsValidation') {
			return 'border-amber-100 bg-amber-50 text-amber-900';
		}

		return 'border-red-100 bg-red-50 text-red-900';
	}

	function groupClaims(claims: readonly SourceClaim[]) {
		const groups = {
			usableNow: [] as SourceClaim[],
			historicalContext: [] as SourceClaim[],
			needsValidation: [] as SourceClaim[],
			doNotUse: [] as SourceClaim[]
		};

		for (const claim of claims) {
			if (claim.stance === 'contradicts' || isUnsafeClaim(claim)) {
				groups.doNotUse.push(claim);
				continue;
			}

			if (isHistoricalClaim(claim)) {
				groups.historicalContext.push(claim);
				continue;
			}

			if (claim.requiresValidation || claim.support === 'weak' || claim.support === 'inferred') {
				groups.needsValidation.push(claim);
				continue;
			}

			groups.usableNow.push(claim);
		}

		return groups;
	}

	function isHistoricalClaim(claim: SourceClaim) {
		const text = `${claim.text} ${claim.reason ?? ''}`.toLowerCase();

		return /\b(old|older|stale|prior|previous|last year|historical|from last year)\b/.test(text);
	}

	function isUnsafeClaim(claim: SourceClaim) {
		const text = `${claim.text} ${claim.reason ?? ''}`.toLowerCase();

		return (
			claim.sensitivity === 'high' ||
			/\b(do not state|do not quote|should not be quoted|without validation|confidential partner|restricted)\b/.test(text)
		);
	}

	function groupOwnerSignals(ownerSignals: readonly OwnerSignal[]) {
		return {
			sourceOwners: dedupeOwnerSignals(
				ownerSignals.filter((ownerSignal) => ownerSignal.kind !== 'unknown' && ownerSignal.owner)
			),
			validationTargets: dedupeOwnerSignals(
				ownerSignals.filter((ownerSignal) => ownerSignal.kind === 'unknown' && ownerSignal.owner)
			)
		};
	}

	function dedupeOwnerSignals(ownerSignals: readonly OwnerSignal[]) {
		const dedupedSignals: OwnerSignal[] = [];

		for (const ownerSignal of ownerSignals) {
			const key = ownerSignal.owner?.id ?? `${ownerSignal.kind}:${ownerSignal.reason}`;
			const existingSignalIndex = dedupedSignals.findIndex((signal) => {
				const signalKey = signal.owner?.id ?? `${signal.kind}:${signal.reason}`;

				return signalKey === key;
			});

			if (existingSignalIndex < 0) {
				dedupedSignals.push(ownerSignal);
				continue;
			}

			if (ownerSignal.confidence > dedupedSignals[existingSignalIndex].confidence) {
				dedupedSignals[existingSignalIndex] = ownerSignal;
			}
		}

		return dedupedSignals.sort((first, second) => second.confidence - first.confidence);
	}

	function claimSummary(claims: readonly SourceClaim[]) {
		return claims
			.slice(0, 2)
			.map((claim) => claim.text)
			.join(' · ');
	}

	function toggleFullText(sourceId: string) {
		openFullTextSourceId = openFullTextSourceId === sourceId ? null : sourceId;
	}

	function evidenceLabHref({
		fixtureId,
		sourceId,
		now = lab.nowIso,
		hiddenSourceIds = []
	}: {
		fixtureId?: string | null;
		sourceId?: string | null;
		now?: string;
		hiddenSourceIds?: readonly string[];
	} = {}) {
		const params = new SvelteURLSearchParams();

		if (fixtureId) {
			params.set('fixture', fixtureId);
		}

		if (sourceId) {
			params.set('source', sourceId);
		}

		params.set('now', now);

		if (hiddenSourceIds.length > 0) {
			params.set('hide', hiddenSourceIds.join(','));
		}

		return `/evidence-lab?${params.toString()}` as `/evidence-lab?${string}`;
	}

	async function handleFileInputChange(event: Event) {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement) || !input.files) {
			return;
		}

		const files = [...input.files];

		if (files.length === 0) {
			return;
		}

		isReadingFiles = true;
		uploadError = null;
		aiExtractionError = null;

		try {
			const nextUploadedFiles = await Promise.all(
				files.map(async (file, index) =>
					toUploadedEvidenceFile({
						name: file.name,
						text: await file.text(),
						lastModified: file.lastModified || Date.now(),
						index
					})
				)
			);

			uploadedFiles = nextUploadedFiles;
			uploadedHiddenSourceIds = [];
			selectedUploadedSourceId = nextUploadedFiles[0]?.id ?? null;
			isReadingFiles = false;
			await extractUploadedFilesWithAi(nextUploadedFiles);
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'Could not read uploaded files.';
		} finally {
			isReadingFiles = false;
			input.value = '';
		}
	}

	function clearUploadedFiles() {
		uploadedFiles = [];
		uploadedHiddenSourceIds = [];
		selectedUploadedSourceId = null;
		uploadError = null;
		aiExtractionError = null;
	}

	function toggleUploadedHiddenSource(sourceId: string) {
		uploadedHiddenSourceIds = uploadedHiddenSourceIds.includes(sourceId)
			? uploadedHiddenSourceIds.filter((id) => id !== sourceId)
			: [...uploadedHiddenSourceIds, sourceId];
	}

	async function extractUploadedFilesWithAi(filesToExtract = uploadedFiles) {
		if (filesToExtract.length === 0 || isExtractingWithAi) {
			return;
		}

		isExtractingWithAi = true;
		aiExtractionError = null;

		try {
			const extractedResults = await Promise.all(
				filesToExtract.map(async (file) => {
					const response = await fetch('/evidence-lab/extract', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ fileName: file.name, text: file.text })
					});
					const result = (await response.json()) as
						| { ok: true; extracted: ExtractedEvidence }
						| { ok: false; error?: string };

					if (!response.ok || !result.ok) {
						throw new Error(!result.ok && result.error ? result.error : 'AI extraction failed.');
					}

					return result.extracted;
				})
			);

			uploadedFiles = filesToExtract.map((file, index) =>
				withAiExtractedEvidence(file, extractedResults[index])
			);
			selectedUploadedSourceId = uploadedFiles[0]?.id ?? null;
		} catch (error) {
			aiExtractionError = error instanceof Error ? error.message : 'AI extraction failed.';
		} finally {
			isExtractingWithAi = false;
		}
	}
</script>

<svelte:head>
	<title>Evidence Lab</title>
</svelte:head>

<main class="h-dvh overflow-y-auto bg-stone-50 px-4 py-5 md:px-6 md:py-6">
	<div class="mx-auto flex max-w-7xl flex-col gap-4 pb-12">
		<section class="overflow-hidden rounded-sm border border-stone-200/70 bg-white shadow-sm">
			<div class="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
				<div class="p-5 md:p-7">
					<p class="text-[0.7rem] font-semibold tracking-[0.18em] text-stone-400 uppercase">
						Public prototype
					</p>
					<h1 class="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-stone-950 md:text-4xl">
						Evidence lab
					</h1>
					<p class="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
						Upload local text data sources or open a synthetic example. Keyword parsing runs locally first, then GPT-5.5 extraction starts automatically.
					</p>
					<div class="mt-5 flex flex-wrap gap-2">
						<span class="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
							No persistence
						</span>
						<span class="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
							GPT-5.5 low reasoning
						</span>
						<span class="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
							{lab.coverage.totalFixtures} examples
						</span>
					</div>
				</div>

				<div class="border-t border-stone-200/70 bg-stone-50 p-5 md:p-7 lg:border-t-0 lg:border-l">
					<p class="text-sm font-semibold text-stone-950">Upload your data sources</p>
					<p class="mt-2 text-xs leading-5 text-stone-500">
						Use `.txt`, `.md`, `.json`, or `.eml` files. Files are read in your browser, keyword parsed immediately, then AI extracted by default.
					</p>
					<label class="mt-4 flex cursor-pointer items-center justify-center rounded-sm border border-dashed border-stone-300 bg-white px-4 py-6 text-center text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50">
						<input
							type="file"
							multiple
							accept=".txt,.md,.json,.eml,text/plain,text/markdown,application/json,message/rfc822"
							class="sr-only"
							onchange={handleFileInputChange}
						/>
						{isReadingFiles ? 'Reading files...' : 'Choose files'}
					</label>
					{#if uploadError}
						<p class="mt-3 rounded-sm border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
							{uploadError}
						</p>
					{/if}
					{#if uploadedFiles.length > 0}
						<div class="mt-3 rounded-sm border border-stone-200 bg-white p-3">
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="text-xs font-medium text-stone-900">{uploadedFiles.length} uploaded source{uploadedFiles.length === 1 ? '' : 's'} active</p>
									<p class="mt-1 text-[0.68rem] text-stone-500">Mode: {uploadedExtractionKind}</p>
									{#if isExtractingWithAi}
										<p class="mt-1 text-[0.68rem] text-blue-700">Extracting with GPT-5.5...</p>
									{/if}
								</div>
								<button type="button" class="text-xs font-medium text-stone-900 underline underline-offset-2" onclick={clearUploadedFiles}>
									Clear
								</button>
							</div>
							{#if aiExtractionError}
								<p class="mt-2 rounded-sm border border-red-100 bg-red-50 px-2 py-1.5 text-xs text-red-700">
									{aiExtractionError}
								</p>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</section>

		{#if activeMode === 'catalog'}
			<section class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm md:p-5">
				<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div>
						<p class="text-[0.72rem] font-semibold tracking-[0.14em] text-stone-400 uppercase">
							Example catalog
						</p>
						<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em] text-stone-950">
							Open an example data source
						</h2>
						<p class="mt-2 text-sm leading-6 text-stone-600">
							The dashboard appears after you select an example or upload local files.
						</p>
					</div>
				</div>

				<div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{#each lab.fixtures as fixture (fixture.id)}
						<a
							href={resolve(evidenceLabHref({ fixtureId: fixture.id }))}
							class="group rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
						>
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-sm font-semibold leading-5 text-stone-950">{fixture.title}</p>
									<p class="mt-2 text-xs leading-5 text-stone-500">{fixture.description}</p>
								</div>
								<span class={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${tierClass(fixture.strongestTier)}`}>
									{fixture.strongestTier}
								</span>
							</div>
							<div class="mt-4 flex flex-wrap gap-2">
								<span class={`rounded-full border px-2 py-1 text-[0.68rem] ${decisionClass(fixture.automationDecision)}`}>
									{formatLabel(fixture.automationDecision)}
								</span>
								<span class="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[0.68rem] text-stone-500">
									{fixture.sourceCount} source{fixture.sourceCount === 1 ? '' : 's'}
								</span>
							</div>
							<p class="mt-4 text-xs font-medium text-stone-950 group-hover:underline">
								Open dashboard
							</p>
						</a>
					{/each}
				</div>
			</section>
		{:else if activeAssessment}
			<div class="grid min-h-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
				<aside class="flex min-h-0 flex-col gap-3">
					<div class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
						<p class="text-sm font-semibold text-stone-950">
							{activeMode === 'upload' ? 'Uploaded sources' : 'Example sources'}
						</p>
						<p class="mt-1 text-xs leading-5 text-stone-500">
							Select a source to read it, or hide it to recompute the assessment.
						</p>
						<div class="mt-4 flex flex-col gap-2">
							{#each activeRows as row (row.source.id)}
								<div class={`rounded-sm border p-3 ${activeSelectedRow?.source.id === row.source.id ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-900'}`}>
									<p class="text-sm font-medium leading-5">{row.source.title}</p>
									<p class={`mt-1 text-xs ${activeSelectedRow?.source.id === row.source.id ? 'text-stone-300' : 'text-stone-500'}`}>
										{row.source.kind} · {row.assessment?.tier ?? row.expectedTier ?? 'hidden'}
									</p>
									<div class="mt-3 flex flex-wrap gap-2">
										{#if activeMode === 'upload'}
											<button type="button" class="rounded-sm border border-stone-200 bg-white px-2 py-1 text-[0.68rem] font-medium text-stone-900" onclick={() => (selectedUploadedSourceId = row.source.id)}>
												Read
											</button>
											<button type="button" class="rounded-sm border border-stone-200 bg-white px-2 py-1 text-[0.68rem] font-medium text-stone-900" onclick={() => toggleUploadedHiddenSource(row.source.id)}>
												{row.isHidden ? 'Show' : 'Hide'}
											</button>
										{:else}
											<a class="rounded-sm border border-stone-200 bg-white px-2 py-1 text-[0.68rem] font-medium text-stone-900" href={resolve(evidenceLabHref({ fixtureId: lab.selectedFixtureId, sourceId: row.source.id, hiddenSourceIds: lab.hiddenSourceIds }))}>
												Read
											</a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</aside>

				<div class="flex min-w-0 flex-col gap-4">
					<section class="rounded-sm border border-stone-200/70 bg-white p-5 shadow-sm">
						<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
							<div>
								<p class="text-[0.72rem] font-semibold tracking-[0.14em] text-stone-400 uppercase">
									Assessment dashboard
								</p>
								<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em] text-stone-950">{activeTitle}</h2>
								<p class="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{activeDescription}</p>
							</div>
							{#if activeMode === 'upload'}
								<span class="w-fit rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
									{uploadedExtractionKind}
								</span>
							{:else if activeMode === 'fixture'}
								<span class={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${decisionClass(lab.selected.fixture.expected.automationDecision)}`}>
									Truth: {formatLabel(lab.selected.fixture.expected.automationDecision)}
								</span>
							{/if}
						</div>

						<div class="mt-5 grid gap-3 md:grid-cols-4">
							<div class="rounded-sm border border-stone-200/70 bg-stone-50 p-3">
								<p class="text-[0.68rem] font-medium text-stone-400">Confidence</p>
								<p class="mt-1 text-lg font-semibold text-stone-950">{formatPercent(activeAssessment.aggregateConfidence)}</p>
							</div>
							<div class="rounded-sm border border-stone-200/70 bg-stone-50 p-3">
								<p class="text-[0.68rem] font-medium text-stone-400">Risk</p>
								<p class="mt-1 text-lg font-semibold text-stone-950">{formatPercent(activeAssessment.aggregateRisk)}</p>
							</div>
							<div class="rounded-sm border border-stone-200/70 bg-stone-50 p-3">
								<p class="text-[0.68rem] font-medium text-stone-400">Best sources</p>
								<p class="mt-1 truncate text-xs font-medium text-stone-700">{activeAssessment.bestSourceIds.join(', ') || 'None'}</p>
							</div>
							<div class="rounded-sm border border-stone-200/70 bg-stone-50 p-3">
								<p class="text-[0.68rem] font-medium text-stone-400">Visible sources</p>
								<p class="mt-1 text-lg font-semibold text-stone-950">{activeAssessment.sourceAssessments.length}/{activeRows.length}</p>
							</div>
						</div>
					</section>

					<section class="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
						<div class="rounded-sm border border-stone-200/70 bg-white p-5 shadow-sm">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-sm font-semibold text-stone-950">Source reader</p>
									<p class="mt-1 text-xs text-stone-500">Read the selected data source when needed.</p>
								</div>
								{#if activeSelectedRow?.isHidden}
									<span class="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[0.68rem] text-stone-500">Hidden</span>
								{/if}
							</div>

							{#if activeSelectedRow}
								<div class="mt-4 rounded-sm border border-stone-200 bg-stone-50 p-4">
									<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
										<div>
											<p class="text-base font-semibold text-stone-950">{activeSelectedRow.source.title}</p>
											<div class="mt-3 grid gap-2 text-xs text-stone-500 md:grid-cols-2">
												<p><span class="font-medium text-stone-900">Created:</span> {formatDate(activeSelectedRow.source.createdAt)}</p>
												<p><span class="font-medium text-stone-900">Updated:</span> {formatDate(activeSelectedRow.source.updatedAt ?? activeSelectedRow.source.createdAt)}</p>
												<p><span class="font-medium text-stone-900">Client:</span> {activeSelectedRow.source.client?.name ?? 'None'}</p>
												<p><span class="font-medium text-stone-900">Opportunity:</span> {activeSelectedRow.source.opportunity?.name ?? 'None'}</p>
											</div>
										</div>
										<div class="flex flex-col items-start gap-2 md:items-end">
											<span class="w-fit rounded-full border border-stone-200 bg-white px-2 py-1 text-[0.68rem] text-stone-500">{activeSelectedRow.source.kind}</span>
											{#if activeSelectedRow.source.extractionKind}
												<span class="w-fit rounded-full border border-stone-200 bg-white px-2 py-1 text-[0.68rem] text-stone-500">{formatLabel(activeSelectedRow.source.extractionKind)}</span>
											{/if}
										</div>
									</div>

									{#if activeSelectedRow.source.fullText}
										<button
											type="button"
											class="mt-4 rounded-sm border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 hover:bg-stone-50"
											onclick={() => toggleFullText(activeSelectedRow.source.id)}
										>
											{isFullTextOpen ? 'Hide full text' : 'See full text'}
										</button>
										{#if isFullTextOpen}
											<pre class="mt-3 max-h-72 overflow-auto rounded-sm border border-stone-200 bg-white p-3 whitespace-pre-wrap text-xs leading-5 text-stone-600">{activeSelectedRow.source.fullText}</pre>
										{/if}
									{:else}
										<p class="mt-4 rounded-sm border border-dashed border-stone-200 bg-white px-3 py-2 text-xs text-stone-500">
											Full source text is not available for this fixture yet.
										</p>
									{/if}
								</div>
							{:else}
								<div class="mt-4 rounded-sm border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
									<p class="text-sm font-medium text-stone-900">No source selected</p>
									<p class="mt-2 text-xs leading-5 text-stone-500">Choose a source from the left to read it.</p>
								</div>
							{/if}
						</div>

						<div class="rounded-sm border border-stone-200/70 bg-white p-5 shadow-sm">
							<p class="text-sm font-semibold text-stone-950">Evidence summary</p>
							<div class="mt-4 grid gap-3 xl:grid-cols-2">
								<div class={`rounded-sm border p-3 ${claimGroupClass('usableNow')}`}>
									<p class="text-xs font-semibold">Usable now · {activeClaimGroups.usableNow.length}</p>
									<p class="mt-1 text-xs leading-5 opacity-80">{claimSummary(activeClaimGroups.usableNow) || 'No directly usable claims yet.'}</p>
								</div>
								<div class={`rounded-sm border p-3 ${claimGroupClass('historicalContext')}`}>
									<p class="text-xs font-semibold">Historical context · {activeClaimGroups.historicalContext.length}</p>
									<p class="mt-1 text-xs leading-5 opacity-80">{claimSummary(activeClaimGroups.historicalContext) || 'No historical-only claims.'}</p>
								</div>
								<div class={`rounded-sm border p-3 ${claimGroupClass('needsValidation')}`}>
									<p class="text-xs font-semibold">Needs validation · {activeClaimGroups.needsValidation.length}</p>
									<p class="mt-1 text-xs leading-5 opacity-80">{claimSummary(activeClaimGroups.needsValidation) || 'No validation-needed claims.'}</p>
								</div>
								<div class={`rounded-sm border p-3 ${claimGroupClass('doNotUse')}`}>
									<p class="text-xs font-semibold">Do not state directly · {activeClaimGroups.doNotUse.length}</p>
									<p class="mt-1 text-xs leading-5 opacity-80">{claimSummary(activeClaimGroups.doNotUse) || 'No contradicting or blocked claims.'}</p>
								</div>
							</div>

							<div class="mt-4 grid gap-3 md:grid-cols-2">
								<div class="rounded-sm border border-stone-200 bg-stone-50 p-3">
									<p class="text-[0.72rem] font-medium text-stone-500">Likely source owner</p>
									<div class="mt-2 flex flex-wrap gap-2">
										{#if activeOwnerGroups.sourceOwners.length === 0}
											<span class="text-xs text-stone-400">None</span>
										{:else}
											{#each activeOwnerGroups.sourceOwners as ownerSignal (`${ownerSignal.kind}:${ownerSignal.owner?.id ?? ownerSignal.reason}`)}
												<span class="rounded-full border border-stone-200 bg-white px-2 py-1 text-[0.68rem] text-stone-600">
													{ownerSignal.owner?.name ?? 'Unknown'} · {formatLabel(ownerSignal.kind)}
												</span>
											{/each}
										{/if}
									</div>
								</div>
								<div class="rounded-sm border border-stone-200 bg-stone-50 p-3">
									<p class="text-[0.72rem] font-medium text-stone-500">Validation targets</p>
									<div class="mt-2 flex flex-wrap gap-2">
										{#if activeOwnerGroups.validationTargets.length === 0}
											<span class="text-xs text-stone-400">None</span>
										{:else}
											{#each activeOwnerGroups.validationTargets as ownerSignal (`${ownerSignal.kind}:${ownerSignal.owner?.id ?? ownerSignal.reason}`)}
												<span class="rounded-full border border-stone-200 bg-white px-2 py-1 text-[0.68rem] text-stone-600">
													{ownerSignal.owner?.name ?? 'Unknown'}
												</span>
											{/each}
										{/if}
									</div>
								</div>
							</div>
						</div>
					</section>

					<section class="rounded-sm border border-stone-200/70 bg-white p-5 shadow-sm">
						<p class="text-sm font-semibold text-stone-950">Selected source claims</p>
						{#if activeSelectedRow}
							<div class="mt-4 grid gap-3 xl:grid-cols-4">
								<div class={`rounded-sm border p-3 ${claimGroupClass('usableNow')}`}>
									<p class="text-xs font-semibold">Usable now</p>
									<div class="mt-2 grid gap-2">
										{#if selectedClaimGroups.usableNow.length === 0}
											<p class="text-xs opacity-70">No usable claims in this source.</p>
										{:else}
											{#each selectedClaimGroups.usableNow as claim (claim.id)}
												<p class="rounded-sm bg-white/70 p-2 text-xs leading-5">{claim.text}</p>
											{/each}
										{/if}
									</div>
								</div>
								<div class={`rounded-sm border p-3 ${claimGroupClass('historicalContext')}`}>
									<p class="text-xs font-semibold">Historical context</p>
									<div class="mt-2 grid gap-2">
										{#if selectedClaimGroups.historicalContext.length === 0}
											<p class="text-xs opacity-70">No historical-only claims.</p>
										{:else}
											{#each selectedClaimGroups.historicalContext as claim (claim.id)}
												<p class="rounded-sm bg-white/70 p-2 text-xs leading-5">{claim.text}</p>
											{/each}
										{/if}
									</div>
								</div>
								<div class={`rounded-sm border p-3 ${claimGroupClass('needsValidation')}`}>
									<p class="text-xs font-semibold">Needs validation</p>
									<div class="mt-2 grid gap-2">
										{#if selectedClaimGroups.needsValidation.length === 0}
											<p class="text-xs opacity-70">No validation-needed claims.</p>
										{:else}
											{#each selectedClaimGroups.needsValidation as claim (claim.id)}
												<p class="rounded-sm bg-white/70 p-2 text-xs leading-5">{claim.text}</p>
											{/each}
										{/if}
									</div>
								</div>
								<div class={`rounded-sm border p-3 ${claimGroupClass('doNotUse')}`}>
									<p class="text-xs font-semibold">Do not state directly</p>
									<div class="mt-2 grid gap-2">
										{#if selectedClaimGroups.doNotUse.length === 0}
											<p class="text-xs opacity-70">No contradicting or blocked claims.</p>
										{:else}
											{#each selectedClaimGroups.doNotUse as claim (claim.id)}
												<p class="rounded-sm bg-white/70 p-2 text-xs leading-5">{claim.text}</p>
											{/each}
										{/if}
									</div>
								</div>
							</div>

							{#if activeSelectedRow.source.cautions?.length || activeSelectedRow.source.missingContext?.length}
								<div class="mt-4 grid gap-3 xl:grid-cols-2">
									{#if activeSelectedRow.source.cautions?.length}
										<div class="rounded-sm border border-amber-100 bg-amber-50 p-3">
											<p class="text-[0.72rem] font-medium text-amber-900">AI cautions</p>
											<ul class="mt-2 list-disc pl-4 text-xs leading-5 text-amber-800">
												{#each activeSelectedRow.source.cautions as caution (caution)}
													<li>{caution}</li>
												{/each}
											</ul>
										</div>
									{/if}
									{#if activeSelectedRow.source.missingContext?.length}
										<div class="rounded-sm border border-blue-100 bg-blue-50 p-3">
											<p class="text-[0.72rem] font-medium text-blue-900">Missing context</p>
											<ul class="mt-2 list-disc pl-4 text-xs leading-5 text-blue-800">
												{#each activeSelectedRow.source.missingContext as missingContext (missingContext)}
													<li>{missingContext}</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							{/if}
						{:else}
							<p class="mt-4 rounded-sm border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-xs text-stone-500">Select a source to see grouped claims.</p>
						{/if}
					</section>

					<section class="rounded-sm border border-stone-200/70 bg-white p-5 shadow-sm">
						<details>
							<summary class="cursor-pointer text-sm font-semibold text-stone-950">View detailed analysis</summary>
							<div class="mt-4 grid gap-4">
								<div class="rounded-sm border border-stone-200 bg-stone-50 p-3">
									<p class="text-[0.72rem] font-medium text-stone-500">Bundle details</p>
									<div class="mt-2 grid gap-2 text-xs leading-5 text-stone-600 md:grid-cols-2">
										<p><span class="font-medium text-stone-900">Strongest tier:</span> {activeAssessment.strongestTier ? formatLabel(activeAssessment.strongestTier) : 'None'}</p>
										<p><span class="font-medium text-stone-900">Likely owners:</span> {activeAssessment.likelyOwnerSignals.map((signal) => signal.owner?.name).filter(Boolean).join(', ') || 'None'}</p>
										<p><span class="font-medium text-stone-900">Corroborated:</span> {activeAssessment.corroboratedClaimKinds.map(formatLabel).join(', ') || 'None'}</p>
										<p><span class="font-medium text-stone-900">Conflicting:</span> {activeAssessment.conflictingClaimKinds.map(formatLabel).join(', ') || 'None'}</p>
										<p><span class="font-medium text-stone-900">Unresolved weaknesses:</span> {activeAssessment.unresolvedWeaknesses.length}</p>
									</div>
								</div>

								<div class="grid gap-3">
									{#each activeRows as row (row.source.id)}
										<div class="rounded-sm border border-stone-200 bg-white p-3">
											<div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
												<div>
													<p class="text-sm font-medium text-stone-950">{row.source.title}</p>
													<p class="mt-1 text-xs text-stone-500">{row.source.summary}</p>
												</div>
												<span class={`w-fit rounded-full border px-2 py-1 text-[0.68rem] font-medium ${tierClass(row.assessment?.tier ?? row.expectedTier)}`}>
													{row.assessment ? row.assessment.tier : `Expected ${row.expectedTier ?? 'hidden'}`}
												</span>
											</div>

											{#if row.assessment}
												<div class="mt-3 grid gap-2 md:grid-cols-3">
													<p class="rounded-sm bg-stone-50 p-2 text-xs text-stone-600"><span class="font-medium text-stone-900">Confidence:</span> {formatPercent(row.assessment.aggregateConfidence)}</p>
													<p class="rounded-sm bg-stone-50 p-2 text-xs text-stone-600"><span class="font-medium text-stone-900">Risk:</span> {formatPercent(row.assessment.aggregateRisk)}</p>
													<p class="rounded-sm bg-stone-50 p-2 text-xs text-stone-600"><span class="font-medium text-stone-900">Matched claims:</span> {row.assessment.matchedClaims.length}</p>
												</div>

												<div class="mt-3 grid gap-3 xl:grid-cols-2">
													<div>
														<p class="text-[0.72rem] font-medium text-stone-500">Score explanations</p>
														<div class="mt-2 grid gap-1.5">
															{#each row.assessment.explanations as explanation (explanation.dimension)}
																<div class="flex items-start justify-between gap-3 rounded-sm border border-stone-100 bg-stone-50 px-2 py-1.5 text-xs">
																	<span class="text-stone-600">{formatLabel(explanation.dimension)}</span>
																	<span class="font-medium text-stone-950">{formatPercent(explanation.score)}</span>
																</div>
															{/each}
														</div>
													</div>
													<div>
														<p class="text-[0.72rem] font-medium text-stone-500">Weaknesses</p>
														<div class="mt-2 grid gap-1.5">
															{#if row.assessment.weaknesses.length === 0}
																<p class="rounded-sm border border-emerald-100 bg-emerald-50 px-2 py-2 text-xs text-emerald-700">No source-level weaknesses.</p>
															{:else}
																{#each row.assessment.weaknesses as weakness (`${weakness.dimension}:${weakness.message}`)}
																	<p class="rounded-sm border border-amber-100 bg-amber-50 px-2 py-2 text-xs leading-5 text-amber-800">
																		<span class="font-medium">{formatLabel(weakness.dimension)}:</span> {weakness.message}
																	</p>
																{/each}
															{/if}
														</div>
													</div>
												</div>
											{/if}
										</div>
									{/each}
								</div>

								{#if activeMode === 'fixture'}
									<div class="rounded-sm border border-stone-200 bg-stone-50 p-3">
										<p class="text-[0.72rem] font-medium text-stone-500">Local truth</p>
										<p class="mt-2 text-xs leading-5 text-stone-600">Decision: {formatLabel(lab.selected.fixture.expected.automationDecision)}</p>
										<p class="mt-1 text-xs leading-5 text-stone-600">Weak claims: {lab.selected.fixture.expected.weakClaimIds.length}</p>
									</div>
								{/if}
							</div>
						</details>
					</section>
				</div>
			</div>
		{/if}
	</div>
</main>

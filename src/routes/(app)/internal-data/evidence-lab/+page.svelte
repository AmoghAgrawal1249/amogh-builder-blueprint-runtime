<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const lab = $derived(data.evidenceLab);
	const selectedAssessment = $derived(lab.selected.assessment);
	const selectedFixture = $derived(lab.selected.fixture);
	const sourceRows = $derived(lab.selected.sourceRows);

	function formatPercent(value: number) {
		return `${Math.round(value * 100)}%`;
	}

	function formatLabel(value: string) {
		return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
	}

	function tierClass(tier: string | null) {
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

	function searchQuery({
		fixtureId = lab.selectedFixtureId,
		now = lab.nowIso,
		hiddenSourceIds = lab.hiddenSourceIds
	}: {
		fixtureId?: string;
		now?: string;
		hiddenSourceIds?: readonly string[];
	} = {}) {
		const params = new SvelteURLSearchParams();

		params.set('fixture', fixtureId);
		params.set('now', now);

		if (hiddenSourceIds.length > 0) {
			params.set('hide', hiddenSourceIds.join(','));
		}

		return `?${params.toString()}`;
	}

	function evidenceLabHref(options: Parameters<typeof searchQuery>[0]) {
		return `/internal-data/evidence-lab${searchQuery(options)}` as `/internal-data/evidence-lab?${string}`;
	}
</script>

<section class="min-h-full bg-stone-50 px-4 py-5 md:px-6 md:py-6">
	<div class="mx-auto flex max-w-7xl flex-col gap-4 pb-12">
		<div class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm md:p-5">
			<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div class="max-w-3xl">
					<p class="text-[0.7rem] font-semibold tracking-[0.18em] text-stone-400 uppercase">
						Hidden internal prototype
					</p>
					<h1 class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
						Evidence lab
					</h1>
					<p class="mt-2 text-sm leading-6 text-stone-600">
						Inspect synthetic source-ranking fixtures, local truth values, and deterministic bundle assessments. This page is intentionally not linked from navigation.
					</p>
				</div>

				<form method="GET" class="rounded-sm border border-stone-200/70 bg-stone-50 p-3">
					<input type="hidden" name="fixture" value={lab.selectedFixtureId} />
					{#each lab.hiddenSourceIds as hiddenSourceId (hiddenSourceId)}
						<input type="hidden" name="hide" value={hiddenSourceId} />
					{/each}
					<label class="text-[0.7rem] font-medium text-stone-500" for="evidence-lab-now">
						Assessment time
					</label>
					<div class="mt-2 flex gap-2">
						<input
							id="evidence-lab-now"
							type="datetime-local"
							name="now"
							value={lab.nowInputValue}
							class="h-8 rounded-sm border border-stone-200 bg-white px-2 text-xs text-stone-900 outline-none focus:border-stone-400"
						/>
						<button
							type="submit"
							class="h-8 rounded-sm bg-stone-950 px-3 text-xs font-medium text-white hover:bg-stone-800"
						>
							Apply
						</button>
					</div>
					<p class="mt-2 text-[0.68rem] text-stone-400">Current: {lab.nowIso}</p>
				</form>
			</div>
		</div>

		<div class="grid gap-3 md:grid-cols-4">
			<div class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
				<p class="text-[0.7rem] font-medium text-stone-400">Fixtures</p>
				<p class="mt-2 text-2xl font-semibold text-stone-950">{lab.coverage.totalFixtures}</p>
			</div>
			<div class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
				<p class="text-[0.7rem] font-medium text-stone-400">Source kinds</p>
				<p class="mt-2 text-2xl font-semibold text-stone-950">{lab.coverage.sourceKinds.length}</p>
				<p class="mt-1 truncate text-xs text-stone-500">{lab.coverage.sourceKinds.join(', ')}</p>
			</div>
			<div class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
				<p class="text-[0.7rem] font-medium text-stone-400">Decision truths</p>
				<p class="mt-2 text-2xl font-semibold text-stone-950">{lab.coverage.automationDecisions.length}</p>
				<p class="mt-1 truncate text-xs text-stone-500">{lab.coverage.automationDecisions.map(formatLabel).join(', ')}</p>
			</div>
			<div class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
				<p class="text-[0.7rem] font-medium text-stone-400">Selected tier</p>
				<p class="mt-2 text-2xl font-semibold text-stone-950">{selectedAssessment.strongestTier ? formatLabel(selectedAssessment.strongestTier) : 'None'}</p>
			</div>
		</div>

		<div class="grid min-h-0 gap-4 lg:grid-cols-[21rem_minmax(0,1fr)]">
			<aside class="flex min-h-0 flex-col gap-3">
				<div class="rounded-sm border border-stone-200/70 bg-white p-3 shadow-sm">
					<p class="px-1 text-[0.72rem] font-semibold tracking-[0.14em] text-stone-400 uppercase">
						Fixture browser
					</p>
					<div class="mt-3 flex flex-col gap-2">
						{#each lab.fixtures as fixture (fixture.id)}
							<a
								href={resolve(evidenceLabHref({ fixtureId: fixture.id, hiddenSourceIds: [] }))}
								class={`rounded-sm border p-3 transition-colors ${fixture.isSelected ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200/70 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50'}`}
							>
								<div class="flex items-start justify-between gap-3">
									<p class="text-sm font-medium leading-5">{fixture.title}</p>
									<span class={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${tierClass(fixture.strongestTier)}`}>
										{fixture.strongestTier}
									</span>
								</div>
								<p class={`mt-2 text-xs leading-5 ${fixture.isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
									{fixture.sourceCount} source{fixture.sourceCount === 1 ? '' : 's'} · {formatLabel(fixture.automationDecision)}
								</p>
							</a>
						{/each}
					</div>
				</div>

				<form method="GET" class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
					<input type="hidden" name="fixture" value={lab.selectedFixtureId} />
					<input type="hidden" name="now" value={lab.nowIso} />
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-stone-950">Scenario toggles</p>
							<p class="mt-1 text-xs text-stone-500">Hide sources and recompute server-side.</p>
						</div>
						<button type="submit" class="h-8 rounded-sm bg-stone-950 px-3 text-xs font-medium text-white hover:bg-stone-800">
							Apply
						</button>
					</div>

					<div class="mt-3 flex flex-col gap-2">
						{#each sourceRows as row (row.source.id)}
							<label class="flex items-start gap-2 rounded-sm border border-stone-200/70 bg-stone-50 p-2 text-xs text-stone-700">
								<input
									type="checkbox"
									name="hide"
									value={row.source.id}
									checked={row.isHidden}
									class="mt-0.5"
								/>
								<span>
									<span class="font-medium text-stone-900">Hide</span> {row.source.title}
									<span class="mt-0.5 block text-stone-400">{row.source.kind}</span>
								</span>
							</label>
						{/each}
					</div>
				</form>
			</aside>

			<div class="flex min-w-0 flex-col gap-4">
				<section class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm md:p-5">
					<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
						<div>
							<p class="text-[0.72rem] font-semibold tracking-[0.14em] text-stone-400 uppercase">
								Selected fixture
							</p>
							<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em] text-stone-950">
								{selectedFixture.title}
							</h2>
							<p class="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{selectedFixture.description}</p>
						</div>
						<span class={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${decisionClass(selectedFixture.expected.automationDecision)}`}>
							Truth: {formatLabel(selectedFixture.expected.automationDecision)}
						</span>
					</div>

					<div class="mt-5 grid gap-3 md:grid-cols-4">
						<div class="rounded-sm border border-stone-200/70 bg-stone-50 p-3">
							<p class="text-[0.68rem] font-medium text-stone-400">Aggregate confidence</p>
							<p class="mt-1 text-lg font-semibold text-stone-950">{formatPercent(selectedAssessment.aggregateConfidence)}</p>
						</div>
						<div class="rounded-sm border border-stone-200/70 bg-stone-50 p-3">
							<p class="text-[0.68rem] font-medium text-stone-400">Aggregate risk</p>
							<p class="mt-1 text-lg font-semibold text-stone-950">{formatPercent(selectedAssessment.aggregateRisk)}</p>
						</div>
						<div class="rounded-sm border border-stone-200/70 bg-stone-50 p-3">
							<p class="text-[0.68rem] font-medium text-stone-400">Best sources</p>
							<p class="mt-1 truncate text-xs font-medium text-stone-700">{selectedAssessment.bestSourceIds.join(', ') || 'None'}</p>
						</div>
						<div class="rounded-sm border border-stone-200/70 bg-stone-50 p-3">
							<p class="text-[0.68rem] font-medium text-stone-400">Visible sources</p>
							<p class="mt-1 text-lg font-semibold text-stone-950">{lab.selected.visibleSourceIds.length}/{sourceRows.length}</p>
						</div>
					</div>
				</section>

				<section class="grid gap-4 xl:grid-cols-2">
					<div class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
						<p class="text-sm font-semibold text-stone-950">Context need</p>
						<p class="mt-2 text-sm leading-6 text-stone-600">{selectedFixture.contextNeed.description}</p>
						<div class="mt-3 flex flex-wrap gap-2">
							{#each selectedFixture.contextNeed.requiredClaimKinds as claimKind (claimKind)}
								<span class="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[0.68rem] text-stone-600">
									{formatLabel(claimKind)}
								</span>
							{/each}
						</div>
					</div>

					<div class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
						<p class="text-sm font-semibold text-stone-950">Bundle signals</p>
						<div class="mt-3 grid gap-2 text-xs text-stone-600">
							<p><span class="font-medium text-stone-900">Likely owners:</span> {selectedAssessment.likelyOwnerSignals.map((signal) => signal.owner?.name).filter(Boolean).join(', ') || 'None'}</p>
							<p><span class="font-medium text-stone-900">Corroborated:</span> {selectedAssessment.corroboratedClaimKinds.map(formatLabel).join(', ') || 'None'}</p>
							<p><span class="font-medium text-stone-900">Conflicting:</span> {selectedAssessment.conflictingClaimKinds.map(formatLabel).join(', ') || 'None'}</p>
							<p><span class="font-medium text-stone-900">Unresolved weaknesses:</span> {selectedAssessment.unresolvedWeaknesses.length}</p>
						</div>
					</div>
				</section>

				<section class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
					<p class="text-sm font-semibold text-stone-950">Source assessments</p>
					<div class="mt-4 grid gap-3">
						{#each sourceRows as row (row.source.id)}
							<div class={`rounded-sm border p-4 ${row.isHidden ? 'border-stone-200 bg-stone-50 opacity-65' : 'border-stone-200/70 bg-white'}`}>
								<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
									<div>
										<div class="flex flex-wrap items-center gap-2">
											<p class="text-sm font-semibold text-stone-950">{row.source.title}</p>
											<span class="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[0.65rem] text-stone-500">{row.source.kind}</span>
											{#if row.isHidden}
												<span class="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[0.65rem] text-stone-400">Hidden</span>
											{/if}
										</div>
										<p class="mt-2 text-xs leading-5 text-stone-500">{row.source.summary}</p>
									</div>
									<span class={`w-fit rounded-full border px-2 py-1 text-[0.68rem] font-medium ${tierClass(row.assessment?.tier ?? row.expectedTier)}`}>
										{row.assessment ? row.assessment.tier : `Expected ${row.expectedTier}`}
									</span>
								</div>

								{#if row.assessment}
									<div class="mt-4 grid gap-3 md:grid-cols-3">
										<div class="rounded-sm bg-stone-50 p-3">
											<p class="text-[0.66rem] text-stone-400">Confidence</p>
											<p class="mt-1 text-sm font-semibold text-stone-950">{formatPercent(row.assessment.aggregateConfidence)}</p>
										</div>
										<div class="rounded-sm bg-stone-50 p-3">
											<p class="text-[0.66rem] text-stone-400">Risk</p>
											<p class="mt-1 text-sm font-semibold text-stone-950">{formatPercent(row.assessment.aggregateRisk)}</p>
										</div>
										<div class="rounded-sm bg-stone-50 p-3">
											<p class="text-[0.66rem] text-stone-400">Matched claims</p>
											<p class="mt-1 text-sm font-semibold text-stone-950">{row.assessment.matchedClaims.length}</p>
										</div>
									</div>

									<div class="mt-4 grid gap-3 xl:grid-cols-2">
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
				</section>

				<section class="rounded-sm border border-stone-200/70 bg-white p-4 shadow-sm">
					<p class="text-sm font-semibold text-stone-950">Local truth metadata</p>
					<div class="mt-3 grid gap-2 text-xs leading-5 text-stone-600 md:grid-cols-2">
						<p><span class="font-medium text-stone-900">Decision:</span> {formatLabel(selectedFixture.expected.automationDecision)}</p>
						<p><span class="font-medium text-stone-900">Primary sources:</span> {selectedFixture.expected.primarySourceIds.join(', ') || 'None'}</p>
						<p><span class="font-medium text-stone-900">Validated claims:</span> {selectedFixture.expected.validatedClaimIds.length}</p>
						<p><span class="font-medium text-stone-900">Weak claims:</span> {selectedFixture.expected.weakClaimIds.length}</p>
						<p><span class="font-medium text-stone-900">Request owner:</span> {selectedFixture.expected.contextRequestOwnerId ?? 'None'}</p>
						<p><span class="font-medium text-stone-900">Review prompt:</span> {selectedFixture.expected.reviewPromptKind ? formatLabel(selectedFixture.expected.reviewPromptKind) : 'None'}</p>
					</div>
					{#if selectedFixture.expected.blockedReason}
						<p class="mt-3 rounded-sm border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
							{selectedFixture.expected.blockedReason}
						</p>
					{/if}
					<div class="mt-3 flex flex-wrap gap-2">
						{#each selectedFixture.expected.notes as note (note)}
							<span class="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[0.68rem] text-stone-600">{note}</span>
						{/each}
					</div>
				</section>
			</div>
		</div>
	</div>
</section>

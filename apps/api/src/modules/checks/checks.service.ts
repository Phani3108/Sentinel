import { Injectable } from '@nestjs/common';
import type { CampaignSpec } from '@sentinel/shared/src/schemas/campaign.js';
import type { Finding } from '@sentinel/shared/src/schemas/finding.js';
import type { Policy } from '../policy/policy.service.js';
import { runAllRules } from './rules/index.js';
import { computeRisk } from './scoring/risk_score.js';
import type { Report } from '@sentinel/shared/src/schemas/report.js';
import { LlmProvider } from '../llm/llm.provider.js';

@Injectable()
export class ChecksService {
	constructor(private readonly llm: LlmProvider) {}

	async reviewCampaign(spec: CampaignSpec, policy: Policy): Promise<Report> {
		const deterministicFindings = runAllRules(spec, policy);

		// LLM pass (MVP: stubbed)
		const llmFindings = await this.llm.completeJSON(spec);

		const findings: Finding[] = [...deterministicFindings, ...llmFindings];
		const risk = computeRisk(findings);
		const summary =
			findings.length === 0
				? 'No issues found.'
				: `Found ${findings.length} issues. Highest severity: ${risk}.`;

		return {
			runId: 'pending-assign',
			risk,
			findings,
			summary
		};
	}
}


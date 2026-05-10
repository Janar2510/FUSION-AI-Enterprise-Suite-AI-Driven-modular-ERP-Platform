/**
 * Attendance Anomaly Agent
 *
 * Detects unusual attendance patterns for an employee: late arrivals,
 * irregular hours, unexplained absences, Friday/Monday patterns.
 *
 * Outputs go into AiAction.status = PENDING. HR must review before action.
 */

import { anthropic, AI_MODEL_FAST, registerAgent, AgentInput, AgentOutput } from '../index';

async function attendanceAnomaly(input: AgentInput): Promise<AgentOutput> {
    const employeeId = String(input.employeeId ?? '');
    const employeeName = String(input.employeeName ?? 'Employee');
    const records = Array.isArray(input.records)
        ? JSON.stringify(input.records.slice(0, 30))  // last 30 records max
        : String(input.records ?? '[]');
    const expectedHours = Number(input.expectedHoursPerWeek ?? 40);

    const response = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 768,
        system: `You are an HR analytics assistant detecting attendance anomalies.
Respond ONLY with valid JSON:
{
  "confidence": <0.0-1.0>,
  "hasAnomalies": <boolean>,
  "anomalyType": "<none|late_arrivals|early_departures|irregular_hours|frequent_absences|mixed>",
  "severity": "<low|medium|high>",
  "summary": "<2 sentence analysis>",
  "patterns": ["<pattern 1>"],
  "recommendation": "<monitor_only|manager_conversation|hr_review>",
  "reasoning": "<one sentence>"
}`,
        messages: [{
            role: 'user',
            content: `Employee: ${employeeName} (${employeeId})\nExpected hours/week: ${expectedHours}\nAttendance records: ${records}`,
        }],
    });

    let parsed: any;
    try {
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        parsed = JSON.parse(text);
    } catch {
        return { confidence: 0, summary: 'Attendance analysis failed: could not parse model response', suggestions: [] };
    }

    return {
        confidence: Number(parsed.confidence ?? 0.6),
        summary: `${employeeName}: ${parsed.anomalyType} (${parsed.severity} severity). ${parsed.summary}`,
        suggestions: parsed.hasAnomalies ? [
            {
                field: 'anomalyType',
                suggestedValue: parsed.anomalyType,
                reasoning: parsed.reasoning,
                isSensitive: true,
            },
            {
                field: 'recommendation',
                suggestedValue: parsed.recommendation,
                reasoning: `Severity: ${parsed.severity}. Patterns: ${(parsed.patterns ?? []).join(', ')}`,
                isSensitive: true,
            },
        ] : [
            {
                field: 'status',
                suggestedValue: 'no_anomalies',
                reasoning: 'No attendance anomalies detected',
            },
        ],
        metadata: { hasAnomalies: parsed.hasAnomalies, severity: parsed.severity },
    };
}

registerAgent('attendance-anomaly', attendanceAnomaly);
export default attendanceAnomaly;

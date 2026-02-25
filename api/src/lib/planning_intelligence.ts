import prisma from './prisma';

export interface ConflictResult {
    hasConflict: boolean;
    conflictingSlots: any[];
}

export class PlanningIntelligence {
    /**
     * Detects if an employee has overlapping planning slots for a given time period.
     */
    static async checkConflicts(employeeId: number, startDate: Date, endDate: Date, currentSlotId?: number): Promise<ConflictResult> {
        const conflicts = await prisma.planningSlot.findMany({
            where: {
                employeeId,
                id: currentSlotId ? { not: currentSlotId } : undefined,
                OR: [
                    {
                        // New slot starts during an existing slot
                        startDate: { lte: startDate },
                        endDate: { gte: startDate }
                    },
                    {
                        // New slot ends during an existing slot
                        startDate: { lte: endDate },
                        endDate: { gte: endDate }
                    },
                    {
                        // New slot encapsulates an existing slot
                        startDate: { gte: startDate },
                        endDate: { lte: endDate }
                    }
                ]
            },
            include: {
                project: {
                    select: { name: true }
                }
            }
        });

        return {
            hasConflict: conflicts.length > 0,
            conflictingSlots: conflicts
        };
    }

    /**
     * Finds employees who have the required skills and are available during the specified period.
     */
    static async findRecommendedResources(requiredSkillIds: number[], startDate: Date, endDate: Date) {
        // 1. Find employees with all required skills
        const qualifiedEmployees = await prisma.hrEmployee.findMany({
            where: {
                active: true,
                skills: {
                    some: {
                        skillId: { in: requiredSkillIds }
                    }
                }
            },
            include: {
                skills: {
                    include: { skill: true }
                }
            }
        });

        // 2. Filter out those with conflicts
        const recommendations = [];
        for (const employee of qualifiedEmployees) {
            const conflict = await this.checkConflicts(employee.id, startDate, endDate);
            if (!conflict.hasConflict) {
                recommendations.push({
                    employee,
                    matchScore: this.calculateMatchScore(employee.skills, requiredSkillIds)
                });
            }
        }

        return recommendations.sort((a, b) => b.matchScore - a.matchScore);
    }

    /**
     * Calculates a simple match score based on skill presence and levels.
     */
    private static calculateMatchScore(employeeSkills: any[], requiredSkillIds: number[]): number {
        let score = 0;
        const skillLevels: Record<string, number> = { 'beginner': 1, 'intermediate': 2, 'expert': 3 };

        for (const es of employeeSkills) {
            if (requiredSkillIds.includes(es.skillId)) {
                score += skillLevels[es.level] || 2;
            }
        }

        return score;
    }

    /**
     * Calculates resource utilization percentage for projects.
     */
    static async getProjectUtilization(projectId: number) {
        const slots = await prisma.planningSlot.findMany({
            where: { projectId },
            select: { hours: true, startDate: true, endDate: true }
        });

        const totalHours = slots.reduce((sum, slot) => sum + slot.hours, 0);

        // Simplistic count of discrete resources
        const resourcesCount = await prisma.planningSlot.groupBy({
            by: ['employeeId'],
            where: { projectId, employeeId: { not: null } }
        });

        return {
            totalHours,
            resourceCount: resourcesCount.length,
            averageHoursPerResource: resourcesCount.length > 0 ? totalHours / resourcesCount.length : 0
        };
    }
}

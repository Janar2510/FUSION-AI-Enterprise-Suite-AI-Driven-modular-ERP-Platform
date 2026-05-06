from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, AIMessage
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timedelta

class ProjectAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.1,
            max_tokens=2000
        )
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

    async def analyze_project_performance(self, project_data: Dict) -> Dict:
        """Analyze project performance and provide insights"""
        try:
            prompt = f"""
            Analyze the following project data and provide performance insights:
            
            Project: {project_data.get('name', 'Unknown')}
            Status: {project_data.get('status', 'Unknown')}
            Budget: {project_data.get('budget', 0)}
            Actual Cost: {project_data.get('actual_cost', 0)}
            Progress: {project_data.get('progress_percentage', 0)}%
            Start Date: {project_data.get('start_date', 'Unknown')}
            End Date: {project_data.get('end_date', 'Unknown')}
            
            Please provide:
            1. Budget variance analysis
            2. Timeline analysis
            3. Risk assessment
            4. Recommendations for improvement
            5. Success factors
            
            Format your response as a JSON object with the following structure:
            {{
                "budget_analysis": {{
                    "variance_percentage": number,
                    "status": "over_budget" | "under_budget" | "on_budget",
                    "recommendation": "string"
                }},
                "timeline_analysis": {{
                    "status": "on_track" | "behind_schedule" | "ahead_of_schedule",
                    "days_behind": number,
                    "recommendation": "string"
                }},
                "risk_assessment": {{
                    "risk_level": "low" | "medium" | "high",
                    "risks": ["risk1", "risk2", "risk3"],
                    "mitigation_strategies": ["strategy1", "strategy2", "strategy3"]
                }},
                "recommendations": ["rec1", "rec2", "rec3"],
                "success_factors": ["factor1", "factor2", "factor3"]
            }}
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            
            try:
                analysis = json.loads(response.content)
                return {
                    "status": "success",
                    "data": analysis
                }
            except json.JSONDecodeError:
                return {
                    "status": "error",
                    "message": "Failed to parse AI response",
                    "raw_response": response.content
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error analyzing project performance: {str(e)}"
            }

    async def predict_project_timeline(self, project_data: Dict, task_data: List[Dict]) -> Dict:
        """Predict project timeline based on current progress and tasks"""
        try:
            prompt = f"""
            Predict the project timeline based on the following data:
            
            Project: {project_data.get('name', 'Unknown')}
            Current Progress: {project_data.get('progress_percentage', 0)}%
            Start Date: {project_data.get('start_date', 'Unknown')}
            Planned End Date: {project_data.get('end_date', 'Unknown')}
            
            Tasks ({len(task_data)} total):
            {json.dumps(task_data[:10], indent=2)}  # Show first 10 tasks
            
            Please provide:
            1. Predicted completion date
            2. Confidence level
            3. Factors affecting timeline
            4. Recommendations to stay on track
            
            Format your response as a JSON object:
            {{
                "predicted_completion_date": "YYYY-MM-DD",
                "confidence_level": "high" | "medium" | "low",
                "days_variance": number,
                "timeline_factors": ["factor1", "factor2", "factor3"],
                "recommendations": ["rec1", "rec2", "rec3"],
                "critical_path_items": ["item1", "item2", "item3"]
            }}
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            
            try:
                prediction = json.loads(response.content)
                return {
                    "status": "success",
                    "data": prediction
                }
            except json.JSONDecodeError:
                return {
                    "status": "error",
                    "message": "Failed to parse AI response",
                    "raw_response": response.content
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error predicting project timeline: {str(e)}"
            }

    async def optimize_resource_allocation(self, project_data: Dict, resource_data: List[Dict]) -> Dict:
        """Optimize resource allocation for the project"""
        try:
            prompt = f"""
            Optimize resource allocation for the following project:
            
            Project: {project_data.get('name', 'Unknown')}
            Budget: {project_data.get('budget', 0)}
            Current Cost: {project_data.get('actual_cost', 0)}
            Progress: {project_data.get('progress_percentage', 0)}%
            
            Resources:
            {json.dumps(resource_data, indent=2)}
            
            Please provide:
            1. Resource utilization analysis
            2. Optimization recommendations
            3. Cost-saving opportunities
            4. Resource reallocation suggestions
            
            Format your response as a JSON object:
            {{
                "utilization_analysis": {{
                    "over_allocated": ["resource1", "resource2"],
                    "under_allocated": ["resource3", "resource4"],
                    "optimal_resources": ["resource5", "resource6"]
                }},
                "optimization_recommendations": [
                    {{
                        "resource": "string",
                        "action": "increase" | "decrease" | "reallocate",
                        "reason": "string",
                        "expected_impact": "string"
                    }}
                ],
                "cost_savings": {{
                    "potential_savings": number,
                    "strategies": ["strategy1", "strategy2", "strategy3"]
                }},
                "resource_reallocation": [
                    {{
                        "from_resource": "string",
                        "to_resource": "string",
                        "amount": number,
                        "reason": "string"
                    }}
                ]
            }}
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            
            try:
                optimization = json.loads(response.content)
                return {
                    "status": "success",
                    "data": optimization
                }
            except json.JSONDecodeError:
                return {
                    "status": "error",
                    "message": "Failed to parse AI response",
                    "raw_response": response.content
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error optimizing resource allocation: {str(e)}"
            }

    async def generate_project_report(self, project_data: Dict, task_data: List[Dict], time_data: List[Dict]) -> Dict:
        """Generate comprehensive project report"""
        try:
            prompt = f"""
            Generate a comprehensive project report based on the following data:
            
            Project Information:
            {json.dumps(project_data, indent=2)}
            
            Tasks ({len(task_data)} total):
            {json.dumps(task_data[:20], indent=2)}  # Show first 20 tasks
            
            Time Entries ({len(time_data)} total):
            {json.dumps(time_data[:10], indent=2)}  # Show first 10 time entries
            
            Please provide a comprehensive report including:
            1. Executive Summary
            2. Project Status Overview
            3. Budget Analysis
            4. Timeline Analysis
            5. Resource Utilization
            6. Risk Assessment
            7. Key Achievements
            8. Challenges and Issues
            9. Recommendations
            10. Next Steps
            
            Format your response as a JSON object:
            {{
                "executive_summary": "string",
                "project_status": {{
                    "overall_status": "string",
                    "progress_summary": "string",
                    "key_metrics": {{
                        "budget_utilization": number,
                        "timeline_adherence": number,
                        "resource_efficiency": number
                    }}
                }},
                "budget_analysis": {{
                    "summary": "string",
                    "variance": number,
                    "recommendations": ["rec1", "rec2"]
                }},
                "timeline_analysis": {{
                    "summary": "string",
                    "status": "string",
                    "recommendations": ["rec1", "rec2"]
                }},
                "resource_utilization": {{
                    "summary": "string",
                    "efficiency_score": number,
                    "recommendations": ["rec1", "rec2"]
                }},
                "risk_assessment": {{
                    "summary": "string",
                    "risk_level": "low" | "medium" | "high",
                    "key_risks": ["risk1", "risk2", "risk3"]
                }},
                "key_achievements": ["achievement1", "achievement2", "achievement3"],
                "challenges_issues": ["challenge1", "challenge2", "challenge3"],
                "recommendations": ["rec1", "rec2", "rec3"],
                "next_steps": ["step1", "step2", "step3"]
            }}
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            
            try:
                report = json.loads(response.content)
                return {
                    "status": "success",
                    "data": report
                }
            except json.JSONDecodeError:
                return {
                    "status": "error",
                    "message": "Failed to parse AI response",
                    "raw_response": response.content
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error generating project report: {str(e)}"
            }

    async def suggest_task_priorities(self, project_data: Dict, task_data: List[Dict]) -> Dict:
        """Suggest task priorities based on project goals and dependencies"""
        try:
            prompt = f"""
            Suggest task priorities for the following project:
            
            Project: {project_data.get('name', 'Unknown')}
            Status: {project_data.get('status', 'Unknown')}
            End Date: {project_data.get('end_date', 'Unknown')}
            
            Tasks:
            {json.dumps(task_data, indent=2)}
            
            Please analyze the tasks and suggest:
            1. Priority levels for each task
            2. Critical path identification
            3. Dependency optimization
            4. Resource allocation suggestions
            
            Format your response as a JSON object:
            {{
                "task_priorities": [
                    {{
                        "task_id": number,
                        "task_title": "string",
                        "suggested_priority": "low" | "medium" | "high" | "urgent",
                        "reason": "string",
                        "impact_on_project": "string"
                    }}
                ],
                "critical_path": ["task1", "task2", "task3"],
                "dependency_optimization": [
                    {{
                        "task": "string",
                        "optimization": "string",
                        "expected_benefit": "string"
                    }}
                ],
                "resource_suggestions": [
                    {{
                        "task": "string",
                        "resource_recommendation": "string",
                        "reason": "string"
                    }}
                ]
            }}
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            
            try:
                suggestions = json.loads(response.content)
                return {
                    "status": "success",
                    "data": suggestions
                }
            except json.JSONDecodeError:
                return {
                    "status": "error",
                    "message": "Failed to parse AI response",
                    "raw_response": response.content
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error suggesting task priorities: {str(e)}"
            }

    async def predict_project_risks(self, project_data: Dict, task_data: List[Dict]) -> Dict:
        """Predict potential project risks"""
        try:
            prompt = f"""
            Predict potential risks for the following project:
            
            Project: {project_data.get('name', 'Unknown')}
            Status: {project_data.get('status', 'Unknown')}
            Budget: {project_data.get('budget', 0)}
            Progress: {project_data.get('progress_percentage', 0)}%
            End Date: {project_data.get('end_date', 'Unknown')}
            
            Tasks:
            {json.dumps(task_data[:15], indent=2)}  # Show first 15 tasks
            
            Please identify:
            1. Potential risks
            2. Risk probability and impact
            3. Early warning signs
            4. Mitigation strategies
            
            Format your response as a JSON object:
            {{
                "identified_risks": [
                    {{
                        "risk": "string",
                        "category": "budget" | "timeline" | "resource" | "technical" | "scope",
                        "probability": "low" | "medium" | "high",
                        "impact": "low" | "medium" | "high",
                        "risk_score": number,
                        "description": "string"
                    }}
                ],
                "early_warning_signs": ["sign1", "sign2", "sign3"],
                "mitigation_strategies": [
                    {{
                        "risk": "string",
                        "strategy": "string",
                        "action_items": ["action1", "action2"],
                        "timeline": "string"
                    }}
                ],
                "overall_risk_level": "low" | "medium" | "high",
                "recommendations": ["rec1", "rec2", "rec3"]
            }}
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            
            try:
                risks = json.loads(response.content)
                return {
                    "status": "success",
                    "data": risks
                }
            except json.JSONDecodeError:
                return {
                    "status": "error",
                    "message": "Failed to parse AI response",
                    "raw_response": response.content
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error predicting project risks: {str(e)}"
            }




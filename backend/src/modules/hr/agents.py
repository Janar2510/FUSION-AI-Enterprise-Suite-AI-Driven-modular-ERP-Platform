from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, SystemMessage
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timedelta

class HRAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.3,
            max_tokens=1000
        )
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
    
    async def analyze_employee_performance(self, employee_data: Dict, performance_history: List[Dict]) -> Dict:
        """Analyze employee performance and provide insights"""
        try:
            system_prompt = """
            You are an AI HR analyst specializing in employee performance evaluation. 
            Analyze the provided employee data and performance history to provide insights on:
            1. Performance trends and patterns
            2. Strengths and areas for improvement
            3. Career development recommendations
            4. Risk factors for retention
            5. Training and development suggestions
            
            Provide actionable insights in a structured format.
            """
            
            employee_context = f"""
            Employee Information:
            - Name: {employee_data.get('first_name', '')} {employee_data.get('last_name', '')}
            - Position: {employee_data.get('position', '')}
            - Department: {employee_data.get('department', '')}
            - Hire Date: {employee_data.get('hire_date', '')}
            - Employment Type: {employee_data.get('employment_type', '')}
            - Status: {employee_data.get('status', '')}
            """
            
            performance_context = f"""
            Performance History:
            {json.dumps(performance_history, indent=2)}
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"{employee_context}\n\n{performance_context}")
            ]
            
            response = await self.llm.agenerate([messages])
            analysis = response.generations[0][0].text
            
            return {
                "analysis": analysis,
                "timestamp": datetime.utcnow().isoformat(),
                "employee_id": employee_data.get('id'),
                "analysis_type": "performance_evaluation"
            }
        except Exception as e:
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_type": "performance_evaluation"
            }
    
    async def predict_employee_turnover(self, employee_data: Dict, historical_data: List[Dict]) -> Dict:
        """Predict employee turnover risk"""
        try:
            system_prompt = """
            You are an AI HR analyst specializing in employee retention and turnover prediction.
            Analyze the provided employee data and historical patterns to assess turnover risk.
            
            Consider factors like:
            - Job satisfaction indicators
            - Performance trends
            - Career progression opportunities
            - Compensation competitiveness
            - Work-life balance factors
            - Manager relationships
            - Team dynamics
            
            Provide a risk assessment with:
            1. Risk level (Low, Medium, High)
            2. Key risk factors
            3. Retention recommendations
            4. Timeline for potential departure
            """
            
            employee_context = f"""
            Employee Profile:
            - Position: {employee_data.get('position', '')}
            - Department: {employee_data.get('department', '')}
            - Tenure: {employee_data.get('hire_date', '')}
            - Salary: {employee_data.get('salary', '')}
            - Status: {employee_data.get('status', '')}
            - Recent Performance: {employee_data.get('recent_performance', '')}
            """
            
            historical_context = f"""
            Historical Data:
            {json.dumps(historical_data, indent=2)}
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"{employee_context}\n\n{historical_context}")
            ]
            
            response = await self.llm.agenerate([messages])
            prediction = response.generations[0][0].text
            
            return {
                "prediction": prediction,
                "timestamp": datetime.utcnow().isoformat(),
                "employee_id": employee_data.get('id'),
                "analysis_type": "turnover_prediction"
            }
        except Exception as e:
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_type": "turnover_prediction"
            }
    
    async def optimize_recruitment_process(self, job_requirements: Dict, candidate_pool: List[Dict]) -> Dict:
        """Optimize recruitment process and candidate matching"""
        try:
            system_prompt = """
            You are an AI recruitment specialist. Analyze job requirements and candidate profiles
            to optimize the recruitment process.
            
            Provide insights on:
            1. Candidate-job fit analysis
            2. Interview process optimization
            3. Skills gap identification
            4. Diversity and inclusion considerations
            5. Salary benchmarking
            6. Candidate experience improvements
            """
            
            job_context = f"""
            Job Requirements:
            - Title: {job_requirements.get('job_title', '')}
            - Department: {job_requirements.get('department', '')}
            - Requirements: {job_requirements.get('requirements', '')}
            - Responsibilities: {job_requirements.get('responsibilities', '')}
            - Salary Range: {job_requirements.get('salary_min', '')} - {job_requirements.get('salary_max', '')}
            - Location: {job_requirements.get('location', '')}
            """
            
            candidates_context = f"""
            Candidate Pool:
            {json.dumps(candidate_pool, indent=2)}
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"{job_context}\n\n{candidates_context}")
            ]
            
            response = await self.llm.agenerate([messages])
            optimization = response.generations[0][0].text
            
            return {
                "optimization": optimization,
                "timestamp": datetime.utcnow().isoformat(),
                "job_id": job_requirements.get('id'),
                "analysis_type": "recruitment_optimization"
            }
        except Exception as e:
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_type": "recruitment_optimization"
            }
    
    async def generate_training_recommendations(self, employee_data: Dict, skill_gaps: List[str]) -> Dict:
        """Generate personalized training recommendations"""
        try:
            system_prompt = """
            You are an AI learning and development specialist. Analyze employee profiles and skill gaps
            to recommend personalized training programs.
            
            Consider:
            1. Current role requirements
            2. Career aspirations
            3. Skill gaps identified
            4. Learning preferences
            5. Available training resources
            6. Budget constraints
            7. Time availability
            
            Provide specific training recommendations with:
            - Training program names
            - Learning objectives
            - Duration and format
            - Expected outcomes
            - Priority levels
            """
            
            employee_context = f"""
            Employee Profile:
            - Name: {employee_data.get('first_name', '')} {employee_data.get('last_name', '')}
            - Position: {employee_data.get('position', '')}
            - Department: {employee_data.get('department', '')}
            - Experience Level: {employee_data.get('experience_level', '')}
            - Current Skills: {employee_data.get('current_skills', '')}
            - Career Goals: {employee_data.get('career_goals', '')}
            """
            
            skill_gaps_context = f"""
            Identified Skill Gaps:
            {', '.join(skill_gaps)}
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"{employee_context}\n\n{skill_gaps_context}")
            ]
            
            response = await self.llm.agenerate([messages])
            recommendations = response.generations[0][0].text
            
            return {
                "recommendations": recommendations,
                "timestamp": datetime.utcnow().isoformat(),
                "employee_id": employee_data.get('id'),
                "analysis_type": "training_recommendations"
            }
        except Exception as e:
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_type": "training_recommendations"
            }
    
    async def analyze_payroll_efficiency(self, payroll_data: List[Dict], budget_data: Dict) -> Dict:
        """Analyze payroll efficiency and cost optimization"""
        try:
            system_prompt = """
            You are an AI payroll and compensation analyst. Analyze payroll data and budget information
            to provide insights on compensation efficiency.
            
            Analyze:
            1. Payroll cost trends
            2. Compensation competitiveness
            3. Budget utilization
            4. Cost optimization opportunities
            5. Salary benchmarking
            6. Benefits optimization
            7. Compliance considerations
            """
            
            payroll_context = f"""
            Payroll Data:
            {json.dumps(payroll_data, indent=2)}
            """
            
            budget_context = f"""
            Budget Information:
            - Total Budget: {budget_data.get('total_budget', '')}
            - Allocated Amount: {budget_data.get('allocated_amount', '')}
            - Remaining Budget: {budget_data.get('remaining_budget', '')}
            - Budget Period: {budget_data.get('period', '')}
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"{payroll_context}\n\n{budget_context}")
            ]
            
            response = await self.llm.agenerate([messages])
            analysis = response.generations[0][0].text
            
            return {
                "analysis": analysis,
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_type": "payroll_efficiency"
            }
        except Exception as e:
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_type": "payroll_efficiency"
            }
    
    async def generate_hr_report(self, report_type: str, data: Dict) -> Dict:
        """Generate comprehensive HR reports"""
        try:
            system_prompt = f"""
            You are an AI HR reporting specialist. Generate a comprehensive {report_type} report
            based on the provided data.
            
            Include:
            1. Executive summary
            2. Key metrics and KPIs
            3. Trends and patterns
            4. Insights and recommendations
            5. Action items
            6. Risk assessments
            7. Future outlook
            
            Format the report professionally with clear sections and actionable insights.
            """
            
            data_context = f"""
            Report Data:
            {json.dumps(data, indent=2)}
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=data_context)
            ]
            
            response = await self.llm.agenerate([messages])
            report = response.generations[0][0].text
            
            return {
                "report": report,
                "report_type": report_type,
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_type": "hr_report"
            }
        except Exception as e:
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_type": "hr_report"
            }




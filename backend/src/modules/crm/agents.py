"""
CRM Module AI Agent
AI-powered insights and automation for CRM operations
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import asyncio

from ...agents.base import BaseAgent
from .models import Contact, Opportunity, Interaction, ContactType, LeadStatus, OpportunityStage


class CRMAgent(BaseAgent):
    """AI agent for CRM operations"""
    
    def __init__(self):
        # Initialize with None values for now - will be set during agent initialization
        super().__init__(
            llm=None,
            memory=None,
            redis=None,
            cache=None,
            name="CRM Agent"
        )
        self.capabilities = [
            "lead_scoring",
            "customer_analysis", 
            "opportunity_prediction",
            "interaction_analysis",
            "churn_prediction",
            "next_best_action",
            "sales_forecasting"
        ]
    
    async def analyze_contact(self, contact: Contact) -> Dict[str, Any]:
        """Analyze a contact and generate AI insights"""
        try:
            # Simulate AI analysis (in real implementation, this would call LLM)
            insights = {
                "lead_score": await self._calculate_lead_score(contact),
                "predicted_value": await self._predict_customer_value(contact),
                "churn_risk": await self._calculate_churn_risk(contact),
                "next_best_action": await self._recommend_next_action(contact),
                "personality_traits": await self._analyze_personality(contact),
                "communication_preferences": await self._analyze_communication_preferences(contact),
                "buying_signals": await self._detect_buying_signals(contact),
                "risk_factors": await self._identify_risk_factors(contact)
            }
            return insights
        except Exception as e:
            self.logger.error(f"Error analyzing contact {contact.id}: {str(e)}")
            return {"error": str(e)}
    
    async def analyze_opportunity(self, opportunity: Opportunity) -> Dict[str, Any]:
        """Analyze an opportunity and generate AI insights"""
        try:
            insights = {
                "win_probability": await self._calculate_win_probability(opportunity),
                "predicted_close_date": await self._predict_close_date(opportunity),
                "recommended_actions": await self._recommend_opportunity_actions(opportunity),
                "risk_assessment": await self._assess_opportunity_risks(opportunity),
                "competitor_analysis": await self._analyze_competition(opportunity),
                "pricing_recommendations": await self._recommend_pricing(opportunity),
                "timeline_optimization": await self._optimize_timeline(opportunity)
            }
            return insights
        except Exception as e:
            self.logger.error(f"Error analyzing opportunity {opportunity.id}: {str(e)}")
            return {"error": str(e)}
    
    async def analyze_interaction(self, interaction: Interaction) -> Dict[str, Any]:
        """Analyze an interaction and generate AI insights"""
        try:
            analysis = {
                "sentiment_score": await self._analyze_sentiment(interaction),
                "sentiment_label": await self._classify_sentiment(interaction),
                "key_topics": await self._extract_key_topics(interaction),
                "action_items": await self._extract_action_items(interaction),
                "urgency_level": await self._assess_urgency(interaction),
                "follow_up_recommendations": await self._recommend_follow_up(interaction),
                "escalation_needed": await self._check_escalation(interaction)
            }
            return analysis
        except Exception as e:
            self.logger.error(f"Error analyzing interaction {interaction.id}: {str(e)}")
            return {"error": str(e)}
    
    async def get_contact_insights(self, contact: Contact) -> Dict[str, Any]:
        """Get comprehensive insights for a contact"""
        try:
            # Get contact analysis
            contact_analysis = await self.analyze_contact(contact)
            
            # Get related opportunities analysis
            opportunities_insights = []
            for opportunity in contact.opportunities:
                opp_insights = await self.analyze_opportunity(opportunity)
                opportunities_insights.append({
                    "opportunity_id": opportunity.id,
                    "insights": opp_insights
                })
            
            # Get interaction patterns
            interaction_patterns = await self._analyze_interaction_patterns(contact)
            
            # Generate recommendations
            recommendations = await self._generate_contact_recommendations(contact)
            
            return {
                "contact_analysis": contact_analysis,
                "opportunities_insights": opportunities_insights,
                "interaction_patterns": interaction_patterns,
                "recommendations": recommendations,
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error getting contact insights {contact.id}: {str(e)}")
            return {"error": str(e)}
    
    async def get_opportunity_insights(self, opportunity: Opportunity) -> Dict[str, Any]:
        """Get comprehensive insights for an opportunity"""
        try:
            # Get opportunity analysis
            opportunity_analysis = await self.analyze_opportunity(opportunity)
            
            # Get contact context
            contact_insights = await self.analyze_contact(opportunity.contact)
            
            # Get interaction history analysis
            interaction_insights = []
            for interaction in opportunity.interactions:
                int_analysis = await self.analyze_interaction(interaction)
                interaction_insights.append({
                    "interaction_id": interaction.id,
                    "analysis": int_analysis
                })
            
            # Generate strategic recommendations
            strategic_recommendations = await self._generate_strategic_recommendations(opportunity)
            
            return {
                "opportunity_analysis": opportunity_analysis,
                "contact_insights": contact_insights,
                "interaction_insights": interaction_insights,
                "strategic_recommendations": strategic_recommendations,
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error getting opportunity insights {opportunity.id}: {str(e)}")
            return {"error": str(e)}
    
    async def score_lead(self, contact: Contact) -> Dict[str, Any]:
        """Calculate comprehensive lead score"""
        try:
            score = await self._calculate_lead_score(contact)
            insights = await self.analyze_contact(contact)
            
            return {
                "score": score,
                "max_score": 100,
                "score_breakdown": await self._get_score_breakdown(contact),
                "insights": insights,
                "recommendations": await self._get_scoring_recommendations(contact, score)
            }
        except Exception as e:
            self.logger.error(f"Error scoring lead {contact.id}: {str(e)}")
            return {"error": str(e)}
    
    async def analyze_contacts_batch(self, db, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze multiple contacts in batch"""
        try:
            # This would typically query the database for contacts
            # For now, return a mock analysis
            return {
                "total_analyzed": 0,
                "insights": {
                    "top_performing_sources": [],
                    "conversion_patterns": {},
                    "churn_risk_segments": [],
                    "recommendations": []
                },
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error in batch contact analysis: {str(e)}")
            return {"error": str(e)}
    
    async def analyze_opportunities_batch(self, db, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze multiple opportunities in batch"""
        try:
            return {
                "total_analyzed": 0,
                "insights": {
                    "pipeline_health": {},
                    "win_probability_trends": {},
                    "stage_analysis": {},
                    "recommendations": []
                },
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error in batch opportunity analysis: {str(e)}")
            return {"error": str(e)}
    
    async def analyze_interactions_batch(self, db, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze multiple interactions in batch"""
        try:
            return {
                "total_analyzed": 0,
                "insights": {
                    "sentiment_trends": {},
                    "common_topics": [],
                    "communication_patterns": {},
                    "recommendations": []
                },
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error in batch interaction analysis: {str(e)}")
            return {"error": str(e)}
    
    # Private helper methods for AI analysis
    
    async def _calculate_lead_score(self, contact: Contact) -> float:
        """Calculate lead score based on various factors"""
        score = 0.0
        
        # Company factors
        if contact.company:
            score += 10
            if contact.job_title and any(title in contact.job_title.lower() for title in ['manager', 'director', 'vp', 'ceo', 'cto']):
                score += 15
        
        # Contact information completeness
        if contact.email:
            score += 5
        if contact.phone or contact.mobile:
            score += 5
        if contact.linkedin_url:
            score += 10
        
        # Industry factors (simplified)
        if contact.industry:
            high_value_industries = ['technology', 'finance', 'healthcare', 'manufacturing']
            if any(industry in contact.industry.lower() for industry in high_value_industries):
                score += 15
        
        # Lead source factors
        if contact.lead_source:
            high_value_sources = ['website', 'referral', 'event']
            if any(source in contact.lead_source.lower() for source in high_value_sources):
                score += 10
        
        # Social media presence
        social_score = 0
        if contact.linkedin_url:
            social_score += 5
        if contact.twitter_handle:
            social_score += 3
        if contact.facebook_url:
            social_score += 2
        score += min(social_score, 10)  # Cap at 10
        
        return min(score, 100.0)  # Cap at 100
    
    async def _predict_customer_value(self, contact: Contact) -> float:
        """Predict customer lifetime value"""
        base_value = 1000.0
        
        # Adjust based on company size indicators
        if contact.company:
            if any(size in contact.company.lower() for size in ['corp', 'inc', 'llc', 'ltd']):
                base_value *= 1.5
        
        # Adjust based on job title
        if contact.job_title:
            if any(title in contact.job_title.lower() for title in ['ceo', 'president', 'founder']):
                base_value *= 2.0
            elif any(title in contact.job_title.lower() for title in ['vp', 'vice president', 'director']):
                base_value *= 1.5
            elif any(title in contact.job_title.lower() for title in ['manager', 'head']):
                base_value *= 1.2
        
        # Adjust based on industry
        if contact.industry:
            high_value_industries = ['technology', 'finance', 'consulting']
            if any(industry in contact.industry.lower() for industry in high_value_industries):
                base_value *= 1.3
        
        return round(base_value, 2)
    
    async def _calculate_churn_risk(self, contact: Contact) -> float:
        """Calculate churn risk (0-1 scale)"""
        risk = 0.0
        
        # Higher risk for new contacts without interactions
        if not contact.interactions:
            risk += 0.3
        
        # Lower risk for contacts with recent interactions
        if contact.interactions:
            recent_interactions = [i for i in contact.interactions 
                                 if i.interaction_date > datetime.utcnow() - timedelta(days=30)]
            if not recent_interactions:
                risk += 0.2
        
        # Higher risk for contacts without opportunities
        if not contact.opportunities:
            risk += 0.2
        
        return min(risk, 1.0)
    
    async def _recommend_next_action(self, contact: Contact) -> str:
        """Recommend next best action for a contact"""
        if not contact.interactions:
            return "Schedule initial discovery call"
        
        if contact.status == LeadStatus.NEW:
            return "Send welcome email and schedule qualification call"
        elif contact.status == LeadStatus.CONTACTED:
            return "Follow up with value proposition and case study"
        elif contact.status == LeadStatus.QUALIFIED:
            return "Schedule product demonstration"
        elif contact.status == LeadStatus.PROPOSAL:
            return "Follow up on proposal and address objections"
        elif contact.status == LeadStatus.NEGOTIATION:
            return "Schedule negotiation meeting and prepare closing strategy"
        else:
            return "Review contact status and plan next engagement"
    
    async def _analyze_personality(self, contact: Contact) -> Dict[str, Any]:
        """Analyze contact personality traits (simplified)"""
        return {
            "communication_style": "professional",
            "decision_making": "analytical",
            "risk_tolerance": "moderate",
            "preferred_channels": ["email", "phone"]
        }
    
    async def _analyze_communication_preferences(self, contact: Contact) -> Dict[str, Any]:
        """Analyze communication preferences"""
        preferences = {
            "preferred_time": "business_hours",
            "preferred_channel": "email",
            "response_frequency": "within_24h",
            "formality_level": "professional"
        }
        
        # Adjust based on interaction history
        if contact.interactions:
            email_count = sum(1 for i in contact.interactions if i.interaction_type == "email")
            phone_count = sum(1 for i in contact.interactions if i.interaction_type == "phone")
            
            if email_count > phone_count:
                preferences["preferred_channel"] = "email"
            elif phone_count > email_count:
                preferences["preferred_channel"] = "phone"
        
        return preferences
    
    async def _detect_buying_signals(self, contact: Contact) -> List[str]:
        """Detect buying signals from contact data"""
        signals = []
        
        if contact.interactions:
            recent_interactions = [i for i in contact.interactions 
                                 if i.interaction_date > datetime.utcnow() - timedelta(days=30)]
            
            for interaction in recent_interactions:
                if interaction.subject and any(word in interaction.subject.lower() 
                                            for word in ['budget', 'pricing', 'proposal', 'contract']):
                    signals.append("Budget discussions")
                
                if interaction.description and any(word in interaction.description.lower() 
                                                for word in ['urgent', 'asap', 'immediately', 'deadline']):
                    signals.append("Urgency indicators")
        
        if contact.opportunities:
            active_opportunities = [o for o in contact.opportunities if o.is_active]
            if len(active_opportunities) > 1:
                signals.append("Multiple active opportunities")
        
        return signals
    
    async def _identify_risk_factors(self, contact: Contact) -> List[str]:
        """Identify risk factors for the contact"""
        risks = []
        
        if not contact.interactions:
            risks.append("No interaction history")
        
        if contact.interactions:
            last_interaction = max(contact.interactions, key=lambda x: x.interaction_date)
            days_since_last = (datetime.utcnow() - last_interaction.interaction_date).days
            if days_since_last > 30:
                risks.append("No recent interactions")
        
        if not contact.opportunities:
            risks.append("No active opportunities")
        
        if contact.lead_source and contact.lead_source.lower() == 'cold_call':
            risks.append("Cold lead source")
        
        return risks
    
    async def _calculate_win_probability(self, opportunity: Opportunity) -> float:
        """Calculate win probability for an opportunity"""
        base_probability = 0.0
        
        # Stage-based probability
        stage_probabilities = {
            OpportunityStage.PROSPECTING: 0.1,
            OpportunityStage.QUALIFICATION: 0.3,
            OpportunityStage.PROPOSAL: 0.6,
            OpportunityStage.NEGOTIATION: 0.8,
            OpportunityStage.CLOSED_WON: 1.0,
            OpportunityStage.CLOSED_LOST: 0.0
        }
        
        base_probability = stage_probabilities.get(opportunity.stage, 0.1)
        
        # Adjust based on estimated value
        if opportunity.estimated_value:
            if opportunity.estimated_value > 50000:
                base_probability *= 0.9  # Slightly lower for high-value deals
            elif opportunity.estimated_value < 5000:
                base_probability *= 1.1  # Slightly higher for low-value deals
        
        # Adjust based on contact lead score
        if opportunity.contact and opportunity.contact.lead_score:
            lead_score_factor = opportunity.contact.lead_score / 100
            base_probability *= (0.5 + lead_score_factor * 0.5)
        
        return min(max(base_probability, 0.0), 1.0)
    
    async def _predict_close_date(self, opportunity: Opportunity) -> datetime:
        """Predict when the opportunity will close"""
        if opportunity.expected_close_date:
            return opportunity.expected_close_date
        
        # Default prediction based on stage
        days_to_close = {
            OpportunityStage.PROSPECTING: 90,
            OpportunityStage.QUALIFICATION: 60,
            OpportunityStage.PROPOSAL: 30,
            OpportunityStage.NEGOTIATION: 15
        }
        
        days = days_to_close.get(opportunity.stage, 45)
        return datetime.utcnow() + timedelta(days=days)
    
    async def _recommend_opportunity_actions(self, opportunity: Opportunity) -> List[str]:
        """Recommend actions for an opportunity"""
        actions = []
        
        if opportunity.stage == OpportunityStage.PROSPECTING:
            actions.extend([
                "Schedule discovery call with key stakeholders",
                "Research company background and pain points",
                "Prepare value proposition presentation"
            ])
        elif opportunity.stage == OpportunityStage.QUALIFICATION:
            actions.extend([
                "Conduct needs assessment questionnaire",
                "Identify decision makers and influencers",
                "Determine budget and timeline"
            ])
        elif opportunity.stage == OpportunityStage.PROPOSAL:
            actions.extend([
                "Prepare detailed proposal with pricing",
                "Schedule proposal presentation",
                "Address potential objections"
            ])
        elif opportunity.stage == OpportunityStage.NEGOTIATION:
            actions.extend([
                "Prepare negotiation strategy",
                "Identify concessions and trade-offs",
                "Schedule closing meeting"
            ])
        
        return actions
    
    async def _assess_opportunity_risks(self, opportunity: Opportunity) -> List[str]:
        """Assess risks for an opportunity"""
        risks = []
        
        if opportunity.estimated_value and opportunity.estimated_value > 100000:
            risks.append("High-value deal - increased scrutiny")
        
        if opportunity.expected_close_date:
            days_to_close = (opportunity.expected_close_date - datetime.utcnow()).days
            if days_to_close < 7:
                risks.append("Tight timeline - may need acceleration")
            elif days_to_close > 120:
                risks.append("Long sales cycle - risk of losing momentum")
        
        if not opportunity.interactions:
            risks.append("No interaction history")
        
        return risks
    
    async def _analyze_competition(self, opportunity: Opportunity) -> Dict[str, Any]:
        """Analyze competitive landscape for opportunity"""
        return {
            "competitors_mentioned": [],
            "competitive_advantages": [],
            "differentiation_strategy": "Focus on unique value proposition"
        }
    
    async def _recommend_pricing(self, opportunity: Opportunity) -> Dict[str, Any]:
        """Recommend pricing strategy for opportunity"""
        return {
            "suggested_price": opportunity.estimated_value,
            "pricing_strategy": "value_based",
            "discount_recommendations": []
        }
    
    async def _optimize_timeline(self, opportunity: Opportunity) -> Dict[str, Any]:
        """Optimize timeline for opportunity"""
        return {
            "current_timeline": "standard",
            "optimization_suggestions": [],
            "critical_milestones": []
        }
    
    async def _analyze_sentiment(self, interaction: Interaction) -> float:
        """Analyze sentiment of interaction (-1 to 1)"""
        # Simplified sentiment analysis
        positive_words = ['good', 'great', 'excellent', 'happy', 'satisfied', 'pleased']
        negative_words = ['bad', 'terrible', 'awful', 'unhappy', 'disappointed', 'frustrated']
        
        text = f"{interaction.subject} {interaction.description or ''}".lower()
        
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        
        if positive_count + negative_count == 0:
            return 0.0
        
        return (positive_count - negative_count) / (positive_count + negative_count)
    
    async def _classify_sentiment(self, interaction: Interaction) -> str:
        """Classify sentiment as positive, negative, or neutral"""
        score = await self._analyze_sentiment(interaction)
        
        if score > 0.2:
            return "positive"
        elif score < -0.2:
            return "negative"
        else:
            return "neutral"
    
    async def _extract_key_topics(self, interaction: Interaction) -> List[str]:
        """Extract key topics from interaction"""
        # Simplified topic extraction
        topics = []
        text = f"{interaction.subject} {interaction.description or ''}".lower()
        
        topic_keywords = {
            'pricing': ['price', 'cost', 'budget', 'expensive', 'cheap'],
            'features': ['feature', 'functionality', 'capability', 'option'],
            'timeline': ['timeline', 'schedule', 'deadline', 'urgent', 'asap'],
            'support': ['support', 'help', 'issue', 'problem', 'bug'],
            'contract': ['contract', 'agreement', 'terms', 'legal']
        }
        
        for topic, keywords in topic_keywords.items():
            if any(keyword in text for keyword in keywords):
                topics.append(topic)
        
        return topics
    
    async def _extract_action_items(self, interaction: Interaction) -> List[str]:
        """Extract action items from interaction"""
        # Simplified action item extraction
        action_items = []
        text = f"{interaction.subject} {interaction.description or ''}".lower()
        
        action_indicators = ['follow up', 'schedule', 'send', 'prepare', 'review', 'call', 'meeting']
        
        for indicator in action_indicators:
            if indicator in text:
                action_items.append(f"Action required: {indicator}")
        
        return action_items
    
    async def _assess_urgency(self, interaction: Interaction) -> str:
        """Assess urgency level of interaction"""
        text = f"{interaction.subject} {interaction.description or ''}".lower()
        
        urgent_words = ['urgent', 'asap', 'immediately', 'critical', 'emergency']
        if any(word in text for word in urgent_words):
            return "high"
        
        if interaction.follow_up_date and interaction.follow_up_date <= datetime.utcnow() + timedelta(days=1):
            return "medium"
        
        return "low"
    
    async def _recommend_follow_up(self, interaction: Interaction) -> List[str]:
        """Recommend follow-up actions"""
        recommendations = []
        
        if interaction.interaction_type == "email":
            recommendations.append("Schedule phone call to discuss further")
        elif interaction.interaction_type == "phone":
            recommendations.append("Send follow-up email with summary")
        elif interaction.interaction_type == "meeting":
            recommendations.append("Send meeting notes and next steps")
        
        return recommendations
    
    async def _check_escalation(self, interaction: Interaction) -> bool:
        """Check if interaction needs escalation"""
        # Check for negative sentiment
        sentiment = await self._analyze_sentiment(interaction)
        if sentiment < -0.5:
            return True
        
        # Check for urgent keywords
        text = f"{interaction.subject} {interaction.description or ''}".lower()
        urgent_words = ['escalate', 'manager', 'supervisor', 'complaint']
        if any(word in text for word in urgent_words):
            return True
        
        return False
    
    async def _analyze_interaction_patterns(self, contact: Contact) -> Dict[str, Any]:
        """Analyze interaction patterns for a contact"""
        if not contact.interactions:
            return {"pattern": "no_interactions", "insights": []}
        
        # Analyze frequency
        interaction_dates = [i.interaction_date for i in contact.interactions]
        interaction_dates.sort()
        
        if len(interaction_dates) > 1:
            intervals = [(interaction_dates[i+1] - interaction_dates[i]).days 
                        for i in range(len(interaction_dates)-1)]
            avg_interval = sum(intervals) / len(intervals)
        else:
            avg_interval = 0
        
        # Analyze types
        type_counts = {}
        for interaction in contact.interactions:
            type_counts[interaction.interaction_type] = type_counts.get(interaction.interaction_type, 0) + 1
        
        return {
            "total_interactions": len(contact.interactions),
            "average_interval_days": round(avg_interval, 1),
            "interaction_types": type_counts,
            "last_interaction": max(interaction_dates).isoformat() if interaction_dates else None
        }
    
    async def _generate_contact_recommendations(self, contact: Contact) -> List[Dict[str, Any]]:
        """Generate recommendations for a contact"""
        recommendations = []
        
        if not contact.interactions:
            recommendations.append({
                "type": "engagement",
                "priority": "high",
                "title": "Initial Contact Needed",
                "description": "This contact has no interaction history. Schedule an initial discovery call."
            })
        
        if contact.lead_score < 30:
            recommendations.append({
                "type": "qualification",
                "priority": "medium",
                "title": "Improve Lead Quality",
                "description": "Gather more information to improve lead scoring and qualification."
            })
        
        if contact.churn_risk and contact.churn_risk > 0.7:
            recommendations.append({
                "type": "retention",
                "priority": "high",
                "title": "High Churn Risk",
                "description": "This contact shows high churn risk. Implement retention strategies."
            })
        
        return recommendations
    
    async def _generate_strategic_recommendations(self, opportunity: Opportunity) -> List[Dict[str, Any]]:
        """Generate strategic recommendations for an opportunity"""
        recommendations = []
        
        if opportunity.win_probability and opportunity.win_probability < 0.3:
            recommendations.append({
                "type": "strategy",
                "priority": "high",
                "title": "Low Win Probability",
                "description": "Consider focusing efforts on higher-probability opportunities or improving this opportunity's positioning."
            })
        
        if opportunity.estimated_value and opportunity.estimated_value > 50000:
            recommendations.append({
                "type": "execution",
                "priority": "high",
                "title": "High-Value Deal",
                "description": "This is a high-value opportunity. Ensure executive involvement and thorough preparation."
            })
        
        return recommendations
    
    async def _get_score_breakdown(self, contact: Contact) -> Dict[str, Any]:
        """Get detailed breakdown of lead score calculation"""
        breakdown = {
            "company_info": 0,
            "contact_completeness": 0,
            "industry_factors": 0,
            "lead_source": 0,
            "social_presence": 0
        }
        
        # Company factors
        if contact.company:
            breakdown["company_info"] += 10
            if contact.job_title and any(title in contact.job_title.lower() for title in ['manager', 'director', 'vp']):
                breakdown["company_info"] += 15
        
        # Contact completeness
        if contact.email:
            breakdown["contact_completeness"] += 5
        if contact.phone or contact.mobile:
            breakdown["contact_completeness"] += 5
        
        # Industry factors
        if contact.industry:
            high_value_industries = ['technology', 'finance', 'healthcare']
            if any(industry in contact.industry.lower() for industry in high_value_industries):
                breakdown["industry_factors"] += 15
        
        # Lead source
        if contact.lead_source:
            high_value_sources = ['website', 'referral', 'event']
            if any(source in contact.lead_source.lower() for source in high_value_sources):
                breakdown["lead_source"] += 10
        
        # Social presence
        social_score = 0
        if contact.linkedin_url:
            social_score += 5
        if contact.twitter_handle:
            social_score += 3
        if contact.facebook_url:
            social_score += 2
        breakdown["social_presence"] = min(social_score, 10)
        
        return breakdown
    
    async def _get_scoring_recommendations(self, contact: Contact, score: float) -> List[str]:
        """Get recommendations to improve lead score"""
        recommendations = []
        
        if not contact.linkedin_url:
            recommendations.append("Add LinkedIn profile to increase social presence score")
        
        if not contact.phone and not contact.mobile:
            recommendations.append("Add phone number to improve contact completeness")
        
        if not contact.company:
            recommendations.append("Add company information to increase company score")
        
        if not contact.job_title:
            recommendations.append("Add job title to improve company information score")
        
        if score < 50:
            recommendations.append("Consider focusing on higher-scoring leads or improving lead quality")
        
        return recommendations
    
    # Required abstract methods from BaseAgent
    async def initialize(self) -> None:
        """Initialize the agent with tools and capabilities."""
        # In a real implementation, this would set up LLM, memory, etc.
        pass
    
    async def process_request(
        self, 
        request: str, 
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a user request."""
        # In a real implementation, this would process the request using AI
        return {
            "response": f"CRM Agent processed request: {request}",
            "context": context or {},
            "user_id": user_id
        }
    
    def get_capabilities(self) -> List[str]:
        """Get list of agent capabilities."""
        return self.capabilities

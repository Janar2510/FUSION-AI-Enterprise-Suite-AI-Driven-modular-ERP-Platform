#!/usr/bin/env python3
"""
Cursor Agent Progress Tracker
Tracks implementation progress and generates reports
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class TaskStatus(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    TESTING = "testing"

@dataclass
class ModuleTask:
    name: str
    status: TaskStatus
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    blocker: Optional[str] = None
    test_coverage: float = 0.0
    
@dataclass
class Module:
    name: str
    tasks: Dict[str, ModuleTask]
    overall_progress: float = 0.0
    
    def calculate_progress(self):
        if not self.tasks:
            return 0.0
        completed = sum(1 for t in self.tasks.values() if t.status == TaskStatus.COMPLETED)
        return (completed / len(self.tasks)) * 100

class ProgressTracker:
    def __init__(self, state_file: str = ".qoder/state.json"):
        self.state_file = Path(state_file)
        self.state = self._load_state()
        
    def _load_state(self) -> Dict:
        """Load current state from file"""
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                return json.load(f)
        return self._create_initial_state()
    
    def _create_initial_state(self) -> Dict:
        """Create initial state structure"""
        modules = [
            "dashboard", "documents", "sign", "discuss", "crm", "sales",
            "inventory", "purchase", "accounting", "subscriptions", "pos",
            "rental", "project", "timesheets", "planning", "field_service",
            "helpdesk", "knowledge", "website", "email_marketing",
            "social_marketing", "hr", "manufacturing", "studio"
        ]
        
        state = {
            "project": "fusionai-enterprise-suite",
            "version": "1.0.0",
            "current_phase": "phase_1",
            "current_module": "dashboard",
            "completed_modules": [],
            "modules": {}
        }
        
        for module in modules:
            state["modules"][module] = {
                "status": "not_started",
                "tasks": {
                    "models": {"status": "not_started", "coverage": 0},
                    "api": {"status": "not_started", "coverage": 0},
                    "services": {"status": "not_started", "coverage": 0},
                    "ai_agent": {"status": "not_started", "coverage": 0},
                    "frontend": {"status": "not_started", "coverage": 0},
                    "tests": {"status": "not_started", "coverage": 0},
                    "documentation": {"status": "not_started", "coverage": 0}
                },
                "overall_progress": 0
            }
        
        return state
    
    def save_state(self):
        """Save current state to file"""
        self.state["last_updated"] = datetime.utcnow().isoformat()
        self.state_file.parent.mkdir(exist_ok=True)
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)
    
    def update_task(self, module: str, task: str, status: str, coverage: float = None):
        """Update task status"""
        if module in self.state["modules"] and task in self.state["modules"][module]["tasks"]:
            self.state["modules"][module]["tasks"][task]["status"] = status
            if coverage is not None:
                self.state["modules"][module]["tasks"][task]["coverage"] = coverage
            
            # Update timestamps
            if status == "in_progress":
                self.state["modules"][module]["tasks"][task]["started_at"] = datetime.utcnow().isoformat()
            elif status == "completed":
                self.state["modules"][module]["tasks"][task]["completed_at"] = datetime.utcnow().isoformat()
            
            # Recalculate module progress
            self._update_module_progress(module)
            self.save_state()
    
    def _update_module_progress(self, module: str):
        """Calculate and update module progress"""
        tasks = self.state["modules"][module]["tasks"]
        completed = sum(1 for t in tasks.values() if t["status"] == "completed")
        total = len(tasks)
        self.state["modules"][module]["overall_progress"] = (completed / total) * 100
    
    def get_current_task(self) -> Optional[Dict]:
        """Get the current task to work on"""
        for module, module_data in self.state["modules"].items():
            for task, task_data in module_data["tasks"].items():
                if task_data["status"] == "in_progress":
                    return {
                        "module": module,
                        "task": task,
                        "data": task_data
                    }
                elif task_data["status"] == "not_started":
                    return {
                        "module": module,
                        "task": task,
                        "data": task_data
                    }
        return None
    
    def generate_report(self) -> str:
        """Generate progress report"""
        report = ["# FusionAI Enterprise Suite - Progress Report"]
        report.append(f"\n## Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        
        # Overall progress
        total_modules = len(self.state["modules"])
        completed_modules = sum(1 for m in self.state["modules"].values() if m["overall_progress"] == 100)
        overall_progress = (completed_modules / total_modules) * 100
        
        report.append(f"### Overall Progress: {overall_progress:.1f}%")
        report.append(f"- Completed Modules: {completed_modules}/{total_modules}")
        report.append("")
        
        # Phase 1 modules (priority)
        phase1_modules = ["dashboard", "documents", "sign", "discuss"]
        report.append("### Phase 1 Modules (Priority)")
        
        for module in phase1_modules:
            if module in self.state["modules"]:
                m_data = self.state["modules"][module]
                status_icon = "✅" if m_data["overall_progress"] == 100 else "🔄" if m_data["overall_progress"] > 0 else "⏳"
                report.append(f"\n#### {status_icon} {module.title()} - {m_data['overall_progress']:.0f}%")
                
                for task, task_data in m_data["tasks"].items():
                    task_icon = "✅" if task_data["status"] == "completed" else "🔄" if task_data["status"] == "in_progress" else "⏳"
                    coverage = f" (Coverage: {task_data.get('coverage', 0):.0f}%)" if task_data.get('coverage', 0) > 0 else ""
                    report.append(f"  - {task_icon} {task.title()}: {task_data['status']}{coverage}")
        
        # Current task
        current = self.get_current_task()
        if current:
            report.append(f"\n### 🎯 Current Task")
            report.append(f"**Module**: {current['module'].title()}")
            report.append(f"**Task**: {current['task'].title()}")
            report.append(f"**Status**: {current['data']['status']}")
        
        # Test coverage summary
        report.append("\n### Test Coverage")
        avg_coverage = sum(
            task.get('coverage', 0) 
            for m in self.state["modules"].values() 
            for task in m["tasks"].values() 
            if task["status"] == "completed"
        )
        completed_tasks = sum(
            1 for m in self.state["modules"].values() 
            for task in m["tasks"].values() 
            if task["status"] == "completed"
        )
        if completed_tasks > 0:
            avg_coverage = avg_coverage / completed_tasks
            report.append(f"Average Coverage: {avg_coverage:.1f}%")
        
        return "\n".join(report)
    
    def get_next_action(self) -> str:
        """Get the next recommended action"""
        current = self.get_current_task()
        
        if not current:
            return "All tasks completed! Ready for deployment."
        
        module = current['module']
        task = current['task']
        
        commands = {
            "models": f"@workspace Create models for {module} module in backend/src/modules/{module}/models.py",
            "api": f"@workspace Create API endpoints for {module} module in backend/src/modules/{module}/api.py",
            "services": f"@workspace Implement business logic for {module} module in backend/src/modules/{module}/services.py",
            "ai_agent": f"@workspace Create AI agent for {module} module in backend/src/modules/{module}/agents.py",
            "frontend": f"@workspace Build React components for {module} module in frontend/src/modules/{module}/",
            "tests": f"@workspace Write tests for {module} module - both backend and frontend",
            "documentation": f"@workspace Document {module} module in docs/modules/{module}.md"
        }
        
        return commands.get(task, f"Work on {task} for {module} module")

# CLI Usage
if __name__ == "__main__":
    import sys
    
    tracker = ProgressTracker()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "status":
            print(tracker.generate_report())
        
        elif command == "next":
            print(tracker.get_next_action())
        
        elif command == "update" and len(sys.argv) >= 5:
            module = sys.argv[2]
            task = sys.argv[3]
            status = sys.argv[4]
            coverage = float(sys.argv[5]) if len(sys.argv) > 5 else None
            tracker.update_task(module, task, status, coverage)
            print(f"Updated {module}/{task} to {status}")
        
        else:
            print("Usage:")
            print("  python progress_tracker.py status - Show current status")
            print("  python progress_tracker.py next - Get next action")
            print("  python progress_tracker.py update <module> <task> <status> [coverage]")
    
    else:
        # Interactive mode
        while True:
            print("\n" + "="*50)
            print(tracker.generate_report())
            print("\n" + "="*50)
            print("\n🎯 Next Action:")
            print(tracker.get_next_action())
            print("\nPress Enter to continue, 'u' to update task, or 'q' to quit:")
            
            choice = input().strip().lower()
            if choice == 'q':
                break
            elif choice == 'u':
                module = input("Module name: ")
                task = input("Task name: ")
                status = input("Status (not_started/in_progress/completed/blocked): ")
                coverage = input("Coverage (0-100, or press Enter to skip): ")
                coverage = float(coverage) if coverage else None
                tracker.update_task(module, task, status, coverage)
                print("✅ Task updated!")

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class JiraIssue(db.Model):
    __tablename__ = 'jira_issues'
    
    id = db.Column(db.Integer, primary_key=True)
    jira_key = db.Column(db.String(50), unique=True, nullable=False)  # Ex: PROJ-123
    jira_id = db.Column(db.String(20), nullable=False)  # ID interno do Jira
    summary = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    
    # Projeto
    project_key = db.Column(db.String(20), nullable=False)
    project_name = db.Column(db.String(200), nullable=False)
    
    # Status e tipo
    status = db.Column(db.String(50), nullable=False)
    issue_type = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.String(20))
    
    # Pessoas
    assignee_email = db.Column(db.String(200))
    assignee_name = db.Column(db.String(200))
    reporter_email = db.Column(db.String(200))
    reporter_name = db.Column(db.String(200))
    creator_email = db.Column(db.String(200))
    creator_name = db.Column(db.String(200))
    
    # Versões/Releases
    fix_versions = db.Column(db.Text)  # JSON string com array de versões
    affected_versions = db.Column(db.Text)  # JSON string com array de versões
    
    # Datas
    created_date = db.Column(db.DateTime)
    updated_date = db.Column(db.DateTime)
    resolved_date = db.Column(db.DateTime)
    
    # Metadados
    last_sync = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<JiraIssue {self.jira_key}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'jira_key': self.jira_key,
            'jira_id': self.jira_id,
            'summary': self.summary,
            'description': self.description,
            'project_key': self.project_key,
            'project_name': self.project_name,
            'status': self.status,
            'issue_type': self.issue_type,
            'priority': self.priority,
            'assignee_email': self.assignee_email,
            'assignee_name': self.assignee_name,
            'reporter_email': self.reporter_email,
            'reporter_name': self.reporter_name,
            'creator_email': self.creator_email,
            'creator_name': self.creator_name,
            'fix_versions': self.fix_versions,
            'affected_versions': self.affected_versions,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None,
            'resolved_date': self.resolved_date.isoformat() if self.resolved_date else None,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None
        }

class JiraProject(db.Model):
    __tablename__ = 'jira_projects'
    
    id = db.Column(db.Integer, primary_key=True)
    jira_id = db.Column(db.String(20), unique=True, nullable=False)
    key = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    project_type = db.Column(db.String(50))
    lead_email = db.Column(db.String(200))
    lead_name = db.Column(db.String(200))
    last_sync = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<JiraProject {self.key}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'jira_id': self.jira_id,
            'key': self.key,
            'name': self.name,
            'description': self.description,
            'project_type': self.project_type,
            'lead_email': self.lead_email,
            'lead_name': self.lead_name,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None
        }

class JiraVersion(db.Model):
    __tablename__ = 'jira_versions'
    
    id = db.Column(db.Integer, primary_key=True)
    jira_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    project_key = db.Column(db.String(20), nullable=False)
    released = db.Column(db.Boolean, default=False)
    archived = db.Column(db.Boolean, default=False)
    release_date = db.Column(db.Date)
    start_date = db.Column(db.Date)
    last_sync = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<JiraVersion {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'jira_id': self.jira_id,
            'name': self.name,
            'description': self.description,
            'project_key': self.project_key,
            'released': self.released,
            'archived': self.archived,
            'release_date': self.release_date.isoformat() if self.release_date else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None
        }


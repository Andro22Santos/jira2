import requests
import base64
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from src.models.jira import JiraIssue, db

class JiraService:
    def __init__(self, base_url: str, email: str, api_token: str):
        self.base_url = base_url.rstrip('/')
        self.email = email
        self.api_token = api_token
        self.auth_header = self._create_auth_header()
        
    def _create_auth_header(self) -> str:
        """Cria o header de autenticação Basic Auth"""
        credentials = f"{self.email}:{self.api_token}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded_credentials}"
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Faz uma requisição para a API do Jira"""
        url = f"{self.base_url}/rest/api/3/{endpoint}"
        headers = {
            'Authorization': self.auth_header,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Erro na requisição para {url}: {e}")
            raise e
    
    def get_projects(self) -> List[Dict]:
        """Busca todos os projetos do Jira"""
        try:
            data = self._make_request('project')
            projects = []
            
            for project in data:
                projects.append({
                    'id': project.get('id'),
                    'jira_id': project.get('id'),
                    'key': project.get('key'),
                    'name': project.get('name'),
                    'description': project.get('description', ''),
                    'project_type': project.get('projectTypeKey', 'software'),
                    'lead_email': project.get('lead', {}).get('emailAddress', ''),
                    'lead_name': project.get('lead', {}).get('displayName', '')
                })
            
            return projects
        except Exception as e:
            print(f"Erro ao buscar projetos: {e}")
            return []
    
    def get_project_versions(self, project_key: str) -> List[Dict]:
        """Busca versões de um projeto"""
        try:
            data = self._make_request(f'project/{project_key}/versions')
            versions = []
            
            for version in data:
                versions.append({
                    'id': version.get('id'),
                    'jira_id': version.get('id'),
                    'name': version.get('name'),
                    'released': version.get('released', False),
                    'project_key': project_key
                })
            
            return versions
        except Exception as e:
            print(f"Erro ao buscar versões do projeto {project_key}: {e}")
            return []
    
    def get_issues(self, filters: Dict, page: int = 1, per_page: int = 50, fetch_all: bool = False) -> Dict:
        try:
            jql_parts = []
            if 'project' in filters:
                jql_parts.append(f"project = {filters['project']}")
            if 'status' in filters:
                jql_parts.append(f"status = '{filters['status']}'")
            if 'assignee' in filters:
                jql_parts.append(f"assignee = '{filters['assignee']}'")
            if 'reporter' in filters:
                jql_parts.append(f"reporter = '{filters['reporter']}'")
            if 'issuetype' in filters:
                jql_parts.append(f"issuetype = '{filters['issuetype']}'")
            if 'priority' in filters:
                jql_parts.append(f"priority = '{filters['priority']}'")
            if 'created' in filters:
                jql_parts.append(filters['created'])
            if 'fix_version' in filters:
                # Escapa aspas simples no valor
                fix_version_value = filters['fix_version'].replace("'", "\\'")
                jql_parts.append(f"fixVersion = '{fix_version_value}'")
            jql = ' AND '.join(jql_parts)

            all_issues = []
            total = 0
            if fetch_all:
                start_at = 0
                while True:
                    params = {
                        'jql': jql,
                        'startAt': start_at,
                        'maxResults': 100,
                        'fields': 'summary,description,project,status,issuetype,priority,assignee,reporter,created,updated,resolutiondate,fixVersions'
                    }
                    data = self._make_request('search', params)
                    issues = []
                    for issue in data.get('issues', []):
                        fields = issue.get('fields', {})
                        assignee_obj = fields.get('assignee')
                        reporter_obj = fields.get('reporter')
                        issues.append({
                            'id': issue.get('id'),
                            'jira_key': issue.get('key'),
                            'jira_id': issue.get('id'),
                            'summary': fields.get('summary', ''),
                            'description': fields.get('description', ''),
                            'project_key': issue.get('key', '').split('-')[0] if issue.get('key') else '',
                            'project_name': '',
                            'status': (fields.get('status') or {}).get('name', ''),
                            'issue_type': (fields.get('issuetype') or {}).get('name', ''),
                            'priority': (fields.get('priority') or {}).get('name', ''),
                            'assignee_name': (assignee_obj or {}).get('displayName', '') if assignee_obj else '',
                            'assignee_id': (assignee_obj or {}).get('accountId', '') if assignee_obj else '',
                            'reporter_name': (reporter_obj or {}).get('displayName', '') if reporter_obj else '',
                            'reporter_id': (reporter_obj or {}).get('accountId', '') if reporter_obj else '',
                            'created_date': fields.get('created', ''),
                            'updated_date': fields.get('updated', ''),
                            'resolution_date': fields.get('resolutiondate', ''),
                            'fix_version': ', '.join([v['name'] for v in fields.get('fixVersions', []) if v.get('name')]) or '',
                            'fix_versions': [v['name'] for v in fields.get('fixVersions', []) if v.get('name')],
                        })
                    all_issues.extend(issues)
                    total = data.get('total', 0)
                    if start_at + 100 >= total:
                        break
                    start_at += 100
                # Após buscar as issues do Jira, se houver filtro de fix_version, filtrar manualmente
                if 'fix_version' in filters:
                    fix_version_value = filters['fix_version'].strip().lower()
                    filtered_issues = []
                    for issue in all_issues:
                        fix_versions = [v['name'] for v in issue.get('fields', {}).get('fixVersions', []) if v.get('name')]
                        if any(fix_version_value == v.strip().lower() for v in fix_versions):
                            filtered_issues.append(issue)
                    all_issues = filtered_issues
                return {
                    'issues': all_issues,
                    'total': total,
                    'pages': 1,
                    'current_page': 1,
                    'per_page': total,
                    'has_next': False,
                    'has_prev': False
                }
            else:
                start_at = (page - 1) * per_page
                params = {
                    'jql': jql,
                    'startAt': start_at,
                    'maxResults': per_page,
                    'fields': 'summary,description,project,status,issuetype,priority,assignee,reporter,created,updated,resolutiondate,fixVersions'
                }
                data = self._make_request('search', params)
                issues = []
                for issue in data.get('issues', []):
                    fields = issue.get('fields', {})
                    assignee_obj = fields.get('assignee')
                    reporter_obj = fields.get('reporter')
                    issues.append({
                        'id': issue.get('id'),
                        'jira_key': issue.get('key'),
                        'jira_id': issue.get('id'),
                        'summary': fields.get('summary', ''),
                        'description': fields.get('description', ''),
                        'project_key': issue.get('key', '').split('-')[0] if issue.get('key') else '',
                        'project_name': '',
                        'status': (fields.get('status') or {}).get('name', ''),
                        'issue_type': (fields.get('issuetype') or {}).get('name', ''),
                        'priority': (fields.get('priority') or {}).get('name', ''),
                        'assignee_name': (assignee_obj or {}).get('displayName', '') if assignee_obj else '',
                        'assignee_id': (assignee_obj or {}).get('accountId', '') if assignee_obj else '',
                        'reporter_name': (reporter_obj or {}).get('displayName', '') if reporter_obj else '',
                        'reporter_id': (reporter_obj or {}).get('accountId', '') if reporter_obj else '',
                        'created_date': fields.get('created', ''),
                        'updated_date': fields.get('updated', ''),
                        'resolution_date': fields.get('resolutiondate', ''),
                        'fix_version': ', '.join([v['name'] for v in fields.get('fixVersions', []) if v.get('name')]) or '',
                        'fix_versions': [v['name'] for v in fields.get('fixVersions', []) if v.get('name')],
                    })
                return {
                    'issues': issues,
                    'total': data.get('total', 0),
                    'pages': (data.get('total', 0) // per_page) + 1,
                    'current_page': page,
                    'per_page': per_page,
                    'has_next': (start_at + per_page) < data.get('total', 0),
                    'has_prev': page > 1
                }
        except Exception as e:
            print(f"Erro ao buscar issues: {e}")
            return {
                'issues': [],
                'total': 0,
                'pages': 1,
                'current_page': page,
                'per_page': per_page,
                'has_next': False,
                'has_prev': False
            }
    
    def get_dashboard_stats(self, filters: Dict = None) -> Dict:
        """Busca estatísticas para o dashboard"""
        try:
            filters = filters or {}
            # Buscar todas as issues do projeto (sem limite)
            issues_data = self.get_issues(filters, fetch_all=True)
            issues = issues_data.get('issues', [])
            total_issues = len(issues)
            # Contadores
            recent_issues = 0
            resolved_issues = 0
            status_dist = {}
            type_dist = {}
            priority_dist = {}
            assignee_dist = {}
            reporter_dist = {}
            version_dist = {}
            thirty_days_ago = datetime.now(datetime.utcnow().astimezone().tzinfo) - timedelta(days=30)
            for issue in issues:
                status = issue.get('status') or 'Desconhecido'
                status_dist[status] = status_dist.get(status, 0) + 1
                issue_type = issue.get('issue_type') or 'Desconhecido'
                type_dist[issue_type] = type_dist.get(issue_type, 0) + 1
                priority = issue.get('priority') or 'Desconhecido'
                priority_dist[priority] = priority_dist.get(priority, 0) + 1
                assignee = issue.get('assignee_name') or 'Não atribuído'
                assignee_dist[assignee] = assignee_dist.get(assignee, 0) + 1
                reporter = issue.get('reporter_name') or 'Não atribuído'
                reporter_dist[reporter] = reporter_dist.get(reporter, 0) + 1
                # Contar criadas nos últimos 30 dias
                created_date = issue.get('created_date')
                resolution_date = issue.get('resolution_date')
                updated_date = issue.get('updated_date')
                created_dt = self.parse_jira_date(created_date) if isinstance(created_date, str) else created_date
                resolution_dt = self.parse_jira_date(resolution_date) if isinstance(resolution_date, str) else resolution_date
                updated_dt = self.parse_jira_date(updated_date) if isinstance(updated_date, str) else updated_date
                if created_dt and created_dt >= thirty_days_ago:
                    recent_issues += 1
                # Considera resolvida se:
                # 1. Tem resolution_date recente
                # 2. OU status é 'Concluído' (ou equivalente) e updated_date recente
                status_resolvidos = ['done', 'concluído', 'concluído.', 'cancelado', 'itens concluídos', 'resolved', 'fechado', 'closed']
                if (resolution_dt and resolution_dt >= thirty_days_ago) or \
                   (status and status.strip().lower() in status_resolvidos and updated_dt and updated_dt >= thirty_days_ago):
                    resolved_issues += 1
                # Versões/Release
                fix_versions = issue.get('fix_versions')
                # Pode ser lista, string JSON ou string simples
                if isinstance(fix_versions, str):
                    try:
                        fix_versions = json.loads(fix_versions)
                    except Exception:
                        fix_versions = [fix_versions]
                if not fix_versions or fix_versions in ([], [None], [""]):
                    version_dist['Não atribuído'] = version_dist.get('Não atribuído', 0) + 1
                else:
                    for v in fix_versions:
                        if not v:
                            version_dist['Não atribuído'] = version_dist.get('Não atribuído', 0) + 1
                        else:
                            version_dist[v] = version_dist.get(v, 0) + 1
            # Montar resposta
            return {
                'total_issues': total_issues,
                'recent_issues': recent_issues,
                'resolved_issues': resolved_issues,
                'status_distribution': [
                    {'status': k, 'count': v} for k, v in status_dist.items()
                ],
                'type_distribution': [
                    {'type': k, 'count': v} for k, v in type_dist.items()
                ],
                'priority_distribution': [
                    {'priority': k, 'count': v} for k, v in priority_dist.items()
                ],
                'assignee_distribution': [
                    {'assignee': k, 'count': v} for k, v in assignee_dist.items()
                ],
                'reporter_distribution': [
                    {'reporter': k, 'count': v} for k, v in reporter_dist.items()
                ],
                'version_distribution': [
                    {'version': k, 'count': v} for k, v in version_dist.items()
                ]
            }
        except Exception as e:
            print(f"Erro ao buscar estatísticas: {e}")
            return None
    
    def get_timeline_data(self, filters: Dict = None, days: int = 30) -> Dict:
        """Busca dados de timeline"""
        try:
            filters = filters or {}
            created_timeline = []
            resolved_timeline = []
            for i in range(days):
                date = (datetime.now() - timedelta(days=days-i-1)).date()
                # Issues criadas neste dia
                day_filters = filters.copy()
                day_filters['created'] = f"created = '{date}'"
                created_jql_parts = []
                if 'project' in day_filters:
                    created_jql_parts.append(f"project = {day_filters['project']}")
                if 'status' in day_filters:
                    created_jql_parts.append(f"status = '{day_filters['status']}'")
                if 'assignee' in day_filters:
                    created_jql_parts.append(f"assignee = '{day_filters['assignee']}'")
                if 'reporter' in day_filters:
                    created_jql_parts.append(f"reporter = '{day_filters['reporter']}'")
                if 'issuetype' in day_filters:
                    created_jql_parts.append(f"issuetype = '{day_filters['issuetype']}'")
                if 'priority' in day_filters:
                    created_jql_parts.append(f"priority = '{day_filters['priority']}'")
                if 'created' in day_filters:
                    created_jql_parts.append(day_filters['created'])
                created_jql = ' AND '.join(created_jql_parts)
                params = {'jql': created_jql, 'maxResults': 0}
                created_data = self._make_request('search', params)
                created_count = created_data.get('total', 0)
                # Issues resolvidas neste dia
                resolved_jql_parts = created_jql_parts.copy()
                resolved_jql_parts[-1] = f"resolutiondate = '{date}'"
                resolved_jql = ' AND '.join(resolved_jql_parts)
                params = {'jql': resolved_jql, 'maxResults': 0}
                resolved_data = self._make_request('search', params)
                resolved_count = resolved_data.get('total', 0)
                created_timeline.append({'date': str(date), 'count': created_count})
                resolved_timeline.append({'date': str(date), 'count': resolved_count})
            return {
                'created_timeline': created_timeline,
                'resolved_timeline': resolved_timeline
            }
        except Exception as e:
            print(f"Erro ao buscar timeline: {e}")
            return None
    
    def get_filter_options(self, project_key: str = None) -> Dict:
        """Busca opções para filtros"""
        try:
            # Busca metadados do projeto
            jql = f"project = {project_key}" if project_key else ""
            params = {
                'jql': jql,
                'maxResults': 1000,
                'fields': 'status,issuetype,priority,assignee,reporter,fixVersions'
            }
            
            data = self._make_request('search', params)
            
            statuses = set()
            types = set()
            priorities = set()
            assignees = {}
            reporters = {}
            versions = set()
            
            for issue in data.get('issues', []):
                fields = issue.get('fields', {})
                
                # Status
                if fields.get('status'):
                    statuses.add(fields['status'].get('name', ''))
                
                # Tipo
                if fields.get('issuetype'):
                    types.add(fields['issuetype'].get('name', ''))
                
                # Prioridade
                if fields.get('priority'):
                    priorities.add(fields['priority'].get('name', ''))
                
                # Responsável
                if fields.get('assignee'):
                    assignee = fields['assignee']
                    assignees[assignee.get('accountId', assignee.get('displayName', ''))] = assignee.get('displayName', '')
                
                # Reporter
                if fields.get('reporter'):
                    reporter = fields['reporter']
                    reporters[reporter.get('accountId', reporter.get('displayName', ''))] = reporter.get('displayName', '')
                
                # Versões
                for version in fields.get('fixVersions', []):
                    versions.add(version.get('name', ''))
            
            return {
                'statuses': sorted(list(statuses)),
                'types': sorted(list(types)),
                'priorities': sorted(list(priorities)),
                'assignees': [{'id': k, 'name': v} for k, v in assignees.items()],
                'reporters': [{'id': k, 'name': v} for k, v in reporters.items()],
                'versions': sorted(list(versions))
            }
            
        except Exception as e:
            print(f"Erro ao buscar opções de filtro: {e}")
            return {
                'statuses': [],
                'types': [],
                'priorities': [],
                'assignees': [],
                'reporters': [],
                'versions': []
            }

    def parse_jira_date(self, date_str):
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%f%z")
        except Exception:
            try:
                return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S%z")
            except Exception:
                return None

    def sync_issues_to_db(self, project_key: str):
        """Sincroniza issues do Jira para o banco, salvando fix_versions corretamente"""
        filters = {'project': project_key}
        page = 1
        per_page = 100
        issues_data = self.get_issues(filters, page, per_page, fetch_all=True)
        issues = issues_data.get('issues', [])
        for issue_data in issues:
            jira_key = issue_data.get('jira_key')
            # Busca issue existente ou cria nova
            issue = JiraIssue.query.filter_by(jira_key=jira_key).first()
            if not issue:
                issue = JiraIssue(jira_key=jira_key, jira_id=issue_data.get('jira_id'))
                db.session.add(issue)
            # Atualiza campos
            issue.summary = issue_data.get('summary', '')
            issue.description = issue_data.get('description', '')
            issue.project_key = issue_data.get('project_key', '')
            issue.project_name = issue_data.get('project_name', '')
            issue.status = issue_data.get('status', '')
            issue.issue_type = issue_data.get('issue_type', '')
            issue.priority = issue_data.get('priority', '')
            issue.assignee_email = ''
            issue.assignee_name = issue_data.get('assignee_name', '')
            issue.reporter_email = ''
            issue.reporter_name = issue_data.get('reporter_name', '')
            issue.creator_email = ''
            issue.creator_name = ''
            # Salva fix_versions como array JSON
            fix_versions = issue_data.get('fix_versions') or issue_data.get('fix_version') or []
            if isinstance(fix_versions, str):
                fix_versions = [v.strip() for v in fix_versions.split(',') if v.strip()]
            elif not isinstance(fix_versions, list):
                fix_versions = []
            issue.fix_versions = json.dumps(fix_versions)
            # Datas
            try:
                issue.created_date = self.parse_jira_date(issue_data.get('created_date'))
            except Exception:
                issue.created_date = None
            try:
                issue.updated_date = self.parse_jira_date(issue_data.get('updated_date'))
            except Exception:
                issue.updated_date = None
            try:
                issue.resolved_date = self.parse_jira_date(issue_data.get('resolution_date'))
            except Exception:
                issue.resolved_date = None
        db.session.commit()


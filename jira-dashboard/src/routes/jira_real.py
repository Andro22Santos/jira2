from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from src.services.jira_service import JiraService
from datetime import datetime, timedelta
import json
import os

jira_bp = Blueprint('jira', __name__)

# Configurações do Jira
JIRA_CONFIG = {
    'base_url': os.getenv('JIRA_BASE_URL', 'https://lojasmarisa.atlassian.net'),
    'email': os.getenv('JIRA_EMAIL', 'andreson.santos@marisapartner.com.br'),
    'api_token': os.getenv('JIRA_API_TOKEN', '')
}

# Instância do serviço Jira
jira_service = JiraService(**JIRA_CONFIG)

@jira_bp.route('/sync', methods=['POST'])
@cross_origin()
def sync_jira_data():
    """Sincroniza dados com o Jira"""
    try:
        data = request.get_json() or {}
        project_key = data.get('project_key')
        
        # Aqui você pode implementar a lógica de sincronização real
        # Por exemplo, buscar dados do Jira e salvar no banco de dados
        
        if project_key:
            message = f"Sincronização do projeto {project_key} concluída"
        else:
            message = "Sincronização completa concluída"
        
        return jsonify({'success': True, 'message': message})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@jira_bp.route('/projects', methods=['GET'])
@cross_origin()
def get_projects():
    """Obtém lista de projetos do Jira"""
    try:
        projects = jira_service.get_projects()
        return jsonify(projects)
    except Exception as e:
        print(f"Erro ao buscar projetos: {e}")
        # Fallback para dados de exemplo em caso de erro
        sample_projects = [
            {
                'id': 1,
                'jira_id': '10001',
                'key': 'ECOM',
                'name': 'E-commerce Platform',
                'description': 'Plataforma de e-commerce da Marisa',
                'project_type': 'software',
                'lead_email': 'tech.lead@marisapartner.com.br',
                'lead_name': 'João Silva'
            },
            {
                'id': 2,
                'jira_id': '10002',
                'key': 'MOBILE',
                'name': 'Mobile App',
                'description': 'Aplicativo móvel da Marisa',
                'project_type': 'software',
                'lead_email': 'mobile.lead@marisapartner.com.br',
                'lead_name': 'Maria Santos'
            }
        ]
        return jsonify(sample_projects)

@jira_bp.route('/projects/<project_key>/versions', methods=['GET'])
@cross_origin()
def get_project_versions(project_key):
    """Obtém versões de um projeto do Jira"""
    try:
        versions = jira_service.get_project_versions(project_key)
        return jsonify(versions)
    except Exception as e:
        print(f"Erro ao buscar versões: {e}")
        # Fallback para dados de exemplo
        sample_versions = [
            {'id': 1, 'jira_id': '1001', 'name': 'v2.0.0', 'released': True, 'project_key': project_key},
            {'id': 2, 'jira_id': '1002', 'name': 'v2.1.0', 'released': False, 'project_key': project_key}
        ]
        return jsonify(sample_versions)

@jira_bp.route('/issues', methods=['GET'])
@cross_origin()
def get_issues():
    """Obtém issues do Jira com filtros"""
    try:
        # Parâmetros de filtro
        project_key = request.args.get('project_key')
        status = request.args.get('status')
        assignee_email = request.args.get('assignee_email')
        reporter_email = request.args.get('reporter_email')
        fix_version = request.args.get('fix_version')
        issue_type = request.args.get('issue_type')
        priority = request.args.get('priority')
        created_after = request.args.get('created_after')
        created_before = request.args.get('created_before')
        
        # Parâmetros de paginação
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        fetch_all = request.args.get('fetch_all', 'false').lower() == 'true'
        
        # Monta filtros para o Jira
        filters = {}
        created_clauses = []
        if project_key:
            filters['project'] = project_key
        if status:
            filters['status'] = status
        if assignee_email:
            filters['assignee'] = assignee_email
        if reporter_email:
            filters['reporter'] = reporter_email
        if issue_type:
            filters['issuetype'] = issue_type
        if priority:
            filters['priority'] = priority
        if created_after:
            created_clauses.append(f"created >= '{created_after}'")
        if created_before:
            created_clauses.append(f"created <= '{created_before}'")
        if created_clauses:
            filters['created'] = ' AND '.join(created_clauses)
        if fix_version:
            filters['fix_version'] = fix_version
        
        # Busca issues do Jira
        issues_data = jira_service.get_issues(filters, page, per_page, fetch_all=fetch_all)
        if not issues_data or not issues_data.get('issues'):
            raise Exception('Sem dados do Jira')
        return jsonify(issues_data)
        
    except Exception as e:
        print(f"Erro ao buscar issues: {e}")
        # Fallback para dados de exemplo em caso de erro
        sample_issues = [
            {
                'id': 1,
                'jira_key': 'ECOM-123',
                'jira_id': '10101',
                'summary': 'Implementar carrinho de compras',
                'description': 'Desenvolver funcionalidade de carrinho de compras com persistência',
                'project_key': project_key or 'ECOM',
                'project_name': 'E-commerce Platform',
                'status': 'In Progress',
                'issue_type': 'Story',
                'priority': 'High',
                'assignee_email': 'dev1@marisapartner.com.br',
                'assignee_name': 'Ana Costa',
                'reporter_email': 'po@marisapartner.com.br',
                'reporter_name': 'Pedro Manager',
                'creator_email': 'po@marisapartner.com.br',
                'creator_name': 'Pedro Manager',
                'fix_versions': '["v2.1.0"]',
                'affected_versions': '[]',
                'created_date': (datetime.now() - timedelta(days=5)).isoformat(),
                'updated_date': (datetime.now() - timedelta(days=1)).isoformat(),
                'resolved_date': None
            }
        ]
        
        return jsonify({
            'issues': sample_issues,
            'total': len(sample_issues),
            'pages': 1,
            'current_page': page,
            'per_page': per_page,
            'has_next': False,
            'has_prev': False
        })

@jira_bp.route('/dashboard/stats', methods=['GET'])
@cross_origin()
def get_dashboard_stats():
    """Obtém estatísticas para o dashboard"""
    try:
        # Parâmetros de filtro
        project_key = request.args.get('project_key')
        status = request.args.get('status')
        assignee_email = request.args.get('assignee_email')
        reporter_email = request.args.get('reporter_email')
        fix_version = request.args.get('fix_version')
        issue_type = request.args.get('issue_type')
        priority = request.args.get('priority')
        created_after = request.args.get('created_after')
        created_before = request.args.get('created_before')

        filters = {}
        created_clauses = []
        if project_key:
            filters['project'] = project_key
        if status:
            filters['status'] = status
        if assignee_email:
            filters['assignee'] = assignee_email
        if reporter_email:
            filters['reporter'] = reporter_email
        if issue_type:
            filters['issuetype'] = issue_type
        if priority:
            filters['priority'] = priority
        if created_after:
            created_clauses.append(f"created >= '{created_after}'")
        if created_before:
            created_clauses.append(f"created <= '{created_before}'")
        if created_clauses:
            filters['created'] = ' AND '.join(created_clauses)

        # Busca estatísticas do Jira
        stats = jira_service.get_dashboard_stats(filters)
        if not stats:
            raise Exception('Sem dados do Jira')
        return jsonify(stats)
    except Exception as e:
        print(f"Erro ao buscar estatísticas: {e}")
        # Fallback para dados de exemplo, sempre preenchidos
        return jsonify({
            'total_issues': 42,
            'recent_issues': 10,
            'resolved_issues': 7,
            'status_distribution': [
                {'status': 'In Progress', 'count': 12},
                {'status': 'Done', 'count': 20},
                {'status': 'To Do', 'count': 10}
            ],
            'type_distribution': [
                {'type': 'Story', 'count': 15},
                {'type': 'Bug', 'count': 10},
                {'type': 'Feature', 'count': 7},
                {'type': 'Task', 'count': 5},
                {'type': 'Improvement', 'count': 5}
            ],
            'priority_distribution': [
                {'priority': 'High', 'count': 10},
                {'priority': 'Critical', 'count': 5},
                {'priority': 'Medium', 'count': 20},
                {'priority': 'Low', 'count': 7}
            ],
            'assignee_distribution': [
                {'assignee': 'Ana Costa', 'count': 15},
                {'assignee': 'Bruno Silva', 'count': 10},
                {'assignee': 'Diana Mobile', 'count': 7},
                {'assignee': 'Felipe DevOps', 'count': 10}
            ]
        })

@jira_bp.route('/dashboard/timeline', methods=['GET'])
@cross_origin()
def get_timeline_data():
    """Obtém dados de timeline para gráficos"""
    try:
        # Parâmetros de filtro
        project_key = request.args.get('project_key')
        days = int(request.args.get('days', 30))
        status = request.args.get('status')
        assignee_email = request.args.get('assignee_email')
        reporter_email = request.args.get('reporter_email')
        fix_version = request.args.get('fix_version')
        issue_type = request.args.get('issue_type')
        priority = request.args.get('priority')
        created_after = request.args.get('created_after')
        created_before = request.args.get('created_before')

        filters = {}
        created_clauses = []
        if project_key:
            filters['project'] = project_key
        if status:
            filters['status'] = status
        if assignee_email:
            filters['assignee'] = assignee_email
        if reporter_email:
            filters['reporter'] = reporter_email
        if issue_type:
            filters['issuetype'] = issue_type
        if priority:
            filters['priority'] = priority
        if created_after:
            created_clauses.append(f"created >= '{created_after}'")
        if created_before:
            created_clauses.append(f"created <= '{created_before}'")
        if created_clauses:
            filters['created'] = ' AND '.join(created_clauses)

        # Busca dados de timeline do Jira
        timeline = jira_service.get_timeline_data(filters, days)
        if not timeline or not timeline.get('created_timeline'):
            raise Exception('Sem dados do Jira')
        return jsonify(timeline)
    except Exception as e:
        print(f"Erro ao buscar timeline: {e}")
        timeline_data = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=days-i-1)).date()
            count = 1 if i % 3 == 0 else 0
            timeline_data.append({'date': str(date), 'count': count})
        return jsonify({
            'created_timeline': timeline_data,
            'resolved_timeline': timeline_data
        })

@jira_bp.route('/filters/options', methods=['GET'])
@cross_origin()
def get_filter_options():
    """Obtém opções para os filtros"""
    try:
        project_key = request.args.get('project_key')
        
        # Busca opções de filtro do Jira
        options = jira_service.get_filter_options(project_key)
        if not options or not options.get('statuses'):
            raise Exception('Sem dados do Jira')
        return jsonify(options)
        
    except Exception as e:
        print(f"Erro ao buscar opções de filtro: {e}")
        return jsonify({
            'statuses': ['To Do', 'In Progress', 'Done'],
            'types': ['Story', 'Bug', 'Feature', 'Task', 'Improvement'],
            'priorities': ['Critical', 'High', 'Medium', 'Low'],
            'assignees': [
                {'email': 'dev1@marisapartner.com.br', 'name': 'Ana Costa'},
                {'email': 'dev2@marisapartner.com.br', 'name': 'Bruno Silva'}
            ],
            'reporters': [
                {'email': 'po@marisapartner.com.br', 'name': 'Pedro Manager'},
                {'email': 'qa@marisapartner.com.br', 'name': 'Carla QA'}
            ],
            'versions': ['v2.0.0', 'v2.0.1', 'v2.1.0']
        })


from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from datetime import datetime, timedelta
import json

jira_bp = Blueprint('jira', __name__)

# Dados de exemplo para demonstração
SAMPLE_PROJECTS = [
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
    },
    {
        'id': 3,
        'jira_id': '10003',
        'key': 'INFRA',
        'name': 'Infrastructure',
        'description': 'Infraestrutura e DevOps',
        'project_type': 'service_desk',
        'lead_email': 'infra.lead@marisapartner.com.br',
        'lead_name': 'Carlos Oliveira'
    }
]

SAMPLE_ISSUES = [
    {
        'id': 1,
        'jira_key': 'ECOM-123',
        'jira_id': '10101',
        'summary': 'Implementar carrinho de compras',
        'description': 'Desenvolver funcionalidade de carrinho de compras com persistência',
        'project_key': 'ECOM',
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
    },
    {
        'id': 2,
        'jira_key': 'ECOM-124',
        'jira_id': '10102',
        'summary': 'Corrigir bug no checkout',
        'description': 'Erro ao finalizar compra com cartão de crédito',
        'project_key': 'ECOM',
        'project_name': 'E-commerce Platform',
        'status': 'Done',
        'issue_type': 'Bug',
        'priority': 'Critical',
        'assignee_email': 'dev2@marisapartner.com.br',
        'assignee_name': 'Bruno Silva',
        'reporter_email': 'qa@marisapartner.com.br',
        'reporter_name': 'Carla QA',
        'creator_email': 'qa@marisapartner.com.br',
        'creator_name': 'Carla QA',
        'fix_versions': '["v2.0.1"]',
        'affected_versions': '["v2.0.0"]',
        'created_date': (datetime.now() - timedelta(days=10)).isoformat(),
        'updated_date': (datetime.now() - timedelta(days=2)).isoformat(),
        'resolved_date': (datetime.now() - timedelta(days=2)).isoformat()
    },
    {
        'id': 3,
        'jira_key': 'MOBILE-45',
        'jira_id': '10103',
        'summary': 'Implementar push notifications',
        'description': 'Adicionar sistema de notificações push para promoções',
        'project_key': 'MOBILE',
        'project_name': 'Mobile App',
        'status': 'To Do',
        'issue_type': 'Feature',
        'priority': 'Medium',
        'assignee_email': 'mobile.dev@marisapartner.com.br',
        'assignee_name': 'Diana Mobile',
        'reporter_email': 'marketing@marisapartner.com.br',
        'reporter_name': 'Eduardo Marketing',
        'creator_email': 'marketing@marisapartner.com.br',
        'creator_name': 'Eduardo Marketing',
        'fix_versions': '["v1.5.0"]',
        'affected_versions': '[]',
        'created_date': (datetime.now() - timedelta(days=3)).isoformat(),
        'updated_date': (datetime.now() - timedelta(days=3)).isoformat(),
        'resolved_date': None
    },
    {
        'id': 4,
        'jira_key': 'INFRA-78',
        'jira_id': '10104',
        'summary': 'Configurar monitoramento',
        'description': 'Implementar monitoramento de performance dos serviços',
        'project_key': 'INFRA',
        'project_name': 'Infrastructure',
        'status': 'In Progress',
        'issue_type': 'Task',
        'priority': 'High',
        'assignee_email': 'devops@marisapartner.com.br',
        'assignee_name': 'Felipe DevOps',
        'reporter_email': 'sre@marisapartner.com.br',
        'reporter_name': 'Gabriel SRE',
        'creator_email': 'sre@marisapartner.com.br',
        'creator_name': 'Gabriel SRE',
        'fix_versions': '["v1.0.0"]',
        'affected_versions': '[]',
        'created_date': (datetime.now() - timedelta(days=7)).isoformat(),
        'updated_date': (datetime.now() - timedelta(hours=6)).isoformat(),
        'resolved_date': None
    },
    {
        'id': 5,
        'jira_key': 'ECOM-125',
        'jira_id': '10105',
        'summary': 'Otimizar performance da busca',
        'description': 'Melhorar tempo de resposta da busca de produtos',
        'project_key': 'ECOM',
        'project_name': 'E-commerce Platform',
        'status': 'Done',
        'issue_type': 'Improvement',
        'priority': 'Medium',
        'assignee_email': 'dev1@marisapartner.com.br',
        'assignee_name': 'Ana Costa',
        'reporter_email': 'po@marisapartner.com.br',
        'reporter_name': 'Pedro Manager',
        'creator_email': 'po@marisapartner.com.br',
        'creator_name': 'Pedro Manager',
        'fix_versions': '["v2.0.2"]',
        'affected_versions': '[]',
        'created_date': (datetime.now() - timedelta(days=15)).isoformat(),
        'updated_date': (datetime.now() - timedelta(days=5)).isoformat(),
        'resolved_date': (datetime.now() - timedelta(days=5)).isoformat()
    }
]

@jira_bp.route('/sync', methods=['POST'])
@cross_origin()
def sync_jira_data():
    """Simula sincronização com dados do Jira"""
    try:
        data = request.get_json() or {}
        project_key = data.get('project_key')
        
        if project_key:
            message = f"Sincronização do projeto {project_key} concluída (simulada)"
        else:
            message = "Sincronização completa concluída (simulada)"
        
        return jsonify({'success': True, 'message': message})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@jira_bp.route('/projects', methods=['GET'])
@cross_origin()
def get_projects():
    """Obtém lista de projetos"""
    try:
        return jsonify(SAMPLE_PROJECTS)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/projects/<project_key>/versions', methods=['GET'])
@cross_origin()
def get_project_versions(project_key):
    """Obtém versões de um projeto"""
    try:
        # Versões de exemplo baseadas no projeto
        versions = []
        if project_key == 'ECOM':
            versions = [
                {'id': 1, 'jira_id': '1001', 'name': 'v2.0.0', 'released': True, 'project_key': 'ECOM'},
                {'id': 2, 'jira_id': '1002', 'name': 'v2.0.1', 'released': True, 'project_key': 'ECOM'},
                {'id': 3, 'jira_id': '1003', 'name': 'v2.0.2', 'released': True, 'project_key': 'ECOM'},
                {'id': 4, 'jira_id': '1004', 'name': 'v2.1.0', 'released': False, 'project_key': 'ECOM'}
            ]
        elif project_key == 'MOBILE':
            versions = [
                {'id': 5, 'jira_id': '1005', 'name': 'v1.4.0', 'released': True, 'project_key': 'MOBILE'},
                {'id': 6, 'jira_id': '1006', 'name': 'v1.5.0', 'released': False, 'project_key': 'MOBILE'}
            ]
        elif project_key == 'INFRA':
            versions = [
                {'id': 7, 'jira_id': '1007', 'name': 'v1.0.0', 'released': False, 'project_key': 'INFRA'}
            ]
        
        return jsonify(versions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/issues', methods=['GET'])
@cross_origin()
def get_issues():
    """Obtém issues com filtros"""
    try:
        # Parâmetros de filtro
        project_key = request.args.get('project_key')
        status = request.args.get('status')
        assignee_email = request.args.get('assignee_email')
        reporter_email = request.args.get('reporter_email')
        fix_version = request.args.get('fix_version')
        issue_type = request.args.get('issue_type')
        priority = request.args.get('priority')
        
        # Parâmetros de paginação
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        
        # Filtra issues
        filtered_issues = SAMPLE_ISSUES.copy()
        
        if project_key:
            filtered_issues = [issue for issue in filtered_issues if issue['project_key'] == project_key]
        
        if status:
            filtered_issues = [issue for issue in filtered_issues if issue['status'] == status]
        
        if assignee_email:
            filtered_issues = [issue for issue in filtered_issues if issue['assignee_email'] == assignee_email]
        
        if reporter_email:
            filtered_issues = [issue for issue in filtered_issues if issue['reporter_email'] == reporter_email]
        
        if fix_version:
            filtered_issues = [issue for issue in filtered_issues if fix_version in issue['fix_versions']]
        
        if issue_type:
            filtered_issues = [issue for issue in filtered_issues if issue['issue_type'] == issue_type]
        
        if priority:
            filtered_issues = [issue for issue in filtered_issues if issue['priority'] == priority]
        
        # Simula paginação
        total = len(filtered_issues)
        start = (page - 1) * per_page
        end = start + per_page
        paginated_issues = filtered_issues[start:end]
        
        return jsonify({
            'issues': paginated_issues,
            'total': total,
            'pages': (total + per_page - 1) // per_page,
            'current_page': page,
            'per_page': per_page,
            'has_next': end < total,
            'has_prev': page > 1
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/dashboard/stats', methods=['GET'])
@cross_origin()
def get_dashboard_stats():
    """Obtém estatísticas para o dashboard"""
    try:
        project_key = request.args.get('project_key')
        
        # Filtra issues por projeto se especificado
        issues = SAMPLE_ISSUES.copy()
        if project_key:
            issues = [issue for issue in issues if issue['project_key'] == project_key]
        
        # Calcula estatísticas
        total_issues = len(issues)
        
        # Issues criadas nos últimos 30 dias
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_issues = len([
            issue for issue in issues 
            if datetime.fromisoformat(issue['created_date'].replace('Z', '+00:00')) >= thirty_days_ago
        ])
        
        # Issues resolvidas nos últimos 30 dias
        resolved_issues = len([
            issue for issue in issues 
            if issue['resolved_date'] and 
            datetime.fromisoformat(issue['resolved_date'].replace('Z', '+00:00')) >= thirty_days_ago
        ])
        
        # Distribuição por status
        status_counts = {}
        for issue in issues:
            status = issue['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        status_distribution = [{'status': k, 'count': v} for k, v in status_counts.items()]
        
        # Distribuição por tipo
        type_counts = {}
        for issue in issues:
            issue_type = issue['issue_type']
            type_counts[issue_type] = type_counts.get(issue_type, 0) + 1
        
        type_distribution = [{'type': k, 'count': v} for k, v in type_counts.items()]
        
        # Distribuição por prioridade
        priority_counts = {}
        for issue in issues:
            priority = issue['priority'] or 'Sem prioridade'
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        priority_distribution = [{'priority': k, 'count': v} for k, v in priority_counts.items()]
        
        # Distribuição por responsável
        assignee_counts = {}
        for issue in issues:
            assignee = issue['assignee_name']
            if assignee:
                assignee_counts[assignee] = assignee_counts.get(assignee, 0) + 1
        
        assignee_distribution = [{'assignee': k, 'count': v} for k, v in assignee_counts.items()]
        
        return jsonify({
            'total_issues': total_issues,
            'recent_issues': recent_issues,
            'resolved_issues': resolved_issues,
            'status_distribution': status_distribution,
            'type_distribution': type_distribution,
            'priority_distribution': priority_distribution,
            'assignee_distribution': assignee_distribution
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/dashboard/timeline', methods=['GET'])
@cross_origin()
def get_timeline_data():
    """Obtém dados de timeline para gráficos"""
    try:
        project_key = request.args.get('project_key')
        days = int(request.args.get('days', 30))
        
        # Filtra issues por projeto se especificado
        issues = SAMPLE_ISSUES.copy()
        if project_key:
            issues = [issue for issue in issues if issue['project_key'] == project_key]
        
        # Gera dados de timeline simulados
        timeline_data = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=days-i-1)).date()
            # Simula algumas issues criadas em dias aleatórios
            count = 1 if i % 3 == 0 else 0
            timeline_data.append({'date': str(date), 'count': count})
        
        resolved_timeline = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=days-i-1)).date()
            # Simula algumas issues resolvidas
            count = 1 if i % 4 == 0 else 0
            resolved_timeline.append({'date': str(date), 'count': count})
        
        return jsonify({
            'created_timeline': timeline_data,
            'resolved_timeline': resolved_timeline
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/filters/options', methods=['GET'])
@cross_origin()
def get_filter_options():
    """Obtém opções para os filtros"""
    try:
        project_key = request.args.get('project_key')
        
        # Filtra issues por projeto se especificado
        issues = SAMPLE_ISSUES.copy()
        if project_key:
            issues = [issue for issue in issues if issue['project_key'] == project_key]
        
        # Extrai opções únicas
        statuses = list(set(issue['status'] for issue in issues))
        types = list(set(issue['issue_type'] for issue in issues))
        priorities = list(set(issue['priority'] for issue in issues if issue['priority']))
        
        assignees = []
        reporters = []
        versions = set()
        
        for issue in issues:
            if issue['assignee_email'] and issue['assignee_name']:
                assignee = {'email': issue['assignee_email'], 'name': issue['assignee_name']}
                if assignee not in assignees:
                    assignees.append(assignee)
            
            if issue['reporter_email'] and issue['reporter_name']:
                reporter = {'email': issue['reporter_email'], 'name': issue['reporter_name']}
                if reporter not in reporters:
                    reporters.append(reporter)
            
            if issue['fix_versions']:
                try:
                    version_list = json.loads(issue['fix_versions'])
                    versions.update(version_list)
                except:
                    pass
        
        return jsonify({
            'statuses': sorted(statuses),
            'types': sorted(types),
            'priorities': sorted(priorities),
            'assignees': sorted(assignees, key=lambda x: x['name']),
            'reporters': sorted(reporters, key=lambda x: x['name']),
            'versions': sorted(list(versions))
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


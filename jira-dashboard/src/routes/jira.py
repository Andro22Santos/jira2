from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from src.models.user import db
from src.models.jira import JiraIssue, JiraProject, JiraVersion
from src.services.jira_service import JiraService
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
import json

jira_bp = Blueprint('jira', __name__)

# Configurações do Jira (em produção, isso deveria vir de variáveis de ambiente)
JIRA_CONFIG = {
    'base_url': 'https://lojasmarisa.atlassian.net',
    'email': 'andreson.santos@marisapartner.com.br',
    'api_token': 'ATATT3xFfGF0TXebDr_cWHOAk5aBTPzfj5AnB5DVJtj4PsNkF9dPsKvAMJMeztWlm2H_cXQQCuDExbs_7SqnDGj3t_rfhCxnaLAnQ3WNA6pZuZ19jlT6HoBdKjt5EbgiczmQN_jLVh1AOLMxr-ib5uImzUIidcSllstw9iMUe19VsAhjcgBAi8A=354291B7'
}

@jira_bp.route('/sync', methods=['POST'])
@cross_origin()
def sync_jira_data():
    """Sincroniza dados do Jira"""
    try:
        jira_service = JiraService(**JIRA_CONFIG)
        
        # Verifica se é sincronização completa ou parcial
        data = request.get_json() or {}
        project_key = data.get('project_key')
        
        if project_key:
            # Sincronização de um projeto específico
            jira_service.sync_versions_to_db(project_key)
            jira_service.sync_issues_to_db(project_key)
            message = f"Sincronização do projeto {project_key} concluída"
        else:
            # Sincronização completa
            jira_service.full_sync()
            message = "Sincronização completa concluída"
        
        return jsonify({'success': True, 'message': message})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@jira_bp.route('/projects', methods=['GET'])
@cross_origin()
def get_projects():
    """Obtém lista de projetos"""
    try:
        projects = JiraProject.query.all()
        return jsonify([project.to_dict() for project in projects])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/projects/<project_key>/versions', methods=['GET'])
@cross_origin()
def get_project_versions(project_key):
    """Obtém versões de um projeto"""
    try:
        versions = JiraVersion.query.filter_by(project_key=project_key).all()
        return jsonify([version.to_dict() for version in versions])
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
        
        # Parâmetros de data
        created_after = request.args.get('created_after')
        created_before = request.args.get('created_before')
        
        # Constrói a query
        query = JiraIssue.query
        
        # Aplica filtros
        if project_key:
            query = query.filter(JiraIssue.project_key == project_key)
        
        if status:
            query = query.filter(JiraIssue.status == status)
        
        if assignee_email:
            query = query.filter(JiraIssue.assignee_email == assignee_email)
        
        if reporter_email:
            query = query.filter(JiraIssue.reporter_email == reporter_email)
        
        if fix_version:
            all_issues = query.all()
            filtered_issues = []
            for issue in all_issues:
                # Sempre tratar fix_versions como array
                try:
                    versions = json.loads(issue.fix_versions) if issue.fix_versions else []
                    if isinstance(versions, str):
                        versions = [versions]
                except Exception:
                    versions = [v.strip() for v in issue.fix_versions.split(',')] if issue.fix_versions else []
                def normaliza(v):
                    return v.strip().lower()
                match = any(normaliza(fix_version) == normaliza(v) for v in versions)
                if match:
                    filtered_issues.append(issue)
            # Paginação manual após filtro
            total = len(filtered_issues)
            start = (page - 1) * per_page
            end = start + per_page
            paginated_issues = filtered_issues[start:end]
            # Padronizar retorno: fix_versions sempre como array
            def issue_to_dict_with_versions(issue):
                d = issue.to_dict()
                try:
                    d['fix_versions'] = json.loads(d['fix_versions']) if d['fix_versions'] else []
                    if isinstance(d['fix_versions'], str):
                        d['fix_versions'] = [d['fix_versions']]
                except Exception:
                    d['fix_versions'] = [v.strip() for v in d['fix_versions'].split(',')] if d['fix_versions'] else []
                return d
            return jsonify({
                'issues': [issue_to_dict_with_versions(issue) for issue in paginated_issues],
                'total': total,
                'pages': (total // per_page) + (1 if total % per_page else 0),
                'current_page': page,
                'per_page': per_page,
                'has_next': end < total,
                'has_prev': start > 0
            })
        
        if issue_type:
            query = query.filter(JiraIssue.issue_type == issue_type)
        
        if priority:
            query = query.filter(JiraIssue.priority == priority)
        
        if created_after:
            created_after_date = datetime.strptime(created_after, '%Y-%m-%d')
            query = query.filter(JiraIssue.created_date >= created_after_date)
        
        if created_before:
            created_before_date = datetime.strptime(created_before, '%Y-%m-%d')
            query = query.filter(JiraIssue.created_date <= created_before_date)
        
        # Ordena por data de criação (mais recentes primeiro)
        query = query.order_by(JiraIssue.created_date.desc())
        
        # Aplica paginação
        paginated_issues = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Padronizar retorno: fix_versions sempre como array
        def issue_to_dict_with_versions(issue):
            d = issue.to_dict()
            try:
                d['fix_versions'] = json.loads(d['fix_versions']) if d['fix_versions'] else []
                if isinstance(d['fix_versions'], str):
                    d['fix_versions'] = [d['fix_versions']]
            except Exception:
                d['fix_versions'] = [v.strip() for v in d['fix_versions'].split(',')] if d['fix_versions'] else []
            return d
        
        return jsonify({
            'issues': [issue_to_dict_with_versions(issue) for issue in paginated_issues.items],
            'total': paginated_issues.total,
            'pages': paginated_issues.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': paginated_issues.has_next,
            'has_prev': paginated_issues.has_prev
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/dashboard/stats', methods=['GET'])
@cross_origin()
def get_dashboard_stats():
    """Obtém estatísticas para o dashboard"""
    try:
        project_key = request.args.get('project_key')
        
        # Base query
        base_query = JiraIssue.query
        if project_key:
            base_query = base_query.filter(JiraIssue.project_key == project_key)
        
        # Total de issues
        total_issues = base_query.count()
        
        # Issues por status
        status_stats = db.session.query(
            JiraIssue.status,
            func.count(JiraIssue.id).label('count')
        )
        if project_key:
            status_stats = status_stats.filter(JiraIssue.project_key == project_key)
        status_stats = status_stats.group_by(JiraIssue.status).all()
        
        # Issues por tipo
        type_stats = db.session.query(
            JiraIssue.issue_type,
            func.count(JiraIssue.id).label('count')
        )
        if project_key:
            type_stats = type_stats.filter(JiraIssue.project_key == project_key)
        type_stats = type_stats.group_by(JiraIssue.issue_type).all()
        
        # Issues por prioridade
        priority_stats = db.session.query(
            JiraIssue.priority,
            func.count(JiraIssue.id).label('count')
        )
        if project_key:
            priority_stats = priority_stats.filter(JiraIssue.project_key == project_key)
        priority_stats = priority_stats.group_by(JiraIssue.priority).all()
        
        # Issues por assignee
        assignee_stats = db.session.query(
            JiraIssue.assignee_name,
            func.count(JiraIssue.id).label('count')
        )
        if project_key:
            assignee_stats = assignee_stats.filter(JiraIssue.project_key == project_key)
        assignee_stats = assignee_stats.filter(JiraIssue.assignee_name.isnot(None)).group_by(JiraIssue.assignee_name).all()
        
        # Issues criadas nos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_issues_query = base_query.filter(JiraIssue.created_date >= thirty_days_ago)
        recent_issues = recent_issues_query.count()
        
        # Issues resolvidas nos últimos 30 dias
        resolved_issues_query = base_query.filter(
            and_(
                JiraIssue.resolved_date >= thirty_days_ago,
                JiraIssue.resolved_date.isnot(None)
            )
        )
        resolved_issues = resolved_issues_query.count()
        
        return jsonify({
            'total_issues': total_issues,
            'recent_issues': recent_issues,
            'resolved_issues': resolved_issues,
            'status_distribution': [{'status': s[0], 'count': s[1]} for s in status_stats],
            'type_distribution': [{'type': t[0], 'count': t[1]} for t in type_stats],
            'priority_distribution': [{'priority': p[0] or 'Sem prioridade', 'count': p[1]} for p in priority_stats],
            'assignee_distribution': [{'assignee': a[0], 'count': a[1]} for a in assignee_stats[:10]]  # Top 10
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
        
        # Data de início
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Base query
        base_query = JiraIssue.query
        if project_key:
            base_query = base_query.filter(JiraIssue.project_key == project_key)
        
        # Issues criadas por dia
        created_by_day = db.session.query(
            func.date(JiraIssue.created_date).label('date'),
            func.count(JiraIssue.id).label('count')
        ).filter(
            JiraIssue.created_date >= start_date
        )
        if project_key:
            created_by_day = created_by_day.filter(JiraIssue.project_key == project_key)
        created_by_day = created_by_day.group_by(func.date(JiraIssue.created_date)).all()
        
        # Issues resolvidas por dia
        resolved_by_day = db.session.query(
            func.date(JiraIssue.resolved_date).label('date'),
            func.count(JiraIssue.id).label('count')
        ).filter(
            and_(
                JiraIssue.resolved_date >= start_date,
                JiraIssue.resolved_date.isnot(None)
            )
        )
        if project_key:
            resolved_by_day = resolved_by_day.filter(JiraIssue.project_key == project_key)
        resolved_by_day = resolved_by_day.group_by(func.date(JiraIssue.resolved_date)).all()
        
        return jsonify({
            'created_timeline': [{'date': str(c[0]), 'count': c[1]} for c in created_by_day],
            'resolved_timeline': [{'date': str(r[0]), 'count': r[1]} for r in resolved_by_day]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/filters/options', methods=['GET'])
@cross_origin()
def get_filter_options():
    """Obtém opções para os filtros"""
    try:
        project_key = request.args.get('project_key')
        
        # Base query
        base_query = JiraIssue.query
        if project_key:
            base_query = base_query.filter(JiraIssue.project_key == project_key)
        
        # Status únicos
        statuses = db.session.query(JiraIssue.status).distinct()
        if project_key:
            statuses = statuses.filter(JiraIssue.project_key == project_key)
        statuses = [s[0] for s in statuses.all()]
        
        # Tipos únicos
        types = db.session.query(JiraIssue.issue_type).distinct()
        if project_key:
            types = types.filter(JiraIssue.project_key == project_key)
        types = [t[0] for t in types.all()]
        
        # Prioridades únicas
        priorities = db.session.query(JiraIssue.priority).distinct()
        if project_key:
            priorities = priorities.filter(JiraIssue.project_key == project_key)
        priorities = [p[0] for p in priorities.all() if p[0]]
        
        # Assignees únicos
        assignees = db.session.query(
            JiraIssue.assignee_email,
            JiraIssue.assignee_name
        ).distinct()
        if project_key:
            assignees = assignees.filter(JiraIssue.project_key == project_key)
        assignees = [
            {'email': a[0], 'name': a[1]} 
            for a in assignees.all() 
            if a[0] and a[1]
        ]
        
        # Reporters únicos
        reporters = db.session.query(
            JiraIssue.reporter_email,
            JiraIssue.reporter_name
        ).distinct()
        if project_key:
            reporters = reporters.filter(JiraIssue.project_key == project_key)
        reporters = [
            {'email': r[0], 'name': r[1]} 
            for r in reporters.all() 
            if r[0] and r[1]
        ]
        
        # Versões únicas (fix versions)
        versions = set()
        issues_with_versions = base_query.filter(JiraIssue.fix_versions.isnot(None)).all()
        for issue in issues_with_versions:
            if issue.fix_versions:
                try:
                    version_list = json.loads(issue.fix_versions)
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


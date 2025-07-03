from flask import Blueprint, request, jsonify, session

auth_bp = Blueprint('auth', __name__)

# Usuário e senha hardcoded (pode ser movido para .env depois)
USERNAME = 'admin'
PASSWORD = '123456'

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if username == USERNAME and password == PASSWORD:
        session['logged_in'] = True
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@auth_bp.route('/check', methods=['GET'])
def check():
    return jsonify({'logged_in': session.get('logged_in', False)}) 
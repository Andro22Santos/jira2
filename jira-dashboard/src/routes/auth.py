import os
import base64
import json
from flask import Blueprint, request, jsonify, session

auth_bp = Blueprint('auth', __name__)

# Usuário e senha via variáveis de ambiente (mais seguro)
USERNAME = os.getenv('LOGIN_USERNAME', 'admin')
PASSWORD = os.getenv('LOGIN_PASSWORD', 'Jira@2025')

def decode_data(encoded_data):
    """Decodifica os dados ofuscados do frontend"""
    try:
        decoded_bytes = base64.b64decode(encoded_data)
        decoded_string = decoded_bytes.decode('utf-8')
        return json.loads(decoded_string)
    except:
        return None

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Verifica se os dados estão ofuscados (novo formato)
    if 'data' in data:
        credentials = decode_data(data['data'])
        if not credentials:
            return jsonify({'success': False, 'error': 'Dados inválidos'}), 400
        username = credentials.get('username')
        password = credentials.get('password')
    else:
        # Formato antigo (compatibilidade)
        username = data.get('username')
        password = data.get('password')
    
    if username == USERNAME and password == PASSWORD:
        session['logged_in'] = True
        return jsonify({'success': True})
    
    # Log de segurança sem expor nenhuma informação sensível
    return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@auth_bp.route('/check', methods=['GET'])
def check():
    return jsonify({'logged_in': session.get('logged_in', False)}) 
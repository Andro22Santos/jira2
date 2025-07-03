import requests
import json
import os
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

# Carregar variáveis de ambiente
load_dotenv()

JIRA_BASE_URL = os.getenv('JIRA_BASE_URL', "https://lojasmarisa.atlassian.net")
JIRA_EMAIL = os.getenv('JIRA_EMAIL', "andreson.santos@marisapartner.com.br")
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN', "")

project_key = "PLATF"
url = f"{JIRA_BASE_URL}/rest/api/3/search"
params = {
    "jql": f"project={project_key}",
    "maxResults": 5
}

response = requests.get(
    url,
    params=params,
    auth=HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN),
    headers={"Accept": "application/json"}
)

print("Status:", response.status_code)
print("Resposta:", response.json()) 
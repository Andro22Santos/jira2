import requests
from requests.auth import HTTPBasicAuth

JIRA_BASE_URL = "https://lojasmarisa.atlassian.net"
JIRA_EMAIL = "andreson.santos@marisapartner.com.br"
JIRA_API_TOKEN = "ATATT3xFfGF0TXebDr_cWHOAk5aBTPzfj5AnB5DVJtj4PsNkF9dPsKvAMJMeztWlm2H_cXQQCuDExbs_7SqnDGj3t_rfhCxnaLAnQ3WNA6pZuZ19jlT6HoBdKjt5EbgiczmQN_jLVh1AOLMxr-ib5uImzUIidcSllstw9iMUe19VsAhjcgBAi8A=354291B7"

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
# Configuração de Segurança

## Credenciais de Login

Para maior segurança, as credenciais agora são lidas de variáveis de ambiente.

### Como configurar:

1. Crie um arquivo `.env` na pasta `jira-dashboard/` com o seguinte conteúdo:

```
LOGIN_USERNAME=admin
LOGIN_PASSWORD=SuaSenhaSegura
SECRET_KEY=asdf#FGSgvasgf$5$WGT
```

2. **IMPORTANTE**: Nunca commite o arquivo `.env` no git (ele já está no .gitignore)

### Credenciais padrão (se não criar o .env):
- Usuário: `admin` 
- Senha: `Jira@2025`

### Para produção na EC2:

Adicione as variáveis de ambiente no script de inicialização:

```bash
export LOGIN_USERNAME="seu_usuario"
export LOGIN_PASSWORD="sua_senha_segura"
./start_all_1.sh
```

Ou adicione no início do script `start_all_1.sh`:

```bash
export LOGIN_USERNAME="admin"
export LOGIN_PASSWORD="SuaSenhaSegura"
``` 
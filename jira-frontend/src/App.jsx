import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { RefreshCw, Download, Filter, Search, BarChart3, Table as TableIcon, Settings, User, Star, Tag, Trophy } from 'lucide-react'
import './App.css'
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL + '/jira'

function App() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [issues, setIssues] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [timelineData, setTimelineData] = useState(null)
  const [filterOptions, setFilterOptions] = useState({})
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    assignee_email: '',
    reporter_email: '',
    fix_version: '',
    issue_type: '',
    priority: '',
    created_after: '',
    created_before: ''
  })

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

  // Sentinelas para valores vazios
  const EMPTY_SENTINELS = ['__all__', 'sem-valor'];

  // Novo estado para total do projeto
  const [projectTotalIssues, setProjectTotalIssues] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchIssues()
      fetchDashboardStats()
      fetchTimelineData()
      fetchFilterOptions()
      fetchProjectTotalIssues()
    }
  }, [selectedProject, filters, currentPage])

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`)
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
    }
  }

  const fetchIssues = async () => {
    if (!selectedProject) return
    setLoading(true)
    try {
      const params = new URLSearchParams(getActiveFilters());
      const response = await fetch(`${API_BASE_URL}/issues?${params}`)
      const data = await response.json()
      setIssues(data.issues || [])
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error('Erro ao buscar issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRealFilterValue = (val) => (val === '__all__' || val === 'sem-valor' ? '' : val);

  // Helper para montar todos os filtros ativos (exceto sentinelas)
  const getActiveFilters = () => {
    const params = { project_key: selectedProject };
    Object.entries(filters).forEach(([key, value]) => {
      const realValue = getRealFilterValue(value);
      if (realValue) params[key] = realValue;
    });
    return params;
  };

  const fetchDashboardStats = async () => {
    if (!selectedProject) return
    
    try {
      const params = new URLSearchParams(getActiveFilters());
      const response = await fetch(`${API_BASE_URL}/dashboard/stats?${params}`)
      const data = await response.json()
      setDashboardStats(data)
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const fetchTimelineData = async () => {
    if (!selectedProject) return
    
    try {
      const params = new URLSearchParams({ ...getActiveFilters(), days: 30 });
      const response = await fetch(`${API_BASE_URL}/dashboard/timeline?${params}`)
      const data = await response.json()
      setTimelineData(data)
    } catch (error) {
      console.error('Erro ao buscar dados de timeline:', error)
    }
  }

  const fetchFilterOptions = async () => {
    if (!selectedProject) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/filters/options?project_key=${selectedProject}`)
      const data = await response.json()
      setFilterOptions(data)
    } catch (error) {
      console.error('Erro ao buscar opções de filtro:', error)
    }
  }

  const syncData = async () => {
    setSyncing(true)
    try {
      const response = await fetch(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_key: selectedProject })
      })
      
      if (response.ok) {
        // Recarrega os dados após sincronização
        await fetchIssues()
        await fetchDashboardStats()
        await fetchTimelineData()
        await fetchFilterOptions()
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset para primeira página
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      assignee_email: '',
      reporter_email: '',
      fix_version: '',
      issue_type: '',
      priority: '',
      created_after: '',
      created_before: ''
    })
    setSearchTerm('')
    setCurrentPage(1)
  }

  const exportToXLSX = async () => {
    if (!selectedProject) return;
    try {
      const params = new URLSearchParams({ ...getActiveFilters(), fetch_all: 'true' });
      const response = await fetch(`${API_BASE_URL}/issues?${params}`);
      const data = await response.json();
      const allIssues = data.issues || [];
      if (!allIssues.length) return;
      const headers = ['Chave', 'Resumo', 'Status', 'Tipo', 'Prioridade', 'Versão/Release', 'Responsável', 'Reporter', 'Criado', 'Atualizado'];
      const rows = allIssues.map(issue => [
        issue.jira_key,
        issue.summary,
        issue.status,
        issue.issue_type,
        issue.priority || '',
        Array.isArray(issue.fix_versions) ? (issue.fix_versions.length > 0 ? issue.fix_versions.join('; ') : '-') : (issue.fix_versions || '-'),
        issue.assignee_name || '',
        issue.reporter_name || '',
        issue.created_date ? new Date(issue.created_date).toLocaleDateString() : '',
        issue.updated_date ? new Date(issue.updated_date).toLocaleDateString() : ''
      ]);
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Issues');
      XLSX.writeFile(workbook, `jira-issues-${selectedProject}-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Erro ao exportar XLSX:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'To Do': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Done': 'bg-green-100 text-green-800',
      'Closed': 'bg-green-100 text-green-800',
      'Open': 'bg-red-100 text-red-800',
      'Resolved': 'bg-green-100 text-green-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const priorityColors = {
      'Highest': 'bg-red-100 text-red-800',
      'High': 'bg-orange-100 text-orange-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-blue-100 text-blue-800',
      'Lowest': 'bg-gray-100 text-gray-800'
    }
    return priorityColors[priority] || 'bg-gray-100 text-gray-800'
  }

  // Função utilitária para agrupar status menos frequentes em 'Outros'
  function groupStatusDistribution(statusDistribution, maxItems = 6) {
    if (!statusDistribution || statusDistribution.length <= maxItems) return statusDistribution;
    // Ordena do maior para o menor
    const sorted = [...statusDistribution].sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, maxItems);
    const rest = sorted.slice(maxItems);
    const outrosCount = rest.reduce((sum, item) => sum + item.count, 0);
    return [...top, { status: 'Outros', count: outrosCount }];
  }

  const groupedStatusDistribution = groupStatusDistribution(dashboardStats?.status_distribution || []);

  // Helper para DRY nos handlers
  const handleSelectFilterChange = (key) => (value) => {
    handleFilterChange(key, EMPTY_SENTINELS.includes(value) ? '' : value);
  };

  const filteredIssues = issues.filter(issue => {
    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!(
        issue.jira_key?.toLowerCase().includes(term) ||
        issue.summary?.toLowerCase().includes(term) ||
        issue.status?.toLowerCase().includes(term) ||
        issue.issue_type?.toLowerCase().includes(term) ||
        (Array.isArray(issue.fix_versions) ? issue.fix_versions.join(', ').toLowerCase().includes(term) : (issue.fix_versions || '').toLowerCase().includes(term))
      )) {
        return false;
      }
    }
    // Filtro por versão/release (exato)
    if (filters.fix_version && filters.fix_version !== '__all__' && filters.fix_version !== 'sem-valor') {
      const filterValue = filters.fix_version.trim().toLowerCase();
      const normalize = (str) =>
        str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/\s+/g, '') // Remove espaços
          .toLowerCase();

      const versions = Array.isArray(issue.fix_versions)
        ? issue.fix_versions.map(v => normalize(v))
        : (issue.fix_versions ? [normalize(issue.fix_versions)] : []);

      if (!versions.some(v => v === normalize(filterValue))) {
        return false;
      }
    }
    // Filtros dos outros campos (status, tipo, prioridade, etc.) seguem como já implementado
    return true;
  });

  // Buscar total do projeto SEM filtro
  const fetchProjectTotalIssues = async () => {
    if (!selectedProject) return;
    try {
      const params = new URLSearchParams({ project_key: selectedProject });
      const response = await fetch(`${API_BASE_URL}/dashboard/stats?${params}`);
      const data = await response.json();
      setProjectTotalIssues(data.total_issues);
    } catch (error) {
      setProjectTotalIssues(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('logged_in');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jira Dashboard</h1>
            <p className="text-gray-600">Planilha conectada com visualizações e filtros avançados</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.key} value={project.key}>
                    {project.key} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.fix_version || ''}
              onValueChange={handleSelectFilterChange('fix_version')}
              disabled={!selectedProject}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as versões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas as versões</SelectItem>
                {filterOptions.versions?.filter(v => v && v !== '').map(version => (
                  <SelectItem key={version} value={version}>{version}</SelectItem>
                ))}
                {filterOptions.versions?.some(v => !v || v === '') && (
                  <SelectItem value="sem-valor">Sem versão</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={syncData} 
              disabled={syncing || !selectedProject}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button onClick={handleLogout} variant="outline" className="ml-4">Sair</Button>
          </div>
        </div>

        {selectedProject && (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="spreadsheet" className="flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                Planilha
              </TabsTrigger>
              <TabsTrigger value="filters" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Bloco de filtros avançados abaixo da aba Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle>Filtros Avançados</CardTitle>
                  <CardDescription>
                    Configure filtros para refinar a visualização dos dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Status */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select
                        value={filters.status || ''}
                        onValueChange={handleSelectFilterChange('status')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os status</SelectItem>
                          {filterOptions.statuses?.filter(v => v && v !== '').map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                          {filterOptions.statuses?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem status</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo</label>
                      <Select
                        value={filters.issue_type || ''}
                        onValueChange={handleSelectFilterChange('issue_type')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os tipos</SelectItem>
                          {filterOptions.types?.filter(v => v && v !== '').map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          {filterOptions.types?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem tipo</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Prioridade */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Prioridade</label>
                      <Select
                        value={filters.priority || ''}
                        onValueChange={handleSelectFilterChange('priority')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as prioridades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas as prioridades</SelectItem>
                          {filterOptions.priorities?.filter(v => v && v !== '').map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                          {filterOptions.priorities?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem prioridade</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Responsável */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Responsável</label>
                      <Select
                        value={filters.assignee_email || ''}
                        onValueChange={handleSelectFilterChange('assignee_email')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os responsáveis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os responsáveis</SelectItem>
                          {filterOptions.assignees?.filter(a => a.id && a.id !== '').map(assignee => (
                            <SelectItem key={assignee.id} value={assignee.id}>{assignee.name}</SelectItem>
                          ))}
                          {filterOptions.assignees?.some(a => !a.id || a.id === '') && (
                            <SelectItem value="sem-valor">Sem responsável</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reporter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Reporter</label>
                      <Select
                        value={filters.reporter_email || ''}
                        onValueChange={handleSelectFilterChange('reporter_email')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os reporters" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os reporters</SelectItem>
                          {filterOptions.reporters?.filter(r => r.id && r.id !== '').map(reporter => (
                            <SelectItem key={reporter.id} value={reporter.id}>{reporter.name}</SelectItem>
                          ))}
                          {filterOptions.reporters?.some(r => !r.id || r.id === '') && (
                            <SelectItem value="sem-valor">Sem reporter</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Versão */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Versão/Release</label>
                      <Select
                        value={filters.fix_version || ''}
                        onValueChange={handleSelectFilterChange('fix_version')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as versões" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas as versões</SelectItem>
                          {filterOptions.versions?.filter(v => v && v !== '').map(version => (
                            <SelectItem key={version} value={version}>{version}</SelectItem>
                          ))}
                          {filterOptions.versions?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem versão</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data de criação - início */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Criado após</label>
                      <Input
                        type="date"
                        value={filters.created_after}
                        onChange={(e) => handleFilterChange('created_after', e.target.value)}
                      />
                    </div>

                    {/* Data de criação - fim */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Criado antes</label>
                      <Input
                        type="date"
                        value={filters.created_before}
                        onChange={(e) => handleFilterChange('created_before', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={clearFilters} variant="outline">
                      Limpar Todos os Filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {dashboardStats && (
                <>
                  {/* Cards de estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Issues</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.total_issues}</div>
                        {projectTotalIssues !== null && (
                          <div className="text-xs text-gray-500 mt-1">Total do Projeto: {projectTotalIssues}</div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Criadas (30 dias)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.recent_issues}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolvidas (30 dias)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.resolved_issues}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardStats.recent_issues > 0 
                            ? Math.round((dashboardStats.resolved_issues / dashboardStats.recent_issues) * 100)
                            : 0}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Card dos 5 tickets mais recentes */}
                  {issues && issues.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>5 Tickets Mais Recentes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-left">
                            <thead>
                              <tr>
                                <th className="font-semibold p-1">Chave</th>
                                <th className="font-semibold p-1">Resumo</th>
                                <th className="font-semibold p-1">Prioridade</th>
                                <th className="font-semibold p-1">Versão</th>
                                <th className="font-semibold p-1">Relator</th>
                                <th className="font-semibold p-1">Criado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {issues
                                .slice()
                                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                                .slice(0, 5)
                                .map((issue) => (
                                  <tr key={issue.id} className="border-b last:border-b-0">
                                    <td className="p-1 font-mono text-gray-700">{issue.jira_key}</td>
                                    <td className="p-1 truncate max-w-xs">{issue.summary}</td>
                                    <td className="p-1">{issue.priority || '-'}</td>
                                    <td className="p-1">{Array.isArray(issue.fix_versions) ? (issue.fix_versions.length > 0 ? issue.fix_versions.join(', ') : '-') : (issue.fix_versions || '-')}</td>
                                    <td className="p-1">{issue.reporter_name || '-'}</td>
                                    <td className="p-1">{issue.created_date ? new Date(issue.created_date).toLocaleDateString() : '-'}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Distribuição por Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dashboardStats && dashboardStats.status_distribution ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={groupedStatusDistribution}
                                cx="40%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="status"
                              >
                                {groupedStatusDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ maxHeight: 220, overflowY: 'auto', fontSize: 12 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div>Carregando gráfico...</div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Gráfico de Tipos */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Distribuição por Tipo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={dashboardStats.type_distribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Timeline */}
                    {timelineData && (
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle>Timeline - Criadas vs Resolvidas (30 dias)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={timelineData.created_timeline}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="count" stroke="#8884d8" name="Criadas" />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Seção separada para os Tops */}
                  <div className="flex flex-row gap-8 w-full mt-10">
                    {/* Top Responsáveis */}
                    <Card className="flex-1 min-w-0 shadow-lg border border-gray-200 rounded-xl transition-shadow duration-200 hover:shadow-xl px-16 py-10">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <User className="text-blue-500 w-5 h-5" />
                        <CardTitle className="whitespace-nowrap overflow-hidden text-ellipsis block text-xl" style={{maxWidth: '100%'}}>
                          Top Responsáveis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {dashboardStats.assignee_distribution.slice(0, 5).map((assignee, index) => (
                            <div key={index} className={`flex flex-row items-center justify-between gap-4 mb-3 px-4 py-3 rounded-lg shadow-sm ${index === 0 ? 'bg-blue-50 font-bold' : 'bg-white'} border border-gray-100`}>
                              <span className="text-base font-semibold text-gray-900 break-words flex-1">{assignee.assignee}</span>
                              <span className={`inline-block text-lg font-bold px-4 py-1 rounded-full ${index === 0 ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-800'}`}>{assignee.count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    {/* Top Relatores */}
                    <Card className="flex-1 min-w-0 shadow-lg border border-gray-200 rounded-xl transition-shadow duration-200 hover:shadow-xl px-16 py-10">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <Star className="text-purple-500 w-5 h-5" />
                        <CardTitle className="whitespace-nowrap overflow-hidden text-ellipsis block text-xl" style={{maxWidth: '100%'}}>
                          Top Relatores
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {dashboardStats.reporter_distribution?.slice(0, 5).map((reporter, index) => (
                            <div key={index} className={`flex flex-row items-center justify-between gap-4 mb-3 px-4 py-3 rounded-lg shadow-sm ${index === 0 ? 'bg-purple-50 font-bold' : 'bg-white'} border border-gray-100`}>
                              <span className="text-base font-semibold text-gray-900 break-words flex-1">{reporter.reporter}</span>
                              <span className={`inline-block text-lg font-bold px-4 py-1 rounded-full ${index === 0 ? 'bg-purple-400 text-white' : 'bg-gray-200 text-gray-800'}`}>{reporter.count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    {/* Top Releases */}
                    <Card className="flex-1 min-w-0 shadow-lg border border-gray-200 rounded-xl transition-shadow duration-200 hover:shadow-xl px-16 py-10">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <Tag className="text-green-500 w-5 h-5" />
                        <CardTitle className="whitespace-nowrap overflow-hidden text-ellipsis block text-xl" style={{maxWidth: '100%'}}>
                          Top Releases
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {dashboardStats.version_distribution && dashboardStats.version_distribution.length > 0 ? (
                            dashboardStats.version_distribution.slice(0, 5).map((version, index) => (
                              <div key={index} className={`flex flex-row items-center justify-between gap-4 mb-3 px-4 py-3 rounded-lg shadow-sm ${index === 0 ? 'bg-green-50 font-bold' : 'bg-white'} border border-gray-100`}>
                                <span className="text-base font-semibold text-gray-900 break-words flex-1">{version.version || 'Não atribuído'}</span>
                                <span className={`inline-block text-lg font-bold px-4 py-1 rounded-full ${index === 0 ? 'bg-green-400 text-white' : 'bg-gray-200 text-gray-800'}`}>{version.count}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">Nenhuma release encontrada</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Spreadsheet Tab */}
            <TabsContent value="spreadsheet" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar issues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button onClick={clearFilters} variant="outline">
                    Limpar Filtros
                  </Button>
                </div>
                <Button onClick={exportToXLSX} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar XLSX
                </Button>
              </div>

              {/* Bloco de filtros avançados abaixo da aba Planilha */}
              <Card>
                <CardHeader>
                  <CardTitle>Filtros Avançados</CardTitle>
                  <CardDescription>
                    Configure filtros para refinar a visualização dos dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Status */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select
                        value={filters.status || ''}
                        onValueChange={handleSelectFilterChange('status')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os status</SelectItem>
                          {filterOptions.statuses?.filter(v => v && v !== '').map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                          {filterOptions.statuses?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem status</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo</label>
                      <Select
                        value={filters.issue_type || ''}
                        onValueChange={handleSelectFilterChange('issue_type')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os tipos</SelectItem>
                          {filterOptions.types?.filter(v => v && v !== '').map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          {filterOptions.types?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem tipo</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Prioridade */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Prioridade</label>
                      <Select
                        value={filters.priority || ''}
                        onValueChange={handleSelectFilterChange('priority')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as prioridades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas as prioridades</SelectItem>
                          {filterOptions.priorities?.filter(v => v && v !== '').map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                          {filterOptions.priorities?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem prioridade</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Responsável */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Responsável</label>
                      <Select
                        value={filters.assignee_email || ''}
                        onValueChange={handleSelectFilterChange('assignee_email')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os responsáveis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os responsáveis</SelectItem>
                          {filterOptions.assignees?.filter(a => a.id && a.id !== '').map(assignee => (
                            <SelectItem key={assignee.id} value={assignee.id}>{assignee.name}</SelectItem>
                          ))}
                          {filterOptions.assignees?.some(a => !a.id || a.id === '') && (
                            <SelectItem value="sem-valor">Sem responsável</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reporter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Reporter</label>
                      <Select
                        value={filters.reporter_email || ''}
                        onValueChange={handleSelectFilterChange('reporter_email')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os reporters" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os reporters</SelectItem>
                          {filterOptions.reporters?.filter(r => r.id && r.id !== '').map(reporter => (
                            <SelectItem key={reporter.id} value={reporter.id}>{reporter.name}</SelectItem>
                          ))}
                          {filterOptions.reporters?.some(r => !r.id || r.id === '') && (
                            <SelectItem value="sem-valor">Sem reporter</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Versão */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Versão/Release</label>
                      <Select
                        value={filters.fix_version || ''}
                        onValueChange={handleSelectFilterChange('fix_version')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as versões" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas as versões</SelectItem>
                          {filterOptions.versions?.filter(v => v && v !== '').map(version => (
                            <SelectItem key={version} value={version}>{version}</SelectItem>
                          ))}
                          {filterOptions.versions?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem versão</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data de criação - início */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Criado após</label>
                      <Input
                        type="date"
                        value={filters.created_after}
                        onChange={(e) => handleFilterChange('created_after', e.target.value)}
                      />
                    </div>

                    {/* Data de criação - fim */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Criado antes</label>
                      <Input
                        type="date"
                        value={filters.created_before}
                        onChange={(e) => handleFilterChange('created_before', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={clearFilters} variant="outline">
                      Limpar Todos os Filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chave</TableHead>
                          <TableHead>Resumo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Prioridade</TableHead>
                          <TableHead>Versão/Release</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Criado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">
                              Carregando...
                            </TableCell>
                          </TableRow>
                        ) : filteredIssues.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">
                              Nenhuma issue encontrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredIssues.map((issue) => (
                            <TableRow key={issue.id}>
                              <TableCell className="font-medium">{issue.jira_key}</TableCell>
                              <TableCell className="max-w-xs truncate">{issue.summary}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(issue.status)}>
                                  {issue.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{issue.issue_type}</TableCell>
                              <TableCell>
                                {issue.priority && (
                                  <Badge className={getPriorityColor(issue.priority)}>
                                    {issue.priority}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{Array.isArray(issue.fix_versions) ? (issue.fix_versions.length > 0 ? issue.fix_versions.join(', ') : '-') : (issue.fix_versions || '-')}</TableCell>
                              <TableCell>{issue.assignee_name || '-'}</TableCell>
                              <TableCell>{issue.reporter_name || '-'}</TableCell>
                              <TableCell>
                                {issue.created_date ? new Date(issue.created_date).toLocaleDateString() : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Filtros Avançados</CardTitle>
                  <CardDescription>
                    Configure filtros para refinar a visualização dos dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Status */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select
                        value={filters.status || ''}
                        onValueChange={handleSelectFilterChange('status')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os status</SelectItem>
                          {filterOptions.statuses?.filter(v => v && v !== '').map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                          {filterOptions.statuses?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem status</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo</label>
                      <Select
                        value={filters.issue_type || ''}
                        onValueChange={handleSelectFilterChange('issue_type')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os tipos</SelectItem>
                          {filterOptions.types?.filter(v => v && v !== '').map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          {filterOptions.types?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem tipo</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Prioridade */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Prioridade</label>
                      <Select
                        value={filters.priority || ''}
                        onValueChange={handleSelectFilterChange('priority')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as prioridades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas as prioridades</SelectItem>
                          {filterOptions.priorities?.filter(v => v && v !== '').map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                          {filterOptions.priorities?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem prioridade</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Responsável */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Responsável</label>
                      <Select
                        value={filters.assignee_email || ''}
                        onValueChange={handleSelectFilterChange('assignee_email')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os responsáveis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os responsáveis</SelectItem>
                          {filterOptions.assignees?.filter(a => a.id && a.id !== '').map(assignee => (
                            <SelectItem key={assignee.id} value={assignee.id}>{assignee.name}</SelectItem>
                          ))}
                          {filterOptions.assignees?.some(a => !a.id || a.id === '') && (
                            <SelectItem value="sem-valor">Sem responsável</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reporter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Reporter</label>
                      <Select
                        value={filters.reporter_email || ''}
                        onValueChange={handleSelectFilterChange('reporter_email')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os reporters" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os reporters</SelectItem>
                          {filterOptions.reporters?.filter(r => r.id && r.id !== '').map(reporter => (
                            <SelectItem key={reporter.id} value={reporter.id}>{reporter.name}</SelectItem>
                          ))}
                          {filterOptions.reporters?.some(r => !r.id || r.id === '') && (
                            <SelectItem value="sem-valor">Sem reporter</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Versão */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Versão/Release</label>
                      <Select
                        value={filters.fix_version || ''}
                        onValueChange={handleSelectFilterChange('fix_version')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as versões" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas as versões</SelectItem>
                          {filterOptions.versions?.filter(v => v && v !== '').map(version => (
                            <SelectItem key={version} value={version}>{version}</SelectItem>
                          ))}
                          {filterOptions.versions?.some(v => !v || v === '') && (
                            <SelectItem value="sem-valor">Sem versão</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data de criação - início */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Criado após</label>
                      <Input
                        type="date"
                        value={filters.created_after}
                        onChange={(e) => handleFilterChange('created_after', e.target.value)}
                      />
                    </div>

                    {/* Data de criação - fim */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Criado antes</label>
                      <Input
                        type="date"
                        value={filters.created_before}
                        onChange={(e) => handleFilterChange('created_before', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={clearFilters} variant="outline">
                      Limpar Todos os Filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!selectedProject && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um projeto
                </h3>
                <p className="text-gray-600">
                  Escolha um projeto no menu acima para visualizar o dashboard e a planilha de issues
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App


import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { RefreshCw, Download, Filter, Search, BarChart3, Table as TableIcon, Settings, User, Star, Tag, Trophy, Clock, TrendingUp, CheckCircle, Activity } from 'lucide-react'
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
  const [timelineDays, setTimelineDays] = useState(90)
  
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
      fetchTimelineData(timelineDays)
      fetchFilterOptions()
      fetchProjectTotalIssues()
    }
  }, [selectedProject, filters, currentPage, timelineDays])

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

  const fetchTimelineData = async (days = 90) => {
    if (!selectedProject) return
    
    try {
      const params = new URLSearchParams({ ...getActiveFilters(), days: days });
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
                {loading && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-1"></div>}
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
                  {/* Cards de Estatísticas */}
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                              </div>
                              <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total de Issues</p>
                              <p className="text-2xl font-bold">{dashboardStats.total_issues}</p>
                              {projectTotalIssues && projectTotalIssues !== dashboardStats.total_issues && (
                                <p className="text-xs text-gray-500">
                                  {projectTotalIssues} no projeto total
                                </p>
                              )}
                            </div>
                            <BarChart3 className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Criadas (30 dias)</p>
                              <p className="text-2xl font-bold">{dashboardStats.recent_issues}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Resolvidas (30 dias)</p>
                              <p className="text-2xl font-bold">{dashboardStats.resolved_issues}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Taxa de Resolução</p>
                              <p className="text-2xl font-bold">
                                {dashboardStats.recent_issues > 0 
                                  ? Math.round((dashboardStats.resolved_issues / dashboardStats.recent_issues) * 100)
                                  : 0}%
                              </p>
                            </div>
                            <Activity className="h-8 w-8 text-orange-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

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
                    {loading ? (
                      <Card className="lg:col-span-2 animate-pulse">
                        <CardHeader>
                          <div className="h-6 bg-gray-200 rounded w-80 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-96"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ) : timelineData && (timelineData.created_timeline || timelineData.resolved_timeline) ? (
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                Timeline - Criadas vs Resolvidas ({timelineDays} dias)
                              </CardTitle>
                              <CardDescription>
                                Comparação entre issues criadas e resolvidas ao longo do tempo
                              </CardDescription>
                            </div>
                            <Select value={timelineDays.toString()} onValueChange={(value) => setTimelineDays(parseInt(value))}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">30 dias</SelectItem>
                                <SelectItem value="60">60 dias</SelectItem>
                                <SelectItem value="90">90 dias</SelectItem>
                                <SelectItem value="180">6 meses</SelectItem>
                                <SelectItem value="365">1 ano</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={350}>
                            <LineChart
                              data={(() => {
                                // Combinar dados de criadas e resolvidas
                                const allDates = new Set();
                                const created = timelineData.created_timeline || [];
                                const resolved = timelineData.resolved_timeline || [];
                                
                                // Coletar todas as datas
                                created.forEach(item => allDates.add(item.date));
                                resolved.forEach(item => allDates.add(item.date));
                                
                                // Criar mapa para acesso rápido
                                const createdMap = {};
                                const resolvedMap = {};
                                created.forEach(item => createdMap[item.date] = item.count);
                                resolved.forEach(item => resolvedMap[item.date] = item.count);
                                
                                // Combinar dados
                                return Array.from(allDates).sort().map(date => ({
                                  date,
                                  criadas: createdMap[date] || 0,
                                  resolvidas: resolvedMap[date] || 0
                                }));
                              })()}
                              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                  try {
                                    return new Date(value).toLocaleDateString('pt-BR', { 
                                      month: 'short', 
                                      day: 'numeric' 
                                    });
                                  } catch {
                                    return value;
                                  }
                                }}
                              />
                              <YAxis 
                                tick={{ fontSize: 12 }} 
                                domain={[0, 'dataMax + 1']}
                                allowDataOverflow={false}
                              />
                              <Tooltip 
                                formatter={(value, name) => [value, name === 'criadas' ? 'Issues Criadas' : 'Issues Resolvidas']}
                                labelFormatter={(label) => {
                                  try {
                                    return new Date(label).toLocaleDateString('pt-BR', { 
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    });
                                  } catch {
                                    return label;
                                  }
                                }}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="criadas" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                name="Issues Criadas"
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 3, fill: '#ffffff' }}
                                connectNulls={false}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="resolvidas" 
                                stroke="#10b981" 
                                strokeWidth={3}
                                name="Issues Resolvidas"
                                dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3, fill: '#ffffff' }}
                                connectNulls={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          
                          {/* Resumo */}
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span>
                                  <strong>Total Criadas:</strong> {' '}
                                  {(timelineData.created_timeline || []).reduce((sum, item) => sum + item.count, 0)} issues
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span>
                                  <strong>Total Resolvidas:</strong> {' '}
                                  {(timelineData.resolved_timeline || []).reduce((sum, item) => sum + item.count, 0)} issues
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                              <strong>Saldo:</strong> {' '}
                              {(timelineData.created_timeline || []).reduce((sum, item) => sum + item.count, 0) - 
                               (timelineData.resolved_timeline || []).reduce((sum, item) => sum + item.count, 0)} issues
                              {' '}(positivo = mais criadas que resolvidas)
                            </div>
                            {(() => {
                              const totalCreated = (timelineData.created_timeline || []).reduce((sum, item) => sum + item.count, 0);
                              const totalResolved = (timelineData.resolved_timeline || []).reduce((sum, item) => sum + item.count, 0);
                              
                              if (totalCreated === 0 && totalResolved === 0) {
                                return (
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                    <strong>💡 Dica:</strong> Nenhuma issue foi criada ou resolvida nos últimos {timelineDays} dias neste projeto/filtro. 
                                    Tente remover filtros ou selecionar um período maior.
                                  </div>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-gray-400" />
                            Timeline - Criadas vs Resolvidas ({timelineDays} dias)
                          </CardTitle>
                          <CardDescription>
                            Comparação entre issues criadas e resolvidas ao longo do tempo
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-center h-80 text-gray-500">
                            <div className="text-center">
                              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-lg font-medium">Nenhum dado de timeline encontrado</p>
                              <p className="text-sm">Não há dados suficientes para gerar o gráfico de timeline.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Backlog Aging */}
                    {loading ? (
                      <Card className="lg:col-span-2 animate-pulse">
                        <CardHeader>
                          <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-96"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-96 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ) : dashboardStats.backlog_aging ? (
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Backlog Aging - Tickets Abertos por Tempo
                          </CardTitle>
                          <CardDescription>
                            Análise de tickets em aberto por faixas de tempo e prioridade. 
                            Identifica issues antigas que podem precisar de atenção.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {dashboardStats.backlog_aging.length > 0 && dashboardStats.backlog_aging.some(item => item.total > 0) ? (
                            <ResponsiveContainer width="100%" height={400}>
                              <BarChart
                                data={dashboardStats.backlog_aging}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="time_range" 
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  interval={0}
                                />
                                <YAxis />
                                <Tooltip 
                                  formatter={(value, name) => {
                                    const priorityNames = {
                                      critical: 'Critical',
                                      high: 'High', 
                                      medium: 'Medium',
                                      low: 'Low',
                                      no_priority: 'Sem prioridade'
                                    };
                                    return [value, priorityNames[name] || name];
                                  }}
                                  labelFormatter={(label) => `Período: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="no_priority" stackId="stack" fill="#6b7280" name="Sem prioridade" />
                                <Bar dataKey="low" stackId="stack" fill="#16a34a" name="Low" />
                                <Bar dataKey="medium" stackId="stack" fill="#ca8a04" name="Medium" />
                                <Bar dataKey="high" stackId="stack" fill="#ea580c" name="High" />
                                <Bar dataKey="critical" stackId="stack" fill="#dc2626" name="Critical" />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                              <div className="text-center">
                                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg font-medium">Nenhum ticket em aberto encontrado</p>
                                <p className="text-sm">Todas as issues do projeto estão resolvidas.</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Legenda explicativa */}
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-600 rounded"></div>
                                <span>Critical: {dashboardStats.backlog_aging.reduce((sum, item) => sum + item.critical, 0)} tickets</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-600 rounded"></div>
                                <span>High: {dashboardStats.backlog_aging.reduce((sum, item) => sum + item.high, 0)} tickets</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                                <span>Medium: {dashboardStats.backlog_aging.reduce((sum, item) => sum + item.medium, 0)} tickets</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-600 rounded"></div>
                                <span>Low: {dashboardStats.backlog_aging.reduce((sum, item) => sum + item.low, 0)} tickets</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-600 rounded"></div>
                                <span>Sem prioridade: {dashboardStats.backlog_aging.reduce((sum, item) => sum + item.no_priority, 0)} tickets</span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                              <strong>Total de tickets abertos:</strong> {' '}
                              {dashboardStats.backlog_aging.reduce((sum, item) => sum + item.total, 0)} tickets
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-400" />
                            Backlog Aging - Tickets Abertos por Tempo
                          </CardTitle>
                          <CardDescription>
                            Análise de tickets em aberto por faixas de tempo e prioridade.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-lg font-medium">Nenhum ticket em aberto encontrado</p>
                              <p className="text-sm">Todas as issues do projeto estão resolvidas ou não há dados disponíveis.</p>
                            </div>
                          </div>
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


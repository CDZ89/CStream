import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Server, Cpu, Database, RefreshCw, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface SystemStats {
    uptime: number;
    memory: { rss: string; heapTotal: string; heapUsed: string };
    system: { platform: string; nodeVersion: string };
    botRunning: boolean;
    timestamp: string;
}

interface Ticket {
    id: string;
    username: string;
    subject: string;
    message: string;
    status: string;
    created_at: string;
}

export function MonitoringTab() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, ticketsRes] = await Promise.all([
                fetch('/api/admin/system-stats'),
                fetch('/api/admin/tickets')
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (ticketsRes.ok) {
                const data = await ticketsRes.json();
                setTickets(data.tickets || []);
            }
        } catch (e) {
            console.error("Monitoring fetch error:", e);
            // Don't toast on every interval error to avoid spam
            if (loading) toast.error("Erreur chargement monitoring");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${d}j ${h}h ${m}m`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-500" />
                    Monitoring Système & Support (Bêta)
                </h2>
                <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* System Stats */}
                <Card className="bg-black/20 border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Server className="w-4 h-4" /> Serveur
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{stats?.system.platform || '-'}</div>
                        <p className="text-xs text-muted-foreground">Node {stats?.system.nodeVersion}</p>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <span>Uptime:</span>
                            <Badge variant="outline">{stats ? formatUptime(stats.uptime) : '-'}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Cpu className="w-4 h-4" /> Ressources
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>RAM (RSS):</span>
                                <span className="font-mono">{stats?.memory.rss || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Heap Used:</span>
                                <span className="font-mono text-yellow-500">{stats?.memory.heapUsed || '-'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Database className="w-4 h-4" /> Bot Discord
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${stats?.botRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="font-bold">{stats?.botRunning ? 'En Ligne' : 'Hors Ligne'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Monitoring actif</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tickets Section */}
            <Card className="border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" /> Tickets Support
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Sujet</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Aucun ticket pour le moment
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map(ticket => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
                                        <TableCell className="font-medium">{ticket.username}</TableCell>
                                        <TableCell>{ticket.subject}</TableCell>
                                        <TableCell>
                                            <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(ticket.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

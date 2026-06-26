import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Terminal, HardDrive, Music, Video, Download, Clock, Activity, Folder } from 'lucide-react';
import { io } from 'socket.io-client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function App() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setStats(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to fetch stats", err);
        // Fallback dummy data or keep existing stats if available
        if (!stats) {
          setStats({
            totalDownloads: 0,
            downloadsToday: 0,
            totalAudio: 0,
            totalVideo: 0,
            totalSize: 0,
            history: [],
            config: { defaultLocation: 'Download' }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Establish Socket.IO connection
    const socket = io({
      path: '/socket.io',
      reconnectionDelayMax: 10000,
    });
    
    socket.on('statsUpdate', (data) => {
      setStats(data);
      setLastUpdated(new Date());
      setLoading(false);
    });

    const interval = setInterval(fetchStats, 3000); // Auto refresh every 3 seconds fallback
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center font-mono">
        <div className="text-neon-cyan animate-pulse">Initializing Cyber-Dashboard...</div>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const lineChartData = {
    labels: stats?.history?.slice(0, 10).reverse().map((h: any) => new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) || [],
    datasets: [
      {
        label: 'Recent Downloads',
        data: stats?.history?.slice(0, 10).reverse().map((h: any, i: number) => i + 1) || [],
        borderColor: '#00f3ff',
        backgroundColor: 'rgba(0, 243, 255, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { display: false },
      x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.05)' } }
    },
  };

  const doughnutData = {
    labels: ['Audio', 'Video'],
    datasets: [
      {
        data: [stats?.totalAudio || 0, stats?.totalVideo || 0],
        backgroundColor: ['#ff00ff', '#39ff14'],
        borderColor: 'transparent',
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#fff', font: { family: 'JetBrains Mono' } } },
    },
    cutout: '75%',
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white font-mono p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-glass backdrop-blur-md border border-glass-border p-6 rounded-xl shadow-[0_0_30px_rgba(0,243,255,0.1)]">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Terminal className="text-neon-cyan w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-magenta">YT DOWNLOADER</h1>
              <p className="text-xs text-white/50 tracking-widest">TERMUX CLI DASHBOARD</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
              </span>
              <span className="text-xs text-neon-green tracking-widest">SYSTEM ONLINE</span>
            </div>
            <div className="text-xs text-white/40">
              UPDATED: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Download className="text-neon-cyan w-5 h-5" />} label="Total Download" value={stats?.totalDownloads || 0} color="border-neon-cyan" />
          <StatCard icon={<Clock className="text-neon-magenta w-5 h-5" />} label="Download Hari Ini" value={stats?.downloadsToday || 0} color="border-neon-magenta" />
          <StatCard icon={<Music className="text-[#ffbd2e] w-5 h-5" />} label="Total Audio (MP3)" value={stats?.totalAudio || 0} color="border-[#ffbd2e]" />
          <StatCard icon={<Video className="text-[#ff5f56] w-5 h-5" />} label="Total Video (MP4)" value={stats?.totalVideo || 0} color="border-[#ff5f56]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-glass backdrop-blur-md border border-glass-border p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Activity className="w-32 h-32 text-neon-cyan" />
             </div>
             <h2 className="text-neon-cyan font-bold mb-6 flex items-center gap-2 text-sm tracking-wider">
               <span>❯</span> AKTIVITAS DOWNLOAD
             </h2>
             <div className="h-[250px] w-full">
               <Line data={lineChartData} options={lineChartOptions} />
             </div>
          </div>

          {/* Storage Info & Doughnut */}
          <div className="flex flex-col gap-6">
            <div className="bg-glass backdrop-blur-md border border-glass-border p-6 rounded-xl flex-1">
              <h2 className="text-neon-magenta font-bold mb-4 flex items-center gap-2 text-sm tracking-wider">
                <span>❯</span> MEDIA DISTRIBUSI
              </h2>
              <div className="h-[150px] w-full relative">
                 <Doughnut data={doughnutData} options={doughnutOptions} />
                 <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-2xl font-bold text-white">{stats?.totalDownloads || 0}</span>
                    <span className="text-[10px] text-white/50">FILES</span>
                 </div>
              </div>
            </div>

            <div className="bg-glass backdrop-blur-md border border-glass-border p-6 rounded-xl">
              <h2 className="text-neon-green font-bold mb-4 flex items-center gap-2 text-sm tracking-wider">
                <span>❯</span> PENYIMPANAN
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-white/50" />
                    <span className="text-xs text-white/60 uppercase">Lokasi Default</span>
                  </div>
                  <span className="text-xs font-bold text-white">{stats?.config?.defaultLocation || 'Download'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-white/50" />
                    <span className="text-xs text-white/60 uppercase">Ukuran Total</span>
                  </div>
                  <span className="text-sm font-bold text-neon-cyan">{formatSize(stats?.totalSize || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent History Table */}
        <div className="bg-glass backdrop-blur-md border border-glass-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-glass-border bg-white/5">
            <h2 className="text-white font-bold flex items-center gap-2 text-sm tracking-wider">
              <span className="text-neon-cyan">❯</span> RIWAYAT TERAKHIR
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border bg-black/40 text-xs text-white/50 uppercase tracking-widest">
                  <th className="p-4 font-normal">Waktu</th>
                  <th className="p-4 font-normal">Judul File</th>
                  <th className="p-4 font-normal">Tipe</th>
                  <th className="p-4 font-normal">Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {stats?.history && stats.history.length > 0 ? (
                  stats.history.slice(0, 10).map((item: any, i: number) => (
                    <tr key={i} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors text-sm">
                      <td className="p-4 text-white/60 whitespace-nowrap">
                        {new Date(item.date).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-white max-w-[200px] md:max-w-md truncate">
                        {item.title}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${item.type === 'audio' ? 'bg-[#ff00ff]/20 text-[#ff00ff]' : 'bg-[#39ff14]/20 text-[#39ff14]'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 text-white/40 text-xs truncate max-w-[150px]" title={item.path}>
                        {item.path}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-white/40 text-sm">
                      Belum ada riwayat download.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className={`bg-glass backdrop-blur-md border-b-2 border-transparent ${color} border-t border-x border-t-glass-border border-x-glass-border p-6 rounded-xl hover:bg-white/5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]`}>
      <div className="flex justify-between items-start mb-4">
        <div className="bg-black/50 p-2 rounded-lg border border-white/5">
          {icon}
        </div>
      </div>
      <div className="text-[10px] uppercase text-white/50 mb-1 tracking-widest">{label}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

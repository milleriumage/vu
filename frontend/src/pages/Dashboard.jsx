import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Cpu, Users, MessageSquare, Activity, Play, Square, RefreshCw, Cast } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="card flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
            <Icon size={24} color={color === 'primary' ? '#8b5cf6' : color === 'accent' ? '#06b6d4' : '#d946ef'} />
        </div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
    </div>
);

export default function Dashboard() {
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [roomUrl, setRoomUrl] = useState("https://pt.imvu.com/next/chat/room-105044116-306/");

    useEffect(() => {
        fetchBots();
        const interval = setInterval(fetchBots, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchBots = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('bots')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setBots(data);
    };

    const sendCommand = async (botId, command, extras = {}) => {
        setLoading(true);
        try {
            await supabase
                .from('bots')
                .update({ command, ...extras })
                .eq('id', botId);
            await fetchBots();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const activeBot = bots[0]; // Simple single-bot focus for now

    return (
        <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Cpu} label="Active Bots" value={bots.length} color="primary" />
                <StatCard icon={Users} label="Details" value={activeBot?.current_activity || "Idle"} color="secondary" />
                <StatCard icon={MessageSquare} label="Status" value={activeBot?.status || "OFFLINE"} color="accent" />
                <StatCard icon={Activity} label="Last Seen" value={activeBot ? new Date(activeBot.last_seen).toLocaleTimeString() : "-"} color="green-500" />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Active Bot Controller */}
                <div className="lg:col-span-2 card space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${activeBot?.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <h3 className="text-lg font-bold">Bot Controller: {activeBot?.imvu_username || "No Bot"}</h3>
                        </div>
                        <button onClick={fetchBots} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {activeBot ? (
                        <div className="space-y-6">
                            {/* Room Joining */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Cast size={16} className="text-primary" /> target Room URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={roomUrl}
                                        onChange={(e) => setRoomUrl(e.target.value)}
                                        placeholder="https://secure.imvu.com/next/chat/room-..."
                                        className="flex-1 bg-surfaceHighlight border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    <button
                                        onClick={() => sendCommand(activeBot.id, 'JOIN_ROOM', { target_room: roomUrl })}
                                        disabled={!roomUrl}
                                        className="btn-primary py-2 px-4 text-sm"
                                    >
                                        Join Room
                                    </button>
                                </div>
                            </div>

                            {/* Activity Log / Status Feed */}
                            <div className="space-y-2">
                                <p className="text-sm text-gray-400">Current Operation</p>
                                <div className="p-4 bg-black/40 rounded-lg font-mono text-sm text-green-400 border border-white/5">
                                    > Status: {activeBot.status}<br />
                                    > Command: {activeBot.command}<br />
                                    > Activity: {activeBot.current_activity}<br />
                                    {activeBot.ai_enabled && "> AI Brain: ACTIVE 🧠"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Create a bot in Settings to start controlling it.
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card space-y-6">
                    <h3 className="text-lg font-bold">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => sendCommand(activeBot.id, 'TEST_AI')}
                            className="flex items-center justify-center gap-2 py-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all font-medium"
                        >
                            <MessageSquare size={18} /> Test AI Reply
                        </button>

                        <button
                            onClick={() => sendCommand(activeBot.id, 'STOP')}
                            className="flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all font-medium"
                        >
                            <Square size={18} fill="currentColor" /> Stop Bot
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

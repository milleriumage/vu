import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Bot, Key, MessageSquare, ToggleLeft, User, Lock, Sparkles } from 'lucide-react';

export default function Settings() {
    const [loading, setLoading] = useState(false);
    const [bots, setBots] = useState([]);
    const [selectedBot, setSelectedBot] = useState(null);

    // Form State
    const [aiEnabled, setAiEnabled] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [geminiKey, setGeminiKey] = useState("");
    const [cannedEnabled, setCannedEnabled] = useState(false);
    const [cannedResponses, setCannedResponses] = useState([]);

    // Provider Toggles
    const [openAiEnabled, setOpenAiEnabled] = useState(true);
    const [geminiEnabled, setGeminiEnabled] = useState(false);

    const [aiModel, setAiModel] = useState("gpt-3.5-turbo"); // Default
    const [imvuUser, setImvuUser] = useState("");
    const [imvuPass, setImvuPass] = useState("");
    const [targetRoom, setTargetRoom] = useState("");
    const [manualMessage, setManualMessage] = useState("");

    // Greeting Configuration
    const [greetingEnabled, setGreetingEnabled] = useState(false);
    const [greetingMessage, setGreetingMessage] = useState("");

    useEffect(() => {
        fetchBots();
    }, []);

    useEffect(() => {
        if (selectedBot) {
            setAiEnabled(selectedBot.ai_enabled || false);
            setSystemPrompt(selectedBot.system_prompt || "You are a friendly IMVU bot.");
            setApiKey(selectedBot.openai_api_key || "");
            setGeminiKey(selectedBot.gemini_api_key || "");

            // Canned Defaults
            setCannedEnabled(selectedBot.canned_enabled || false);
            setCannedResponses(selectedBot.canned_responses || []);

            setAiModel(selectedBot.ai_model || "gpt-3.5-turbo");
            setImvuUser(selectedBot.imvu_username || "");
            setImvuPass(selectedBot.imvu_password || "");
            setTargetRoom(selectedBot.target_room || "");

            setGreetingEnabled(selectedBot.greeting_enabled || false);
            setGreetingMessage(selectedBot.greeting_message || "Hello everyone!");

            // Provider Defaults
            // If null/undefined in DB, default to TRUE for OpenAI (legacy) and FALSE for Gemini, or explicit if set
            setOpenAiEnabled(selectedBot.openai_enabled !== false);
            setGeminiEnabled(selectedBot.gemini_enabled || false);
        }
    }, [selectedBot]);

    const fetchBots = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('bots')
                .select('*')
                .eq('user_id', user.id);

            if (data && data.length > 0) {
                setBots(data);
                setSelectedBot(data[0]); // Select first bot by default
            }
        } catch (err) {
            console.error("Error fetching bots:", err);
        }
    };

    const sendMessage = async () => {
        if (!selectedBot || !manualMessage) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('bots')
                .update({
                    command: 'SEND_MESSAGE',
                    manual_message: manualMessage
                })
                .eq('id', selectedBot.id);

            if (error) throw error;
            setManualMessage(""); // Clear input
            alert("Message sent to bot!");
        } catch (err) {
            alert("Error sending message: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedBot) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('bots')
                .update({
                    ai_enabled: aiEnabled,
                    system_prompt: systemPrompt,
                    openai_api_key: apiKey,
                    gemini_api_key: geminiKey,
                    ai_model: aiModel,
                    canned_enabled: cannedEnabled,
                    canned_responses: cannedResponses,
                    openai_enabled: openAiEnabled,
                    gemini_enabled: geminiEnabled,
                    imvu_username: imvuUser,
                    imvu_password: imvuPass,
                    target_room: targetRoom,
                    greeting_enabled: greetingEnabled,
                    greeting_message: greetingMessage
                })
                .eq('id', selectedBot.id);

            if (error) throw error;
            fetchBots(); // Refresh local state
            alert("Settings saved successfully!");
        } catch (err) {
            alert("Error saving settings: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const createBot = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('bots').insert({
                id: 'bot-alpha-1',
                user_id: user.id,
                imvu_username: 'test_user',
                imvu_password: 'change_me',
                status: 'STOPPED'
            });

            if (error) throw error;
            fetchBots();
        } catch (err) {
            alert("Error creating bot: " + err.message);
        }
    };

    if (bots.length === 0) {
        return (
            <div className="p-8 text-center text-gray-400">
                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-4">No bots found.</p>
                <button onClick={createBot} className="btn-primary">
                    + Create First Bot
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Bot Settings</h2>
                <p className="text-gray-400">Configure your bot details and AI behavior.</p>
            </div>

            <div className="card space-y-6">
                {/* Bot Selector */}
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
                    <Bot className="text-primary" size={24} />
                    <div>
                        <p className="text-sm font-medium text-gray-400">Target Bot</p>
                        <p className="text-lg font-bold text-white">{selectedBot?.imvu_username || "Unknown"}</p>
                    </div>
                    <div className="ml-auto text-xs px-2 py-1 bg-primary/20 text-primary rounded border border-primary/20">
                        {selectedBot?.id}
                    </div>
                </div>

                {/* Manual Message (New) */}
                <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
                    <input
                        type="text"
                        value={manualMessage}
                        onChange={(e) => setManualMessage(e.target.value)}
                        placeholder="Type a message to send manually..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !manualMessage}
                        className="btn-primary"
                    >
                        Send
                    </button>
                </div>

                {/* Credentials Section */}
                <div className="pt-2">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <Lock size={20} className="text-secondary" /> Login Credentials
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">IMVU Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    value={imvuUser}
                                    onChange={(e) => setImvuUser(e.target.value)}
                                    className="w-full bg-surfaceHighlight border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-gray-600"
                                    placeholder="Username"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">IMVU Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    value={imvuPass}
                                    onChange={(e) => setImvuPass(e.target.value)}
                                    className="w-full bg-surfaceHighlight border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-gray-600"
                                    placeholder="Password"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-gray-300">Default Room URL (Auto-Join)</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    value={targetRoom}
                                    onChange={(e) => setTargetRoom(e.target.value)}
                                    className="w-full bg-surfaceHighlight border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-gray-600"
                                    placeholder="https://pt.imvu.com/next/chat/..."
                                />
                            </div>
                            <p className="text-xs text-gray-400">Bot will enter this room automatically after login.</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-6 space-y-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <MessageSquare size={20} className="text-accent" /> AI Configuration
                    </h3>

                    {/* AI Model Selector - Updated with correct Gemini Flash Latest */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-300">AI Model</label>
                        <select
                            value={aiModel}
                            onChange={(e) => setAiModel(e.target.value)}
                            className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                        >
                            <option value="gpt-3.5-turbo">OpenAI: GPT-3.5 Turbo (Fast)</option>
                            <option value="gpt-4o">OpenAI: GPT-4o (Smart)</option>
                            <option value="gemini-1.5-flash">Google: Gemini 1.5 Flash (Stable)</option>
                            <option value="gemini-2.0-flash-exp">Google: Gemini 2.0 Flash (New! Experimental)</option>
                            <option value="gemini-1.5-pro">Google: Gemini 1.5 Pro (Powerful)</option>
                        </select>
                    </div>

                    {/* AI Toggle */}
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                        <div className="space-y-1">
                            <label className="text-base font-medium text-white flex items-center gap-2">
                                <ToggleLeft className="text-secondary" /> Enable AI Chat
                            </label>
                            <p className="text-sm text-gray-400">Allow the bot to automatically reply using AI (OpenAI or Gemini).</p>
                        </div>
                        <button
                            onClick={() => setAiEnabled(!aiEnabled)}
                            className={`w-14 h-8 rounded-full transition-colors relative ${aiEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                        >
                            <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Auto-Greeting Configuration */}
                    <div className="space-y-6 border-b border-white/5 pb-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-base font-medium text-white flex items-center gap-2">
                                    <MessageSquare className="text-pink-400" size={20} /> Auto-Greeting
                                </label>
                                <p className="text-sm text-gray-400">Send a message automatically when entering the room.</p>
                            </div>
                            <button
                                onClick={() => setGreetingEnabled(!greetingEnabled)}
                                className={`w-14 h-8 rounded-full transition-colors relative ${greetingEnabled ? 'bg-pink-500' : 'bg-gray-700'}`}
                            >
                                <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${greetingEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {greetingEnabled && (
                            <div className="bg-white/5 rounded-xl p-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Greeting Message</label>
                                <textarea
                                    value={greetingMessage}
                                    onChange={(e) => setGreetingMessage(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500/50 outline-none resize-none h-20 placeholder:text-gray-600"
                                    placeholder="Enter your welcome message..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Canned Responses Toggle & Manager */}
                    <div className="space-y-6 border-b border-white/5 pb-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-base font-medium text-white flex items-center gap-2">
                                    <Sparkles className="text-purple-400" size={20} /> Enable Canned Responses
                                </label>
                                <p className="text-sm text-gray-400">Bot will check these triggers BEFORE using AI.</p>
                            </div>
                            <button
                                onClick={() => setCannedEnabled(!cannedEnabled)}
                                className={`w-14 h-8 rounded-full transition-colors relative ${cannedEnabled ? 'bg-purple-500' : 'bg-gray-700'}`}
                            >
                                <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${cannedEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {cannedEnabled && (
                            <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Triggers & Answers</h4>

                                {cannedResponses.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            placeholder="User says (e.g. 'Hi')"
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                            value={item.trigger}
                                            onChange={(e) => {
                                                const newReqs = [...cannedResponses];
                                                newReqs[index].trigger = e.target.value;
                                                setCannedResponses(newReqs);
                                            }}
                                        />
                                        <input
                                            placeholder="Bot replies (e.g. 'Hello!')"
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                            value={item.response}
                                            onChange={(e) => {
                                                const newReqs = [...cannedResponses];
                                                newReqs[index].response = e.target.value;
                                                setCannedResponses(newReqs);
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const newReqs = cannedResponses.filter((_, i) => i !== index);
                                                setCannedResponses(newReqs);
                                            }}
                                            className="text-red-400 hover:text-red-300 px-2"
                                        >✕</button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setCannedResponses([...cannedResponses, { trigger: "", response: "" }])}
                                    className="text-xs text-primary hover:text-white font-bold uppercase tracking-wide flex items-center gap-1"
                                >
                                    + Add Trigger
                                </button>
                            </div>
                        )}
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-300">System Personality</label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full h-32 bg-surfaceHighlight border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none placeholder:text-gray-600"
                            placeholder="Ex: You are a helpful fashion assistant..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* API Key - OpenAI */}
                        <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-300">OpenAI Configuration</label>
                                <button
                                    onClick={() => setOpenAiEnabled(!openAiEnabled)}
                                    className={`w-10 h-6 rounded-full transition-colors relative ${openAiEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${openAiEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {openAiEnabled && (
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500/50 outline-none placeholder:text-gray-600 text-sm"
                                    placeholder="sk-..."
                                />
                            )}
                        </div>

                        {/* API Key - Gemini */}
                        <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Sparkles size={14} className="text-blue-400" /> Gemini Configuration
                                </label>
                                <button
                                    onClick={() => setGeminiEnabled(!geminiEnabled)}
                                    className={`w-10 h-6 rounded-full transition-colors relative ${geminiEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${geminiEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {geminiEnabled && (
                                <input
                                    type="password"
                                    value={geminiKey}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-gray-600 text-sm"
                                    placeholder="AIza..."
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}

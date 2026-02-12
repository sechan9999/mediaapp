import React, { useState, useRef, useEffect } from 'react';
import {
    Square, Download, Share2, Settings, Mic, Monitor, PlayCircle,
    Info, Scissors, Radio, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const STREAMS_SERVER_URL = "https://your-streaming-endpoint.com"; // Placeholder for actual RTMP/WebSocket bridge

const App: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<any>(null);

    // Initialize FFmpeg
    useEffect(() => {
        const loadFFmpeg = async () => {
            try {
                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
                const ffmpeg = ffmpegRef.current;
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });
                setFfmpegLoaded(true);
            } catch (err) {
                console.error("FFmpeg Load Error:", err);
            }
        };
        loadFFmpeg();
    }, []);

    useEffect(() => {
        if (isRecording || isStreaming) {
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording, isStreaming]);

    const startMedia = async (mode: 'record' | 'stream') => {
        setError(null);
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 30 } },
                audio: true
            });

            let combinedStream = displayStream;
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const tracks = [...displayStream.getTracks(), ...audioStream.getAudioTracks()];
                combinedStream = new MediaStream(tracks);
            } catch (err) {
                console.warn("Mic access denied.");
            }

            setStream(combinedStream);
            if (videoRef.current) videoRef.current.srcObject = combinedStream;

            const options = { mimeType: 'video/webm;codecs=vp9,opus' };
            const recorder = new MediaRecorder(combinedStream, options);

            const chunks: Blob[] = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                    setRecordedChunks([...chunks]);

                    if (mode === 'stream') {
                        // Mock streaming: Send chunks to server here
                        // socket.emit('stream-chunk', event.data);
                    }
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                combinedStream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = recorder;
            recorder.start(1000);

            if (mode === 'record') setIsRecording(true);
            else setIsStreaming(true);

            setRecordedChunks([]);
            setPreviewUrl(null);

        } catch (err: any) {
            setError(err.message || "Failed to start. Check permissions.");
        }
    };

    const stopMedia = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsStreaming(false);
            setStream(null);
        }
    };

    const trimVideo = async () => {
        if (!previewUrl || !ffmpegLoaded) return;
        setIsProcessing(true);
        const ffmpeg = ffmpegRef.current;

        try {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            await ffmpeg.writeFile('input.webm', await fetchFile(blob));

            // Basic trim command: ffmpeg -i input.webm -ss HH:MM:SS -to HH:MM:SS -c copy output.webm
            await ffmpeg.exec([
                '-i', 'input.webm',
                '-ss', '00:00:00', // Mock trim start
                '-t', '10',        // Mock duration (10s)
                '-c', 'copy',
                'output.webm'
            ]);

            const data = await ffmpeg.readFile('output.webm');
            const url = URL.createObjectURL(new Blob([data], { type: 'video/webm' }));
            setPreviewUrl(url);
            alert("Video trimmed successfully (First 10s captured)!");
        } catch (err) {
            console.error(err);
            setError("Processing failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadRecording = () => {
        if (!previewUrl) return;
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = `media-${Date.now()}.webm`;
        a.click();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="container-custom">
            <header className="header-custom">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-4xl font-bold gradient-text">Media Hub Pro</h1>
                    <p className="text-gray-400 mt-1">Record, Stream, and Edit with Ease.</p>
                </motion.div>

                <div className="flex gap-4 items-center">
                    <div className="status-badge bg-white/5 border-white/10">
                        {ffmpegLoaded ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                        <span className="text-xs font-semibold">{ffmpegLoaded ? 'ENGINE READY' : 'LOADING ENGINE'}</span>
                    </div>
                    <div className="status-badge">
                        <div className={`w-2 h-2 rounded-full ${(isRecording || isStreaming) ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="font-bold text-xs">{(isRecording || isStreaming) ? 'LIVE' : 'STANDBY'}</span>
                    </div>
                </div>
            </header>

            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6 flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                </motion.div>
            )}

            <main className="main-grid">
                <section className="space-y-6">
                    <div className="glass-card !p-2 relative overflow-hidden">
                        <div className="preview-container !rounded-2xl">
                            {isRecording || isStreaming || stream ? (
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            ) : previewUrl ? (
                                <video src={previewUrl} controls className="w-full h-full" />
                            ) : (
                                <div className="flex flex-col items-center gap-4 opacity-20 py-20">
                                    <Monitor className="w-24 h-24" />
                                    <p className="text-2xl font-light">Studio Feed</p>
                                </div>
                            )}

                            {(isRecording || isStreaming) && (
                                <div className="absolute top-6 left-6 flex items-center gap-4 bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10">
                                    <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-purple-500' : 'bg-red-500'} animate-pulse`} />
                                    <span className="font-mono text-2xl font-bold tabular-nums">{formatTime(recordingTime)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {!isRecording && !isStreaming ? (
                            <>
                                <button onClick={() => startMedia('record')} className="btn-primary grow hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                    <PlayCircle className="w-6 h-6" /> Record
                                </button>
                                <button onClick={() => startMedia('stream')} className="grow bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all">
                                    <Radio className="w-6 h-6" /> Go Live
                                </button>
                            </>
                        ) : (
                            <button onClick={stopMedia} className="btn-danger w-full text-xl py-6">
                                <Square className="w-6 h-6 fill-current" /> Terminate Session
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {previewUrl && !isRecording && !isStreaming && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Scissors className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Post-Production</h4>
                                        <p className="text-gray-400 text-xs">Edit your capture before saving</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        disabled={isProcessing || !ffmpegLoaded}
                                        onClick={trimVideo}
                                        className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl font-bold text-sm border border-white/10 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Quick Trim (10s)'}
                                    </button>
                                    <button onClick={downloadRecording} className="btn-primary !min-w-0 !px-6">
                                        <Download className="w-5 h-5" /> Download
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                <aside className="space-y-6">
                    <div className="glass-card flex flex-col h-full">
                        <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                            <Settings className="w-5 h-5 text-blue-400" /> Control Tower
                        </h3>

                        <div className="space-y-8 grow">
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase text-gray-500 tracking-widest">Input Matrix</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center gap-2">
                                        <Monitor className="w-6 h-6 text-blue-400" />
                                        <span className="text-[10px] font-bold">EXTERN DISPLAY</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2 opacity-30">
                                        <Mic className="w-6 h-6" />
                                        <span className="text-[10px] font-bold">SYSTEM AUDIO</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase text-gray-500 tracking-widest">Streaming Metadata</label>
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Resolution</span>
                                        <span className="font-mono">1080p (Scaled)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Bitrate</span>
                                        <span className="font-mono">Adaptive (Auto)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-4">Assets</h4>
                                {previewUrl ? (
                                    <div className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-video hover:border-blue-500/50 transition-all cursor-pointer" onClick={downloadRecording}>
                                        <video src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-all" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <Download className="w-8 h-8 text-white drop-shadow-xl" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-32 rounded-2xl bg-white/5 border border-white/5 border-dashed flex flex-col items-center justify-center gap-2">
                                        <Info className="w-5 h-5 text-gray-600" />
                                        <p className="text-[10px] text-gray-600 font-bold">EMPTY VAULT</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button className="w-full mt-10 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-blue-500/10 hover:text-blue-400 transition-all flex items-center justify-center gap-3 text-sm font-bold">
                            <Share2 className="w-4 h-4" /> BROADCAST LINK
                        </button>
                    </div>
                </aside>
            </main>

            <footer className="mt-20 text-center">
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-700 uppercase">
                    Engineered for sechan9999 © 2026 Media Hub Pro
                </p>
            </footer>
        </div>
    );
};

export default App;

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
}

const SAMPLE_LOGS: LogEntry[] = [
    { id: "1", timestamp: new Date().toISOString(), level: "info", service: "api-gateway", message: "Request received: GET /api/v1/users" },
    { id: "2", timestamp: new Date().toISOString(), level: "info", service: "auth-service", message: "User authenticated successfully" },
    { id: "3", timestamp: new Date().toISOString(), level: "warn", service: "primary-db", message: "Query latency high: 120ms" },
];

export function useLogs(initialLogs: LogEntry[] = SAMPLE_LOGS) {
    const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
    const [isPaused, setIsPaused] = useState(false);
    const [filterLevel, setFilterLevel] = useState<LogLevel | "all">("all");
    const [search, setSearch] = useState("");

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Helper to generate a random log
    const generateLog = useCallback(() => {
        const services = ["api-gateway", "auth-service", "primary-db", "payments-worker", "redis-cache"];
        const levels: LogLevel[] = ["info", "info", "info", "warn", "error", "debug"];
        const messages = [
            "Request processed in 45ms",
            "Cache hit for key: user:123",
            "Database connection pool at 80%",
            "Payment processing started",
            "Invalid token signature detected",
            "Heartbeat received from worker-1",
            "GC cycle completed",
            "Rate limit exceeded for IP",
        ];

        const randomService = services[Math.floor(Math.random() * services.length)];
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        return {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            level: randomLevel,
            service: randomService,
            message: randomMessage,
        };
    }, []);

    // Filtered logs
    const filteredLogs = logs.filter(log => {
        const matchesLevel = filterLevel === "all" || log.level === filterLevel;
        const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
            log.service.toLowerCase().includes(search.toLowerCase());
        return matchesLevel && matchesSearch;
    });

    // Streaming effect
    useEffect(() => {
        if (isPaused) return;

        timerRef.current = setInterval(() => {
            const newLog = generateLog();
            setLogs(prev => {
                const next = [...prev, newLog];
                if (next.length > 500) next.shift(); // Keep buffer manageable
                return next;
            });
        }, 800); // New log every 800ms

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused, generateLog]);

    return {
        logs: filteredLogs,
        isPaused,
        setIsPaused,
        filterLevel,
        setFilterLevel,
        search,
        setSearch,
        clearLogs: () => setLogs([])
    };
}

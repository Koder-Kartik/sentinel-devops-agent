"use client";

import { useEffect, useState, useCallback } from "react";
import { Incident } from "@/lib/mockData";
import { useWebSocket } from "./useWebSocket";
import { WebSocketMessage } from "../lib/websocket";

export function useIncidents() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

    const processInsight = useCallback((insight: any) => {
        if (!insight) return;

        // Parse AI analysis
        let aiData: any = {};
        const rawAnalysis = insight.analysis || insight.summary || "";

        try {
            if (typeof rawAnalysis === 'string' && rawAnalysis.trim().startsWith('{')) {
                aiData = JSON.parse(rawAnalysis);
                if (aiData.choices?.[0]?.message?.content) {
                    aiData.summary = aiData.choices[0].message.content;
                }
            } else {
                aiData = { summary: rawAnalysis };
            }
        } catch {
            aiData = { summary: rawAnalysis };
        }

        const summaryUpper = (aiData.summary || "").toUpperCase();
        const isCritical = summaryUpper.includes("CRITICAL") || summaryUpper.includes("FATAL");
        const isDegraded = summaryUpper.includes("DEGRADED") || summaryUpper.includes("ERROR") || summaryUpper.includes("DOWN");

        let status: "resolved" | "failed" = "resolved";
        let title = "System Normal";
        let severity: "info" | "warning" | "critical" = "info";

        if (isCritical) {
            status = "failed";
            title = "System Critical";
            severity = "critical";
        } else if (isDegraded) {
            status = "failed";
            title = "System Degraded";
            severity = "warning";
        }

        const incident: Incident = {
            id: insight.id?.toString() || Date.now().toString(),
            title: title,
            serviceId: "system",
            status: status,
            severity: severity,
            timestamp: insight.timestamp || new Date().toISOString(),
            duration: status === "failed" ? "Action Required" : "Normal",
            rootCause: status === "failed" ? "Service Failure Detected" : "Routine Check",
            agentAction: "Monitoring",
            agentPredictionConfidence: 99,
            timeline: [],
            reasoning: aiData.summary || rawAnalysis || "No analysis available"
        };

        setIncidents([incident]);

        // Auto-open panel only if critical/degraded
        if (status === 'failed') {
            setActiveIncidentId(incident.id);
        }
    }, [activeIncidentId]); // activeIncidentId dependency to avoid re-opening if user closed it? Actually logic above ignores it, checking activeIncidentId inside might be better or remove dependency if always open recent. Logic in original was `if (!activeIncidentId && status === 'failed')`.

    const handleMessage = useCallback((message: WebSocketMessage) => {
        if (message.type === 'INCIDENT_NEW') {
            processInsight(message.data);
        } else if (message.type === 'INIT' && message.data.aiAnalysis) {
            // Reconstruct insight from initial state if needed, or fetch latest
            // For now, let's just trigger a fetch for the latest incase to be safe, or allow INIT to carry it
        }
    }, [processInsight]);

    const { isConnected } = useWebSocket({
        onMessage: handleMessage
    });

    // Initial Fetch
    useEffect(() => {
        fetch("http://localhost:4000/api/insights")
            .then(res => res.json())
            .then(data => {
                if (data.insights && Array.isArray(data.insights) && data.insights.length > 0) {
                    processInsight(data.insights[0]);
                }
            })
            .catch(e => console.error("Failed to fetch incidents:", e));
    }, [processInsight]);

    return {
        incidents,
        activeIncidentId,
        setActiveIncidentId,
        connectionStatus: isConnected ? "connected" : "disconnected",
    };
}

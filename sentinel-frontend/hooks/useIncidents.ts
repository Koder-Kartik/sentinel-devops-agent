"use client";

import { useEffect, useState, useRef } from "react";
import { Incident } from "@/lib/mockData";

export function useIncidents() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchIncidents = async () => {
        try {
            const res = await fetch("http://localhost:4000/api/insights");
            if (!res.ok) return;
            const data = await res.json();

            if (data.insights && Array.isArray(data.insights) && data.insights.length > 0) {
                // Map backend insights to frontend incidents
                // SHOW ONLY LATEST: Backend uses unshift(), so index 0 is the NEWEST.
                const latestInsight = data.insights[0];
                const insightsToProcess = [latestInsight];

                const mappedIncidents: Incident[] = insightsToProcess.map((insight: any) => {
                    let aiData: any = {};
                    try {
                        aiData = insight.analysis ? JSON.parse(insight.analysis) : {};
                    } catch (e) {
                        console.warn("Failed to parse insight analysis:", insight.id);
                    }
                    const severity = aiData.severity ? aiData.severity.toLowerCase() : "info";

                    // Critical/Warning -> Active (Failed)
                    // Info/Success -> Recent (Resolved)
                    const isCritical = severity === 'critical' || severity === 'warning' ||
                        aiData.summary?.includes("DEGRADED") || aiData.summary?.includes("CRITICAL");

                    return {
                        id: insight.id.toString(),
                        title: aiData.summary || "System Analysis Log",
                        serviceId: "system",
                        status: isCritical ? "failed" : "resolved",
                        severity: severity as any,
                        timestamp: insight.timestamp,
                        duration: isCritical ? "Action Required" : "Normal",
                        rootCause: aiData.root_cause || "Routine Check",
                        agentAction: aiData.recommendation || "Monitoring",
                        agentPredictionConfidence: aiData.confidence_score || 99,
                        timeline: [],
                        reasoning: insight.analysis
                    };
                });

                setIncidents(mappedIncidents);

                // Only auto-open if it's critical
                if (!activeIncidentId && mappedIncidents.length > 0 && mappedIncidents[0].status === 'failed') {
                    setActiveIncidentId(mappedIncidents[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchIncidents();
        intervalRef.current = setInterval(fetchIncidents, 5000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return {
        incidents,
        activeIncidentId,
        setActiveIncidentId,
        connectionStatus: "connected",
    };
}

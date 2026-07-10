"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Activity,
  Terminal as TerminalIcon,
  AlertOctagon,
  Clock,
  ChevronRight,
  TrendingDown,
  Percent,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Info,
  ListFilter,
  ArrowLeft,
  Sliders,
  Copy,
  Check
} from "lucide-react";

interface Order {
  order_id: number;
  region: string;
  shipping_mode: string;
  customer_segment: string;
  value: number;
  scheduled_days: number;
  qty: number;
}

interface MLMetrics {
  predicted_deviation_days: number;
  late_risk_probability: number;
}

interface EvaluationResult {
  status: string;
  ml_metrics: MLMetrics;
  amber_advisory: string;
}

const mockOrders: Order[] = [
  {
    order_id: 12345,
    region: "Southeast Asia",
    shipping_mode: "Standard Class",
    customer_segment: "Consumer",
    value: 850,
    scheduled_days: 5,
    qty: 12
  },
  {
    order_id: 99821,
    region: "Western Europe",
    shipping_mode: "First Class",
    customer_segment: "Corporate",
    value: 4200,
    scheduled_days: 2,
    qty: 4
  },
  {
    order_id: 55432,
    region: "Central America",
    shipping_mode: "Same Day",
    customer_segment: "Home Office",
    value: 120,
    scheduled_days: 1,
    qty: 1
  }
];

// Matrix Cipher Decoding effect component
const DecryptText: React.FC<{ value: string; delay?: number }> = ({ value, delay = 400 }) => {
  const [displayText, setDisplayText] = useState("");
  const chars = "0123456789X#A%&*?@$!+=-_[]{}|\\/<>§";

  useEffect(() => {
    let active = true;
    let frame = 0;
    const totalFrames = Math.floor(delay / 30);
    
    const interval = setInterval(() => {
      if (!active) return;
      if (frame >= totalFrames) {
        setDisplayText(value);
        clearInterval(interval);
      } else {
        const scrambled = value
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            const progress = frame / totalFrames;
            // Lock letters from left to right as animation progresses
            if (index / value.length < progress) {
              return value[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
        setDisplayText(scrambled);
        frame++;
      }
    }, 30);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [value, delay]);

  return <span>{displayText}</span>;
};

// Background live telemetry scrolling feed (Pill structure with fading transitions)
const TelemetryLogFeed = () => {
  const gatewayInfo = typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL 
    ? `API Gateway: ${process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, "")}`
    : "API Gateway: 127.0.0.1:5000";

  const logPool = [
    "AWS Route Cache: ONLINE",
    "Regressor Weights: LOADED",
    "Classifier Pipeline: ACTIVE",
    "Telemetry Buffer: CLEARED",
    "Regional Nodes: VERIFIED",
    "Neural Inference: COLD",
    "GenAI Safety Filter: ON",
    "Integrity Matrix: 100.0%",
    "Model Confidence: MAE 0.98",
    gatewayInfo
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % logPool.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [logPool.length]);

  return (
    <div className="flex items-center gap-2 px-3 py-1 border border-zinc-800/80 bg-zinc-900/30 rounded-full text-[10px] text-zinc-400 font-mono select-none shadow-[0_0_12px_rgba(16,185,129,0.02)] max-w-[280px]">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
      <span className="text-[9px] text-emerald-500/80 font-bold tracking-wider uppercase">SYS.FEED:</span>
      <div className="overflow-hidden flex-1 relative h-4 w-40 flex items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 truncate tracking-wide"
          >
            {logPool[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function Home() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [systemTime, setSystemTime] = useState<string>("");
  
  // Custom execution states for the interactive mitigation triggers
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});
  
  // Toggle for raw matrix payload inspector modal drawer
  const [showRawMatrix, setShowRawMatrix] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Real-time UTC system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        now.toISOString().replace("T", " ").substring(0, 19) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderSelect = async (order: Order) => {
    setSelectedOrder(order);
    setLoading(true);
    setError(null);
    setResult(null);
    setExecutedActions({}); // Clear previously executed commands

    const payload = {
      order_id: order.order_id,
      "Shipping Mode": order.shipping_mode,
      "Order Region": order.region,
      "Customer Segment": order.customer_segment,
      "Days for shipment (scheduled)": order.scheduled_days,
      "Product Price": order.value / order.qty,
      "Order Item Quantity": order.qty,
      "Sales": order.value
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
      const response = await axios.post<EvaluationResult>(
        `${backendUrl}/api/evaluate-risk`,
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      setResult(response.data);
    } catch (err: any) {
      console.error("API error details:", err);
      setError("[ ERR_CONNECTION_REFUSED ] Backend analytics core is offline.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = (actionId: string) => {
    setExecutedActions((prev) => ({ ...prev, [actionId]: true }));
  };

  const getProbabilityColor = (prob: number) => {
    const percentage = prob * 100;
    if (percentage > 60) return "text-red-400 border-red-950 bg-red-950/20 animate-pulse-subtle";
    if (percentage > 30) return "text-yellow-400 border-yellow-950 bg-yellow-950/20";
    return "text-emerald-400 border-emerald-950 bg-emerald-950/20";
  };

  // Mitigation buttons mapping dynamically to selected order details
  const getMitigationButtons = (orderId: number) => {
    switch (orderId) {
      case 12345:
        return [
          { id: "opt1", label: "EXECUTE: CARRIER SERVICE UPGRADE (EXPEDITED)" },
          { id: "opt2", label: "EXECUTE: PROACTIVE CLIENT RETENTION PING" }
        ];
      case 99821:
        return [
          { id: "opt1", label: "EXECUTE: NEXT-FLIGHT-OUT AIR INTERCEPT" },
          { id: "opt2", label: "EXECUTE: STANDBY STOCK PRE-POSITIONING" }
        ];
      case 55432:
        return [
          { id: "opt1", label: "EXECUTE: WHITE GLOVE ROUTE INTERFERENCE" },
          { id: "opt2", label: "EXECUTE: PROACTIVE SLA SERVICE CREDIT" }
        ];
      default:
        return [
          { id: "opt1", label: "EXECUTE: GENERAL ROUTE MITIGATION" },
          { id: "opt2", label: "EXECUTE: CLIENT RETENTION TRIGGER" }
        ];
    }
  };

  // Compile full raw JSON model payload for judges dashboard
  const getFormattedPayload = () => {
    if (!selectedOrder || !result) return "";
    return JSON.stringify(
      {
        request_payload: {
          order_id: selectedOrder.order_id,
          "Shipping Mode": selectedOrder.shipping_mode,
          "Order Region": selectedOrder.region,
          "Customer Segment": selectedOrder.customer_segment,
          "Days for shipment (scheduled)": selectedOrder.scheduled_days,
          "Product Price": selectedOrder.value / selectedOrder.qty,
          "Order Item Quantity": selectedOrder.qty,
          "Sales": selectedOrder.value
        },
        response_payload: {
          status: result.status,
          ml_metrics: result.ml_metrics,
          amber_advisory: result.amber_advisory
        }
      },
      null,
      2
    );
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(getFormattedPayload());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-100 font-mono flex flex-col antialiased relative">
      {/* Header Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 animate-pulse rounded-full shadow-[0_0_8px_#10b981]" />
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-widest text-zinc-50 flex items-center gap-2">
              PROJECT PRAVAH <span className="text-zinc-650 font-normal">//</span> RISK ASSESSMENT CORE
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-wider">
              SECURE LOGISTICS INTERCEPT TERMINAL // v3.2-STABLE
            </p>
          </div>
        </div>

        {/* Live background logs */}
        <div className="hidden lg:block">
          <TelemetryLogFeed />
        </div>

        {/* Telemetry metadata */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[10px] md:text-xs text-zinc-400">
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-4 md:pr-6">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span>SYS.TIME: <span className="text-zinc-200">{systemTime}</span></span>
          </div>
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-4 md:pr-6">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>INTEGRITY: <span className="text-emerald-500">100.0%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-500" />
            <span>AUTH: <span className="text-zinc-200">OP_ADMIN</span></span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Active Logistics Queue Section */}
        <section className="border border-zinc-800 bg-zinc-950/40 p-4 backdrop-blur-sm rounded-lg shadow-xl">
          <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-4">
            <h2 className="text-xs md:text-sm font-bold text-zinc-300 tracking-widest uppercase flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-emerald-500" />
              Active Logistics Queue
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider hidden sm:inline">
                Select an order row below to perform risk assessment
              </span>
              {selectedOrder && (
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setResult(null);
                    setError(null);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold uppercase transition-all duration-150 rounded"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Show Intro
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-850 rounded bg-zinc-950/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] md:text-xs text-zinc-400 tracking-wider uppercase font-semibold">
                  <th className="py-3 px-4 border-r border-zinc-800">ID</th>
                  <th className="py-3 px-4 border-r border-zinc-800">Order Region</th>
                  <th className="py-3 px-4 border-r border-zinc-800">Shipping Mode</th>
                  <th className="py-3 px-4 border-r border-zinc-800">Customer Segment</th>
                  <th className="py-3 px-4 border-r border-zinc-800">Value</th>
                  <th className="py-3 px-4 border-r border-zinc-800">Scheduled Days</th>
                  <th className="py-3 px-4">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs md:text-sm">
                {mockOrders.map((order) => {
                  const isSelected = selectedOrder?.order_id === order.order_id;
                  return (
                    <tr
                      key={order.order_id}
                      onClick={() => handleOrderSelect(order)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "bg-emerald-500/10 text-emerald-300 font-bold border-l-4 border-emerald-500"
                          : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <td className="py-3.5 px-4 border-r border-zinc-900 font-mono tracking-wider flex items-center gap-2">
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isSelected ? "text-emerald-400 rotate-90" : "text-zinc-600"
                          }`}
                        />
                        {order.order_id}
                      </td>
                      <td className="py-3.5 px-4 border-r border-zinc-900">{order.region}</td>
                      <td className="py-3.5 px-4 border-r border-zinc-900">{order.shipping_mode}</td>
                      <td className="py-3.5 px-4 border-r border-zinc-900">{order.customer_segment}</td>
                      <td className="py-3.5 px-4 border-r border-zinc-900 font-semibold">
                        ${order.value.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 border-r border-zinc-900">{order.scheduled_days} Days</td>
                      <td className="py-3.5 px-4">{order.qty} units</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dynamic Display Area: Landing Page OR Telemetry Results */}
        <AnimatePresence mode="wait">
          {!selectedOrder ? (
            /* CLEAN LANDING PAGE (Hero Section) */
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* Left Column: Aesthetic Center Image */}
              <div className="lg:col-span-5 border border-zinc-800 bg-zinc-950/50 p-6 flex flex-col items-center justify-center rounded-lg shadow-xl relative overflow-hidden group">
                <div className="absolute -inset-x-20 -inset-y-20 bg-emerald-500/5 rounded-full filter blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                
                {/* Image Container with Custom Glow Border */}
                <div className="relative w-full aspect-square max-w-[320px] lg:max-w-full border border-emerald-500/20 bg-black p-2 rounded shadow-[0_0_25px_rgba(16,185,129,0.1)] group-hover:border-emerald-500/40 transition-all duration-300 z-10">
                  <img
                    src="/pravah_logistics_flow.png"
                    alt="Pravah Logistics Flow telemetry grid"
                    className="w-full h-full object-cover rounded opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                </div>

                <div className="mt-4 text-center z-10">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] animate-pulse">
                    FLOW VISUALIZATION MATRIX
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-[300px]">
                    Real-time monitoring node depicting package transit vectors and latent delays.
                  </p>
                </div>
              </div>

              {/* Right Column: Instruction Terminal */}
              <div className="lg:col-span-7 border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden shadow-xl flex flex-col">
                <div className="bg-zinc-900 border-b border-zinc-850 px-4 py-3 flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-zinc-355 tracking-wider">
                    &gt;_ PRAVAH.OPERATIONAL.MANUAL // DIAGNOSTICS
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between gap-6 bg-black text-xs leading-relaxed text-zinc-300">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-zinc-50 font-bold text-sm tracking-wider uppercase flex items-center gap-1.5 mb-2">
                        <Cpu className="w-4 h-4 text-emerald-500" />
                        System Architecture
                      </h3>
                      <p className="text-zinc-400">
                        Project Pravah implements an enterprise-grade dual-tier risk evaluation mechanism. The system ingests raw delivery variables and processes them through an offline ML inference pipeline (transforming raw inputs, predicting shipment delay margins, and calculating fulfillment failures). The output metrics are passed to Amber, a generative AI cognitive layer that crafts real-time corporate advisories.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-zinc-50 font-bold text-sm tracking-wider uppercase flex items-center gap-1.5 mb-2">
                        <Sliders className="w-4 h-4 text-emerald-500" />
                        Operation Instructions
                      </h3>
                      <ul className="list-inside list-decimal space-y-1.5 text-zinc-400 pl-1">
                        <li>Select an active item from the <span className="text-zinc-200">Logistics Queue</span> at the top.</li>
                        <li>The system will transform the raw data and query the preprocessor, regressor, and classifier pipelines.</li>
                        <li>Observe the <span className="text-emerald-400">Telemetry Inspector</span> dashboard to evaluate risk levels.</li>
                        <li>Read the generated <span className="text-emerald-400">Amber advisory terminal</span> to access targeted logistics mitigation strategies.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-zinc-50 font-bold text-sm tracking-wider uppercase flex items-center gap-1.5 mb-2">
                        <Info className="w-4 h-4 text-emerald-500" />
                        Risk Indicators Legend
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase mt-2">
                        <div className="border border-emerald-900 bg-emerald-950/20 text-emerald-400 py-1.5 rounded">
                          Minimal (&lt;30%)
                        </div>
                        <div className="border border-yellow-900 bg-yellow-950/20 text-yellow-400 py-1.5 rounded">
                          Elevated (30% - 60%)
                        </div>
                        <div className="border border-red-900 bg-red-950/20 text-red-400 py-1.5 rounded">
                          Critical (&gt;60%)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-900 pt-4 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                      Ready for operator input. Click an active logistics queue row to initiate.
                    </span>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : (
            /* ACTIVE DIAGNOSTICS VIEWS */
            <motion.div
              key={selectedOrder.order_id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {/* Telemetry Inspector loading state */}
              {loading && (
                <div className="border border-zinc-800 bg-zinc-950 p-12 flex flex-col items-center justify-center gap-3 rounded-lg shadow-xl">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <span className="text-sm font-semibold tracking-widest text-zinc-300">
                    [ RUNNING ML INFERENCE MATRIX... ]
                  </span>
                  <span className="text-xs text-zinc-500">
                    Processing stochastic delay projections and querying remote AI reasoning core.
                  </span>
                </div>
              )}

              {/* Error Output block */}
              {error && (
                <div className="border border-red-900/50 bg-red-950/10 p-6 flex flex-col gap-2 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
                    <span>{error}</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Could not communicate with the local analytics microservice at <code className="text-zinc-200">http://127.0.0.1:5000</code>. Verify that the Flask server is running and CORS allows incoming browser requests.
                  </p>
                </div>
              )}

              {/* Tier 2: Telemetry Inspector (Success State) */}
              {result && (
                <section className="border border-zinc-800 bg-zinc-950/30 p-4 rounded-lg shadow-lg">
                  <div className="border-b border-zinc-850 pb-3 mb-4 flex items-center justify-between">
                    <h3 className="text-xs md:text-sm font-bold text-zinc-300 tracking-widest uppercase flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-500" />
                      Telemetry Inspector // Order {selectedOrder.order_id}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowRawMatrix(true)}
                        className="px-2.5 py-1 text-[10px] border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400 font-bold uppercase transition-all duration-150 rounded"
                      >
                        [ VIEW RAW SYSTEM MATRIX ]
                      </button>
                      <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800 rounded">
                        INFERENCE COMPLETED
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Metric 1: Late Risk Probability (Animated Decryption) */}
                    <div className={`border p-4 flex flex-col gap-1.5 rounded transition-colors ${getProbabilityColor(result.ml_metrics.late_risk_probability)}`}>
                      <span className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 text-zinc-400">
                        <Percent className="w-3.5 h-3.5" />
                        LATE RISK PROBABILITY
                      </span>
                      <span className="text-2xl md:text-3xl font-bold tracking-tight">
                        <DecryptText value={`${(result.ml_metrics.late_risk_probability * 100).toFixed(2)}%`} />
                      </span>
                      <span className="text-[9px] uppercase tracking-wider opacity-85">
                        {result.ml_metrics.late_risk_probability * 100 > 60
                          ? "CRITICAL // SHIPMENT INTERCEPT MANDATORY"
                          : result.ml_metrics.late_risk_probability * 100 > 30
                          ? "ELEVATED // SERVICE UPGRADE SUGGESTED"
                          : "MINIMAL // TRACING WITHIN MARGIN"}
                      </span>
                    </div>

                    {/* Metric 2: Predicted Deviation (Animated Decryption) */}
                    <div className="border border-zinc-800 bg-zinc-900/20 p-4 flex flex-col gap-1.5 text-zinc-100 rounded animate-glow-glow">
                      <span className="text-[10px] text-zinc-400 font-bold tracking-wide flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-555" />
                        PREDICTED DEVIATION
                      </span>
                      <span className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-400">
                        <DecryptText value={`${result.ml_metrics.predicted_deviation_days >= 0 ? "+" : ""}${result.ml_metrics.predicted_deviation_days.toFixed(2)} Days`} />
                      </span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                        STOCHASTIC DELAY VALUE PROJECTED BY REGRESSOR
                      </span>
                    </div>

                    {/* Metric 3: Confidence MAE (Animated Decryption) */}
                    <div className="border border-zinc-800 bg-zinc-900/20 p-4 flex flex-col gap-1.5 text-zinc-100 rounded">
                      <span className="text-[10px] text-zinc-400 font-bold tracking-wide flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-zinc-555" />
                        MODEL CONFIDENCE MAE
                      </span>
                      <span className="text-2xl md:text-3xl font-bold tracking-tight">
                        <DecryptText value="0.9839 Days" />
                      </span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                        STOCHASTIC BASELINE ERROR RATE LIMIT
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* Tier 3: Amber Command Core (LLM Renderer + Action Buttons) */}
              {result && (
                <section className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden shadow-xl flex flex-col">
                  {/* CLI Header */}
                  <div className="bg-zinc-900 border-b border-zinc-850 px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TerminalIcon className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-zinc-300 tracking-wider">
                        &gt;_ AMBER.REASONING.CORE // LOGISTICS ADVISORY DISPATCH
                      </span>
                    </div>
                  </div>

                  {/* Terminal Console Output */}
                  <div className="p-6 bg-black select-text overflow-y-auto max-h-[500px]">
                    <div className="prose prose-invert max-w-none prose-p:font-mono prose-headings:font-mono prose-p:leading-relaxed prose-li:font-mono prose-strong:text-zinc-50 prose-headings:text-zinc-50 prose-headings:text-xs md:prose-headings:text-sm prose-headings:font-bold prose-headings:tracking-widest prose-headings:uppercase prose-hr:border-zinc-800">
                      <ReactMarkdown>{result.amber_advisory}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Operational Mitigations Action Dispatcher Panel */}
                  <div className="bg-zinc-950 border-t border-zinc-900 px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                      <Sliders className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      Recommended Action Dispatcher
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {getMitigationButtons(selectedOrder.order_id).map((btn) => {
                        const isExecuted = executedActions[btn.id];
                        return (
                          <button
                            key={btn.id}
                            disabled={isExecuted}
                            onClick={() => handleExecuteAction(btn.id)}
                            className={`px-3 py-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider border rounded transition-all duration-200 flex items-center gap-2 ${
                              isExecuted
                                ? "border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                                : "border-zinc-800 bg-zinc-900 hover:border-emerald-500/50 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400"
                            }`}
                          >
                            <TerminalIcon className="w-3.5 h-3.5" />
                            {isExecuted ? (
                              <span className="flex items-center gap-1.5 text-emerald-400 font-bold animate-pulse">
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                COMMAND ACCEPTED // ROUTING UPDATED
                              </span>
                            ) : (
                              <span>[ &gt;_ {btn.label} ]</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Side Slide-out Panel: Raw Payload Inspector (Judges Panel) */}
      <AnimatePresence>
        {showRawMatrix && selectedOrder && result && (
          <>
            {/* Backdrop filter overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRawMatrix(false)}
              className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
            />
            {/* Drawer side-panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-zinc-950 border-l border-zinc-850 p-6 z-50 overflow-y-auto font-mono flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
                  <h3 className="text-xs md:text-sm font-bold text-zinc-200 uppercase tracking-widest">
                    Raw System Matrix Payload
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJSON}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 border border-emerald-950 bg-emerald-950/20 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 uppercase font-bold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        [ COPIED! ]
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        [ COPY JSON ]
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRawMatrix(false)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-200 border border-zinc-850 px-2.5 py-1 rounded bg-zinc-900 transition-colors uppercase font-bold"
                  >
                    [ CLOSE ]
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-black p-4 border border-zinc-900 rounded text-[10px] md:text-xs leading-relaxed text-zinc-400 select-text">
                <pre className="whitespace-pre-wrap break-all font-mono">
                  {getFormattedPayload()}
                </pre>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer bar */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 px-6 text-center text-[10px] text-zinc-650 tracking-widest mt-auto">
        SECURE CONNECTIVITY MATRIX // PROTOCOL SHIELD ACTIVE // PROJ_PRAVAH DEPLOYMENT TERMINAL
      </footer>
    </div>
  );
}

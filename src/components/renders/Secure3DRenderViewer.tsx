"use client";

import React, { useRef, useEffect } from "react";
import { Box, RefreshCw } from "lucide-react";

interface Secure3DRenderViewerProps {
  htmlContent: string;
  renderName?: string;
  activeRowData?: Record<string, any>;
  className?: string;
  height?: string;
}

/**
 * COMPONENTE DE SEGURIDAD CRÍTICA:
 * Aísla el código HTML del render 3D subido por el usuario en un iframe sandboxed.
 * Sandbox restrictivo: "allow-scripts" exclusivamente (sin "allow-same-origin").
 * Esto bloquea cualquier vector de ataque Stored XSS, robo de cookies o tokens.
 */
export default function Secure3DRenderViewer({
  htmlContent,
  renderName = "Visor 3D",
  activeRowData,
  className = "",
  height = "380px",
}: Secure3DRenderViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Enviar mensaje reactivo al render 3D cuando el usuario modifique las filas de la tabla
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow && activeRowData) {
      // Extraemos el primer texto relevante (ej. texto a grabar)
      const primaryText =
        activeRowData["col-1"] ||
        Object.values(activeRowData).find((v) => typeof v === "string" && v.length > 0) ||
        "GrabaMil 3D";

      try {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "UPDATE_RENDER_TEXT",
            text: String(primaryText),
            fullData: activeRowData,
          },
          "*"
        );
      } catch (err) {
        console.warn("Could not postMessage to sandboxed render:", err);
      }
    }
  }, [activeRowData]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl flex flex-col ${className}`}>
      {/* Header del visor */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <Box className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
            {renderName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            Sandbox Aislado Seguro
          </span>
          <button
            onClick={() => {
              if (iframeRef.current) {
                iframeRef.current.srcdoc = htmlContent;
              }
            }}
            title="Reiniciar escena 3D"
            className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-700 rounded"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas / Iframe Sandbox */}
      <div className="w-full relative" style={{ height }}>
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          title={renderName}
          sandbox="allow-scripts"
          className="w-full h-full border-none"
        />
      </div>

      {/* Info footer */}
      {activeRowData && (
        <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            Mostrando datos de fila activa:{" "}
            <strong className="text-sky-300">
              {String(activeRowData["col-1"] || "Registro actual")}
            </strong>
          </span>
          <span className="text-slate-500">Renderizado 3D en tiempo real</span>
        </div>
      )}
    </div>
  );
}


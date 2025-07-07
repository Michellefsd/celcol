"use client";

import { useState, useEffect } from "react";

interface ComponenteAvion {
  id: number;
  tipo: "MOTOR" | "HELICE" | "INSTRUMENTO" | string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  estado: "ACTIVO" | "DESINSTALADO" | "MANTENIMIENTO";
  TSN?: number | null;
  TSO?: number | null;
  TBOFecha?: string | null;
  TBOHoras?: number | null;
}

interface Props {
  componente: ComponenteAvion;
  onClose: () => void;
  onSaved?: () => void;
}

const estados = ["ACTIVO", "DESINSTALADO", "MANTENIMIENTO"];

export default function EditarAvionComponentes({ componente, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    tipo: "",
    marca: "",
    modelo: "",
    numeroSerie: "",
    estado: "ACTIVO",
    TSN: "",
    TSO: "",
    TBOFecha: "",
    TBOHoras: ""
  });

  useEffect(() => {
    if (componente) {
      setFormData({
        tipo: componente.tipo || "",
        marca: componente.marca || "",
        modelo: componente.modelo || "",
        numeroSerie: componente.numeroSerie || "",
        estado: componente.estado || "ACTIVO",
        TSN: componente.TSN?.toString() || "",
        TSO: componente.TSO?.toString() || "",
        TBOFecha: componente.TBOFecha ? componente.TBOFecha.slice(0, 10) : "",
        TBOHoras: componente.TBOHoras?.toString() || ""
      });
    }
  }, [componente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const body = {
      tipo: formData.tipo,
      marca: formData.marca,
      modelo: formData.modelo,
      numeroSerie: formData.numeroSerie,
      estado: formData.estado,
      TSN: formData.TSN ? parseFloat(formData.TSN) : null,
      TSO: formData.TSO ? parseFloat(formData.TSO) : null,
      TBOFecha: formData.TBOFecha ? new Date(formData.TBOFecha) : null,
      TBOHoras: formData.TBOHoras ? parseFloat(formData.TBOHoras) : null
    };

    await fetch(`http://localhost:3001/componentes-avion/${componente.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Editar Componente</h2>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          {[
            { name: "tipo", type: "text" },
            { name: "marca", type: "text" },
            { name: "modelo", type: "text" },
            { name: "numeroSerie", type: "text" },
            { name: "estado", type: "select" },
            { name: "TSN", type: "text" },
            { name: "TSO", type: "text" },
            { name: "TBOFecha", type: "date" },
            { name: "TBOHoras", type: "text" }
          ].map(({ name, type }) => (
            <div key={name} className="flex flex-col">
              <label className="text-sm capitalize">{name}</label>
              {type === "select" ? (
                <select
                  name={name}
                  value={formData[name as keyof typeof formData]}
                  onChange={handleChange}
                  className="border p-2 rounded"
                >
                  {estados.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  name={name}
                  value={formData[name as keyof typeof formData]}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-white sticky bottom-0 z-10">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

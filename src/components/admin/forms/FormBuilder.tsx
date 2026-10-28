"use client";

import React, { useState } from "react";
import {
  CustomForm,
  FormElement,
  FormElementType,
  FormTypeItem,
  CustomTable,
  Render3D,
} from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Plus,
  Type,
  Hash,
  Mail,
  MapPin,
  Tag,
  List,
  CircleDot,
  Table,
  Send,
  XCircle,
  Eye,
  Check,
  Sparkles,
} from "lucide-react";
import DynamicFormRenderer from "@/components/dynamic-form/DynamicFormRenderer";

interface FormBuilderProps {
  initialForm?: CustomForm;
  formTypes: FormTypeItem[];
  customTables: CustomTable[];
  renders: Render3D[];
  onSave: (form: CustomForm) => void;
  onCancel: () => void;
}

// Elemento arrastrable de la lista
function SortableElementItem({
  element,
  isSelected,
  onSelect,
  onRemove,
}: {
  element: FormElement;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const getIcon = () => {
    switch (element.type) {
      case "text":
        return <Type className="w-4 h-4 text-sky-500" />;
      case "number":
        return <Hash className="w-4 h-4 text-blue-500" />;
      case "email":
        return <Mail className="w-4 h-4 text-purple-500" />;
      case "address":
        return <MapPin className="w-4 h-4 text-emerald-500" />;
      case "label":
        return <Tag className="w-4 h-4 text-amber-500" />;
      case "select":
        return <List className="w-4 h-4 text-orange-500" />;
      case "radio":
        return <CircleDot className="w-4 h-4 text-pink-500" />;
      case "custom_table":
        return <Table className="w-4 h-4 text-indigo-500" />;
      case "button_submit":
        return <Send className="w-4 h-4 text-emerald-600" />;
      case "button_cancel":
        return <XCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
        isSelected
          ? "border-indigo-600 bg-indigo-50/70 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1 rounded"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="p-2 rounded-lg bg-slate-100">{getIcon()}</div>
        <div>
          <h4 className="text-xs font-bold text-slate-800">{element.label}</h4>
          <p className="text-[10px] text-slate-400 font-mono uppercase">
            Tipo: {element.type} {element.required ? "• Obligatorio" : ""}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-slate-300 hover:text-rose-600 p-1.5 rounded transition opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function FormBuilder({
  initialForm,
  formTypes,
  customTables,
  renders,
  onSave,
  onCancel,
}: FormBuilderProps) {
  const [name, setName] = useState(initialForm?.name || "");
  const [formTypeId, setFormTypeId] = useState(
    initialForm?.formTypeId || formTypes[0]?.id || "ft-producto"
  );
  const [customTableId, setCustomTableId] = useState<string | undefined>(
    initialForm?.customTableId || undefined
  );
  const [elements, setElements] = useState<FormElement[]>(
    initialForm?.elements || [
      { id: "elem-1", type: "label", label: "Formulario de Personalización", order: 0 },
      { id: "elem-2", type: "text", label: "Nombre o Texto Especial", required: true, order: 1 },
      { id: "elem-3", type: "button_cancel", label: "Cancelar", order: 2 },
      { id: "elem-4", type: "button_submit", label: "Enviar Petición", order: 3 },
    ]
  );

  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    initialForm?.elements?.[0]?.id || "elem-1"
  );
  const [previewMode, setPreviewMode] = useState(false);

  // Sincronizar el estado del constructor cuando se seleccione un formulario para editar
  React.useEffect(() => {
    if (initialForm) {
      setName(initialForm.name);
      setFormTypeId(initialForm.formTypeId);
      setCustomTableId(initialForm.customTableId);
      setElements(initialForm.elements);
      setSelectedElementId(initialForm.elements[0]?.id || null);
    }
  }, [initialForm]);

  // Sensores para Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, idx) => ({ ...item, order: idx }));
      });
    }
  };

  // Determinar si es de tipo PRODUCTO o CLIENTE
  const currentFormType = formTypes.find((ft) => ft.id === formTypeId);
  const isProductType = currentFormType?.name === "PRODUCTO";
  const isClientType = currentFormType?.name === "CLIENTE";

  // Agregar elemento
  const handleAddElement = (type: FormElementType) => {
    const newId = `elem-${Date.now().toString(36)}`;
    let defaultLabel = "Nuevo Campo";

    if (type === "text") defaultLabel = "Texto";
    else if (type === "number") defaultLabel = "Cantidad / Número";
    else if (type === "email") defaultLabel = "Correo Electrónico";
    else if (type === "address") defaultLabel = "Dirección";
    else if (type === "label") defaultLabel = "Título / Encabezado";
    else if (type === "select") defaultLabel = "Selección Desplegable";
    else if (type === "radio") defaultLabel = "Opciones Radio";
    else if (type === "custom_table") defaultLabel = "Tabla Personalizada 3D";
    else if (type === "button_submit") defaultLabel = "Enviar Petición";
    else if (type === "button_cancel") defaultLabel = "Cancelar";

    const newElem: FormElement = {
      id: newId,
      type,
      label: defaultLabel,
      required: type !== "label" && !type.startsWith("button_"),
      options: type === "select" || type === "radio" ? ["Opción A", "Opción B"] : undefined,
      order: elements.length,
    };

    setElements((prev) => [...prev, newElem]);
    setSelectedElementId(newId);
  };

  const handleRemoveElement = (id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const handleUpdateSelected = (field: keyof FormElement, val: any) => {
    if (!selectedElementId) return;
    setElements((prev) =>
      prev.map((e) => (e.id === selectedElementId ? { ...e, [field]: val } : e))
    );
  };

  const selectedElement = elements.find((e) => e.id === selectedElementId);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Por favor ingresa un nombre para el formulario.");
      return;
    }

    const formId =
      initialForm?.id ||
      `form-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const savedForm: CustomForm = {
      id: formId,
      name: name.trim(),
      formTypeId,
      customTableId: isProductType ? customTableId : undefined,
      elements,
      createdAt: initialForm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedForm);
  };

  const activeTable = customTables.find((t) => t.id === customTableId);
  const activeRender = renders.find((r) => r.id === activeTable?.renderId);

  return (
    <div className="space-y-6">
      {/* Banner de Modo Edición */}
      {initialForm && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-bold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-wider">
              Modo Edición
            </span>
            <span>
              Editando formulario: <strong>{initialForm.name}</strong> (ID: <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-amber-300">{initialForm.id}</code>)
            </span>
          </div>
          <div className="text-[11px] text-amber-800 font-medium">
            Creado: {new Date(initialForm.createdAt).toLocaleDateString("es-CO")}
            {initialForm.updatedAt && ` • Última modificación: ${new Date(initialForm.updatedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`}
          </div>
        </div>
      )}

      {/* Barra superior de acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 max-w-md">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Nombre del Formulario
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Formulario de Grabado Láser Personalizado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tipo de Formulario
            </label>
            <select
              value={formTypeId}
              onChange={(e) => setFormTypeId(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {formTypes.map((ft) => (
                <option key={ft.id} value={ft.id}>
                  {ft.name}
                </option>
              ))}
            </select>
          </div>

          {isProductType && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Tabla 3D Vinculada
              </label>
              <select
                value={customTableId || ""}
                onChange={(e) => setCustomTableId(e.target.value || undefined)}
                className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
              >
                <option value="">-- Sin tabla asociada --</option>
                {customTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end gap-2 pt-5">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                previewMode
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{previewMode ? "Editar Estructura" : "Previsualizar"}</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
            >
              Descartar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialForm ? "Guardar Cambios" : "Crear Formulario"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Regla visible para tipos de formulario */}
      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
        <div>
          <strong>Regla Tipo Formulario ({currentFormType?.name || "ACTIVO"}): </strong>
          {isProductType && (
            <span>
              Disponible todos los elementos básicos HTML + Tablas personalizadas interactivas con renderizado 3D en tiempo real.
            </span>
          )}
          {isClientType && (
            <span>
              Disponible exclusivamente elementos básicos HTML (inputs text, number, address, email, labels, botones).
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
          Sin límite de elementos
        </span>
      </div>

      {previewMode ? (
        /* Vista de previsualización interactiva */
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Modo Previsualización Activo
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{name || "Formulario"}</h2>
          </div>

          <DynamicFormRenderer
            form={{
              id: "preview-id",
              name: name || "Vista Previa",
              formTypeId,
              customTableId,
              elements,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            customTable={activeTable}
            render3D={activeRender}
            onSubmit={(data, rows) => {
              alert(
                `Petición enviada con éxito (Simulación):\n\nDatos: ${JSON.stringify(
                  data,
                  null,
                  2
                )}\n\nFilas de tabla: ${rows ? rows.length : 0}`
              );
            }}
            onCancel={() => {
              alert("Lógica de botón cancelar ejecutada: Cierre de formulario.");
            }}
          />
        </div>
      ) : (
        /* Constructor con 3 Columnas: Paleta | Lienzo Drag & Drop | Propiedades */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 1. Paleta de Elementos */}
          <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Paleta de Elementos HTML
            </h3>
            <p className="text-[11px] text-slate-400">
              Haz clic para agregar elementos al lienzo:
            </p>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleAddElement("text")}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-left"
              >
                <Type className="w-4 h-4 text-sky-500" />
                <span>Input Text</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement("number")}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-left"
              >
                <Hash className="w-4 h-4 text-blue-500" />
                <span>Input Number</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement("email")}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-left"
              >
                <Mail className="w-4 h-4 text-purple-500" />
                <span>Input Email</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement("address")}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-left"
              >
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Input Dirección</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement("label")}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-left"
              >
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Label / Título</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement("select")}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-left"
              >
                <List className="w-4 h-4 text-orange-500" />
                <span>Select (Desplegable)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement("radio")}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-left"
              >
                <CircleDot className="w-4 h-4 text-pink-500" />
                <span>Radio Buttons</span>
              </button>

              {/* Elementos con restricción por tipo de formulario */}
              {isProductType && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                    Solo Tipo PRODUCTO
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddElement("custom_table")}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition border border-indigo-200 text-left"
                  >
                    <Table className="w-4 h-4 text-indigo-600" />
                    <span>Tabla Interactiva 3D</span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Botones de Acción
                </span>
                <button
                  type="button"
                  onClick={() => handleAddElement("button_submit")}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200 text-left"
                >
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Botón Enviar Petición</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddElement("button_cancel")}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition border border-transparent hover:border-rose-200 text-left"
                >
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Botón Cancelar (Cerrar)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Lienzo Drag & Drop */}
          <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lienzo de Elementos ({elements.length})
              </h3>
              <span className="text-[10px] text-slate-400">
                Arrastra para reordenar la posición
              </span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={elements.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2.5 min-h-[350px]">
                  {elements.map((elem) => (
                    <SortableElementItem
                      key={elem.id}
                      element={elem}
                      isSelected={selectedElementId === elem.id}
                      onSelect={() => setSelectedElementId(elem.id)}
                      onRemove={() => handleRemoveElement(elem.id)}
                    />
                  ))}

                  {elements.length === 0 && (
                    <div className="h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs">
                      <p>Formulario vacío. Agrega elementos desde la paleta izquierda.</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* 3. Inspector de Propiedades */}
          <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Propiedades del Elemento
            </h3>

            {selectedElement ? (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 font-mono">
                  ID: {selectedElement.id} • Tipo: {selectedElement.type}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Etiqueta / Label
                  </label>
                  <input
                    type="text"
                    value={selectedElement.label}
                    onChange={(e) => handleUpdateSelected("label", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {!selectedElement.type.startsWith("button_") && selectedElement.type !== "custom_table" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Texto Placeholder
                    </label>
                    <input
                      type="text"
                      value={selectedElement.placeholder || ""}
                      onChange={(e) => handleUpdateSelected("placeholder", e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                )}

                {!selectedElement.type.startsWith("button_") && selectedElement.type !== "label" && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={!!selectedElement.required}
                      onChange={(e) => handleUpdateSelected("required", e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>Campo Obligatorio</span>
                  </label>
                )}

                {/* Si es select o radio, gestionar opciones */}
                {(selectedElement.type === "select" || selectedElement.type === "radio") && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Opciones (separadas por coma)
                    </label>
                    <textarea
                      rows={3}
                      value={selectedElement.options?.join(", ") || ""}
                      onChange={(e) =>
                        handleUpdateSelected(
                          "options",
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      placeholder="Opción 1, Opción 2, Opción 3"
                    />
                  </div>
                )}

                {/* Si es tabla personalizada, seleccionar cuál asociar */}
                {selectedElement.type === "custom_table" && isProductType && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Asociar Tabla Personalizada (con 3D)
                    </label>
                    <select
                      value={customTableId || ""}
                      onChange={(e) => setCustomTableId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    >
                      <option value="">-- Seleccionar tabla --</option>
                      {customTables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {activeRender && (
                      <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <Sparkles className="w-3.5 h-3.5" />
                        Render 3D vinculado: {activeRender.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Selecciona un elemento en el lienzo central para editar sus etiquetas y propiedades.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


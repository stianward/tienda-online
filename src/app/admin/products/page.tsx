"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { Product, ProductCategory, CustomForm } from "@/types";
import { Package, Plus, Trash2, Edit2, CheckCircle2, Image as ImageIcon } from "lucide-react";

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [forms, setForms] = useState<CustomForm[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(100000);
  const [status, setStatus] = useState<"activo" | "inactivo">("activo");
  const [imageUrl, setImageUrl] = useState("");
  const [stock, setStock] = useState(50);
  const [categoryId, setCategoryId] = useState("");
  const [formId, setFormId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setProducts(db.products);
    setCategories(db.categories);
    setForms(db.customForms);

    if (db.categories.length > 0 && !categoryId) {
      setCategoryId(db.categories[0].id);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice(100000);
    setStatus("activo");
    setImageUrl("https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80");
    setStock(50);
    setCategoryId(categories[0]?.id || "");
    setFormId(forms[0]?.id || "");
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price);
    setStatus(p.status);
    setImageUrl(p.imageUrl);
    setStock(p.stock);
    setCategoryId(p.categoryId);
    setFormId(p.formId || "");
    setShowModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const db = getDatabase();

    if (editingId) {
      const updated = db.products.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: name.trim(),
              description: description.trim(),
              price: Number(price),
              status,
              imageUrl: imageUrl.trim(),
              stock: Number(stock),
              categoryId,
              formId: formId || undefined,
            }
          : p
      );
      saveDatabase({ ...db, products: updated });
      setSuccessMsg(`Producto "${name}" actualizado con éxito.`);
    } else {
      const newId = `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newProd: Product = {
        id: newId,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        status,
        imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        stock: Number(stock),
        categoryId,
        formId: formId || undefined,
        createdAt: new Date().toISOString(),
      };
      saveDatabase({ ...db, products: [...db.products, newProd] });
      setSuccessMsg(`Producto "${newProd.name}" creado con éxito (ID: ${newProd.id}).`);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Deseas eliminar este producto?")) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        products: db.products.filter((p) => p.id !== id),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            Módulo de Productos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administra catálogo, inventario, precios y la vinculación con el formulario personalizado de compra y render 3D.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Producto</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const catObj = categories.find((c) => c.id === product.categoryId);
          const formObj = forms.find((f) => f.id === product.formId);

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src =
                        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        product.status === "activo"
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-slate-500 text-white"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="font-mono text-[10px] bg-black/70 text-white px-2 py-0.5 rounded">
                      {product.id}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-600 font-semibold">
                    <span>{catObj?.name || "Sin categoría"}</span>
                    <span className="text-slate-500 font-normal">Stock: {product.stock} un.</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {product.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <p className="text-slate-500 text-[11px]">
                      Formulario ID asignado:{" "}
                      <strong className="text-slate-800">
                        {formObj ? formObj.name : "Ninguno"}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <span className="text-base font-extrabold text-slate-900">
                  ${product.price.toLocaleString("es-CO")}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                    title="Editar producto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                {editingId ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Anillo de Plata con Grabado Personalizado"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Descripción detallada de la pieza o producto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio ($ COP)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cantidad Inventario (Stock)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL de Imagen del Producto
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Formulario Personalizado Asignado (Formulario ID)
                </label>
                <select
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white text-slate-800"
                >
                  <option value="">-- Sin formulario personalizado --</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  El cliente diligenciará este formulario al comprar el producto.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-md shadow-indigo-600/20"
                >
                  {editingId ? "Actualizar Producto" : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


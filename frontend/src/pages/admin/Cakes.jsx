import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import Modal from "../../components/ui/Modal";

import { GET_CAKES, ADD_CAKE, UPDATE_CAKE, DELETE_CAKE } from "../../graphql/cakes";

export default function Cakes() {
  const { data, loading, error, refetch } = useQuery(GET_CAKES, {
    variables: { activeOnly: false }, // admin lihat semua
    fetchPolicy: "network-only",
  });

  const [addCakeMut] = useMutation(ADD_CAKE);
  const [updateCakeMut] = useMutation(UPDATE_CAKE);
  const [deleteCakeMut] = useMutation(DELETE_CAKE);

  const cakes = useMemo(() => data?.cakes ?? [], [data]);

  const [editingId, setEditingId] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "default" });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image_url: "",
    // kalau kamu belum ada toggle aktif/nonaktif, biarkan default true
    is_active: true,
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      image_url: "",
      is_active: true,
    });
  };

  // ====== EDIT (FIX agar tidak bikin hilang) ======
  const startEdit = (cake) => {
    setEditingId(String(cake.id));
    setForm({
      name: cake.name ?? "",
      description: cake.description ?? "",
      price: String(cake.price ?? ""),
      stock: String(cake.stock ?? ""),
      image_url: cake.image_url ?? "",
      is_active: cake.is_active ?? true,
    });
  };

  // ====== DELETE (FIX tombol bisa klik) ======
  const remove = async (id) => {
    const ok = confirm("Yakin mau hapus kue ini?");
    if (!ok) return;

    try {
      await deleteCakeMut({ variables: { id: String(id) } });
      setModal({
        isOpen: true,
        title: "Berhasil",
        message: "Kue berhasil dihapus",
        type: "success",
      });
      await refetch();
    } catch (e) {
      console.error(e);
      setModal({
        isOpen: true,
        title: "Error",
        message: e.message || "Gagal hapus kue",
        type: "error",
      });
    }
  };

  // ====== SUBMIT ADD / UPDATE ======
  const submit = async () => {
    if (!form.name.trim()) {
      setModal({
        isOpen: true,
        title: "Validasi Error",
        message: "Nama kue wajib diisi",
        type: "error",
      });
      return;
    }
    if (!form.price) {
      setModal({
        isOpen: true,
        title: "Validasi Error",
        message: "Harga wajib diisi",
        type: "error",
      });
      return;
    }
    if (!form.stock) {
      setModal({
        isOpen: true,
        title: "Validasi Error",
        message: "Stock wajib diisi",
        type: "error",
      });
      return;
    }

    const price = parseInt(form.price, 10);
    const stock = parseInt(form.stock, 10);
    if (Number.isNaN(price) || price < 0) {
      setModal({
        isOpen: true,
        title: "Validasi Error",
        message: "Harga tidak valid",
        type: "error",
      });
      return;
    }
    if (Number.isNaN(stock) || stock < 0) {
      setModal({
        isOpen: true,
        title: "Validasi Error",
        message: "Stock tidak valid",
        type: "error",
      });
      return;
    }

    try {
      if (editingId) {
        // ✅ PENTING: saat update, jangan kirim is_active kalau kamu tidak punya toggle
        const input = {
          name: form.name,
          description: form.description || null,
          price,
          stock,
          image_url: form.image_url || null,
          // ❌ jangan kirim is_active agar tidak berubah jadi false/null
          // is_active: form.is_active,
        };

        await updateCakeMut({
          variables: { id: String(editingId), input },
        });

        setModal({
          isOpen: true,
          title: "Berhasil",
          message: "Kue berhasil diupdate",
          type: "success",
        });
      } else {
        const input = {
          name: form.name,
          description: form.description || null,
          price,
          stock,
          image_url: form.image_url || null,
          is_active: true,
        };

        await addCakeMut({
          variables: { input },
        });

        setModal({
          isOpen: true,
          title: "Berhasil",
          message: "Kue berhasil ditambahkan",
          type: "success",
        });
      }

      await refetch();
      resetForm();
    } catch (e) {
      console.error(e);
      setModal({
        isOpen: true,
        title: "Error",
        message: e.message || "Gagal simpan kue",
        type: "error",
      });
    }
  };

  // ====== UI ======
  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error.message}</div>;

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-pink-600 mb-2">Catalog Kue</h1>
        <p className="text-gray-600">Manage your cake catalog</p>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 border border-pink-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <input
            className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition"
            placeholder="Nama Kue"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition"
            placeholder="Harga"
            type="number"
            value={form.price}
            onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
          />
          <input
            className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition"
            placeholder="Stock"
            type="number"
            value={form.stock}
            onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))}
          />
          <div className="md:col-span-2 flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Upload Gambar</label>
              <input
                type="file"
                accept="image/*"
                className="border rounded-xl px-4 py-2 w-full"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    // reader.result is a data URL (base64)
                    setForm((s) => ({ ...s, image_url: reader.result }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Pilih gambar dari komputer (maks 10MB). Gambar akan di-upload saat simpan.</p>
            </div>

            <div className="w-32 h-20 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
              {form.image_url ? (
                // show preview: data url or absolute url
                <img
                  src={form.image_url}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs text-gray-400">Preview</div>
              )}
            </div>
          </div>

          <div className="md:col-span-5">
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition"
              placeholder="Deskripsi Kue"
              value={form.description}
              rows="3"
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5 justify-end">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-medium transition transform hover:scale-105"
            >
              Batal
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            className="px-8 py-3 rounded-xl bg-pink-600 text-white hover:bg-pink-700 font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            {editingId ? "✨ Update" : "➕ Tambah"}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cakes.map((cake) => (
          <div
            key={cake.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            {/* jangan bungkus card dengan Link biar tombol pasti kepencet */}
            <div className="w-full h-64 bg-pink-50 overflow-hidden">
              {cake.image_url ? (
                <img
                  src={cake.image_url}
                  alt={cake.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>

            <div className="p-5 flex flex-col gap-2">
              <h3 className="text-xl font-bold text-pink-700">{cake.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-2">
                {cake.description || "Tidak ada deskripsi"}
              </p>
              <p className="text-gray-800 font-semibold">
                Rp {Number(cake.price).toLocaleString("id-ID")}
              </p>
              <p className="text-gray-600 text-sm">Stock: {cake.stock}</p>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => startEdit(cake)}
                  className="flex-1 bg-yellow-300 hover:bg-yellow-400 rounded-xl py-2 font-medium relative z-10"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => remove(cake.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 font-medium relative z-10"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        type={modal.type}
      >
        <p className="text-lg">{modal.message}</p>
      </Modal>
    </section>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import JSZip from "jszip";

const MonitoringPDIL = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  const [searchTerm, setSearchTerm] = useState("");

  // state filter
  const [ulpFilter, setUlpFilter] = useState("");
  const [pbmFilter, setPbmFilter] = useState("");
  const [petugasFilter, setPetugasFilter] = useState("");
  const [jenisFilter, setJenisFilter] = useState("");
  const [ketFilter, setKetFilter] = useState("");

  // state untuk foto modal
  const [selectedFoto, setSelectedFoto] = useState(null);

  useEffect(() => {
    fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTfELCjsjIkZhKELOGBb_yybu6oZOvN468uKYwKahgCyAtoJoUJyfZ0iBMWVQ4xOydbd1im79D-i6h3/pub?gid=1408204138&single=true&output=csv")
      .then((res) => res.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          worker: true,
          complete: (result) => {
            setData(result.data || []);
            setLoading(false);
          },
        });
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  // ambil opsi unik untuk dropdown
  const ulpOptions = [...new Set(data.map((row) => row["ULP"]))];
  const pbmOptions = [...new Set(data.map((row) => row["PBM"]))];
  const petugasOptions = [...new Set(data.map((row) => row["PETUGAS"]))];
  const jenisOptions = [...new Set(data.map((row) => row["JENIS KWH"]))];
  const ketOptions = [...new Set(data.map((row) => row["KET PDIL"]))];

  // filter data
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch =
        !searchTerm ||
        row["ID PELANGGAN"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row["NO METER"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row["NAMA"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row["ALAMAT"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row["GARDU TIANG"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row["RBM"]?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUlp = !ulpFilter || row["ULP"] === ulpFilter;
      const matchesPbm = !pbmFilter || row["PBM"] === pbmFilter;
      const matchesPetugas = !petugasFilter || row["PETUGAS"] === petugasFilter;
      const matchesJenis = !jenisFilter || row["JENIS KWH"] === jenisFilter;
      const matchesKet = !ketFilter || row["KET PDIL"] === ketFilter;

      return matchesSearch && matchesUlp && matchesPbm && matchesPetugas && matchesJenis && matchesKet;
    });
  }, [data, searchTerm, ulpFilter, pbmFilter, petugasFilter, jenisFilter, ketFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  const sudahDibaca = filteredData.filter(
    (r) => r["KET PDIL"] && r["KET PDIL"].trim().toUpperCase() === "SUDAH DIBACA"
  ).length;
  const belumDibaca = filteredData.filter(
    (r) => r["KET PDIL"] && r["KET PDIL"].trim().toUpperCase() !== "SUDAH DIBACA"
  ).length;

  // fungsi export ke excel
  const exportToExcel = () => {
    const exportData = filteredData.map((row, i) => ({
      NO: i + 1,
      UNIT: row["UNIT"],
      HEADER: row["HEADER"],
      ULP: row["ULP"],
      "ID PELANGGAN": row["ID PELANGGAN"],
      NAMA: row["NAMA"],
      ALAMAT: row["ALAMAT"],
      "TARIF DAYA": row["TARIF DAYA"],
      "NO METER": row["NO METER"],
      "GARDU TIANG": row["GARDU TIANG"],
      RBM: row["RBM"],
      PBM: row["PBM"],
      PETUGAS: row["PETUGAS"],
      "JENIS KWH": row["JENIS KWH"],
      "TGL PDIL": row["TGL PDIL"],
      "KET PDIL": row["KET PDIL"],
      LOKASI: row["LOKASI"],
      KORDINAT: row["KORDINAT"],
      "FILE FOTO": row["FILE FOTO"],
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PDIL");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Monitoring_PDIL.xlsx");
  };

  // fungsi download semua foto sebagai ZIP
  const downloadAllPhotos = async () => {
    const zip = new JSZip();
    const folder = zip.folder("PDIL_Foto");

    const fetchImageAsBlob = async (filename) => {
      try {
        const response = await fetch(`/images/${filename}`);
        if (!response.ok) throw new Error("Gagal fetch");
        return await response.blob();
      } catch {
        return null;
      }
    };

    const validFiles = filteredData
      .map((row) => row["FILE FOTO"])
      .filter((name) => name);

    for (const filename of validFiles) {
      const blob = await fetchImageAsBlob(filename);
      if (blob) folder.file(filename, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "PDIL_Foto.zip");
  };

  if (loading) return <p>⏳ Sedang memuat data pelanggan dari Google Sheets...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Monitoring Data Pelanggan PDIL 53-BGR</h2>

      {/* Kolom pencarian */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="🔍 Cari ID, No Meter, Nama, Alamat, Gardu Tiang, RBM..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{ width: "400px", padding: "8px", marginBottom: "6px" }}
        />
      </div>

      {/* Dropdown filters */}
      <div style={{ marginBottom: "10px" }}>
        <select value={ulpFilter} onChange={(e) => setUlpFilter(e.target.value)} style={{ width: "160px", marginRight: "10px", padding: "6px" }}>
          <option value="">-Semua ULP-</option>
          {ulpOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>

        <select value={pbmFilter} onChange={(e) => setPbmFilter(e.target.value)} style={{ width: "260px", marginRight: "10px", padding: "6px" }}>
          <option value="">-Semua PBM-</option>
          {pbmOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>

        <select value={petugasFilter} onChange={(e) => setPetugasFilter(e.target.value)} style={{ width: "260px", marginRight: "10px", padding: "6px" }}>
          <option value="">-Semua Petugas-</option>
          {petugasOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>

        <select value={jenisFilter} onChange={(e) => setJenisFilter(e.target.value)} style={{ width: "160px", marginRight: "10px", padding: "6px" }}>
          <option value="">-Semua Jenis KWH-</option>
          {jenisOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>

        <select value={ketFilter} onChange={(e) => setKetFilter(e.target.value)} style={{ width: "160px", marginRight: "10px", padding: "6px" }}>
          <option value="">-Semua KET PDIL-</option>
          {ketOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
      </div>

      {/* Tombol Export & Download Foto */}
      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={exportToExcel}
          style={{
            marginRight: "10px",
            padding: "8px 12px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          📥 Export ke Excel
        </button>

        <button
          onClick={downloadAllPhotos}
          style={{
            padding: "8px 12px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          🖼️ Download Foto
        </button>
      </div>

      {/* Rekap Status Baca */}
      <p style={{ marginBottom: "10px", fontWeight: "bold" }}>
        Jumlah Pelanggan: {filteredData.length.toLocaleString()}
      </p>
      <div style={{ marginBottom: "15px" }}>
        <strong>Rekap Status Baca:</strong>
        <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
          <li>✅ Sudah Dibaca: {sudahDibaca.toLocaleString()} pelanggan</li>
          <li>⏳ Belum Dibaca: {belumDibaca.toLocaleString()} pelanggan</li>
        </ul>
      </div>

      {/* Tabel data */}
      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead style={{ backgroundColor: "#f0f0f0" }}>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>AKSI</th>
            <th style={{ whiteSpace: "nowrap" }}>NO</th>
            <th style={{ whiteSpace: "nowrap" }}>UNIT</th>
            <th style={{ whiteSpace: "nowrap" }}>HEADER</th>
            <th style={{ whiteSpace: "nowrap" }}>ULP</th>
            <th style={{ whiteSpace: "nowrap" }}>ID PELANGGAN</th>
            <th style={{ whiteSpace: "nowrap" }}>NAMA</th>
            <th style={{ whiteSpace: "nowrap" }}>ALAMAT</th>
            <th style={{ whiteSpace: "nowrap" }}>TARIF DAYA</th> 
            <th style={{ whiteSpace: "nowrap" }}>NO METER</th>
            <th style={{ whiteSpace: "nowrap" }}>GARDU TIANG</th>
            <th style={{ whiteSpace: "nowrap" }}>RBM</th>
            <th style={{ whiteSpace: "nowrap" }}>PBM</th>
            <th style={{ whiteSpace: "nowrap" }}>PETUGAS</th>
            <th style={{ whiteSpace: "nowrap" }}>JENIS KWH</th>
            <th style={{ whiteSpace: "nowrap" }}>TGL PDIL</th>
            <th style={{ whiteSpace: "nowrap" }}>KET PDIL</th>
            <th style={{ whiteSpace: "nowrap" }}>LOKASI</th>
            <th style={{ whiteSpace: "nowrap" }}>KORDINAT</th>
            <th style={{ whiteSpace: "nowrap" }}>ID PELANGGAN PDIL</th>
            <th style={{ whiteSpace: "nowrap" }}>NO METER PDIL</th>
            <th style={{ whiteSpace: "nowrap" }}>GARDU PDIL</th>
            <th style={{ whiteSpace: "nowrap" }}>FOTO</th>
            <th style={{ whiteSpace: "nowrap" }}>URL FOTO KWH</th>
            <th style={{ whiteSpace: "nowrap" }}>FILE FOTO</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, i) => (
            <tr key={i}>
              <td style={{ whiteSpace: "wrap" }}>
                <button onClick={() => setSelectedFoto(row["FILE FOTO"])}>
                  Lihat Foto
                </button>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
               {(currentPage - 1) * rowsPerPage + i + 1}
              </td>
              <td style={{ whiteSpace: "nowrap" }}>{row["UNIT"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["HEADER"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["ULP"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["ID PELANGGAN"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["NAMA"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["ALAMAT"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["TARIF DAYA"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["NO METER"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["GARDU TIANG"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["RBM"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["PBM"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["PETUGAS"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["JENIS KWH"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["TGL PDIL"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["KET PDIL"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["LOKASI"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["KORDINAT"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["ID PELANGGAN PDIL"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["NO METER PDIL"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["GARDU PDIL"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["FOTO"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["URL FOTO KWH"]}</td>
              <td style={{ whiteSpace: "nowrap" }}>{row["FILE FOTO"]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Navigasi halaman */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          ⬅️ Sebelumnya
        </button>
        <span style={{ margin: "0 10px" }}>Halaman {currentPage}</span>
        <button
          onClick={() =>
            setCurrentPage((p) =>
              p * rowsPerPage < filteredData.length ? p + 1 : p
            )
          }
          disabled={currentPage * rowsPerPage >= filteredData.length}
        >
          Berikutnya ➡️
        </button>
      </div>

      {/* Modal Foto */}
      {selectedFoto && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
          justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px" }}>
            <img
              src={`/images/${selectedFoto}`}
              alt="Foto KWH"
              style={{ maxWidth: "500px", maxHeight: "500px", objectFit: "contain" }}
            />
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <a
                href={`/images/${selectedFoto}`}
                download
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#2196F3",
                  color: "white",
                  borderRadius: "4px",
                  textDecoration: "none",
                  marginRight: "10px"
                }}
              >
                ⬇️ Download Foto
              </a>
              <button
                onClick={() => setSelectedFoto(null)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#f44336",
                  color: "white",
                  borderRadius: "4px",
                  border: "none"
                }}
              >
                ✖️ Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringPDIL;

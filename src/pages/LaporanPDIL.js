import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTfELCjsjIkZhKELOGBb_yybu6oZOvN468uKYwKahgCyAtoJoUJyfZ0iBMWVQ4xOydbd1im79D-i6h3/pub?gid=1408204138&single=true&output=csv";

const LaporanPDIL = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(SHEET_URL)
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

  const laporan = useMemo(() => {
    const daftarUnitTetap = [
      { unit: "53811", ulp: "Cipayung" },
      { unit: "53821", ulp: "Bogor Timur" },
      { unit: "53831", ulp: "Bogor Kota" },
      { unit: "53841", ulp: "Bogor Barat" },
      { unit: "53851", ulp: "Leuwiliang" },
      { unit: "53853", ulp: "Jasinga" },
    ];

    const rekap = {};
    const countByULP = {};

    daftarUnitTetap.forEach(({ unit, ulp }) => {
      rekap[unit] = {
        unit,
        ulp,
        total: 0,
        sudah: 0,
        belum: 0,
        lpb: 0,
        pasca: 0,
        sisipan: 0,
        totalsudahdibaca: 0,
      };
      countByULP[ulp] = 0;
    });

    data.forEach((row) => {
      const unit = row["UNIT"];
      const ulp = row["ULP"];
      const ket = row["KET PDIL"]?.trim().toUpperCase();
      const jenis = row["JENIS KWH"]?.trim().toUpperCase();

      if (ulp && countByULP[ulp] !== undefined) countByULP[ulp]++;

      if (!rekap[unit]) return;

      rekap[unit].total++;
      if (ket === "SUDAH DIBACA") rekap[unit].sudah++;
      if (ket !== "SUDAH DIBACA") rekap[unit].belum++;
      if (jenis === "LPB") rekap[unit].lpb++;
      if (jenis === "PASCA") rekap[unit].pasca++;
    });

    Object.values(rekap).forEach((row) => {
      const jumlahULP = countByULP[row.ulp] || 0;
      const jumlahUNIT = row.total;
      row.sisipan = jumlahULP - jumlahUNIT;
      row.totalsudahdibaca = row.sudah + row.sisipan;
    });

    return Object.values(rekap);
  }, [data]);

  const totalRow = useMemo(() => {
    const total = {
      unit: "",
      ulp: "Jumlah Total",
      total: 0,
      sudah: 0,
      belum: 0,
      lpb: 0,
      pasca: 0,
      sisipan: 0,
      totalsudahdibaca: 0,
    };
    laporan.forEach((row) => {
      total.total += row.total;
      total.sudah += row.sudah;
      total.belum += row.belum;
      total.lpb += row.lpb;
      total.pasca += row.pasca;
      total.sisipan += row.sisipan;
      total.totalsudahdibaca += row.totalsudahdibaca;
    });
    return total;
  }, [laporan]);

  if (loading) return <p>⏳ Sedang memuat laporan dari Google Sheets...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📑 Laporan Monitoring Data Pelanggan PDIL 53-BOGOR</h2>
      <table
        border="1"
        cellPadding="6"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          fontSize: "15px",
          marginTop: "20px",
        }}
      >
        <thead style={{ backgroundColor: "#f0f0f0" }}>
          <tr>
            <th>No</th>
            <th>Unit</th>
            <th>ULP</th>
            <th>Pelanggan WO</th>
            <th>Sudah Dibaca</th>
            <th>Sisipan</th>
            <th>Total Sudah Dibaca</th>
            <th>Belum Dibaca</th>
            <th>WO LPB</th>
            <th>WO PASCA</th>
            <th>Persentase</th>
          </tr>
        </thead>
        <tbody>
          {laporan.map((row, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{row.unit}</td>
              <td>{row.ulp}</td>
              <td>{row.total.toLocaleString()}</td>
              <td>{row.sudah.toLocaleString()}</td>
              <td>{row.sisipan.toLocaleString()}</td>
              <td>{row.totalsudahdibaca.toLocaleString()}</td>
              <td>{row.belum.toLocaleString()}</td>
              <td>{row.lpb.toLocaleString()}</td>
              <td>{row.pasca.toLocaleString()}</td>
              <td>
                {row.total === 0
                  ? "0.00%"
                  : ((row.sudah / row.total) * 100).toFixed(2) + "%"}
              </td>
            </tr>
          ))}

          <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
            <td></td>
            <td></td>
            <td>{totalRow.ulp}</td>
            <td>{totalRow.total.toLocaleString()}</td>
            <td>{totalRow.sudah.toLocaleString()}</td>
            <td>{totalRow.sisipan.toLocaleString()}</td>
            <td>{totalRow.totalsudahdibaca.toLocaleString()}</td>
            <td>{totalRow.belum.toLocaleString()}</td>
            <td>{totalRow.lpb.toLocaleString()}</td>
            <td>{totalRow.pasca.toLocaleString()}</td>
            <td>
              {totalRow.total === 0
                ? "0.00%"
                : ((totalRow.sudah / totalRow.total) * 100).toFixed(2) + "%"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default LaporanPDIL;

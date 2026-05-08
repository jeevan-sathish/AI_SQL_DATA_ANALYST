import { useState } from "react";
import axios from "axios";

import {
  FaDatabase,
  FaRobot,
  FaTerminal,
  FaUpload,
  FaChartBar,
  FaTable,
  FaCode,
  FaFileCsv,
  FaCheckCircle,
} from "react-icons/fa";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState([]);
  const [sql, setSql] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {
      setUploading(true);

      const res = await axios.post("http://127.0.0.1:5000/upload", formData);

      setUploadedFileName(file.name);

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question) return;

    try {
      setLoading(true);

      const res = await axios.post("http://127.0.0.1:5000/ask", {
        question,
      });

      setResult(res.data.data);
      setSql(res.data.sql);
      setChartData(null);
      setSelectedRow(null);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);

    const numericEntries = Object.entries(row).filter(
      ([_, value]) => !isNaN(value) && value !== null && value !== "",
    );

    const labels = numericEntries.map(([key]) => key);

    const values = numericEntries.map(([_, value]) => Number(value));

    setChartData({
      labels,
      datasets: [
        {
          label: "Statistics",
          data: values,
          backgroundColor: "rgba(0,255,0,0.5)",
          borderColor: "#00ff00",
          borderWidth: 1,
        },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-3 md:p-5 font-mono overflow-hidden">
      <div className="border border-green-500 rounded-2xl p-5 shadow-[0_0_20px_#00ff00] mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <FaTerminal className="text-2xl md:text-4xl" />

            <div>
              <h1 className="text-2xl md:text-5xl font-bold tracking-widest">
                AI SQL DATA ANALYST
              </h1>

              <p className="text-green-300 text-sm mt-1">
                Upload • Query • Analyze • Visualize
              </p>
            </div>
          </div>

          {uploadedFileName && (
            <div className="border border-green-500 bg-[#021402] px-4 py-3 rounded-xl flex items-center gap-3 shadow-[0_0_12px_#00ff00]">
              <FaFileCsv className="text-2xl" />

              <div>
                <p className="text-xs text-green-300">ACTIVE DATASET</p>

                <p className="font-bold break-all">{uploadedFileName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="mb-5 border border-green-500 bg-[#021402] text-green-300 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-[0_0_15px_#00ff00] animate-pulse">
          <FaCheckCircle className="text-2xl text-green-400" />

          <div>
            <p className="font-bold">Dataset Uploaded Successfully</p>

            <p className="text-sm text-green-500">
              {uploadedFileName} is now active
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-3 flex flex-col gap-5">
          <div className="border border-green-500 rounded-2xl p-5 bg-[#020202] h-fit">
            <div className="flex items-center gap-2 mb-5">
              <FaDatabase />

              <h2 className="text-xl font-bold">Upload Dataset</h2>
            </div>

            <div className="flex flex-col gap-4">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="border border-green-500 bg-black rounded-xl p-3 text-sm"
              />

              <button
                onClick={handleUpload}
                className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <FaUpload />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border border-green-500 rounded-2xl p-5 bg-[#020202] h-fit">
            <div className="flex items-center gap-2 mb-5">
              <FaRobot />

              <h2 className="text-xl font-bold">Ask AI</h2>
            </div>

            <div className="flex flex-col gap-4">
              <textarea
                rows={5}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Show top cholesterol values"
                className="border border-green-500 bg-black rounded-xl p-3 resize-none outline-none"
              />

              <button
                onClick={handleAsk}
                className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-all duration-300"
              >
                {loading ? "Analyzing..." : "Ask AI"}
              </button>
            </div>
          </div>

          <div className="border border-green-500 rounded-2xl p-5 bg-[#020202]">
            <div className="flex items-center gap-2 mb-4">
              <FaCode />

              <h2 className="text-xl font-bold">Generated SQL</h2>
            </div>

            <div className="bg-black rounded-xl p-4 overflow-auto max-h-[250px]">
              <pre className="text-green-300 text-sm whitespace-pre-wrap break-words">
                {sql || "Waiting for query..."}
              </pre>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="border border-green-500 rounded-2xl p-5 bg-[#020202] h-full flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <FaTable />

              <h2 className="text-xl font-bold">Query Results</h2>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : result.length > 0 ? (
              <div className="overflow-auto max-h-[75vh] rounded-xl border border-green-500">
                <table className="min-w-full">
                  <thead className="bg-green-500 text-black sticky top-0">
                    <tr>
                      {Object.keys(result[0]).map((key) => (
                        <th
                          key={key}
                          className="px-5 py-3 whitespace-nowrap border border-black"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.map((row, index) => (
                      <tr
                        key={index}
                        onClick={() => handleRowClick(row)}
                        className="hover:bg-green-900/30 cursor-pointer transition-all duration-300"
                      >
                        {Object.values(row).map((value, i) => (
                          <td
                            key={i}
                            className="px-5 py-3 border border-green-500 whitespace-nowrap"
                          >
                            {value?.toString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-green-700">
                No Results Yet
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="border border-green-500 rounded-2xl p-5 bg-[#020202] h-full flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <FaChartBar />

              <h2 className="text-xl font-bold">Visualization</h2>
            </div>

            {chartData ? (
              <>
                <div className="bg-black rounded-xl p-4">
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          labels: {
                            color: "#00ff00",
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: "#00ff00",
                          },
                          grid: {
                            color: "#003300",
                          },
                        },
                        y: {
                          ticks: {
                            color: "#00ff00",
                          },
                          grid: {
                            color: "#003300",
                          },
                        },
                      },
                    }}
                  />
                </div>

                <div className="mt-5 overflow-auto max-h-[300px]">
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(selectedRow).map(([key, value]) => (
                      <div
                        key={key}
                        className="border border-green-500 rounded-xl p-3"
                      >
                        <p className="text-green-300 text-xs">{key}</p>

                        <p className="font-bold break-words">
                          {value?.toString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-green-700 text-center">
                Click Any Row To Visualize Data
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 text-center text-green-700 text-sm">
        SYSTEM STATUS : ONLINE
      </div>
    </div>
  );
}

export default App;

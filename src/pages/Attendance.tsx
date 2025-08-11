import React, { useEffect, useState } from "react";
import { format } from "date-fns";

interface AttendanceRecord {
  id: number;
  uid: string;
  name: string;
  timestamp: string;
}

interface ExpandedRecord {
  uid: string;
  expanded: boolean;
  history?: AttendanceRecord[];
  loading?: boolean;
}

const Attendance: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [expandedRecords, setExpandedRecords] = useState<ExpandedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest attendance data
  const fetchLatestAttendance = async () => {
    try {
      const response = await fetch("https://realgbackend-production.up.railway.app/api/attendance/latest");
      const data: AttendanceRecord[] = await response.json();
      setAttendanceData(data);
      
      // Initialize expanded state for each record
      setExpandedRecords(data.map(record => ({
        uid: record.uid,
        expanded: false,
        history: undefined,
        loading: false
      })));
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all timestamps for a specific UID
  const fetchAttendanceHistory = async (uid: string): Promise<AttendanceRecord[]> => {
    try {
      const response = await fetch(`https://realgbackend-production.up.railway.app/api/attendance/history/${uid}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      return [];
    }
  };

  // Handle expanding/collapsing and fetch history if needed
  const handleRowClick = async (uid: string) => {
    const existingRecord = expandedRecords.find(r => r.uid === uid);
    const isExpanding = !existingRecord?.expanded;

    // Update the expanded state immediately
    setExpandedRecords(prev => 
      prev.map(record => 
        record.uid === uid 
          ? { ...record, expanded: !record.expanded, loading: isExpanding }
          : record
      )
    );

    // If expanding and history not loaded yet, fetch it
    if (isExpanding && (!existingRecord?.history || existingRecord.history.length === 0)) {
      const history = await fetchAttendanceHistory(uid);
      setExpandedRecords(prev =>
        prev.map(record =>
          record.uid === uid 
            ? { ...record, history, loading: false }
            : record
        )
      );
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLatestAttendance();
  }, []);

  if (loading) return <div className="p-4">Loading attendance data...</div>;

  return (
    <div className="rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-3xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-700 mb-2">Smart Attendance Tracking</h2>
        <p className="text-sm text-gray-600">
          {format(new Date(), "MMMM d, yyyy")}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">
                UID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Worker Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Last Scan Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendanceData.map((record) => {
              const expandedRecord = expandedRecords.find(r => r.uid === record.uid);
              const isExpanded = expandedRecord?.expanded || false;
              const history = expandedRecord?.history || [];
              const isLoading = expandedRecord?.loading || false;

              return (
                <React.Fragment key={record.uid}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(record.uid)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.uid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(record.timestamp), "yyyy-MM-dd hh:mm:ss a")}
                      <span className="ml-2 text-xs text-blue-500">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-6 py-4">
                        <div className="pl-8">
                          <h4 className="text-sm font-medium mb-2">All check-ins:</h4>
                          {isLoading ? (
                            <div className="text-sm text-gray-400">Loading history...</div>
                          ) : history.length > 0 ? (
                            <ul className="space-y-1">
                              {history.map((historyItem, index) => (
                                <li key={index} className="text-sm text-gray-600">
                                  {format(new Date(historyItem.timestamp), "yyyy-MM-dd hh:mm:ss a")}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-sm text-gray-400">No history available</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
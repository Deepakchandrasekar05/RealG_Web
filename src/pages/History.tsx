import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

type ViolationHistory = {
  timestamp: number;
  violations: { class: string, confidence: number }[];
  image?: string;
};

const History: React.FC = () => {
  const { cameraId } = useParams();
  const [events, setEvents] = useState<ViolationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem('violationHistory');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Filter by cameraId if needed
          setEvents(parsed);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [cameraId]);

  // Chart data
  const chartData = {
    labels: events.map((_, i) => `Event ${i + 1}`),
    datasets: [{
      label: 'Violations',
      data: events.map(e => e.violations.length),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    }]
  };

  return (
    <div className="history-page">
      <h2>Violation History - Camera {cameraId}</h2>
      
      {loading ? (
        <div className="loading">Loading history...</div>
      ) : events.length === 0 ? (
        <div className="no-violations">No violations recorded yet</div>
      ) : (
        <>
          <div className="chart-container">
            <Line 
              data={chartData} 
              options={{ 
                responsive: true,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const index = context.dataIndex;
                        const violations = events[index].violations;
                        return [
                          `Time: ${new Date(events[index].timestamp).toLocaleString()}`,
                          ...violations.map(v => `${v.class} (${Math.round(v.confidence * 100)}%)`)
                        ];
                      }
                    }
                  }
                }
              }} 
            />
          </div>
          
          <div className="violation-list">
            {events.map((event, i) => (
              <div key={i} className="violation-item">
                <div className="violation-header">
                  <span className="timestamp">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                  <span className="count">
                    {event.violations.length} violation(s)
                  </span>
                </div>
                <div className="violation-types">
                  {event.violations.map((v, j) => (
                    <span key={j} className={`violation-tag ${v.class.replace('NO-', '').toLowerCase()}`}>
                      {v.class} ({Math.round(v.confidence * 100)}%)
                    </span>
                  ))}
                </div>
                {event.image && (
                  <img 
                    src={event.image} 
                    alt="Violation snapshot" 
                    className="violation-image"
                    onClick={() => window.open(event.image, '_blank')}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default History;
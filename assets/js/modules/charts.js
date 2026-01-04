export function initCharts() {
  if (!window.Chart) return;
  const barCanvas = document.getElementById('costBarChart');
  const doughnutCanvas = document.getElementById('costDoughnutChart');
  if (!barCanvas || !doughnutCanvas) return;

  const costBarCtx = barCanvas.getContext('2d');
  new Chart(costBarCtx, {
    type: 'bar',
    data: {
      labels: ['항공료', '숙박비', '투어/액티비티', '특별 다이닝', '렌터카'],
      datasets: [
        {
          label: '예상 비용 (만원, 2인 기준)',
          data: [320, 360, 237, 102, 75],
          backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'],
          borderColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.parsed.y}만원`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#e7e5e4' },
          ticks: {
            callback(value) {
              return `${value}만원`;
            }
          }
        },
        x: { grid: { display: false } }
      }
    }
  });

  const costDoughnutCtx = doughnutCanvas.getContext('2d');
  new Chart(costDoughnutCtx, {
    type: 'doughnut',
    data: {
      labels: [
        '항공료 (19.5%)',
        '숙박비 (21.9%)',
        '일반 식비 (20.7%)',
        '투어/액티비티 (14.4%)',
        '특별 다이닝 (6.2%)',
        '렌터카 (4.6%)',
        '교통 & 기타 (11.0%)'
      ],
      datasets: [
        {
          data: [3200, 3600, 3400, 2370, 1020, 750, 1800],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#6b7280'],
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 10 },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label.split(' (')[0]}: ₩${context.parsed.toLocaleString()}만원 (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}



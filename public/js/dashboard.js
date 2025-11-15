/**
 * Dashboard Client-Side JavaScript
 * Handles charts, sync button, and search
 */

// Chart initialization
document.addEventListener('DOMContentLoaded', function() {
  initializeCharts();
  initializeSyncButton();
  initializeSearch();
});

/**
 * Initialize Charts
 */
function initializeCharts() {
  const data = window.dashboardData;

  // Inventory Bar Chart
  if (data.topProducts && data.topProducts.length > 0) {
    const inventoryCtx = document.getElementById('inventoryChart');
    if (inventoryCtx) {
      new Chart(inventoryCtx, {
        type: 'bar',
        data: {
          labels: data.topProducts.map(p => p.title.substring(0, 20) + '...'),
          datasets: [{
            label: 'Inventory Quantity',
            data: data.topProducts.map(p => p.inventory_quantity),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  }

  // Status Pie Chart
  const statusCtx = document.getElementById('statusChart');
  if (statusCtx && data.stats) {
    new Chart(statusCtx, {
      type: 'pie',
      data: {
        labels: ['Active', 'Draft'],
        datasets: [{
          data: [
            data.stats.activeProducts,
            data.stats.draftProducts
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(201, 203, 207, 0.5)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(201, 203, 207, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

/**
 * Initialize Sync Button
 */
function initializeSyncButton() {
  const syncBtn = document.getElementById('syncBtn');

  if (syncBtn) {
    syncBtn.addEventListener('click', async function() {
      const originalText = syncBtn.innerHTML;

      // Disable button and show loading
      syncBtn.disabled = true;
      syncBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Syncing...';

      try {
        const response = await fetch('/dashboard/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (result.success) {
          // Show success message
          showAlert('success', result.message);

          // Reload page after 2 seconds
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          showAlert('danger', 'Sync failed: ' + result.message);
          syncBtn.disabled = false;
          syncBtn.innerHTML = originalText;
        }
      } catch (error) {
        console.error('Sync error:', error);
        showAlert('danger', 'Sync failed: Network error');
        syncBtn.disabled = false;
        syncBtn.innerHTML = originalText;
      }
    });
  }
}

/**
 * Initialize Search Functionality
 */
function initializeSearch() {
  const searchInput = document.getElementById('searchInput');

  if (searchInput) {
    searchInput.addEventListener('keyup', function() {
      const searchTerm = this.value.toLowerCase();
      const table = document.getElementById('productsTable');
      const rows = table.getElementsByTagName('tr');

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();

        if (text.includes(searchTerm)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      }
    });
  }
}

/**
 * Show Alert Message
 */
function showAlert(type, message) {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  const container = document.querySelector('.container-fluid');
  const firstChild = container.firstElementChild;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = alertHtml;

  container.insertBefore(tempDiv.firstChild, firstChild);
}

/**
 * CSS for spinning icon
 */
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 1s linear infinite;
    display: inline-block;
  }
`;
document.head.appendChild(style);


interface Transaction {
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  status: string;
  party: string;
  partyType: string;
}

interface Stat {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  description: string;
}

export function generateAccountingReport(transactions: Transaction[], stats: Stat[]) {
  const now = new Date();
  const reportDate = now.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const reportTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const reportId = `RPT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const completedCount = transactions.filter(t => t.status === 'completed').length;
  const pendingCount = transactions.filter(t => t.status === 'pending').length;
  const overdueCount = transactions.filter(t => t.status === 'overdue').length;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Financier - ${reportId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #FAF9F6; color: #1a1a1a; }
  
  .page { max-width: 900px; margin: 0 auto; padding: 48px; }
  
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 3px solid #E8853B; }
  .header-left h1 { font-size: 28px; font-weight: 800; color: #E8853B; letter-spacing: -0.5px; }
  .header-left p { font-size: 13px; color: #888; margin-top: 4px; }
  .header-right { text-align: right; font-size: 12px; color: #666; line-height: 1.8; }
  .header-right .report-id { font-weight: 700; color: #E8853B; font-size: 14px; }
  
  /* Watermark badge */
  .confidential { display: inline-block; padding: 4px 14px; border: 2px solid #E8853B; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #E8853B; text-transform: uppercase; margin-top: 8px; }
  
  /* KPI Grid */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 40px; }
  .kpi-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #eee; position: relative; overflow: hidden; }
  .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .kpi-card.income::before { background: linear-gradient(90deg, #22c55e, #4ade80); }
  .kpi-card.expense::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .kpi-card.net::before { background: linear-gradient(90deg, #E8853B, #f0a060); }
  .kpi-card.pending::before { background: linear-gradient(90deg, #6366f1, #818cf8); }
  .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; }
  .kpi-value { font-size: 26px; font-weight: 800; margin-top: 8px; }
  .kpi-value.green { color: #16a34a; }
  .kpi-value.orange { color: #d97706; }
  .kpi-value.primary { color: #E8853B; }
  .kpi-value.indigo { color: #4f46e5; }
  .kpi-sub { font-size: 11px; color: #999; margin-top: 4px; }
  
  /* Summary cards */
  .summary-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 40px; }
  .summary-card { background: white; border-radius: 12px; padding: 24px; border: 1px solid #eee; }
  .summary-card h3 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #E8853B; margin-bottom: 16px; }
  
  /* Stats overview */
  .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #eee; }
  .stat-row:last-child { border: none; }
  .stat-label { font-size: 13px; color: #666; }
  .stat-val { font-size: 13px; font-weight: 700; }
  .stat-val.up { color: #16a34a; }
  .stat-val.down { color: #dc2626; }
  
  /* Pie chart simulation */
  .status-bars { margin-top: 8px; }
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .bar-label { font-size: 12px; width: 80px; color: #666; }
  .bar-track { flex: 1; height: 8px; background: #f3f3f3; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; }
  .bar-fill.completed { background: linear-gradient(90deg, #22c55e, #4ade80); }
  .bar-fill.pending { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .bar-fill.overdue { background: linear-gradient(90deg, #ef4444, #f87171); }
  .bar-count { font-size: 12px; font-weight: 700; width: 20px; text-align: right; }
  
  /* Table */
  .section-title { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .section-title::before { content: ''; width: 4px; height: 20px; background: #E8853B; border-radius: 2px; }
  
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #eee; margin-bottom: 40px; }
  thead { background: #fafafa; }
  th { text-align: left; padding: 14px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 700; border-bottom: 2px solid #eee; }
  td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
  tr:last-child td { border: none; }
  tr:hover { background: #fefcf9; }
  
  .type-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .type-badge.income { background: #dcfce7; color: #16a34a; }
  .type-badge.expense { background: #fef3c7; color: #d97706; }
  
  .status-dot { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; }
  .status-dot::before { content: ''; width: 7px; height: 7px; border-radius: 50%; }
  .status-dot.completed::before { background: #22c55e; }
  .status-dot.pending::before { background: #f59e0b; }
  .status-dot.overdue::before { background: #ef4444; }
  
  .amount { font-weight: 700; font-variant-numeric: tabular-nums; }
  .amount.income { color: #16a34a; }
  .amount.expense { color: #d97706; }
  
  /* Footer */
  .footer { margin-top: 48px; padding-top: 24px; border-top: 2px solid #eee; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 11px; color: #bbb; line-height: 1.8; }
  .footer-right { font-size: 10px; color: #ccc; text-align: right; }
  
  @media print {
    body { background: white; }
    .page { padding: 24px; }
  }
</style>
</head>
<body>
<div class="page">
  
  <div class="header">
    <div class="header-left">
      <h1>Rapport Financier</h1>
      <p>Vue d'ensemble comptable et transactions récentes</p>
      <div class="confidential">Confidentiel</div>
    </div>
    <div class="header-right">
      <div class="report-id">${reportId}</div>
      Date: ${reportDate}<br>
      Heure: ${reportTime}<br>
      Période: Janvier 2024
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card income">
      <div class="kpi-label">Revenus Totaux</div>
      <div class="kpi-value green">$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="kpi-sub">${transactions.filter(t => t.type === 'income').length} transactions</div>
    </div>
    <div class="kpi-card expense">
      <div class="kpi-label">Dépenses Totales</div>
      <div class="kpi-value orange">$${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="kpi-sub">${transactions.filter(t => t.type === 'expense').length} transactions</div>
    </div>
    <div class="kpi-card net">
      <div class="kpi-label">Bénéfice Net</div>
      <div class="kpi-value primary">$${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="kpi-sub">Marge: ${((netProfit / totalIncome) * 100).toFixed(1)}%</div>
    </div>
    <div class="kpi-card pending">
      <div class="kpi-label">En Attente</div>
      <div class="kpi-value indigo">${pendingCount + overdueCount}</div>
      <div class="kpi-sub">${overdueCount} en retard</div>
    </div>
  </div>

  <div class="summary-row">
    <div class="summary-card">
      <h3>Indicateurs Clés</h3>
      ${stats.map(s => `
        <div class="stat-row">
          <span class="stat-label">${s.title}</span>
          <span class="stat-val ${s.isPositive ? 'up' : 'down'}">${s.value} (${s.change})</span>
        </div>
      `).join('')}
    </div>
    <div class="summary-card">
      <h3>Répartition des Statuts</h3>
      <div class="status-bars">
        <div class="bar-row">
          <span class="bar-label">Complétées</span>
          <div class="bar-track"><div class="bar-fill completed" style="width:${(completedCount/transactions.length*100)}%"></div></div>
          <span class="bar-count">${completedCount}</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">En attente</span>
          <div class="bar-track"><div class="bar-fill pending" style="width:${(pendingCount/transactions.length*100)}%"></div></div>
          <span class="bar-count">${pendingCount}</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">En retard</span>
          <div class="bar-track"><div class="bar-fill overdue" style="width:${(overdueCount/transactions.length*100)}%"></div></div>
          <span class="bar-count">${overdueCount}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section-title">Détail des Transactions</div>
  <table>
    <thead>
      <tr>
        <th>Réf.</th>
        <th>Date</th>
        <th>Description</th>
        <th>Tiers</th>
        <th>Type</th>
        <th>Montant</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.map(t => `
        <tr>
          <td style="font-family:monospace;font-weight:600;color:#888">${t.id}</td>
          <td>${t.date}</td>
          <td style="font-weight:500">${t.description}</td>
          <td>${t.party}</td>
          <td><span class="type-badge ${t.type}">${t.type === 'income' ? 'Revenu' : 'Dépense'}</span></td>
          <td class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}$${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td><span class="status-dot ${t.status}">${t.status === 'completed' ? 'Complété' : t.status === 'pending' ? 'En attente' : 'En retard'}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div class="footer-left">
      Rapport généré automatiquement<br>
      Ce document est confidentiel et destiné à un usage interne uniquement.
    </div>
    <div class="footer-right">
      ${reportId} • Page 1/1<br>
      ${reportDate} ${reportTime}
    </div>
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rapport-Financier-${reportId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

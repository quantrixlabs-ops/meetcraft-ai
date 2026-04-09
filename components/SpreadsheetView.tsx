import React from 'react';
import { KnowledgePackage } from '../types';
import { Table, Download } from 'lucide-react';

interface SpreadsheetViewProps {
  data: KnowledgePackage;
}

const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({ data }) => {
  
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAgenda = () => {
    const headers = ['Time (min)', 'Section', 'Talking Point', 'Speaker Notes'];
    const rows = data.agenda.map(item => 
      `"${item.time}","${item.section.replace(/"/g, '""')}","${item.talkingPoint.replace(/"/g, '""')}","${item.notes.replace(/"/g, '""')}"`
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, 'agenda.csv');
  };

  const handleDownloadActions = () => {
    const headers = ['Category', 'Item', 'Priority', 'Owner'];
    let rows: string[] = [];

    data.takeaways.insights.forEach(i => rows.push(`"Key Insight","${i.replace(/"/g, '""')}","High","-"`));
    data.takeaways.decisions.forEach(i => rows.push(`"Decision Needed","${i.replace(/"/g, '""')}","Critical","Decision Maker"`));
    data.takeaways.nextSteps.forEach(i => rows.push(`"Next Step","${i.replace(/"/g, '""')}","Medium","Assignee"`));
    data.takeaways.recommendations.forEach(i => rows.push(`"Recommendation","${i.replace(/"/g, '""')}","Low","-"`));

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, 'action_plan.csv');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Table className="w-5 h-5 text-green-600" />
          Spreadsheet Data
        </h2>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadAgenda}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            Download Agenda (.csv)
          </button>
          <button
            onClick={handleDownloadActions}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Actions (.csv)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Meeting Agenda</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Time (Min)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Section
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Key Talking Point
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Speaker Notes / Instructions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.agenda.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    {item.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                    {item.section}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {item.talkingPoint}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">
                    {item.notes}
                  </td>
                </tr>
              ))}
              <tr className="bg-green-50 border-t-2 border-green-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-800">
                  Total: {data.meta.duration}
                </td>
                <td colSpan={3} className="px-6 py-4 text-sm text-green-800 font-medium">
                  Complete Session Duration
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Action Items Preview</h3>
           <div className="space-y-2">
             {data.takeaways.nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded">
                    <span className="font-mono text-xs text-slate-400 bg-white border px-1 rounded">TODO</span>
                    {step}
                </div>
             ))}
           </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Key Insights Preview</h3>
           <div className="space-y-2">
             {data.takeaways.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded">
                    <span className="font-mono text-xs text-slate-400 bg-white border px-1 rounded">NOTE</span>
                    {insight}
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetView;

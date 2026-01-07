import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getRandomVerse } from '../../../../../services/bibleVerses';
import { CleaningScheduleItem } from '../../../../../types/cleaning';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChurchData {
  churchName: string;
  address?: string;
  phone?: string;
  pastor?: string;
}

export const exportToPDF = async (
  schedule: CleaningScheduleItem[],
  churchData: ChurchData,
  currentMonth: Date
) => {
  const verse = getRandomVerse();
  const monthYear = format(currentMonth, 'MMMM yyyy', { locale: es }).toUpperCase();
  
  const weeks: { [key: number]: CleaningScheduleItem[] } = {};
  schedule.forEach(item => {
    const date = new Date(item.date);
    const weekNum = Math.ceil(date.getDate() / 7);
    if (!weeks[weekNum]) weeks[weekNum] = [];
    weeks[weekNum].push(item);
  });
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
      <div style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1e40af; margin: 0; font-size: 28px;">🧹 PROGRAMACIÓN DE ASEO DEL TEMPLO</h1>
        <h2 style="color: #3b82f6; margin: 10px 0; font-size: 22px;">${churchData.churchName || 'IGLESIA EVANGÉLICA'}</h2>
      </div>
      
      <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1e40af; margin: 0; font-size: 20px;">MES: ${monthYear}</h3>
      </div>
      
      ${Object.keys(weeks).sort((a, b) => +a - +b).map(weekNum => {
        const weekItems = weeks[+weekNum].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        return \`
          <div style="margin-bottom: 30px;">
            <div style="background: #1e40af; color: white; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px;">
              <h4 style="margin: 0;">SEMANA ${weekNum}</h4>
            </div>
            
            ${weekItems.map(item => \`
              <div style="border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 15px; background: #f8fafc;">
                <div><strong>${format(new Date(item.date), "EEEE d 'de' MMMM", { locale: es })}</strong> - ${item.service.name}</div>
                <div style="margin-top: 10px;">
                  <p><strong>Grupo:</strong> ${item.group.name}</p>
                  <p><strong>Coordinador:</strong> ${item.group.coordinator} - ${item.group.phone}</p>
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
      }).join('')}
      
      <div style="border-top: 2px solid #e2e8f0; margin-top: 40px; padding-top: 20px;">
        <div style="background: #fef3c7; padding: 15px;">
          <p style="font-style: italic;">"${verse.text}"</p>
          <p style="text-align: right; font-weight: bold;">- ${verse.reference}</p>
        </div>
      </div>
    </div>
  `;
  
  const element = document.createElement('div');
  element.innerHTML = htmlContent;
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  document.body.appendChild(element);
  
  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(\`aseo-${format(currentMonth, 'yyyy-MM')}.pdf\`);
    alert('PDF generado exitosamente');
  } catch (error) {
    alert('Error al generar PDF');
  } finally {
    document.body.removeChild(element);
  }
};

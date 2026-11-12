import { useState, useRef, useEffect } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from 'reactflow';
import jsPDF from 'jspdf';
import { Download, Loader2, Image as ImageIcon, FileText } from 'lucide-react';

interface ExportProps {
  className?: string;
}

export function Export(_props: ExportProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [exporting, setExporting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { getNodes } = useReactFlow();

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    };

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  // Close popover with Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPopover) {
        setShowPopover(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showPopover]);

  const exportToPNG = async () => {
    setExporting(true);
    try {
      const nodesBounds = getNodesBounds(getNodes());
      const viewport = getViewportForBounds(
        nodesBounds,
        nodesBounds.width,
        nodesBounds.height,
        0.5,
        2,
        0.1
      );

      // Find the react flow viewport element
      const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElement) {
        console.error('Could not find React Flow viewport');
        return;
      }

      // Use html2canvas to capture the canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(viewportElement, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim(),
        scale: 2,
        logging: false,
      });

      // Download as PNG
      const link = document.createElement('a');
      link.download = `canvassy-board-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();

      setShowPopover(false);
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      alert('Failed to export as PNG. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const nodesBounds = getNodesBounds(getNodes());

      // Find the react flow viewport element
      const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElement) {
        console.error('Could not find React Flow viewport');
        return;
      }

      // Use html2canvas to capture the canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(viewportElement, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim(),
        scale: 2,
        logging: false,
      });

      // Calculate PDF dimensions to fit the content
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Create PDF with appropriate dimensions (in mm)
      const pdfWidth = 297; // A4 landscape width
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`canvassy-board-${Date.now()}.pdf`);

      setShowPopover(false);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export as PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="dock-popover-anchor">
      <button
        ref={buttonRef}
        className={`dock-btn${showPopover ? ' is-active' : ''}`}
        onClick={() => setShowPopover(!showPopover)}
        data-tip={showPopover ? undefined : 'Export'}
        aria-label="Export"
        disabled={exporting}
      >
        {exporting ? <Loader2 size={17} className="spin" /> : <Download size={17} />}
      </button>

      {showPopover && (
        <div ref={popoverRef} className="dock-popover dock-popover--end" style={{ width: 240 }}>
          <div className="dock-popover-title">Export board</div>
          <div className="dock-menu">
            <button className="dock-menu-item" onClick={exportToPNG} disabled={exporting}>
              <ImageIcon size={18} />
              <span>
                <strong>PNG image</strong>
                <small>High-resolution picture</small>
              </span>
            </button>
            <button className="dock-menu-item" onClick={exportToPDF} disabled={exporting}>
              <FileText size={18} />
              <span>
                <strong>PDF document</strong>
                <small>For sharing or printing</small>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
